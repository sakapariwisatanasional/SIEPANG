/**
 * @license
 * SiEpang - Canonical Admin Persistence Service
 *
 * All admin mutations are persisted through:
 * React -> service -> apiTransport -> GAS -> RBAC -> canonical Spreadsheet.
 *
 * This service never writes localStorage and never fabricates a server-confirmed ID.
 */
import { apiTransport } from './apiTransport';

export type CanonicalEntity =
  | 'participants'
  | 'contingents'
  | 'attendance'
  | 'competitionEntries'
  | 'judgingScores'
  | 'pointTransactions'
  | 'participantBadges'
  | 'healthRecords'
  | 'incidents'
  | 'logistics'
  | 'organizations'
  | 'profilePhotos'
  | 'banners'
  | 'sponsors'
  | 'sponsorSettings'
  | 'brandingAssets'
  | 'mediaPublications'
  | 'documentTemplates'
  | 'generatedDocuments'
  | 'visitors'
  | 'visitorPasses'
  | 'visitorVisits'
  | 'visitorGates'
  | 'users'
  | 'userRoleAssignments'
  | 'featureConfigs';

export interface CanonicalMutationResult<T = Record<string, any>> {
  record: T;
  entity: CanonicalEntity;
}

class AdminPersistenceService {
  public async list<T = Record<string, any>>(
    entity: CanonicalEntity,
    filters: Record<string, any> = {}
  ): Promise<T[]> {
    const res = await apiTransport.send<{ records: T[] }>(
      'admin.entity.list',
      { entity, filters }
    );

    if (!res.ok) {
      throw new Error(res.error?.message || `Gagal memuat ${entity}.`);
    }

    return Array.isArray(res.data?.records) ? res.data.records : [];
  }

  public async upsert<T extends Record<string, any>>(
    entity: CanonicalEntity,
    record: T
  ): Promise<T> {
    const res = await apiTransport.send<CanonicalMutationResult<T>>(
      'admin.entity.upsert',
      { entity, record },
      { timeoutMs: 60000 }
    );

    if (!res.ok || !res.data?.record) {
      throw new Error(res.error?.message || `Gagal menyimpan ${entity}.`);
    }

    return res.data.record;
  }

  public async archive<T = Record<string, any>>(
    entity: CanonicalEntity,
    id: string,
    updates: Record<string, any> = {}
  ): Promise<T> {
    const res = await apiTransport.send<CanonicalMutationResult<T>>(
      'admin.entity.archive',
      { entity, id, updates }
    );

    if (!res.ok || !res.data?.record) {
      throw new Error(res.error?.message || `Gagal mengarsipkan ${entity}.`);
    }

    return res.data.record;
  }

  public async remove(
    entity: CanonicalEntity,
    id: string
  ): Promise<boolean> {
    const res = await apiTransport.send<{ deleted: boolean }>(
      'admin.entity.delete',
      { entity, id }
    );

    if (!res.ok) {
      throw new Error(res.error?.message || `Gagal menghapus ${entity}.`);
    }

    return Boolean(res.data?.deleted);
  }

  public async getConfig<T = any>(key: string): Promise<T | null> {
    const res = await apiTransport.send<{ value: T | null }>(
      'admin.config.get',
      { key }
    );
    if (!res.ok) throw new Error(res.error?.message || 'Gagal memuat konfigurasi.');
    return res.data?.value ?? null;
  }

  public async setConfig<T = any>(key: string, value: T): Promise<T> {
    const res = await apiTransport.send<{ value: T }>(
      'admin.config.set',
      { key, value }
    );
    if (!res.ok) throw new Error(res.error?.message || 'Gagal menyimpan konfigurasi.');
    return res.data?.value as T;
  }
}

export const adminPersistenceService = new AdminPersistenceService();
