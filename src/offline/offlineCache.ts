/**
 * @license
 * SiEpang - Offline Cache Store
 */

import { localDb } from './indexedDb';

export class OfflineCacheStore {
  private cachePrefix = 'siepang_cache_';

  public async set<T>(key: string, data: T, ttlMinutes = 1440): Promise<void> {
    const entry = {
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      data,
    };
    await localDb.set(this.cachePrefix + key, entry);
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = await localDb.get<{ timestamp: number; ttl: number; data: T }>(this.cachePrefix + key);
    if (!entry) return null;
    return entry.data;
  }

  public async isCached(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

export const offlineCache = new OfflineCacheStore();
