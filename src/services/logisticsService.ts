/**
 * @license
 * SiEpang - Logistics & Equipment Inventory Service
 * Manages campsite inventory items, condition, stock availability, and loan tracking.
 * Consumes ApiClient / ApiTransport to persist to customer Spreadsheet.
 */

import { LogisticItem } from '../types';
import { apiClient } from './apiClient';

class LogisticsService {
  private items: LogisticItem[] = [];
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  public getItems(): LogisticItem[] {
    return [...this.items];
  }

  public async addItem(item: Omit<LogisticItem, 'id' | 'borrowedStock'>): Promise<LogisticItem> {
    const newItem: LogisticItem = {
      ...item,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      borrowedStock: 0,
      availableStock: item.totalStock,
    };

    this.items.unshift(newItem);
    this.notify();

    try {
      await apiClient.request('logistics/add', { data: newItem });
    } catch (e) {
      console.warn('Error syncing logistics item:', e);
    }

    return newItem;
  }

  public async updateItem(id: string, updates: Partial<LogisticItem>): Promise<void> {
    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.notify();
      try {
        await apiClient.request('logistics/update', { data: { id, updates } });
      } catch (e) {
        console.warn('Error updating logistics item:', e);
      }
    }
  }

  public async recordLoan(id: string): Promise<boolean> {
    const item = this.items.find(i => i.id === id);
    if (!item || item.availableStock <= 0) return false;

    item.availableStock -= 1;
    item.borrowedStock += 1;
    this.notify();

    try {
      await apiClient.request('logistics/loan', { data: { id, count: 1 } });
    } catch (e) {
      console.warn('Error recording logistics loan:', e);
    }

    return true;
  }

  public async recordReturn(id: string): Promise<boolean> {
    const item = this.items.find(i => i.id === id);
    if (!item || item.borrowedStock <= 0) return false;

    item.availableStock += 1;
    item.borrowedStock -= 1;
    this.notify();

    try {
      await apiClient.request('logistics/return', { data: { id, count: 1 } });
    } catch (e) {
      console.warn('Error recording logistics return:', e);
    }

    return true;
  }
}

export const logisticsService = new LogisticsService();
