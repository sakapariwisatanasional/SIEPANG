/**
 * @license
 * SiEpang - Sync Center & Local Camp Server Service
 * Supports Local Camp Server on local Wi-Fi / LAN with offline queueing.
 */

import { LocalCampStatus, NetworkConnectionState, SyncItem } from '../types';
import { syncQueue } from '../offline/syncQueue';

class SyncService {
  private localCampStatus: LocalCampStatus = {
    connected: true,
    serverIp: '192.168.10.1:8080 (Buper-Local-WiFi)',
    networkType: 'Local Wi-Fi',
    cloudSyncAvailable: false,
    connectedDevices: 38,
    pendingTransactions: 1282,
    localAttendanceCount: 342,
    localPointTransactions: 480,
    lastHeartbeat: '10 detik yang lalu',
  };

  private listeners: Set<() => void> = new Set();

  public getLocalCampStatus(): LocalCampStatus {
    return this.localCampStatus;
  }

  public toggleLocalServerConnected(): void {
    this.localCampStatus.connected = !this.localCampStatus.connected;
    this.notify();
  }

  public getConnectionState(): NetworkConnectionState {
    return syncQueue.getConnectionState();
  }

  public setConnectionState(state: NetworkConnectionState): void {
    syncQueue.setConnectionState(state);
  }

  public async getQueue(): Promise<SyncItem[]> {
    return syncQueue.getQueue();
  }

  public async triggerSync(): Promise<{ success: number; failed: number }> {
    return syncQueue.processQueue();
  }

  public async resolveConflict(id: string, resolution: 'keep_local' | 'accept_server'): Promise<void> {
    await syncQueue.resolveConflict(id, resolution);
    this.notify();
  }

  public async clearHistory(): Promise<void> {
    await syncQueue.clearHistory();
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const syncService = new SyncService();
