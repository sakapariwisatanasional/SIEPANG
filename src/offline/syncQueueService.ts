/**
 * @license
 * SiEpang - Centralized SyncQueueService & Operational Integrity Engine
 * Handles pre-generated UUID offline transactions, batch uploads,
 * incremental pull sync (sync_version), conflict detection, and device registry.
 */

import {
  OfflineTransaction,
  BatchSyncResult,
  IncrementalPullResult,
  RoleScopedSnapshot,
  RegisteredDevice,
  NetworkConnectionState,
} from './types';
import { siepangBackendApi } from '../backend/api/siepangBackendApi';
import { authService } from '../services/authService';
import { workspaceService } from '../services/workspaceService';
import { eventService } from '../services/eventService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'siepang_offline_transactions',
  DEVICE_ID: 'siepang_device_id',
  LAST_SYNC_VERSION: 'siepang_last_sync_version',
  LAST_SYNC_TIME: 'siepang_last_sync_time',
  OFFLINE_SNAPSHOT: 'siepang_role_snapshot',
  CONNECTION_OVERRIDE: 'siepang_connection_override',
};

// UUID generator supporting standard Web Crypto or fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class SyncQueueService {
  private deviceId: string = '';
  private connectionState: NetworkConnectionState = 'online';
  private isSyncing = false;
  private listeners: Set<() => void> = new Set();
  private transactions: OfflineTransaction[] = [];
  private lastSyncVersion: number = 0;
  private lastSyncTime: string = 'Belum pernah';

  constructor() {
    this.initDevice();
    this.loadState();
    this.initNetworkMonitoring();
  }

  private initDevice(): void {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = `dev_${generateUUID().substring(0, 18)}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    this.deviceId = id;
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.transactions = stored ? JSON.parse(stored) : [];

      const v = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_VERSION);
      this.lastSyncVersion = v ? Number(v) : 100;

      const t = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
      this.lastSyncTime = t || 'Belum pernah';

      const conn = localStorage.getItem(STORAGE_KEYS.CONNECTION_OVERRIDE);
      if (conn === 'offline') {
        this.connectionState = 'offline';
      }
    } catch (e) {
      console.warn('Failed to load sync queue state:', e);
      this.transactions = [];
    }
  }

  private saveTransactions(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_VERSION, String(this.lastSyncVersion));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, this.lastSyncTime);
    } catch (e) {
      console.warn('Failed to save transactions to localStorage:', e);
    }
    this.notify();
  }

  private initNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      if (localStorage.getItem(STORAGE_KEYS.CONNECTION_OVERRIDE) !== 'offline') {
        this.setConnectionState('online');
        this.processBatch();
      }
    });

    window.addEventListener('offline', () => {
      this.setConnectionState('offline');
    });
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getConnectionState(): NetworkConnectionState {
    return this.connectionState;
  }

  public setConnectionState(state: NetworkConnectionState): void {
    this.connectionState = state;
    if (state === 'offline') {
      localStorage.setItem(STORAGE_KEYS.CONNECTION_OVERRIDE, 'offline');
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONNECTION_OVERRIDE);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  }

  public getTransactions(): OfflineTransaction[] {
    return [...this.transactions];
  }

  public getStats() {
    const pending = this.transactions.filter(t => t.sync_status === 'PENDING' || t.sync_status === 'SYNCING').length;
    const synced = this.transactions.filter(t => t.sync_status === 'SYNCED').length;
    const conflicts = this.transactions.filter(t => t.sync_status === 'CONFLICT').length;
    const rejected = this.transactions.filter(t => t.sync_status === 'REJECTED').length;
    const failed = this.transactions.filter(t => t.sync_status === 'FAILED').length;

    return {
      total: this.transactions.length,
      pendingCount: pending,
      syncedCount: synced,
      conflictCount: conflicts,
      rejectedCount: rejected,
      failedCount: failed,
      lastSyncVersion: this.lastSyncVersion,
      lastSyncTime: this.lastSyncTime,
      deviceId: this.deviceId,
      connectionState: this.connectionState,
    };
  }

  /**
   * Enqueues an offline transaction.
   * Immediately records as "Saved on Device" with pre-generated UUID.
   */
  public enqueueTransaction(params: {
    entity: string;
    action: string;
    record_id: string;
    payload: any;
    expected_version?: number;
  }): OfflineTransaction {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    const tx: OfflineTransaction = {
      transaction_id: generateUUID(),
      workspace_id: currentWorkspace?.id || '',
      event_id: currentEvent?.id || '',
      device_id: this.deviceId,
      user_id: currentUser?.id || 'usr_anonymous',
      entity: params.entity,
      action: params.action,
      record_id: params.record_id,
      payload: params.payload,
      client_created_at: new Date().toISOString(),
      sync_status: 'PENDING',
      retry_count: 0,
      expected_version: params.expected_version,
    };

    this.transactions.unshift(tx);
    this.saveTransactions();

    // Auto-attempt batch sync if online
    if (this.connectionState === 'online') {
      setTimeout(() => this.processBatch(), 100);
    }

    return tx;
  }

  /**
   * Batch Upload Synchronization
   * Uploads queued pending transactions in a single batch request to /api/sync/batch
   */
  public async processBatch(): Promise<{
    processed: number;
    accepted: number;
    conflicts: number;
    rejected: number;
    failed: number;
  }> {
    if (this.isSyncing) return { processed: 0, accepted: 0, conflicts: 0, rejected: 0, failed: 0 };
    if (this.connectionState === 'offline') {
      return { processed: 0, accepted: 0, conflicts: 0, rejected: 0, failed: 0 };
    }

    const pending = this.transactions.filter(t => t.sync_status === 'PENDING' || t.sync_status === 'FAILED');
    if (pending.length === 0) {
      // Still ping server for incremental pull
      await this.pullIncrementalChanges();
      return { processed: 0, accepted: 0, conflicts: 0, rejected: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.connectionState = 'syncing';
    this.notify();

    let accepted = 0;
    let conflicts = 0;
    let rejected = 0;
    let failed = 0;

    try {
      // Mark all pending as SYNCING locally
      pending.forEach(t => { t.sync_status = 'SYNCING'; });
      this.saveTransactions();

      const currentUser = authService.getCurrentUser();
      const currentWorkspace = workspaceService.getCurrentWorkspace();
      const currentEvent = eventService.getCurrentEvent();

      // Register / ping device before batch
      await siepangBackendApi.handleRequest({
        endpoint: '/api/devices/register',
        payload: {
          device_id: this.deviceId,
          device_name: navigator.userAgent.includes('Mobile') ? 'Smartphone Petugas Lapangan' : 'Workstation Admin Buper',
          device_type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          last_sync: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          last_sync_version: this.lastSyncVersion,
          pending_transaction_count: pending.length,
        },
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });

      // Submit batch request
      const response = await siepangBackendApi.handleRequest<BatchSyncResult[]>({
        endpoint: '/api/sync/batch',
        payload: {
          deviceId: this.deviceId,
          transactions: pending,
        },
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });

      if (response.success && Array.isArray(response.data)) {
        const resultMap = new Map<string, BatchSyncResult>(response.data.map(r => [r.transaction_id, r]));

        for (const tx of pending) {
          const res = resultMap.get(tx.transaction_id);
          if (!res) continue;

          if (res.status === 'accepted' || res.status === 'duplicate') {
            tx.sync_status = 'SYNCED';
            tx.result_code = res.resultCode;
            tx.server_version = res.server_version;
            tx.last_error = undefined;
            accepted++;
          } else if (res.status === 'conflict') {
            tx.sync_status = 'CONFLICT';
            tx.result_code = res.resultCode;
            tx.last_error = res.message;
            conflicts++;
          } else if (res.status === 'rejected') {
            tx.sync_status = 'REJECTED';
            tx.result_code = res.resultCode;
            tx.last_error = res.message;
            rejected++;
          } else {
            tx.sync_status = 'FAILED';
            tx.retry_count++;
            tx.last_error = res.message;
            failed++;
          }
        }

        if (response.meta?.syncVersion) {
          this.lastSyncVersion = response.meta.syncVersion;
        }
        this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else {
        // Entire batch failed (e.g. revoked device)
        pending.forEach(t => {
          t.sync_status = 'FAILED';
          t.retry_count++;
          t.last_error = response.error?.message || response.message || 'Gagal sinkronisasi';
        });
        failed = pending.length;
      }

      // Also pull incremental changes
      await this.pullIncrementalChanges();
    } catch (err: any) {
      console.error('Batch sync network exception:', err);
      pending.forEach(t => {
        t.sync_status = 'FAILED';
        t.retry_count++;
        t.last_error = err.message;
      });
      failed = pending.length;
    } finally {
      this.isSyncing = false;
      this.connectionState = 'online';
      this.saveTransactions();
    }

    return { processed: pending.length, accepted, conflicts, rejected, failed };
  }

  /**
   * Incremental Pull Synchronization based on sync_version
   */
  public async pullIncrementalChanges(): Promise<IncrementalPullResult | null> {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    try {
      const res = await siepangBackendApi.handleRequest<IncrementalPullResult>({
        endpoint: '/api/sync/changes',
        payload: {
          sinceVersion: this.lastSyncVersion,
        },
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });

      if (res.success && res.data) {
        if (res.data.current_sync_version > this.lastSyncVersion) {
          this.lastSyncVersion = res.data.current_sync_version;
          this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          this.saveTransactions();
        }
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('Failed to pull incremental changes:', err);
      return null;
    }
  }

  /**
   * Downloads Role-Scoped Offline Snapshot
   */
  public async downloadRoleScopedSnapshot(): Promise<RoleScopedSnapshot | null> {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    try {
      const res = await siepangBackendApi.handleRequest<RoleScopedSnapshot>({
        endpoint: '/api/sync/snapshot',
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });

      if (res.success && res.data) {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_SNAPSHOT, JSON.stringify(res.data));
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to download role-scoped snapshot:', err);
      return null;
    }
  }

  /**
   * Resolves transaction conflict
   */
  public resolveConflict(transactionId: string, resolution: 'keep_local' | 'accept_server'): void {
    const idx = this.transactions.findIndex(t => t.transaction_id === transactionId);
    if (idx === -1) return;

    if (resolution === 'keep_local') {
      // Force resync without expecting previous version
      this.transactions[idx].sync_status = 'PENDING';
      this.transactions[idx].expected_version = undefined;
      this.transactions[idx].last_error = undefined;
    } else {
      // Drop local transaction and accept server authoritative version
      this.transactions.splice(idx, 1);
    }
    this.saveTransactions();

    if (this.connectionState === 'online') {
      this.processBatch();
    }
  }

  /**
   * Clears synced transaction history
   */
  public clearSyncedHistory(): void {
    this.transactions = this.transactions.filter(t => t.sync_status !== 'SYNCED');
    this.saveTransactions();
  }

  /**
   * Device Registry operations
   */
  public async getRegisteredDevices(): Promise<RegisteredDevice[]> {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    try {
      const res = await siepangBackendApi.handleRequest<RegisteredDevice[]>({
        endpoint: '/api/devices/list',
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });
      return res.success && Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  public async revokeDevice(deviceId: string): Promise<boolean> {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    try {
      const res = await siepangBackendApi.handleRequest({
        endpoint: '/api/devices/revoke',
        payload: { deviceId },
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });
      this.notify();
      return res.success;
    } catch {
      return false;
    }
  }

  public async activateDevice(deviceId: string): Promise<boolean> {
    const currentUser = authService.getCurrentUser();
    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();

    try {
      const res = await siepangBackendApi.handleRequest({
        endpoint: '/api/devices/activate',
        payload: { deviceId },
        context: {
          userId: currentUser?.id || 'usr_anonymous',
          userRole: currentUser?.role || 'viewer',
          workspaceId: currentWorkspace?.id || '',
          eventId: currentEvent?.id || '',
        },
      });
      this.notify();
      return res.success;
    } catch {
      return false;
    }
  }

  public getCachedRoleSnapshot(): RoleScopedSnapshot | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_SNAPSHOT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Diagnostic simulation helpers for Field Operations Integrity demonstration
   */
  public simulateIdempotentResubmit(): OfflineTransaction | null {
    const synced = this.transactions.find(t => t.sync_status === 'SYNCED');
    if (!synced) {
      // Enqueue fresh and then mark as duplicate test
      const fresh = this.enqueueTransaction({
        entity: 'attendance',
        action: 'SCAN',
        record_id: 'att_demo_idempotent',
        payload: { participantId: 'p_01', participantCode: 'PST-0001', session: 'Apel Pagi' },
      });
      return fresh;
    }

    // Clone existing transaction with SAME transaction_id
    const duplicateTx: OfflineTransaction = {
      ...synced,
      sync_status: 'PENDING',
      result_code: undefined,
      last_error: undefined,
    };
    this.transactions.unshift(duplicateTx);
    this.saveTransactions();
    if (this.connectionState === 'online') {
      setTimeout(() => this.processBatch(), 100);
    }
    return duplicateTx;
  }

  public simulateQuotaViolation(): OfflineTransaction {
    const tx = this.enqueueTransaction({
      entity: 'vote',
      action: 'VOTE',
      record_id: 'work_pionering_01',
      payload: { currentVoteCount: 99, maxVotes: 1 },
    });
    return tx;
  }

  public simulateScoreLockConflict(): OfflineTransaction {
    const tx = this.enqueueTransaction({
      entity: 'scoring',
      action: 'SCORE',
      record_id: 'comp_pionering_score',
      payload: { isLocked: true, score: 95 },
    });
    return tx;
  }

  public simulateVersionConflict(): OfflineTransaction {
    const currentEvent = eventService.getCurrentEvent();
    const tx = this.enqueueTransaction({
      entity: 'event',
      action: 'UPDATE',
      record_id: currentEvent?.id || 'evt_active',
      payload: { name: 'Perubahan Versi Usang' },
      expected_version: 5, // Intentionally outdated vs server version ~100
    });
    return tx;
  }
}

export const syncQueueService = new SyncQueueService();
