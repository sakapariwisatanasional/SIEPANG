/**
 * @license
 * SiEpang - Offline Sync Queue Manager
 */

import { localDb } from './indexedDb';
import { SyncItem, NetworkConnectionState } from '../types';

export class SyncQueueManager {
  private isProcessing = false;
  private connectionState: NetworkConnectionState = 'online';
  private listeners: Set<(state: NetworkConnectionState, count: number) => void> = new Set();

  constructor() {
    this.initNetworkMonitoring();
  }

  private initNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.setConnectionState('online');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.setConnectionState('offline');
    });

    // Check if offline override was stored
    const override = localStorage.getItem('siepang_simulated_offline');
    if (override === 'true') {
      this.connectionState = 'offline';
    }
  }

  public getConnectionState(): NetworkConnectionState {
    return this.connectionState;
  }

  public setConnectionState(state: NetworkConnectionState) {
    this.connectionState = state;
    if (state === 'offline') {
      localStorage.setItem('siepang_simulated_offline', 'true');
    } else {
      localStorage.removeItem('siepang_simulated_offline');
    }
    this.notify();
  }

  public subscribe(cb: (state: NetworkConnectionState, count: number) => void) {
    this.listeners.add(cb);
    this.getPendingCount().then(c => cb(this.connectionState, c));
    return () => {
      this.listeners.delete(cb);
    };
  }

  private async notify() {
    const count = await this.getPendingCount();
    this.listeners.forEach(cb => cb(this.connectionState, count));
  }

  public async getPendingCount(): Promise<number> {
    const queue = await localDb.getSyncQueue();
    return queue.filter(q => q.status === 'pending' || q.status === 'syncing').length;
  }

  public async getQueue(): Promise<SyncItem[]> {
    return localDb.getSyncQueue();
  }

  public async addAction(
    actionType: SyncItem['actionType'],
    payload: any
  ): Promise<SyncItem> {
    // Register transaction in centralized SyncQueueService dynamically
    let transactionId: string | undefined = undefined;
    try {
      const { syncQueueService } = await import('./syncQueueService');
      const tx = syncQueueService.enqueueTransaction({
        entity: actionType === 'update_event' ? 'event' : actionType,
        action: 'UPDATE',
        record_id: payload?.recordId || payload?.id || 'rec_offline',
        payload,
      });
      transactionId = tx?.transaction_id;
    } catch (e) {
      console.warn('syncQueueService registration skipped:', e);
    }

    const item = await localDb.enqueue({ actionType, payload, transaction_id: transactionId } as any);
    await this.notify();

    // If online, attempt background sync immediately
    if (this.connectionState === 'online') {
      this.processQueue();
    }
    return item;
  }

  public async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) return { success: 0, failed: 0 };
    if (this.connectionState === 'offline') return { success: 0, failed: 0 };

    this.isProcessing = true;
    this.setConnectionState('syncing');

    let successCount = 0;
    let failedCount = 0;

    const queue = await localDb.getSyncQueue();
    const pendingItems = queue.filter(i => i.status === 'pending' || i.status === 'failed');

    for (const item of pendingItems) {
      await localDb.updateItem(item.id, { status: 'syncing' });
      // Simulate real network request to backend service
      await new Promise(r => setTimeout(r, 400));

      // Simulate occasional conflict test case or clean success
      const isSimulatedConflict = item.payload?.simulateConflict;
      if (isSimulatedConflict) {
        await localDb.updateItem(item.id, {
          status: 'conflict',
          errorMessage: 'Data peserta telah diperbarui di server oleh petugas lain.',
        });
        failedCount++;
      } else {
        await localDb.updateItem(item.id, { status: 'synced' });
        successCount++;
      }
    }

    this.isProcessing = false;
    this.setConnectionState('online');
    await this.notify();
    return { success: successCount, failed: failedCount };
  }

  public async resolveConflict(id: string, resolution: 'keep_local' | 'accept_server'): Promise<void> {
    if (resolution === 'keep_local') {
      await localDb.updateItem(id, { status: 'synced', errorMessage: undefined });
    } else {
      await localDb.remove(id);
    }
    await this.notify();
  }

  public async clearHistory(): Promise<void> {
    await localDb.clearSynced();
    await this.notify();
  }
}

export const syncQueue = new SyncQueueManager();
