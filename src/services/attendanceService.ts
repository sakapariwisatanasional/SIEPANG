/**
 * @license
 * SiEpang - Attendance Service
 * Canonical cloud persistence with offline/local-camp compatibility.
 */
import { syncQueueService } from '../offline/syncQueueService';
import { localCampServerService } from './localCampServerService';
import { pointService } from './pointService';
import { participantService } from './participantService';
import { adminPersistenceService } from './adminPersistenceService';

export interface AttendanceRecord {
  id: string;
  transactionId?: string;
  participantId: string;
  participantName: string;
  participantCode: string;
  contingentName: string;
  sessionId: string;
  sessionName: string;
  timestamp: string;
  xpAwarded: number;
  synced: boolean;
  syncStatus: 'Saved on Device' | 'Saved on Server Buper' | 'Synced to Cloud';
  edgeNodeId?: string;
}

class AttendanceService {
  private records: AttendanceRecord[] = [];

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    try {
      const rows = await adminPersistenceService.list<any>('attendance');
      const participants = participantService.getParticipants();
      this.records = rows.map((r: any) => {
        const p = participants.find(x => x.id === r.participant_id);
        return {
          id: String(r.id || ''),
          transactionId: r.transaction_id || undefined,
          participantId: String(r.participant_id || ''),
          participantName: r.participant_name || p?.name || '',
          participantCode: r.participant_code || p?.code || '',
          contingentName: r.contingent_name || p?.contingentName || '',
          sessionId: String(r.checkpoint_or_schedule_id || ''),
          sessionName: r.session_name || '',
          timestamp: String(r.timestamp || ''),
          xpAwarded: Number(r.xp_awarded || 0),
          synced: String(r.sync_status || '').toUpperCase() === 'SYNCED',
          syncStatus: 'Synced to Cloud',
          edgeNodeId: r.edge_node_id || undefined,
        } as AttendanceRecord;
      });
    } catch (e) {
      console.error('Gagal memuat AttendanceLogs:', e);
    }
  }

  public getRecords(): AttendanceRecord[] {
    return [...this.records];
  }

  public async recordAttendance(
    codeOrId: string,
    sessionId = 'sch_today',
    sessionName = 'Kegiatan Lapangan & Apel'
  ): Promise<{ record: AttendanceRecord; offline: boolean; destination: 'device' | 'server_buper' | 'cloud' }> {
    const participant =
      participantService.getParticipantByCode(codeOrId) ||
      participantService.getParticipants().find(p => p.id === codeOrId);

    if (!participant) {
      throw new Error(`Peserta dengan kode '${codeOrId}' tidak terdaftar.`);
    }

    const alreadyAttended = this.records.some(
      r => r.participantId === participant.id && r.sessionId === sessionId
    );
    if (alreadyAttended) {
      throw new Error(`Peserta '${participant.name}' sudah tercatat hadir pada sesi '${sessionName}'.`);
    }

    const isOffline = syncQueueService.getConnectionState() === 'offline';
    const operationalMode = localCampServerService.getOperationalMode();
    const xpReward = 5;

    const tx = syncQueueService.enqueueTransaction({
      entity: 'attendance',
      action: 'SCAN',
      record_id: `att_${participant.id}_${Date.now()}`,
      payload: {
        participantId: participant.id,
        participantCode: participant.code,
        participantName: participant.name,
        contingentName: participant.contingentName,
        sessionId,
        sessionName,
        timestamp: new Date().toISOString(),
      },
    });

    let destination: 'device' | 'server_buper' | 'cloud' = 'cloud';
    let syncStatus: AttendanceRecord['syncStatus'] = 'Synced to Cloud';
    let edgeNodeId: string | undefined;

    if (isOffline) {
      destination = 'device';
      syncStatus = 'Saved on Device';
    } else if (operationalMode === 'local' || operationalMode === 'hybrid') {
      const edgeRes = localCampServerService.receiveTransactionFromDevice(tx);
      destination = 'server_buper';
      syncStatus = 'Saved on Server Buper';
      edgeNodeId = edgeRes.acknowledgement.edge_server_id;
    }

    const nowIso = new Date().toISOString();
    let persistedId = tx.record_id;

    if (destination === 'cloud') {
      const saved = await adminPersistenceService.upsert<any>('attendance', {
        id: tx.record_id,
        participant_id: participant.id,
        checkpoint_or_schedule_id: sessionId,
        scanned_by_user_id: '',
        timestamp: nowIso,
        sync_status: 'SYNCED',
        transaction_id: tx.transaction_id,
        participant_name: participant.name,
        participant_code: participant.code,
        contingent_name: participant.contingentName,
        session_name: sessionName,
        xp_awarded: xpReward,
      });
      persistedId = saved.id;
    }

    const record: AttendanceRecord = {
      id: persistedId,
      transactionId: tx.transaction_id,
      participantId: participant.id,
      participantName: participant.name,
      participantCode: participant.code,
      contingentName: participant.contingentName,
      sessionId,
      sessionName,
      timestamp: nowIso,
      xpAwarded: xpReward,
      synced: destination !== 'device',
      syncStatus,
      edgeNodeId,
    };

    this.records.unshift(record);

    if (destination === 'cloud') {
      await participantService.checkIn(participant.id, 'Attendance Scanner');
      await pointService.awardXP(
        participant.id,
        participant.name,
        xpReward,
        `Presensi: ${sessionName}`,
        'attendance'
      );
    }

    return { record, offline: isOffline, destination };
  }
}

export const attendanceService = new AttendanceService();
