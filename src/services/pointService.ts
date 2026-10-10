/**
 * @license
 * SiEpang - Gamification, XP & Peer Appreciation Service
 */

import { XPTransaction, LeaderboardEntry, Badge, PeerAppreciationType } from '../types';
import { syncQueueService } from '../offline/syncQueueService';
import { participantService } from './participantService';

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

  public getBadges(): Badge[] {
    return this.badges;
  }

  public getTransactions(participantId?: string): XPTransaction[] {
    if (participantId) {
      return this.transactions.filter(t => t.participantId === participantId);
    }
    return this.transactions;
  }

  /**
   * Primary source of truth calculated from authoritative ledger transactions (Req 10)
   */
  public getParticipantTotalXP(participantId: string): number {
    return this.transactions
      .filter(t => t.participantId === participantId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    const participants = participantService.getParticipants();
    const sorted = [...participants].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    return sorted.map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      contingentName: p.contingentName,
      avatar: p.photoUrl,
      role: p.role,
      xp: p.xp || 0,
      level: Math.floor((p.xp || 0) / 200) + 1,
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
    const tx: XPTransaction = {
      id: `tx_${Date.now()}`,
      participantId,
      participantName,
      amount,
      reason,
      category,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.transactions.unshift(tx);

    // Update participant
    const target = participantService.getParticipants().find(p => p.id === participantId);
    if (target) {
      target.xp = (target.xp || 0) + amount;
      target.level = Math.floor(target.xp / 200) + 1;
    }

    // Enqueue centralized transaction with pre-generated UUID
    syncQueueService.enqueueTransaction({
      entity: 'points',
      action: 'CREATE',
      record_id: tx.id,
      payload: {
        participantId,
        participantName,
        amount,
        reason,
        category,
        currentDailyTotal: 15,
        dailyLimit: 100,
      },
    });

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
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const pointService = new PointService();
