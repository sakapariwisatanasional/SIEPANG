/**
 * @license
 * SiEpang - Online User & Role Management Service
 * Manages user accounts, invitations, role assignments, activation status,
 * and structured permission matrices grouped into 13 operational domains.
 * All mutations persist directly to the customer-owned Google Spreadsheet.
 */

import { User, UserRole, TrustedDeviceRecord } from '../types';
import { apiTransport } from './apiTransport';
import { adminPersistenceService } from './adminPersistenceService';

export interface ManagedUser extends User {
  status: 'active' | 'inactive';
  lastLogin: string;
  organizationName?: string;
  createdAt: string;
}

export interface PermissionGroup {
  id: string;
  title: string;
  description: string;
  permissions: {
    code: string;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'grp_event',
    title: 'Manajemen Event & Kwartir',
    description: 'Pengaturan identitas event, siklus hidup, dan konfigurasi fitur.',
    permissions: [
      { code: 'event.view', label: 'Lihat Informasi Event', description: 'Melihat detail publik dan jadwal event' },
      { code: 'event.update', label: 'Ubah Pengaturan Event', description: 'Memperbarui tema, tanggal, dan deskripsi event' },
      { code: 'event.archive', label: 'Arsipkan Event', description: 'Menutup dan mengarsipkan seluruh data event' },
    ],
  },
  {
    id: 'grp_participants',
    title: 'Peserta & Kontingen',
    description: 'Verifikasi biodata pramuka, pengelompokan regu/sangga, dan cetak kartu.',
    permissions: [
      { code: 'participant.view', label: 'Lihat Daftar Peserta', description: 'Melihat data anggota kontingen' },
      { code: 'participant.verify', label: 'Verifikasi Berkas Peserta', description: 'Memeriksa keabsahan KTA dan surat izin' },
      { code: 'participant.approve', label: 'Persetujuan Akhir Peserta', description: 'Mengesahkan status kepesertaan' },
      { code: 'contingent.manage', label: 'Kelola Kontingen', description: 'Menetapkan pimpinan kontingen dan kuota' },
    ],
  },
  {
    id: 'grp_registration',
    title: 'Pendaftaran & Formulir Dinamis',
    description: 'Konfigurasi formulir dinamis, kuota pendaftaran, dan gelombang registrasi.',
    permissions: [
      { code: 'registration.config', label: 'Konfigurasi Formulir', description: 'Menambah dan mengubah kolom formulir' },
      { code: 'registration.open_close', label: 'Buka / Tutup Registrasi', description: 'Mengatur periode pendaftaran' },
    ],
  },
  {
    id: 'grp_schedule',
    title: 'Jadwal & Agenda Kegiatan',
    description: 'Penyusunan jadwal kegiatan perkemahan dan deteksi bentrok jadwal.',
    permissions: [
      { code: 'schedule.view', label: 'Lihat Jadwal', description: 'Melihat agenda perkemahan' },
      { code: 'schedule.create', label: 'Tambah Agenda', description: 'Membuat jadwal baru di timeline' },
      { code: 'schedule.update', label: 'Ubah & Pindah Jadwal', description: 'Menggeser jam atau hari kegiatan' },
      { code: 'schedule.publish', label: 'Publikasikan Jadwal', description: 'Menampilkan jadwal ke aplikasi peserta' },
    ],
  },
  {
    id: 'grp_campsite',
    title: 'Kavling Tenda & Bumi Perkemahan',
    description: 'Pemetaan sub-camp, zona putra/putri, blok kavling, dan fasilitas MCK/air.',
    permissions: [
      { code: 'campsite.view', label: 'Lihat Denah Kavling', description: 'Melihat pembagian kavling tenda' },
      { code: 'campsite.assign', label: 'Penetapan Kavling', description: 'Menempatkan kontingen ke kavling tertentu' },
      { code: 'facility.manage', label: 'Kelola Fasilitas Buper', description: 'Menandai posko medis, MCK, dan musholla' },
    ],
  },
  {
    id: 'grp_competition',
    title: 'Lomba & Penjurian',
    description: 'Kriteria rubrik penilaian, penugasan dewan juri, dan penguncian nilai.',
    permissions: [
      { code: 'competition.view', label: 'Lihat Daftar Lomba', description: 'Melihat cabang lomba yang aktif' },
      { code: 'competition.manage', label: 'Kelola Kriteria Lomba', description: 'Menyusun rubrik bobot nilai 100%' },
      { code: 'judge.assign', label: 'Tugaskan Dewan Juri', description: 'Menunjuk juri pada cabang lomba' },
      { code: 'judge.score', label: 'Input Nilai Juri', description: 'Memberikan skor pada karya peserta' },
      { code: 'judge.lock', label: 'Kunci Nilai Resmi', description: 'Mengunci nilai agar tidak bisa diubah' },
    ],
  },
  {
    id: 'grp_voting',
    title: 'Voting Apresiasi Karya',
    description: 'Apresiasi karya video/foto favorit oleh peserta dan publik.',
    permissions: [
      { code: 'voting.vote', label: 'Berikan Suara Voting', description: 'Memilih karya favorit sesuai kuota' },
      { code: 'voting.manage', label: 'Konfigurasi Voting', description: 'Mengatur batas suara dan bobot publik' },
    ],
  },
  {
    id: 'grp_points',
    title: 'Poin XP & Lencana Pramuka',
    description: 'Buku besar gamifikasi XP, scan presensi apel, dan klaim lencana digital.',
    permissions: [
      { code: 'points.award', label: 'Anugerahkan Poin XP', description: 'Memberi XP dari giat prestasi' },
      { code: 'attendance.scan', label: 'Scan QR Presensi', description: 'Mencatat kehadiran apel dan giat' },
      { code: 'badge.manage', label: 'Kelola Lencana Digital', description: 'Menerbitkan lencana pencapaian' },
    ],
  },
  {
    id: 'grp_documents',
    title: 'Dokumen & Sertifikat Digital',
    description: 'Desain templat ID Card, nomor piagam penghargaan, dan verifikasi QR publik.',
    permissions: [
      { code: 'document.id_card', label: 'Cetak Massal ID Card', description: 'Menghasilkan kartu tanda peserta' },
      { code: 'document.certificate', label: 'Terbitkan Piagam', description: 'Menghasilkan e-sertifikat ber-QR' },
      { code: 'document.verify', label: 'Verifikasi Keaslian', description: 'Memvalidasi QR piagam penghargaan' },
    ],
  },
  {
    id: 'grp_health',
    title: 'Posko Kesehatan & Medis',
    description: 'Pencatatan insiden medis, riwayat alergi, dan rujukan darurat.',
    permissions: [
      { code: 'health.manage', label: 'Kelola Catatan Medis', description: 'Mencatat triase dan rekam medis pasien' },
      { code: 'health.emergency', label: 'Panggilan Darurat', description: 'Mengaktifkan sirene siaga posko' },
    ],
  },
  {
    id: 'grp_logistics',
    title: 'Logistik & Inventaris Tenda',
    description: 'Peminjaman perlengkapan pioneering, sound system, dan konsumsi.',
    permissions: [
      { code: 'logistics.manage', label: 'Kelola Barang Buper', description: 'Mencatat stok dan sirkulasi peminjaman' },
    ],
  },
  {
    id: 'grp_audit',
    title: 'Audit Trail & Keamanan',
    description: 'Pemeriksaan jejak rekam mutasi administratif dan keamanan sistem.',
    permissions: [
      { code: 'audit.view', label: 'Lihat Audit Trail', description: 'Memantau log aktivitas administrator' },
    ],
  },
  {
    id: 'grp_settings',
    title: 'Pengaturan Kwartir & Domain',
    description: 'Custom domain, branding logo, dan manajemen pengguna.',
    permissions: [
      { code: 'settings.workspace', label: 'Pengaturan Workspace', description: 'Mengubah identitas kwartir dan Google Drive' },
      { code: 'settings.users', label: 'Kelola Hak Akses Pengguna', description: 'Menambah dan menetapkan peran panitia' },
    ],
  },
];

