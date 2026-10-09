/**
 * @license
 * SiEpang - Single Authoritative Canonical Schema Registry (Milestone v1.8 Release Candidate)
 * Authoritative Schema v1.8 with Complete Feature-to-Storage Coverage.
 * All provisioning, validation, migrations, repositories, health checks,
 * and customer Google Apps Script backends MUST consume this exact schema.
 * 
 * Version: v1.8
 */

export const CANONICAL_SCHEMA_VERSION = 'v1.8';

export type TableCategory =
  | 'CORE'
  | 'EVENT'
  | 'PARTICIPANT'
  | 'OPERATION'
  | 'COMPETITION'
  | 'GAMIFICATION'
  | 'VISITOR'
  | 'PUBLICATION'
  | 'DOCUMENT'
  | 'SAFETY'
  | 'SYSTEM';

export type TableRequirement = 'REQUIRED' | 'OPTIONAL_BY_FEATURE';

export interface ColumnDefinition {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATETIME' | 'DATE';
  required: boolean;
  isPrimaryKey?: boolean;
  description: string;
  defaultValue?: any;
}

export interface TableDefinition {
  tableName: string;
  category: TableCategory;
  requirement: TableRequirement;
  featureName: string;
  description: string;
  primaryKey: string;
  majorForeignKeys?: string[];
  columns: ColumnDefinition[];
  seedRowCount?: number;
}

export type DatabaseClassification =
  | 'EMPTY_SPREADSHEET'
  | 'VALID_SIEPANG_DATABASE'
  | 'OLDER_SCHEMA'
  | 'NEWER_UNSUPPORTED_SCHEMA'
  | 'INVALID_SCHEMA'
  | 'READ_ONLY'
  | 'ACCESS_DENIED';

export interface SchemaValidationDetail {
  tableName: string;
  category: TableCategory;
  requirement: TableRequirement;
  exists: boolean;
  missingColumns: string[];
  extraColumns: string[];
  isValid: boolean;
}

export interface DatabaseClassificationResult {
  status: DatabaseClassification;
  detectedVersion?: string;
  targetVersion: string;
  tableCount: number;
  expectedTableCount: number;
  requiredTableCount: number;
  missingRequiredTables: string[];
  tableDetails: SchemaValidationDetail[];
  message: string;
  canAutoMigrate: boolean;
}

/**
 * The 39 Authoritative Canonical Tables of SiEpang Schema v1.6
 * Fully covering every operational module across the entire platform.
 */
