/**
 * @license
 * SiEpang - Gamification, XP & Peer Appreciation Service
 * Canonical PointTransactions persistence.
 */
import { XPTransaction, LeaderboardEntry, Badge, PeerAppreciationType } from '../types';
import { participantService } from './participantService';
import { adminPersistenceService } from './adminPersistenceService';

export const PEER_APPRECIATIONS: { type: PeerAppreciationType; xp: number; icon: string; label: string }[] = [
  { type: 'Helpful', xp: 25, icon: 'Handshake', label: 'Siaga Menolong' },
  { type: 'Friendly', xp: 20, icon: 'Smile', label: 'Ramah & Bersahabat' },
  { type: 'Scout Spirit', xp: 35, icon: 'Flame', label: 'Semangat Tri Satya' },
  { type: 'Inspiring', xp: 30, icon: 'Lightbulb', label: 'Kreatif & Inspiratif' },
  { type: 'Eco Action', xp: 30, icon: 'Leaf', label: 'Peduli Lingkungan' },
];

class PointService {
  private transactions: XPTransaction[] = [];
  private badges: Badge[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    try {
      const [txRows, badgeRows] = await Promise.all([
        adminPersistenceService.list<any>('pointTransactions'),
        adminPersistenceService.list<any>('participantBadges'),
      ]);

      this.transactions = txRows.map((r: any) => ({
        id: String(r.id || ''),
        participantId: String(r.participant_id || ''),
        participantName: String(r.participant_name || ''),
        amount: Number(r.amount || 0),
        reason: String(r.reason || ''),
        category: (r.category || r.source_type || 'attendance') as any,
        timestamp: String(r.created_at || ''),
      })) as XPTransaction[];

      // Badge definitions remain supplied by Event Studio/Badge config.
      // ParticipantBadges are retained server-side and can be combined later.
      void badgeRows;
      this.notify();
    } catch (e) {
      console.error('Gagal memuat ledger XP:', e);
    }
  }

  public getBadges(): Badge[] {
    return [...this.badges];
  }

  public getTransactions(participantId?: string): XPTransaction[] {
    return participantId
      ? this.transactions.filter(t => t.participantId === participantId)
      : [...this.transactions];
  }

  public getParticipantTotalXP(participantId: string): number {
    return this.transactions
      .filter(t => t.participantId === participantId)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const totals = new Map<string, number>();
    this.transactions.forEach(tx => {
      totals.set(tx.participantId, (totals.get(tx.participantId) || 0) + Number(tx.amount || 0));
    });

    return [...participantService.getParticipants()]
      .map(p => ({ p, xp: totals.get(p.id) ?? Number(p.xp || 0) }))
      .sort((a, b) => b.xp - a.xp)
      .map(({ p, xp }, index) => ({
        rank: index + 1,
        id: p.id,
        name: p.name,
        contingentName: p.contingentName,
        avatar: p.photoUrl,
        role: p.role,
        xp,
        level: Math.floor(xp / 200) + 1,
        isCurrentUser: false,
      }));
  }

  public async awardXP(
    participantId: string,
    participantName: string,
    amount: number,
    reason: string,
    category: XPTransaction['category']
  ): Promise<XPTransaction> {
    const saved = await adminPersistenceService.upsert<any>('pointTransactions', {
      participant_id: participantId,
      participant_name: participantName,
      amount,
      reason,
      source_type: category,
      category,
      reference_id: '',
      created_at: new Date().toISOString(),
      created_by: '',
    });

    const tx: XPTransaction = {
      id: saved.id,
      participantId,
      participantName,
      amount,
      reason,
      category,
      timestamp: saved.created_at || new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    this.notify();
    return tx;
  }

  public async givePeerAppreciation(
    targetParticipantId: string,
    targetParticipantName: string,
    type: PeerAppreciationType
  ): Promise<XPTransaction> {
    const config = PEER_APPRECIATIONS.find(a => a.type === type) || PEER_APPRECIATIONS[0];
    return this.awardXP(
      targetParticipantId,
      targetParticipantName,
      config.xp,
      `Apresiasi Kawan: ${config.label}`,
      'peer_appreciation'
    );
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const pointService = new PointService();
