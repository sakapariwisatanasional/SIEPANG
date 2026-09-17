export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'partner';

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  logoUrl: string;
  websiteUrl?: string;
  tagline: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge: string;
  actionText?: string;
  actionTab?: string;
  isActive: boolean;
}

export type ScheduleCategory = 'upacara' | 'lomba' | 'survival' | 'malam_gembira' | 'keagamaan' | 'umum';
export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface ScheduleItem {
  id: string;
  day: number; // Day 1, 2, 3, etc.
  date: string; // e.g. "16 September 2026"
  time: string; // e.g. "07:30 - 09:00 WIB"
  title: string;
  location: string;
  category: ScheduleCategory;
  status: ScheduleStatus;
  description: string;
  pic: string;
  dressCode?: string;
  isLiveUpdated?: boolean;
}

export interface DocumentationItem {
  id: string;
  type: 'photo' | 'video' | 'document';
  title: string;
  description: string;
  url: string; // YouTube, Google Drive, or Direct URL
  embedUrl?: string; // YouTube embed / Google Drive preview frame
  downloadUrl?: string; // Direct download link
  sourceType?: 'youtube' | 'google_drive' | 'direct';
  thumbnailUrl?: string;
  category: 'Upacara' | 'Perkemahan' | 'Penjelajahan' | 'Api Unggun' | 'Pentas Seni' | 'Umum';
  date: string;
  author: string;
  fileSize?: string;
}

export interface Participant {
  id: string;
  regId: string; // e.g. "JAM-P-001"
  fullName: string;
  nickname: string;
  pangkalan: string; // Sekolah / Gugus Depan
  kwarcab: string;
  kwarda: string;
  regu: string;
  gender: 'Putra' | 'Putri';
  bloodType: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  checkInStatus: boolean;
  checkInTime?: string;
  campTenda?: string;
  photoUrl?: string;
  points?: number; // Total akumulasi poin dari pos kegiatan
  completedPosts?: string[]; // Daftar ID atau Kode pos kegiatan yang telah diselesaikan
  pointsHistory?: {
    postId: string;
    postTitle: string;
    points: number;
    scannedAt: string;
  }[];
}

export interface ActivityPost {
  id: string;
  code: string; // e.g. "POS-PIONERING"
  title: string; // e.g. "Kegiatan Pionering"
  category: 'Teknik Kepramukaan' | 'Ketangkasan & Fisik' | 'Keterampilan Khusus' | 'Penjelajahan' | 'Wawasan & Kebangsaan';
  points: number; // Nilai poin yang ditentukan Admin (e.g. 10)
  description: string;
  location: string;
  picName: string; // Penanggung Jawab Pos
  qrData: string; // Payload QR Code, e.g. "JAMBOREE-POS:POS-PIONERING"
  isActive: boolean;
  completedCount?: number;
}

export interface Leader {
  id: string;
  regId: string; // e.g. "JAM-B-001"
  fullName: string;
  pangkalan: string;
  kwarcab: string;
  phone: string;
  email: string;
  assignedRegu: string[];
  role: string;
  checkInStatus: boolean;
  checkInTime?: string;
  photoUrl?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'jadwal' | 'darurat' | 'pengumuman' | 'presensi';
  isRead: boolean;
  highlight?: boolean;
}

export interface VerificationLog {
  id: string;
  regId: string;
  name: string;
  type: 'Peserta' | 'Pembina' | 'Pengunjung (Visitor)' | 'Pos Kegiatan';
  organization: string;
  timestamp: string;
  status: 'valid' | 'invalid' | 'already_checked_in';
  scannerDevice: string;
  notes?: string;
  pointsEarned?: number;
  postTitle?: string;
}

export type UserRole = 'admin' | 'member' | 'public';

export interface VisitorRegistration {
  id: string;
  ticketNumber: string; // e.g. "VIS-2026-0841"
  fullName: string;
  phone: string;
  email?: string;
  institutionOrCity: string;
  visitDate: string;
  purpose: 'Keluarga Peserta' | 'Kunjungan Dinas / Pramuka' | 'Media & Liputan' | 'Masyarakat Umum' | 'Lainnya';
  paxCount: number; // Jumlah rombongan
  notes?: string;
  registeredAt: string;
  checkInStatus: boolean;
  checkInTime?: string;
}

export interface CurrentUser {
  role: UserRole;
  name: string;
  id?: string;
  adminLevel?: 'superadmin' | 'admin';
  memberId?: string; // RegId of participant or leader if role === 'member'
  memberType?: 'peserta' | 'pembina';
  visitorTicketNumber?: string; // Ticket number if role === 'public'
  organization?: string;
  regu?: string;
  points?: number;
}

export interface GASConfig {
  gasWebAppUrl: string;
  sheetId: string;
  autoSync: boolean;
  lastSyncTime: string | null;
}

export type Visitor = VisitorRegistration;

export interface HomeContent {
  eventTitle: string;
  eventSubtitle: string;
  eventLocation: string;
  eventDates: string;
  eventStatusBadge: string;
  highlightAgendaTitle: string;
  highlightAgendaSubtitle: string;
  presenceBoxTitle: string;
  presenceBoxDescription: string;
  presenceBoxBadge: string;
  sponsorSectionTitle: string;
  sponsorSectionSubtitle: string;
}