export const CANONICAL_TABLES: Record<string, TableDefinition> = {
  // ==================== SYSTEM TABLES ====================
  InstallationConfig: {
    tableName: 'InstallationConfig',
    category: 'SYSTEM',
    requirement: 'REQUIRED',
    featureName: 'Instalasi & Konfigurasi Runtime',
    description: 'Konfigurasi instalasi customer dan parameter backend Google Apps Script',
    primaryKey: 'key',
    columns: [
      { name: 'key', type: 'STRING', required: true, isPrimaryKey: true, description: 'Kunci konfigurasi sistem' },
      { name: 'value', type: 'STRING', required: true, description: 'Nilai konfigurasi tersimpan' },
      { name: 'description', type: 'STRING', required: false, description: 'Penjelasan kegunaan parameter' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu pembaruan terakhir' },
    ],
  },
  FeatureConfigs: {
    tableName: 'FeatureConfigs',
    category: 'SYSTEM',
    requirement: 'REQUIRED',
    featureName: 'Feature Control (Backend-Driven)',
    description: 'Konfigurasi status fitur hierarkis (SYSTEM, WORKSPACE, EVENT) lintas perangkat',
    primaryKey: 'id',
    majorForeignKeys: ['scope_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik konfigurasi fitur' },
      { name: 'feature_key', type: 'STRING', required: true, description: 'Kunci fitur kanonikal' },
      { name: 'scope_type', type: 'STRING', required: true, description: 'Tingkat lingkup (SYSTEM, WORKSPACE, EVENT)' },
      { name: 'scope_id', type: 'STRING', required: true, description: 'ID sasaran lingkup' },
      { name: 'configured_state', type: 'STRING', required: true, description: 'Status dikonfigurasi (ENABLED, DISABLED, INHERIT)' },
      { name: 'metadata_json', type: 'JSON', required: false, description: 'Metadata perilaku efektif' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu pembaruan' },
      { name: 'updated_by', type: 'STRING', required: false, description: 'User pembaru' },
    ],
  },
  AuditLogs: {
    tableName: 'AuditLogs',
    category: 'SYSTEM',
    requirement: 'REQUIRED',
    featureName: 'Audit & Kepatuhan',
    description: 'Log audit rekam jejak kepatuhan dan tata kelola enterprise',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID log audit' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace' },
      { name: 'module', type: 'STRING', required: true, description: 'Modul sistem' },
      { name: 'action', type: 'STRING', required: true, description: 'Aksi yang dilakukan' },
      { name: 'actor_name', type: 'STRING', required: true, description: 'Nama pelaku aksi' },
      { name: 'actor_role', type: 'STRING', required: true, description: 'Peran pengguna' },
      { name: 'timestamp', type: 'DATETIME', required: true, description: 'Waktu pencatatan' },
      { name: 'target', type: 'STRING', required: false, description: 'Objek sasaran' },
    ],
  },
  SyncLogs: {
    tableName: 'SyncLogs',
    category: 'SYSTEM',
    requirement: 'REQUIRED',
    featureName: 'Sinkronisasi Multi-Device',
    description: 'Log sinkronisasi offline-online dan token idempoten antar-perangkat',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik catatan sinkronisasi' },
      { name: 'device_id', type: 'STRING', required: true, description: 'ID perangkat petugas' },
      { name: 'sync_version', type: 'NUMBER', required: true, description: 'Versi inkremental sinkronisasi' },
      { name: 'status', type: 'STRING', required: true, description: 'Status sinkronisasi (SUCCESS, CONFLICT)' },
      { name: 'payload_hash', type: 'STRING', required: true, description: 'Hash keutuhan data transaksi' },
      { name: 'synced_at', type: 'DATETIME', required: true, description: 'Waktu proses sinkronisasi' },
    ],
  },
  QRTokens: {
    tableName: 'QRTokens',
    category: 'SYSTEM',
    requirement: 'REQUIRED',
    featureName: 'Secure QR Registry',
    description: 'Registry terpusat token QR terenkripsi tanpa ekspos ID numerik mentah',
    primaryKey: 'token_id',
    majorForeignKeys: ['entity_id', 'event_id'],
    columns: [
      { name: 'token_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik registry token QR' },
      { name: 'token_type', type: 'STRING', required: true, description: 'Tipe entitas (PARTICIPANT, ACTIVITY, CHECKPOINT, VISITOR, CERTIFICATE)' },
      { name: 'entity_id', type: 'STRING', required: true, description: 'ID entitas terhubung' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event perkemahan' },
      { name: 'token_hash', type: 'STRING', required: true, description: 'Hash HMAC token QR acak aman' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aktif (ACTIVE, REVOKED, EXPIRED)' },
      { name: 'expires_at', type: 'DATETIME', required: false, description: 'Waktu kedaluwarsa' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu pembuatan token' },
    ],
  },

  // ==================== CORE HIERARCHY & USERS ====================
  Organizations: {
    tableName: 'Organizations',
    category: 'CORE',
    requirement: 'REQUIRED',
    featureName: 'Struktur Organisasi Kwartir',
    description: 'Hierarki struktur kwartir (Kwarnas, Kwarda, Kwarcab, Kwarran, Gudep)',
    primaryKey: 'organization_id',
    columns: [
      { name: 'organization_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID organisasi kwartir' },
      { name: 'organization_code', type: 'STRING', required: true, description: 'Kode numerik kwartir (misal 13.10)' },
      { name: 'organization_name', type: 'STRING', required: true, description: 'Nama kwartir atau pangkalan' },
      { name: 'organization_level', type: 'STRING', required: true, description: 'Level (KWARNAS, KWARDA, KWARCAB, KWARRAN, GUDEP)' },
      { name: 'parent_organization_id', type: 'STRING', required: false, description: 'ID kwartir induk di atasnya' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aktif organisasi' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu registrasi' },
    ],
  },
  Users: {
    tableName: 'Users',
    category: 'CORE',
    requirement: 'REQUIRED',
    featureName: 'Autentikasi & Akun Pengguna',
    description: 'Daftar pengguna dan profil akun SiEpang (Email OTP)',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik pengguna' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace kwartir' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama lengkap pengguna' },
      { name: 'email', type: 'STRING', required: true, description: 'Alamat surel terdaftar pengguna' },
      { name: 'role', type: 'STRING', required: true, description: 'Peran RBAC utama' },
      { name: 'organization_id', type: 'STRING', required: false, description: 'ID kwartir/pangkalan pengguna' },
      { name: 'status', type: 'STRING', required: true, description: 'Status akun pengguna' },
      { name: 'last_login', type: 'DATETIME', required: false, description: 'Waktu login terakhir' },
    ],
  },
  UserRoleAssignments: {
    tableName: 'UserRoleAssignments',
    category: 'CORE',
    requirement: 'REQUIRED',
    featureName: 'Otorisasi RBAC Persisten',
    description: 'Penugasan peran dan izin RBAC terperinci per workspace atau event',
    primaryKey: 'id',
    majorForeignKeys: ['user_id', 'scope_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID penugasan peran' },
      { name: 'user_id', type: 'STRING', required: true, description: 'ID pengguna' },
      { name: 'role', type: 'STRING', required: true, description: 'Peran yang diberikan' },
      { name: 'scope_type', type: 'STRING', required: true, description: 'Lingkup otoritas (WORKSPACE, EVENT)' },
      { name: 'scope_id', type: 'STRING', required: true, description: 'ID sasaran otoritas' },
      { name: 'permissions_json', type: 'JSON', required: false, description: 'Daftar izin spesifik' },
      { name: 'granted_by', type: 'STRING', required: true, description: 'Pemberi wewenang' },
      { name: 'granted_at', type: 'DATETIME', required: true, description: 'Waktu pemberian izin' },
    ],
  },

  // ==================== EVENT & BRANDING ====================
  Events: {
    tableName: 'Events',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Manajemen Event Perkemahan',
    description: 'Data utama penyelenggaraan perkemahan pramuka',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik event perkemahan' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace kwartir pemilik' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama lengkap event' },
      { name: 'short_name', type: 'STRING', required: true, description: 'Nama singkat event' },
      { name: 'event_code', type: 'STRING', required: true, description: 'Kode resmi event' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori (Jambore, Raimuna, dll)' },
      { name: 'theme', type: 'STRING', required: true, description: 'Tema perkemahan' },
      { name: 'start_date', type: 'DATE', required: true, description: 'Tanggal mulai perkemahan' },
      { name: 'end_date', type: 'DATE', required: true, description: 'Tanggal selesai perkemahan' },
      { name: 'location', type: 'STRING', required: true, description: 'Bumi perkemahan dan lokasi geografis' },
      { name: 'status', type: 'STRING', required: true, description: 'Status event (DRAFT, UPCOMING, ONGOING, COMPLETED)' },
      { name: 'participant_capacity', type: 'NUMBER', required: true, description: 'Kapasitas maksimum peserta' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu pembuatan' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu pembaruan' },
    ],
  },
  Announcements: {
    tableName: 'Announcements',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Pengumuman Resmi',
    description: 'Pemberitahuan broadcast resmi panitia ke peserta dan publik',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID pengumuman' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event pemilik' },
      { name: 'title', type: 'STRING', required: true, description: 'Judul pengumuman' },
      { name: 'content', type: 'STRING', required: true, description: 'Isi pengumuman' },
      { name: 'priority', type: 'STRING', required: true, description: 'Prioritas (NORMAL, URGENT, EMERGENCY)' },
      { name: 'audience', type: 'STRING', required: true, description: 'Sasaran (SEMUA, PESERTA, PEMBINA, JURI)' },
      { name: 'publish_start', type: 'DATETIME', required: true, description: 'Waktu mulai tayang' },
      { name: 'publish_end', type: 'DATETIME', required: false, description: 'Waktu selesai tayang' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (ACTIVE, ARCHIVED)' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu pembuatan' },
    ],
  },
  Banners: {
    tableName: 'Banners',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Banner Hero & Informasi',
    description: 'Banner visual hero dan strip informasi di beranda publik',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik banner' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'banner_type', type: 'STRING', required: true, description: 'Tipe banner (HERO, INFO_STRIP)' },
      { name: 'title', type: 'STRING', required: true, description: 'Judul/teks banner' },
      { name: 'image_url', type: 'STRING', required: true, description: 'URL gambar banner' },
      { name: 'target_url', type: 'STRING', required: false, description: 'Tautan eksternal' },
      { name: 'display_order', type: 'NUMBER', required: true, description: 'Urutan tayang' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (ACTIVE, INACTIVE)' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu pembuatan' },
    ],
  },
  Sponsors: {
    tableName: 'Sponsors',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Sponsor & Mitra Resmi',
    description: 'Logo sponsor dan mitra resmi perkemahan untuk strip carousel',
    primaryKey: 'sponsor_id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'sponsor_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik sponsor' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'logo_url', type: 'STRING', required: true, description: 'URL gambar logo sponsor' },
      { name: 'target_url', type: 'STRING', required: false, description: 'Tautan eksternal opsional' },
      { name: 'display_order', type: 'NUMBER', required: true, description: 'Urutan tampilan di carousel' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aktif (ACTIVE / INACTIVE)' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu penambahan' },
      { name: 'created_by', type: 'STRING', required: false, description: 'Petugas pembuat' },
      { name: 'updated_at', type: 'DATETIME', required: false, description: 'Waktu edit terakhir' },
      { name: 'updated_by', type: 'STRING', required: false, description: 'Petugas pengedit' },
    ],
  },
  SponsorSettings: {
    tableName: 'SponsorSettings',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Pengaturan Carousel Sponsor',
    description: 'Parameter carousel sponsor (kecepatan, arah, jeda hover) lintas perangkat',
    primaryKey: 'event_id',
    columns: [
      { name: 'event_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID event pemilik' },
      { name: 'carousel_enabled', type: 'BOOLEAN', required: true, description: 'Status aktif carousel' },
      { name: 'direction', type: 'STRING', required: true, description: 'Arah gerak (left, right)' },
      { name: 'carousel_duration_seconds', type: 'NUMBER', required: true, description: 'Durasi animasi siklus' },
      { name: 'pause_on_hover', type: 'BOOLEAN', required: true, description: 'Jeda saat kursor melayang' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu konfigurasi terakhir' },
    ],
  },
  BrandingAssets: {
    tableName: 'BrandingAssets',
    category: 'EVENT',
    requirement: 'REQUIRED',
    featureName: 'Branding & Identitas Visual',
    description: 'Aset logo aplikasi, favicon, hero, dan hierarki branding customer Drive',
    primaryKey: 'asset_id',
    majorForeignKeys: ['workspace_id', 'event_id'],
    columns: [
      { name: 'asset_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik aset branding' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace pemilik' },
      { name: 'event_id', type: 'STRING', required: false, description: 'ID event jika level event' },
      { name: 'asset_type', type: 'STRING', required: true, description: 'Tipe (APP_LOGO, FAVICON, EVENT_LOGO, HERO)' },
      { name: 'drive_file_id', type: 'STRING', required: true, description: 'Canonical Google Drive File ID' },
      { name: 'file_name', type: 'STRING', required: true, description: 'Nama berkas gambar' },
      { name: 'mime_type', type: 'STRING', required: true, description: 'Format MIME (image/png, image/webp)' },
      { name: 'public_render_url', type: 'STRING', required: true, description: 'URL render browser' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aktif (ACTIVE, ARCHIVED)' },
      { name: 'version', type: 'NUMBER', required: true, description: 'Versi branding untuk cache invalidation' },
      { name: 'priority', type: 'STRING', required: true, description: 'Prioritas (EVENT, WORKSPACE, INSTALLATION, DEFAULT)' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu unggah' },
    ],
  },

  // ==================== PARTICIPANTS & REGISTRATION ====================
  Contingents: {
    tableName: 'Contingents',
    category: 'PARTICIPANT',
    requirement: 'REQUIRED',
    featureName: 'Manajemen Kontingen',
    description: 'Data kontingen ranting dan perutusan pangkalan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID kontingen' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama kontingen' },
      { name: 'region', type: 'STRING', required: true, description: 'Asal kwarran/kwarcab' },
      { name: 'leader_name', type: 'STRING', required: true, description: 'Nama pimpinan kontingen (Pimkon)' },
      { name: 'leader_phone', type: 'STRING', required: false, description: 'Nomor telepon darurat' },
      { name: 'camp_zone', type: 'STRING', required: true, description: 'Alokasi kavling/subcamp' },
      { name: 'participant_count', type: 'NUMBER', required: true, description: 'Jumlah anggota kontingen' },
      { name: 'checked_in_count', type: 'NUMBER', required: true, description: 'Jumlah tiba di buper' },
    ],
  },
  Participants: {
    tableName: 'Participants',
    category: 'PARTICIPANT',
    requirement: 'REQUIRED',
    featureName: 'Biodata Peserta Pramuka',
    description: 'Daftar biodata peserta, nomor anggota Pramuka, dan status check-in',
    primaryKey: 'id',
    majorForeignKeys: ['event_id', 'contingent_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID peserta' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'contingent_id', type: 'STRING', required: true, description: 'ID kontingen' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama lengkap peserta' },
      { name: 'pramuka_id', type: 'STRING', required: true, description: 'Nomor Induk Anggota Pramuka / NTA' },
      { name: 'gender', type: 'STRING', required: true, description: 'Jenis kelamin (L / P)' },
      { name: 'subcamp', type: 'STRING', required: true, description: 'Zona tenda' },
      { name: 'lot_number', type: 'STRING', required: true, description: 'Nomor kavling' },
      { name: 'checked_in', type: 'BOOLEAN', required: true, description: 'Status check-in gerbang buper' },
      { name: 'checked_in_at', type: 'DATETIME', required: false, description: 'Waktu check-in' },
      { name: 'points', type: 'NUMBER', required: true, description: 'Akumulasi skor XP' },
      { name: 'rank', type: 'NUMBER', required: false, description: 'Peringkat klasemen' },
    ],
  },
  RegistrationConfigs: {
    tableName: 'RegistrationConfigs',
    category: 'PARTICIPANT',
    requirement: 'REQUIRED',
    featureName: 'Pengaturan Registrasi',
    description: 'Periode pendaftaran, kuota, dan konfigurasi formulir dinamis',
    primaryKey: 'event_id',
    columns: [
      { name: 'event_id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID event pemilik' },
      { name: 'registration_start', type: 'DATE', required: true, description: 'Tanggal buka registrasi' },
      { name: 'registration_end', type: 'DATE', required: true, description: 'Tanggal tutup registrasi' },
      { name: 'max_participants', type: 'NUMBER', required: true, description: 'Kuota maksimal peserta' },
      { name: 'max_per_contingent', type: 'NUMBER', required: true, description: 'Maksimum per kontingen' },
      { name: 'allow_self_registration', type: 'BOOLEAN', required: true, description: 'Izin registrasi mandiri' },
      { name: 'dynamic_fields_json', type: 'JSON', required: false, description: 'Definisi field kustom formulir' },
      { name: 'status', type: 'STRING', required: true, description: 'Status pendaftaran (OPEN, CLOSED)' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu konfigurasi' },
    ],
  },
  ParticipantDocuments: {
    tableName: 'ParticipantDocuments',
    category: 'PARTICIPANT',
    requirement: 'REQUIRED',
    featureName: 'Verifikasi Berkas Peserta',
    description: 'Berkas verifikasi peserta (surat tugas, izin ortu, asuransi, dll)',
    primaryKey: 'id',
    majorForeignKeys: ['participant_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID berkas peserta' },
      { name: 'participant_id', type: 'STRING', required: true, description: 'ID peserta pemilik' },
      { name: 'document_type', type: 'STRING', required: true, description: 'Jenis berkas (SURAT_TUGAS, IZIN_ORTU, ASURANSI, KTA)' },
      { name: 'drive_file_id', type: 'STRING', required: true, description: 'ID berkas di Google Drive' },
      { name: 'verification_status', type: 'STRING', required: true, description: 'Status verifikasi (PENDING, APPROVED, REJECTED)' },
      { name: 'verified_by', type: 'STRING', required: false, description: 'Petugas pemeriksa' },
      { name: 'verified_at', type: 'DATETIME', required: false, description: 'Waktu verifikasi' },
      { name: 'notes', type: 'STRING', required: false, description: 'Catatan hasil verifikasi' },
    ],
  },

  // ==================== OPERATIONS & CAMPSITE ====================
  Schedules: {
    tableName: 'Schedules',
    category: 'OPERATION',
    requirement: 'REQUIRED',
    featureName: 'Jadwal & Agenda Giat',
    description: 'Jadwal dan agenda giat harian perkemahan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID agenda jadwal' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event pemilik' },
      { name: 'title', type: 'STRING', required: true, description: 'Nama kegiatan' },
      { name: 'day_number', type: 'NUMBER', required: true, description: 'Hari ke-n perkemahan' },
      { name: 'date', type: 'DATE', required: true, description: 'Tanggal pelaksanaan' },
      { name: 'start_time', type: 'STRING', required: true, description: 'Waktu mulai (HH:MM)' },
      { name: 'end_time', type: 'STRING', required: true, description: 'Waktu selesai (HH:MM)' },
      { name: 'location', type: 'STRING', required: true, description: 'Tempat/zona pelaksanaan' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori giat' },
      { name: 'xp_reward', type: 'NUMBER', required: false, description: 'Poin XP kehadiran' },
      { name: 'is_published', type: 'BOOLEAN', required: true, description: 'Status publikasi ke portal' },
    ],
  },
  Activities: {
    tableName: 'Activities',
    category: 'OPERATION',
    requirement: 'REQUIRED',
    featureName: 'Katalog Materi Giat',
    description: 'Master jenis giat dan materi perkemahan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID jenis giat' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama giat' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori materi' },
      { name: 'description', type: 'STRING', required: false, description: 'Deskripsi giat' },
      { name: 'xp_points', type: 'NUMBER', required: true, description: 'Nilai XP' },
    ],
  },
  Campsites: {
    tableName: 'Campsites',
    category: 'OPERATION',
    requirement: 'REQUIRED',
    featureName: 'Tata Ruang Perkemahan',
    description: 'Tata ruang kavling perkemahan, subcamp, zona tenda, blok, kapasitas, dan penempatan kontingen',
    primaryKey: 'id',
    majorForeignKeys: ['event_id', 'subcamp_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID kavling' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'camp_name', type: 'STRING', required: true, description: 'Nama bumi perkemahan utama' },
      { name: 'subcamp_id', type: 'STRING', required: true, description: 'ID subcamp perkemahan' },
      { name: 'subcamp_name', type: 'STRING', required: true, description: 'Nama subcamp' },
      { name: 'zone_name', type: 'STRING', required: true, description: 'Nama zona tenda (Putra / Putri)' },
      { name: 'block_name', type: 'STRING', required: true, description: 'Nama blok kavling' },
      { name: 'lot_code', type: 'STRING', required: true, description: 'Kode kavling (misal A-01)' },
      { name: 'capacity_tents', type: 'NUMBER', required: true, description: 'Kapasitas tenda regu' },
      { name: 'capacity_participants', type: 'NUMBER', required: true, description: 'Kapasitas daya tampung peserta' },
      { name: 'assigned_contingent_id', type: 'STRING', required: false, description: 'ID kontingen penghuni' },
      { name: 'assigned_contingent_name', type: 'STRING', required: false, description: 'Nama kontingen penghuni' },
      { name: 'status', type: 'STRING', required: true, description: 'Status kavling (AVAILABLE, OCCUPIED, RESERVED)' },
    ],
  },
  AttendanceLogs: {
    tableName: 'AttendanceLogs',
    category: 'OPERATION',
    requirement: 'REQUIRED',
    featureName: 'Presensi & Kehadiran Lapangan',
    description: 'Log presensi pemindaian kehadiran kegiatan dan posko',
    primaryKey: 'id',
    majorForeignKeys: ['event_id', 'participant_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID log presensi' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'participant_id', type: 'STRING', required: true, description: 'ID peserta' },
      { name: 'checkpoint_or_schedule_id', type: 'STRING', required: true, description: 'ID pos atau jadwal' },
      { name: 'scanned_by_user_id', type: 'STRING', required: true, description: 'ID petugas pemindai' },
      { name: 'timestamp', type: 'DATETIME', required: true, description: 'Waktu pemindaian' },
      { name: 'sync_status', type: 'STRING', required: true, description: 'Status sinkronisasi (SYNCED, PENDING)' },
    ],
  },

  // ==================== COMPETITIONS & VOTING ====================
  Competitions: {
    tableName: 'Competitions',
    category: 'COMPETITION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Lomba Prestasi',
    description: 'Daftar cabang lomba giat prestasi dan rubrik penjurian',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID lomba' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'title', type: 'STRING', required: true, description: 'Nama cabang lomba' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori (Pramuka, Seni, Ketangkasan)' },
      { name: 'type', type: 'STRING', required: true, description: 'Format (RUBRIC_SCORED, SPEED_TIMED, VOTING)' },
      { name: 'status', type: 'STRING', required: true, description: 'Status lomba (DRAFT, ONGOING, LOCKED, COMPLETED)' },
      { name: 'max_score', type: 'NUMBER', required: true, description: 'Skor maksimum 100%' },
    ],
  },
  CompetitionEntries: {
    tableName: 'CompetitionEntries',
    category: 'COMPETITION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Peserta & Karya Lomba (Team / Individu)',
    description: 'Pendaftaran kontestan lomba perorangan/regu dan karya digital',
    primaryKey: 'id',
    majorForeignKeys: ['competition_id', 'contingent_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID pendaftaran lomba' },
      { name: 'competition_id', type: 'STRING', required: true, description: 'ID cabang lomba' },
      { name: 'participation_level', type: 'STRING', required: true, description: 'Tingkat partisipasi (INDIVIDUAL, TEAM, CONTINGENT)' },
      { name: 'contingent_id', type: 'STRING', required: true, description: 'ID kontingen pengirim' },
      { name: 'team_name', type: 'STRING', required: false, description: 'Nama regu/tim lomba' },
      { name: 'team_leader_id', type: 'STRING', required: false, description: 'ID pemimpin regu/kontestan utama' },
      { name: 'team_members_json', type: 'JSON', required: false, description: 'Daftar anggota tim terstruktur (JSON array)' },
      { name: 'entry_title', type: 'STRING', required: false, description: 'Judul karya / materi tampil' },
      { name: 'submission_url', type: 'STRING', required: false, description: 'Tautan Google Drive berkas karya' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (REGISTERED, SUBMITTED, DISQUALIFIED)' },
      { name: 'submitted_at', type: 'DATETIME', required: true, description: 'Waktu registrasi karya' },
    ],
  },
  JudgingScores: {
    tableName: 'JudgingScores',
    category: 'COMPETITION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Penilaian Dewan Juri',
    description: 'Nilai penjurian lomba, rubrik kriteria berbobot, penguncian skor, dan riwayat revisi juri',
    primaryKey: 'id',
    majorForeignKeys: ['competition_id', 'judge_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID skor penjurian' },
      { name: 'competition_id', type: 'STRING', required: true, description: 'ID cabang lomba' },
      { name: 'entry_id', type: 'STRING', required: true, description: 'ID entri karya/regu lomba' },
      { name: 'judge_id', type: 'STRING', required: true, description: 'ID dewan juri penilai' },
      { name: 'score', type: 'NUMBER', required: true, description: 'Nilai total tertimbang' },
      { name: 'criteria_scores_json', type: 'JSON', required: false, description: 'Rincian per kriteria rubrik berbobot' },
      { name: 'is_locked', type: 'BOOLEAN', required: true, description: 'Status kunci nilai (tidak dapat diubah)' },
      { name: 'locked_at', type: 'DATETIME', required: false, description: 'Waktu penguncian nilai' },
      { name: 'revision_number', type: 'NUMBER', required: true, description: 'Nomor versi revisi skor' },
      { name: 'revision_reason', type: 'STRING', required: false, description: 'Alasan revisi nilai jika dibuka kunci' },
      { name: 'submitted_at', type: 'DATETIME', required: true, description: 'Waktu penilaian diserahkan' },
    ],
  },
  VotingSessions: {
    tableName: 'VotingSessions',
    category: 'COMPETITION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Sesi Voting Terbuka',
    description: 'Sesi pemungutan suara publik dan kontingen terfavorit',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID sesi voting' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event pemilik' },
      { name: 'title', type: 'STRING', required: true, description: 'Judul pemungutan suara' },
      { name: 'type', type: 'STRING', required: true, description: 'Tipe (PUBLIC, PARTICIPANT_ONLY)' },
      { name: 'start_time', type: 'DATETIME', required: true, description: 'Waktu mulai buka' },
      { name: 'end_time', type: 'DATETIME', required: true, description: 'Waktu tutup' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (ACTIVE, CLOSED)' },
      { name: 'total_votes', type: 'NUMBER', required: true, description: 'Total suara masuk' },
    ],
  },
  Votes: {
    tableName: 'Votes',
    category: 'COMPETITION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Surat Suara (Voting Ledger)',
    description: 'Catatan surat suara individu dengan bukti hash pemilih',
    primaryKey: 'id',
    majorForeignKeys: ['session_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID unik suara' },
      { name: 'session_id', type: 'STRING', required: true, description: 'ID sesi voting' },
      { name: 'voter_token_hash', type: 'STRING', required: true, description: 'Hash satu arah identitas pemilih' },
      { name: 'candidate_id', type: 'STRING', required: true, description: 'ID kandidat/regu pilihan' },
      { name: 'timestamp', type: 'DATETIME', required: true, description: 'Waktu pemberian suara' },
      { name: 'client_meta', type: 'STRING', required: false, description: 'Informasi verifikasi suara' },
    ],
  },

  // ==================== GAMIFICATION & POINTS ====================
  Checkpoints: {
    tableName: 'Checkpoints',
    category: 'GAMIFICATION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Pos Penjelajahan (Checkpoints)',
    description: 'Pos petualangan dan kode QR penjelajahan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID pos checkpoint' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama pos' },
      { name: 'qr_code', type: 'STRING', required: true, description: 'Token QR pos terenkripsi' },
      { name: 'xp_points', type: 'NUMBER', required: true, description: 'Hadiah XP penyelesaian' },
      { name: 'location', type: 'STRING', required: false, description: 'Titik koordinat atau deskripsi lokasi' },
    ],
  },
  PointRules: {
    tableName: 'PointRules',
    category: 'GAMIFICATION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Aturan Hadiah XP',
    description: 'Aturan skor XP, batas maksimum harian, dan pelipat ganda giat',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID aturan poin' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'activity_category', type: 'STRING', required: true, description: 'Kategori giat yang berlaku' },
      { name: 'xp_value', type: 'NUMBER', required: true, description: 'Nilai standar XP' },
      { name: 'daily_limit', type: 'NUMBER', required: false, description: 'Batas maksimum XP per hari' },
      { name: 'multiplier', type: 'NUMBER', required: true, description: 'Pengali poin khusus' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aturan aktif' },
    ],
  },
  PointTransactions: {
    tableName: 'PointTransactions',
    category: 'GAMIFICATION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Ledger Transaksi Poin XP',
    description: 'Buku besar transaksi perolehan dan pengurangan XP (Authoritative Ledger)',
    primaryKey: 'id',
    majorForeignKeys: ['event_id', 'participant_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID transaksi poin' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'participant_id', type: 'STRING', required: true, description: 'ID peserta penerima' },
      { name: 'amount', type: 'NUMBER', required: true, description: 'Besaran poin (+ atau -)' },
      { name: 'reason', type: 'STRING', required: true, description: 'Alasan pemberian XP' },
      { name: 'source_type', type: 'STRING', required: true, description: 'Sumber (ACTIVITY, CHECKPOINT, COMPETITION, BONUS)' },
      { name: 'reference_id', type: 'STRING', required: false, description: 'ID jadwal/pos rujukan' },
      { name: 'created_at', type: 'DATETIME', required: true, description: 'Waktu transaksi' },
      { name: 'created_by', type: 'STRING', required: true, description: 'Petugas / sistem pemberi' },
    ],
  },
  Badges: {
    tableName: 'Badges',
    category: 'GAMIFICATION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Lencana Digital (Badges)',
    description: 'Master lencana kecakapan digital dan syarat perolehan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID lencana' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama lencana digital' },
      { name: 'icon_name', type: 'STRING', required: true, description: 'Nama ikon visual' },
      { name: 'description', type: 'STRING', required: true, description: 'Penjelasan pencapaian' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori keahlian' },
      { name: 'xp_required', type: 'NUMBER', required: true, description: 'Ambang batas XP wajib' },
      { name: 'status', type: 'STRING', required: true, description: 'Status aktif' },
    ],
  },
  ParticipantBadges: {
    tableName: 'ParticipantBadges',
    category: 'GAMIFICATION',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Koleksi Lencana Peserta',
    description: 'Koleksi lencana yang telah diraih oleh peserta perkemahan',
    primaryKey: 'id',
    majorForeignKeys: ['participant_id', 'badge_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID perolehan lencana' },
      { name: 'participant_id', type: 'STRING', required: true, description: 'ID peserta pemilik' },
      { name: 'badge_id', type: 'STRING', required: true, description: 'ID lencana yang diraih' },
      { name: 'awarded_at', type: 'DATETIME', required: true, description: 'Waktu penyerahan lencana' },
      { name: 'awarded_by', type: 'STRING', required: true, description: 'Sistem atau admin pemberi' },
    ],
  },

  // ==================== VISITORS ====================
  Visitors: {
    tableName: 'Visitors',
    category: 'VISITOR',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Buku Tamu Pengunjung',
    description: 'Biodata pengunjung umum non-peserta dan kontak darurat',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID pengunjung' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event dikunjungi' },
      { name: 'full_name', type: 'STRING', required: true, description: 'Nama lengkap pengunjung' },
      { name: 'phone', type: 'STRING', required: true, description: 'Nomor WhatsApp aktif' },
      { name: 'institution', type: 'STRING', required: false, description: 'Asal instansi / pangkalan' },
      { name: 'id_number', type: 'STRING', required: false, description: 'Nomor identitas (KTP / KTA)' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (REGISTERED, VERIFIED, BANNED)' },
      { name: 'registered_at', type: 'DATETIME', required: true, description: 'Waktu registrasi' },
    ],
  },
  VisitorPasses: {
    tableName: 'VisitorPasses',
    category: 'VISITOR',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Tiket & Akses Tamu',
    description: 'Tiket QR pass pengunjung per tanggal kunjungan',
    primaryKey: 'id',
    majorForeignKeys: ['visitor_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID tiket tamu' },
      { name: 'visitor_id', type: 'STRING', required: true, description: 'ID pengunjung pemilik' },
      { name: 'pass_code', type: 'STRING', required: true, description: 'Kode unik tiket QR' },
      { name: 'valid_date', type: 'DATE', required: true, description: 'Tanggal berlaku kunjungan' },
      { name: 'entry_type', type: 'STRING', required: true, description: 'Tipe akses (SINGLE_ENTRY, MULTI_ENTRY)' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (ACTIVE, USED, EXPIRED, REVOKED)' },
    ],
  },
  VisitorVisits: {
    tableName: 'VisitorVisits',
    category: 'VISITOR',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Log Kunjungan Tamu (Immutable)',
    description: 'Riwayat pencatatan gerbang check-in dan check-out pengunjung',
    primaryKey: 'id',
    majorForeignKeys: ['pass_id', 'visitor_id', 'gate_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID log kunjungan' },
      { name: 'pass_id', type: 'STRING', required: true, description: 'ID tiket pengunjung' },
      { name: 'visitor_id', type: 'STRING', required: true, description: 'ID data pengunjung' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'gate_id', type: 'STRING', required: true, description: 'ID pos gerbang' },
      { name: 'gate_name', type: 'STRING', required: true, description: 'Nama pos gerbang' },
      { name: 'action_type', type: 'STRING', required: true, description: 'Aksi (CHECK_IN, CHECK_OUT)' },
      { name: 'timestamp', type: 'DATETIME', required: true, description: 'Waktu pemindaian' },
      { name: 'officer_user_id', type: 'STRING', required: true, description: 'ID petugas pos' },
      { name: 'notes', type: 'STRING', required: false, description: 'Catatan gerbang' },
    ],
  },
  VisitorGates: {
    tableName: 'VisitorGates',
    category: 'VISITOR',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Pos Gerbang Tamu Buper',
    description: 'Master pos gerbang masuk dan keluar bumi perkemahan',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID gerbang' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'gate_name', type: 'STRING', required: true, description: 'Nama gerbang (Gate Utama Selatan, dsb)' },
      { name: 'gate_location', type: 'STRING', required: true, description: 'Lokasi gerbang buper' },
      { name: 'status', type: 'STRING', required: true, description: 'Status operasional pos (ACTIVE, CLOSED)' },
    ],
  },

  // ==================== MEDIA & PUBLICATIONS ====================
  MediaPublications: {
    tableName: 'MediaPublications',
    category: 'PUBLICATION',
    requirement: 'REQUIRED',
    featureName: 'Dokumentasi & Galeri Publik',
    description: 'Dokumentasi resmi, album Google Drive, dan video highlight YouTube',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID publikasi media' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'album_id', type: 'STRING', required: false, description: 'ID kelompok album' },
      { name: 'album_title', type: 'STRING', required: true, description: 'Judul album / liputan giat' },
      { name: 'media_type', type: 'STRING', required: true, description: 'Format media (PHOTO, VIDEO)' },
      { name: 'source_provider', type: 'STRING', required: true, description: 'Penyedia (GOOGLE_DRIVE, YOUTUBE, DIRECT)' },
      { name: 'drive_folder_id', type: 'STRING', required: false, description: 'Folder Google Drive album' },
      { name: 'drive_file_id', type: 'STRING', required: false, description: 'ID berkas Google Drive foto' },
      { name: 'youtube_video_id', type: 'STRING', required: false, description: 'ID video YouTube highlight' },
      { name: 'media_url', type: 'STRING', required: true, description: 'Tautan resmi / render URL' },
      { name: 'publication_status', type: 'STRING', required: true, description: 'Status (PUBLISHED, DRAFT, ARCHIVED)' },
      { name: 'sync_status', type: 'STRING', required: true, description: 'Status sinkronisasi (SYNCED, PENDING)' },
      { name: 'published_at', type: 'DATETIME', required: true, description: 'Tanggal publikasi' },
    ],
  },

  // ==================== DOCUMENTS & CERTIFICATES ====================
  DocumentTemplates: {
    tableName: 'DocumentTemplates',
    category: 'DOCUMENT',
    requirement: 'REQUIRED',
    featureName: 'Desain ID Card & Piagam',
    description: 'Master template ID Card, piagam penghargaan, dan sertifikat',
    primaryKey: 'id',
    majorForeignKeys: ['workspace_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID template dokumen' },
      { name: 'workspace_id', type: 'STRING', required: true, description: 'ID workspace pemilik' },
      { name: 'template_type', type: 'STRING', required: true, description: 'Tipe (ID_CARD, CERTIFICATE, LETTER)' },
      { name: 'name', type: 'STRING', required: true, description: 'Nama template desain' },
      { name: 'drive_file_id', type: 'STRING', required: false, description: 'ID file template di Google Drive' },
      { name: 'placeholders_json', type: 'JSON', required: false, description: 'Konfigurasi letak variabel dinamis' },
      { name: 'status', type: 'STRING', required: true, description: 'Status template aktif' },
      { name: 'updated_at', type: 'DATETIME', required: true, description: 'Waktu modifikasi terakhir' },
    ],
  },
  GeneratedDocuments: {
    tableName: 'GeneratedDocuments',
    category: 'DOCUMENT',
    requirement: 'REQUIRED',
    featureName: 'Dokumen & Piagam Diterbitkan',
    description: 'Catatan sertifikat terbit, nomor seri unik, token verifikasi, dan link berkas Drive',
    primaryKey: 'id',
    majorForeignKeys: ['template_id', 'recipient_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID dokumen terbit' },
      { name: 'template_id', type: 'STRING', required: true, description: 'ID template desain' },
      { name: 'batch_id', type: 'STRING', required: false, description: 'ID batch penerbitan massal' },
      { name: 'recipient_id', type: 'STRING', required: true, description: 'ID penerima (peserta / pembina / juri)' },
      { name: 'recipient_type', type: 'STRING', required: true, description: 'Tipe penerima (PARTICIPANT, OFFICIAL, JUDGE)' },
      { name: 'serial_number', type: 'STRING', required: true, description: 'Nomor seri resmi sertifikat kwartir' },
      { name: 'verification_token', type: 'STRING', required: true, description: 'Token verifikasi keaslian piagam' },
      { name: 'drive_file_id', type: 'STRING', required: true, description: 'ID berkas PDF di Drive customer' },
      { name: 'generation_status', type: 'STRING', required: true, description: 'Status (GENERATED, PENDING, REVOKED)' },
      { name: 'verified_count', type: 'NUMBER', required: true, description: 'Jumlah kali dipindai untuk verifikasi' },
      { name: 'generated_at', type: 'DATETIME', required: true, description: 'Waktu penerbitan dokumen' },
    ],
  },

  // ==================== SAFETY & LOGISTICS ====================
  HealthRecords: {
    tableName: 'HealthRecords',
    category: 'SAFETY',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Rekam Medis & Posko Kesehatan',
    description: 'Catatan klinis posko medis, keluhan peserta, triase, resep, dan rujukan RS',
    primaryKey: 'id',
    majorForeignKeys: ['event_id', 'participant_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID rekam medis' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'participant_id', type: 'STRING', required: true, description: 'ID peserta pasien' },
      { name: 'patient_name', type: 'STRING', required: true, description: 'Nama lengkap pasien' },
      { name: 'contingent_name', type: 'STRING', required: true, description: 'Nama kontingen asal' },
      { name: 'blood_type', type: 'STRING', required: false, description: 'Golongan darah' },
      { name: 'known_allergies', type: 'STRING', required: false, description: 'Riwayat alergi' },
      { name: 'vital_signs', type: 'STRING', required: false, description: 'Tensi, suhu, detak nadi' },
      { name: 'symptoms', type: 'STRING', required: true, description: 'Keluhan utama pasien' },
      { name: 'medical_diagnosis', type: 'STRING', required: true, description: 'Diagnosa tim medis posko' },
      { name: 'treatment_given', type: 'STRING', required: true, description: 'Tindakan medis dan perawatan' },
      { name: 'medication_administered', type: 'STRING', required: false, description: 'Obat yang diberikan' },
      { name: 'hospital_referral', type: 'BOOLEAN', required: true, description: 'Rujukan ke rumah sakit (Ya / Tidak)' },
      { name: 'treated_by', type: 'STRING', required: true, description: 'Tenaga medis penanggung jawab' },
      { name: 'treated_at', type: 'DATETIME', required: true, description: 'Waktu penanganan medis' },
      { name: 'status', type: 'STRING', required: true, description: 'Status (IN_TREATMENT, DISCHARGED, REFERRED)' },
    ],
  },
  Incidents: {
    tableName: 'Incidents',
    category: 'SAFETY',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Pelaporan Insiden & Ketertiban',
    description: 'Laporan posko keamanan, kehilangan barang, cuaca ekstrem, dan kedisiplinan buper',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID catatan insiden' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'incident_type', type: 'STRING', required: true, description: 'Jenis (KEHILANGAN, TERTIB, CUACA, SARPRAS)' },
      { name: 'severity', type: 'STRING', required: true, description: 'Tingkat keparahan (RINGAN, SEDANG, DARURAT)' },
      { name: 'reported_by', type: 'STRING', required: true, description: 'Pelapor kejadian' },
      { name: 'description', type: 'STRING', required: true, description: 'Uraian kejadian insiden' },
      { name: 'location', type: 'STRING', required: true, description: 'Lokasi kejadian di buper' },
      { name: 'action_taken', type: 'STRING', required: true, description: 'Tindakan satgas pengamanan' },
      { name: 'security_followup', type: 'STRING', required: false, description: 'Tindak lanjut keamanan' },
      { name: 'status', type: 'STRING', required: true, description: 'Status penanganan (OPEN, INVESTIGATING, RESOLVED)' },
      { name: 'resolved_at', type: 'DATETIME', required: false, description: 'Waktu selesai penanganan' },
    ],
  },
  Logistics: {
    tableName: 'Logistics',
    category: 'SAFETY',
    requirement: 'OPTIONAL_BY_FEATURE',
    featureName: 'Logistik & Sarana Prasarana',
    description: 'Inventaris perlengkapan bumi perkemahan dan riwayat peminjaman',
    primaryKey: 'id',
    majorForeignKeys: ['event_id'],
    columns: [
      { name: 'id', type: 'STRING', required: true, isPrimaryKey: true, description: 'ID perlengkapan' },
      { name: 'event_id', type: 'STRING', required: true, description: 'ID event' },
      { name: 'item_name', type: 'STRING', required: true, description: 'Nama barang / perlengkapan' },
      { name: 'category', type: 'STRING', required: true, description: 'Kategori (TENDA, LISTRIK, SOUND, P3K)' },
      { name: 'total_quantity', type: 'NUMBER', required: true, description: 'Total unit terdata' },
      { name: 'available_quantity', type: 'NUMBER', required: true, description: 'Unit tersedia saat ini' },
      { name: 'unit', type: 'STRING', required: true, description: 'Satuan (unit, roll, set, pcs)' },
      { name: 'condition', type: 'STRING', required: true, description: 'Kondisi barang (BAIK, PERLU_PERBAIKAN)' },
      { name: 'storage_location', type: 'STRING', required: true, description: 'Lokasi gudang / posko logistik' },
    ],
  },
};

