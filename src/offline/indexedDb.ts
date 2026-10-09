/**
 * @license
 * SiEpang - Offline IndexedDB Storage Service
 */

import { SyncItem } from '../types';

const STORAGE_KEYS = {
  SYNC_QUEUE: 'siepang_sync_queue',
  OFFLINE_CACHE: 'siepang_offline_cache',
  OFFLINE_MODE_FLAG: 'siepang_offline_override',
  LOCAL_SERVER_FLAG: 'siepang_local_server_mode',
};

class IndexedDbService {
  private memoryFallback: Map<string, any> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // Check if localStorage is accessible
    try {
      if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      }
    } catch {
      // In private browsing or environments where localStorage might fail
      this.memoryFallback.set(STORAGE_KEYS.SYNC_QUEUE, []);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return this.memoryFallback.get(key) || null;
    }
  }

  public async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      this.memoryFallback.set(key, value);
    }
  }

  public async getSyncQueue(): Promise<SyncItem[]> {
    const queue = await this.get<SyncItem[]>(STORAGE_KEYS.SYNC_QUEUE);
    return queue || [];
  }

  public async saveSyncQueue(queue: SyncItem[]): Promise<void> {
    await this.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  public async enqueue(item: Omit<SyncItem, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<SyncItem> {
    const queue = await this.getSyncQueue();
    const newItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(newItem);
    await this.saveSyncQueue(queue);
    window.dispatchEvent(new CustomEvent('siepang:sync_queue_updated', { detail: { count: queue.length } }));
    return newItem;
  }

  public async updateItem(id: string, updates: Partial<SyncItem>): Promise<void> {
    const queue = await this.getSyncQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await this.saveSyncQueue(queue);
      window.dispatchEvent(new CustomEvent('siepang:sync_queue_updated', { detail: { count: queue.length } }));
    }
  }

  public async remove(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.saveSyncQueue(filtered);
    window.dispatchEvent(new CustomEvent('siepang:sync_queue_updated', { detail: { count: filtered.length } }));
  }

  public async clearSynced(): Promise<void> {
    const queue = await this.getSyncQueue();
    const active = queue.filter(item => item.status !== 'synced');
    await this.saveSyncQueue(active);
    window.dispatchEvent(new CustomEvent('siepang:sync_queue_updated', { detail: { count: active.length } }));
  }
}

export const localDb = new IndexedDbService();
export { STORAGE_KEYS };
