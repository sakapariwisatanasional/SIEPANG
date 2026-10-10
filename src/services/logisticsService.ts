/**
 * @license
 * SiEpang - Logistics & Equipment Inventory Service
 * GAS-authoritative / canonical Spreadsheet persistence.
 */
import { LogisticItem } from '../types';
import { adminPersistenceService } from './adminPersistenceService';

class LogisticsService {
  private items: LogisticItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  public async refreshFromBackend(): Promise<void> {
    const rows = await adminPersistenceService.list<any>('logistics');
    this.items = rows.map((r: any) => ({
      ...r,
      id: String(r.id || ''),
      name: r.name || r.item_name || '',
      category: r.category || '',
      totalStock: Number(r.totalStock ?? r.total_quantity ?? 0),
      availableStock: Number(r.availableStock ?? r.available_quantity ?? 0),
      borrowedStock: Number(r.borrowedStock ?? r.borrowed_quantity ?? 0),
      unit: r.unit || '',
      condition: r.condition || '',
      location: r.location || r.storage_location || '',
    })) as LogisticItem[];
    this.notify();
  }

  public getItems(): LogisticItem[] {
    return [...this.items];
  }

  private toRecord(item: Partial<LogisticItem> & Record<string, any>): any {
    return {
      id: item.id || undefined,
      item_name: item.name || item.item_name || '',
      category: item.category || '',
      total_quantity: Number(item.totalStock ?? item.total_quantity ?? 0),
      available_quantity: Number(item.availableStock ?? item.available_quantity ?? 0),
      borrowed_quantity: Number(item.borrowedStock ?? item.borrowed_quantity ?? 0),
      unit: item.unit || '',
      condition: item.condition || '',
      storage_location: item.location || item.storage_location || '',
      updated_at: new Date().toISOString(),
    };
  }

  private fromRecord(r: any): LogisticItem {
    return {
      ...r,
      id: r.id,
      name: r.name || r.item_name || '',
      category: r.category || '',
      totalStock: Number(r.totalStock ?? r.total_quantity ?? 0),
      availableStock: Number(r.availableStock ?? r.available_quantity ?? 0),
      borrowedStock: Number(r.borrowedStock ?? r.borrowed_quantity ?? 0),
      unit: r.unit || '',
      condition: r.condition || '',
      location: r.location || r.storage_location || '',
    } as LogisticItem;
  }

  public async addItem(item: Omit<LogisticItem, 'id' | 'borrowedStock'>): Promise<LogisticItem> {
    const candidate: any = {
      ...item,
      borrowedStock: 0,
      availableStock: (item as any).availableStock ?? (item as any).totalStock,
    };
    const saved = await adminPersistenceService.upsert<any>('logistics', this.toRecord(candidate));
    const newItem = this.fromRecord(saved);
    this.items.unshift(newItem);
    this.notify();
    return newItem;
  }

  public async updateItem(id: string, updates: Partial<LogisticItem>): Promise<void> {
    const current = this.items.find(i => i.id === id);
    if (!current) throw new Error('Item logistik tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('logistics', this.toRecord({ ...current, ...updates, id } as any));
    Object.assign(current, this.fromRecord(saved));
    this.notify();
  }

  public async recordLoan(id: string): Promise<boolean> {
    const item = this.items.find(i => i.id === id);
    if (!item || item.availableStock <= 0) return false;
    const saved = await adminPersistenceService.upsert<any>('logistics', this.toRecord({
      ...item,
      id,
      availableStock: item.availableStock - 1,
      borrowedStock: item.borrowedStock + 1,
    } as any));
    Object.assign(item, this.fromRecord(saved));
    this.notify();
    return true;
  }

  public async recordReturn(id: string): Promise<boolean> {
    const item = this.items.find(i => i.id === id);
    if (!item || item.borrowedStock <= 0) return false;
    const saved = await adminPersistenceService.upsert<any>('logistics', this.toRecord({
      ...item,
      id,
      availableStock: item.availableStock + 1,
      borrowedStock: item.borrowedStock - 1,
    } as any));
    Object.assign(item, this.fromRecord(saved));
    this.notify();
    return true;
  }
}

export const logisticsService = new LogisticsService();