/**
 * Array of all 39 canonical table names
 */
export const CANONICAL_TABLE_NAMES = Object.keys(CANONICAL_TABLES);

/**
 * Array of REQUIRED canonical tables (The core operational baseline)
 */
export const REQUIRED_TABLE_NAMES = Object.keys(CANONICAL_TABLES).filter(
  tableName => CANONICAL_TABLES[tableName].requirement === 'REQUIRED'
);

/**
 * Feature to Storage Audit Matrix
 */
export interface FeatureStorageAuditItem {
  feature: string;
  category: TableCategory;
  canonicalStorage: string;
  requirement: TableRequirement;
  primaryKey: string;
  majorForeignKeys: string[];
  status: 'OK' | 'UPGRADED' | 'OPTIONAL';
}

export function generateFeatureStorageMatrix(): FeatureStorageAuditItem[] {
  return CANONICAL_TABLE_NAMES.map(name => {
    const table = CANONICAL_TABLES[name];
    return {
      feature: table.featureName,
      category: table.category,
      canonicalStorage: table.tableName,
      requirement: table.requirement,
      primaryKey: table.primaryKey,
      majorForeignKeys: table.majorForeignKeys || [],
      status: table.requirement === 'REQUIRED' ? 'OK' : 'OPTIONAL',
    };
  });
}