export const ROLE_PERMISSION_MAP: Record<UserRole, string[]> = {
  superadmin: [
    'event.view', 'event.update', 'event.archive',
    'participant.view', 'participant.verify', 'participant.approve', 'contingent.manage',
    'registration.config', 'registration.open_close',
    'schedule.view', 'schedule.create', 'schedule.update', 'schedule.publish',
    'campsite.view', 'campsite.assign', 'facility.manage',
    'competition.view', 'competition.manage', 'judge.assign', 'judge.score', 'judge.lock',
    'voting.vote', 'voting.manage',
    'points.award', 'attendance.scan', 'badge.manage',
    'document.id_card', 'document.certificate', 'document.verify',
    'health.manage', 'health.emergency',
    'logistics.manage',
    'audit.view',
    'settings.workspace', 'settings.users',
  ],
  workspace_admin: [
    'event.view', 'event.update',
    'participant.view', 'participant.verify', 'participant.approve', 'contingent.manage',
    'registration.config', 'registration.open_close',
    'schedule.view', 'schedule.create', 'schedule.update', 'schedule.publish',
    'campsite.view', 'campsite.assign', 'facility.manage',
    'competition.view', 'competition.manage', 'judge.assign', 'judge.score', 'judge.lock',
    'voting.manage',
    'points.award', 'attendance.scan', 'badge.manage',
    'document.id_card', 'document.certificate', 'document.verify',
    'health.manage',
    'logistics.manage',
    'audit.view',
    'settings.workspace', 'settings.users',
  ],
  event_admin: [
    'event.view', 'event.update',
    'participant.view', 'participant.verify', 'contingent.manage',
    'schedule.view', 'schedule.create', 'schedule.update', 'schedule.publish',
    'campsite.view', 'campsite.assign', 'facility.manage',
    'competition.view', 'competition.manage', 'judge.assign',
    'voting.manage',
    'points.award', 'attendance.scan', 'badge.manage',
    'document.id_card', 'document.verify',
    'health.manage',
    'logistics.manage',
  ],
  kontingen_admin: [
    'event.view',
    'participant.view', 'contingent.manage',
    'schedule.view',
    'campsite.view',
    'competition.view',
    'voting.vote',
    'document.verify',
  ],
  registration_officer: [
    'event.view',
    'participant.view', 'participant.verify', 'participant.approve',
    'document.id_card', 'document.verify',
    'schedule.view',
  ],
  judge: [
    'event.view',
    'competition.view', 'judge.score', 'judge.lock',
    'schedule.view',
  ],
  attendance_officer: [
    'event.view',
    'attendance.scan', 'points.award',
    'participant.view',
    'schedule.view',
  ],
  health_officer: [
    'event.view',
    'health.manage', 'health.emergency',
    'participant.view',
    'schedule.view',
  ],
  logistic_officer: [
    'event.view',
    'logistics.manage',
    'campsite.view',
  ],
  ceremony_officer: [
    'event.view',
    'schedule.view',
    'attendance.scan',
  ],
  committee: [
    'event.view',
    'schedule.view',
    'attendance.scan',
    'points.award',
  ],
  viewer: [
    'event.view',
    'schedule.view',
    'competition.view',
  ],
  participant: [
    'event.view',
    'schedule.view',
    'competition.view',
    'voting.vote',
    'document.verify',
  ],
  documentation_officer: [
    'event.view',
    'schedule.view',
    'documentation.read',
    'documentation.create',
    'documentation.update',
    'documentation.publish',
    'documentation.archive',
    'documentation.manage',
  ],
  publication_officer: [
    'event.view',
    'schedule.view',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.publish',
    'banner.archive',
    'banner.manage',
    'sponsor.read',
    'sponsor.create',
    'sponsor.update',
    'sponsor.publish',
    'sponsor.manage',
  ],
};

