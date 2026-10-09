/**
 * @license
 * SiEpang - Attendance Service
 */

import { syncQueueService } from '../offline/syncQueueService';
import { localCampServerService } from './localCampServerService';
import { pointService } from './pointService';
import { participantService } from './participantService';

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

  public getRecords(): AttendanceRecord[] {
    return this.records;
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

    // Prevent duplicate attendance for the same participant in the same session (Requirement 22)
    const alreadyAttended = this.records.some(
      r => r.participantId === participant.id && r.sessionId === sessionId
    );
    if (alreadyAttended) {
      throw new Error(`⚠️ Peserta '${participant.name}' (${participant.code}) sudah tercatat hadir pada sesi '${sessionName}'. Presensi ganda dicegah.`);
    }

    const isOffline = syncQueueService.getConnectionState() === 'offline';
    const operationalMode = localCampServerService.getOperationalMode();
    const xpReward = 5;

    // Enqueue centralized offline transaction with pre-generated UUID
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

    let syncStatus: 'Saved on Device' | 'Saved on Server Buper' | 'Synced to Cloud' = 'Synced to Cloud';
    let destination: 'device' | 'server_buper' | 'cloud' = 'cloud';
    let edgeNodeId: string | undefined = undefined;

    if (isOffline) {
      syncStatus = 'Saved on Device';
      destination = 'device';
    } else if (operationalMode === 'local' || operationalMode === 'hybrid') {
      const edgeRes = localCampServerService.receiveTransactionFromDevice(tx);
      syncStatus = 'Saved on Server Buper';
      destination = 'server_buper';
      edgeNodeId = edgeRes.acknowledgement.edge_server_id;
    } else {
      syncStatus = 'Synced to Cloud';
      destination = 'cloud';
    }

    const record: AttendanceRecord = {
      id: `att_${Date.now()}`,
      transactionId: tx.transaction_id,
      participantId: participant.id,
      participantName: participant.name,
      participantCode: participant.code,
      contingentName: participant.contingentName,
      sessionId,
      sessionName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      xpAwarded: xpReward,
      synced: destination !== 'device',
      syncStatus,
      edgeNodeId,
    };

    this.records.unshift(record);
    participant.attendanceCount += 1;

    // Award +5 XP
    await pointService.awardXP(participant.id, participant.name, xpReward, `Presensi: ${sessionName}`, 'attendance');

    return { record, offline: isOffline, destination };
  }
}

export const attendanceService = new AttendanceService();