/**
 * Single Authoritative Schema Validator
 */
export class CanonicalSchemaValidator {
  /**
   * Classifies an existing spreadsheet based on sheet presence and header compatibility.
   */
  public static classifySpreadsheet(
    existingSheetNames: string[],
    existingHeadersBySheet: Record<string, string[]> = {},
    metadataVersion?: string
  ): DatabaseClassificationResult {
    const canonicalNames = CANONICAL_TABLE_NAMES;
    const requiredNames = REQUIRED_TABLE_NAMES;

    // Case 1: Empty spreadsheet
    if (!existingSheetNames || existingSheetNames.length === 0 || (existingSheetNames.length === 1 && existingSheetNames[0] === 'Sheet1')) {
      return {
        status: 'EMPTY_SPREADSHEET',
        targetVersion: CANONICAL_SCHEMA_VERSION,
        tableCount: 0,
        expectedTableCount: canonicalNames.length,
        requiredTableCount: requiredNames.length,
        missingRequiredTables: requiredNames,
        tableDetails: [],
        message: 'Spreadsheet masih kosong. Belum ada lembar kerja skema SiEpang.',
        canAutoMigrate: false,
      };
    }

    const matchedTables = canonicalNames.filter(name => existingSheetNames.includes(name));
    const matchedRequired = requiredNames.filter(name => existingSheetNames.includes(name));
    const missingRequired = requiredNames.filter(name => !existingSheetNames.includes(name));

    // Check version metadata if available
    if (metadataVersion) {
      if (metadataVersion === CANONICAL_SCHEMA_VERSION && missingRequired.length === 0) {
        return {
          status: 'VALID_SIEPANG_DATABASE',
          detectedVersion: metadataVersion,
          targetVersion: CANONICAL_SCHEMA_VERSION,
          tableCount: matchedTables.length,
          expectedTableCount: canonicalNames.length,
          requiredTableCount: requiredNames.length,
          missingRequiredTables: [],
          tableDetails: this.inspectTableDetails(existingSheetNames, existingHeadersBySheet),
          message: `Database valid dan selaras dengan Skema Resmi ${CANONICAL_SCHEMA_VERSION} (${matchedTables.length}/${canonicalNames.length} tabel).`,
          canAutoMigrate: false,
        };
      } else if (metadataVersion.localeCompare(CANONICAL_SCHEMA_VERSION) < 0) {
        return {
          status: 'OLDER_SCHEMA',
          detectedVersion: metadataVersion,
          targetVersion: CANONICAL_SCHEMA_VERSION,
          tableCount: matchedTables.length,
          expectedTableCount: canonicalNames.length,
          requiredTableCount: requiredNames.length,
          missingRequiredTables: missingRequired,
          tableDetails: this.inspectTableDetails(existingSheetNames, existingHeadersBySheet),
          message: `Database menggunakan skema versi ${metadataVersion}. SiEpang membutuhkan Skema Lengkap ${CANONICAL_SCHEMA_VERSION} (${missingRequired.length} tabel wajib belum dibuat).`,
          canAutoMigrate: true,
        };
      } else if (metadataVersion.localeCompare(CANONICAL_SCHEMA_VERSION) > 0) {
        return {
          status: 'NEWER_UNSUPPORTED_SCHEMA',
          detectedVersion: metadataVersion,
          targetVersion: CANONICAL_SCHEMA_VERSION,
          tableCount: matchedTables.length,
          expectedTableCount: canonicalNames.length,
          requiredTableCount: requiredNames.length,
          missingRequiredTables: missingRequired,
          tableDetails: this.inspectTableDetails(existingSheetNames, existingHeadersBySheet),
          message: `Database menggunakan skema lebih baru (${metadataVersion}) dari yang didukung backend (${CANONICAL_SCHEMA_VERSION}). Perbarui backend SiEpang Anda.`,
          canAutoMigrate: false,
        };
      }
    }

    // Fallback: heuristic based on required table match
    const details = this.inspectTableDetails(existingSheetNames, existingHeadersBySheet);

    if (missingRequired.length === 0) {
      return {
        status: 'VALID_SIEPANG_DATABASE',
        detectedVersion: CANONICAL_SCHEMA_VERSION,
        targetVersion: CANONICAL_SCHEMA_VERSION,
        tableCount: matchedTables.length,
        expectedTableCount: canonicalNames.length,
        requiredTableCount: requiredNames.length,
        missingRequiredTables: [],
        tableDetails: details,
        message: `Database valid dan selaras dengan Skema Resmi ${CANONICAL_SCHEMA_VERSION} (${matchedTables.length}/${canonicalNames.length} tabel tersedia).`,
        canAutoMigrate: matchedTables.length < canonicalNames.length,
      };
    } else if (matchedTables.length >= 8) {
      return {
        status: 'OLDER_SCHEMA',
        detectedVersion: 'v1.5',
        targetVersion: CANONICAL_SCHEMA_VERSION,
        tableCount: matchedTables.length,
        expectedTableCount: canonicalNames.length,
        requiredTableCount: requiredNames.length,
        missingRequiredTables: missingRequired,
        tableDetails: details,
        message: `Struktur tabel terdeteksi dari rilis sebelumnya (${matchedTables.length}/${canonicalNames.length} tabel). Perlu auto-migrasi ke ${CANONICAL_SCHEMA_VERSION} untuk melengkapi tabel kanonikal.`,
        canAutoMigrate: true,
      };
    } else {
      return {
        status: 'INVALID_SCHEMA',
        detectedVersion: 'unknown',
        targetVersion: CANONICAL_SCHEMA_VERSION,
        tableCount: matchedTables.length,
        expectedTableCount: canonicalNames.length,
        requiredTableCount: requiredNames.length,
        missingRequiredTables: missingRequired,
        tableDetails: details,
        message: 'Struktur spreadsheet tidak cocok dengan skema standar SiEpang.',
        canAutoMigrate: false,
      };
    }
  }

  public static inspectTableDetails(
    sheetNames: string[],
    headersBySheet: Record<string, string[]>
  ): SchemaValidationDetail[] {
    return CANONICAL_TABLE_NAMES.map(name => {
      const def = CANONICAL_TABLES[name];
      const exists = sheetNames.includes(name);
      if (!exists) {
        return {
          tableName: name,
          category: def.category,
          requirement: def.requirement,
          exists: false,
          missingColumns: def.columns.map(c => c.name),
          extraColumns: [],
          isValid: false,
        };
      }

      const existingHeaders = headersBySheet[name] || [];
      const expectedColumnNames = def.columns.map(c => c.name);
      const missingColumns = expectedColumnNames.filter(c => !existingHeaders.includes(c));
      const extraColumns = existingHeaders.filter(c => !expectedColumnNames.includes(c));

      return {
        tableName: name,
        category: def.category,
        requirement: def.requirement,
        exists: true,
        missingColumns,
        extraColumns,
        isValid: missingColumns.length === 0,
      };
    });
  }

  /**
   * Generates header array for a canonical table
   */
  public static getHeadersForTable(tableName: string): string[] {
    const table = CANONICAL_TABLES[tableName];
    if (!table) return [];
    return table.columns.map(col => col.name);
  }
}