export class UserManagementService {
  private users: ManagedUser[] = [];
  private listeners: Set<() => void> = new Set();
  private isLoading = false;

  constructor() {
    setTimeout(() => void this.refreshUsers(), 0);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  private normalizeUser(row: any): ManagedUser {
    return {
      id: String(row.user_id || row.id || ''),
      name: String(row.name || ''),
      email: String(row.email || ''),
      role: (row.role || 'viewer') as UserRole,
      workspaceId: String(row.workspace_id || row.workspaceId || ''),
      eventId: String(row.event_id || row.eventId || ''),
      avatar: String(row.avatar_url || row.avatar || ''),
      organizationName: String(row.organization_name || row.organizationName || 'Gerakan Pramuka'),
      status: String(row.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
      lastLogin: String(row.last_login_at || row.lastLogin || 'Belum pernah login'),
      createdAt: String(row.created_at || row.createdAt || ''),
    } as ManagedUser;
  }

  public async refreshUsers(): Promise<ManagedUser[]> {
    if (this.isLoading) return [...this.users];
    this.isLoading = true;
    try {
      const [userRows, assignments] = await Promise.all([
        adminPersistenceService.list<any>('users'),
        adminPersistenceService.list<any>('userRoleAssignments'),
      ]);

      const activeRoleByUser = new Map<string, string>();
      assignments
        .filter((a: any) => String(a.status || '').toLowerCase() === 'active')
        .forEach((a: any) => {
          const uid = String(a.user_id || '');
          const role = String(a.role || 'viewer');
          if (!activeRoleByUser.has(uid) || role === 'superadmin') {
            activeRoleByUser.set(uid, role);
          }
        });

      this.users = userRows.map((r: any) =>
        this.normalizeUser({
          ...r,
          role: activeRoleByUser.get(String(r.user_id || r.id || '')) || r.role || 'viewer',
        })
      );
      this.notify();
      return [...this.users];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Compatibility method. Bootstrap is backend-authoritative; this method only
   * returns the already-loaded record and never fabricates one in the browser.
   */
  public ensureBootstrapSuperadmin(_workspaceId?: string): ManagedUser {
    const existing = this.users.find(
      u => u.email?.toLowerCase().trim() === 'scoutpreneur@gmail.com'
    );
    if (!existing) {
      throw new Error('SuperAdmin belum termuat dari backend. Jalankan bootstrap backend terlebih dahulu.');
    }
    return existing;
  }

  public getUsers(): ManagedUser[] {
    return [...this.users];
  }

  public listUsers(workspaceId?: string): ManagedUser[] {
    return workspaceId
      ? this.users.filter(u => u.workspaceId === workspaceId)
      : [...this.users];
  }

  public async addUser(data: {
    name: string;
    email: string;
    role: UserRole;
    workspaceId: string;
    organizationName?: string;
    status?: 'active' | 'inactive';
  }): Promise<ManagedUser> {
    const cleanEmail = data.email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Alamat email tidak valid.');
    if (this.users.some(u => u.email?.toLowerCase().trim() === cleanEmail)) {
      throw new Error(`Email '${cleanEmail}' sudah terdaftar.`);
    }

    const saved = await adminPersistenceService.upsert<any>('users', {
      email: cleanEmail,
      name: data.name.trim(),
      email_verified: false,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      created_by: '',
      updated_at: new Date().toISOString(),
      avatar_url: '',
      phone: '',
      organization_id: data.organizationName || '',
      workspace_id: data.workspaceId,
    });

    const assignment = await adminPersistenceService.upsert<any>('userRoleAssignments', {
      user_id: saved.user_id,
      role: data.role,
      scope_type: data.role === 'superadmin' ? 'SYSTEM' : 'WORKSPACE',
      scope_id: data.role === 'superadmin' ? 'GLOBAL' : data.workspaceId,
      status: 'active',
      granted_by: '',
      granted_at: new Date().toISOString(),
      revoked_at: '',
    });

    void assignment;

    const user = this.normalizeUser({
      ...saved,
      role: data.role,
      workspace_id: data.workspaceId,
      organization_name: data.organizationName,
    });
    this.users.unshift(user);
    this.notify();
    return user;
  }

  public async updateUser(userId: string, updates: Partial<ManagedUser>): Promise<ManagedUser> {
    const current = this.users.find(u => u.id === userId);
    if (!current) throw new Error('Pengguna tidak ditemukan.');

    const email = updates.email ? updates.email.toLowerCase().trim() : current.email;
    if (!email || !email.includes('@')) throw new Error('Alamat email tidak valid.');
    if (this.users.some(u => u.id !== userId && u.email?.toLowerCase().trim() === email)) {
      throw new Error(`Email '${email}' sudah digunakan pengguna lain.`);
    }

    const saved = await adminPersistenceService.upsert<any>('users', {
      user_id: userId,
      email,
      name: updates.name ?? current.name,
      status: updates.status ?? current.status,
      avatar_url: updates.avatar ?? current.avatar ?? '',
      organization_id: (updates as any).organization_id || updates.organizationName || current.organizationName || '',
      workspace_id: updates.workspaceId || current.workspaceId || '',
      updated_at: new Date().toISOString(),
    });

    let role = updates.role || current.role;
    if (updates.role && updates.role !== current.role) {
      await this.updateUserRole(userId, updates.role);
      role = updates.role;
    }

    const next = this.normalizeUser({
      ...saved,
      role,
      workspace_id: updates.workspaceId || current.workspaceId,
      organization_name: updates.organizationName || current.organizationName,
    });

    const idx = this.users.findIndex(u => u.id === userId);
    this.users[idx] = next;
    this.notify();
    return next;
  }

  public async updateUserRole(userId: string, newRole: UserRole): Promise<ManagedUser> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const assignments = await adminPersistenceService.list<any>('userRoleAssignments', { user_id: userId });
    for (const a of assignments.filter((x: any) => String(x.status || '').toLowerCase() === 'active')) {
      await adminPersistenceService.upsert<any>('userRoleAssignments', {
        ...a,
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      });
    }

    await adminPersistenceService.upsert<any>('userRoleAssignments', {
      user_id: userId,
      role: newRole,
      scope_type: newRole === 'superadmin' ? 'SYSTEM' : 'WORKSPACE',
      scope_id: newRole === 'superadmin' ? 'GLOBAL' : user.workspaceId,
      status: 'active',
      granted_by: '',
      granted_at: new Date().toISOString(),
      revoked_at: '',
    });

    user.role = newRole;
    this.notify();
    return user;
  }

  public async toggleUserStatus(userId: string): Promise<ManagedUser> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const saved = await adminPersistenceService.upsert<any>('users', {
      user_id: userId,
      email: user.email,
      name: user.name,
      status: nextStatus,
      avatar_url: user.avatar || '',
      organization_id: user.organizationName || '',
      workspace_id: user.workspaceId || '',
      updated_at: new Date().toISOString(),
    });
    const next = this.normalizeUser({ ...saved, role: user.role, workspace_id: user.workspaceId });
    const idx = this.users.findIndex(u => u.id === userId);
    this.users[idx] = next;
    this.notify();
    return next;
  }

  public async revokeUserRole(userId: string): Promise<ManagedUser> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    const assignments = await adminPersistenceService.list<any>('userRoleAssignments', { user_id: userId });
    for (const a of assignments.filter((x: any) => String(x.status || '').toLowerCase() === 'active')) {
      await adminPersistenceService.upsert<any>('userRoleAssignments', {
        ...a,
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      });
    }
    user.role = 'viewer';
    this.notify();
    return user;
  }

  public async logoutUserFromAllDevices(userId: string): Promise<boolean> {
    const res = await apiTransport.send('auth.logoutAll', { user_id: userId });
    return res.ok;
  }

  public async listUserTrustedDevices(userId: string): Promise<TrustedDeviceRecord[]> {
    const res = await apiTransport.send<TrustedDeviceRecord[]>('auth.devices.list', { user_id: userId });
    return res.ok && Array.isArray(res.data) ? res.data : [];
  }

  public async revokeUserDevice(devicePublicId: string): Promise<boolean> {
    const res = await apiTransport.send('auth.devices.revoke', { device_public_id: devicePublicId });
    return res.ok;
  }

  public async removeUser(userId: string): Promise<void> {
    await adminPersistenceService.upsert<any>('users', {
      user_id: userId,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    });
    this.users = this.users.filter(u => u.id !== userId);
    this.notify();
  }

  public getPermissionGroups(): PermissionGroup[] {
    return PERMISSION_GROUPS;
  }
}

export const userManagementService = new UserManagementService();
