import React, { useState, useEffect } from 'react';
import {
  Banner,
  Sponsor,
  ScheduleItem,
  DocumentationItem,
  Participant,
  Leader,
  PushNotification,
  VerificationLog,
  GASConfig,
  CurrentUser,
  UserRole,
  VisitorRegistration,
  HomeContent,
  ActivityPost,
} from './types';
import {
  INITIAL_BANNERS,
  INITIAL_SPONSORS,
  INITIAL_SCHEDULE,
  INITIAL_DOCUMENTATION,
  INITIAL_PARTICIPANTS,
  INITIAL_LEADERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_VISITORS,
  INITIAL_HOME_CONTENT,
  INITIAL_ACTIVITY_POSTS,
} from './data/mockData';
import {
  LOCAL_STORAGE_KEYS,
  getStoredGASConfig,
  saveStoredGASConfig,
  postVisitorToGAS,
  postAwardPointsToGAS,
} from './services/gasSyncService';
import { soundEffects } from './utils/audioNotify';
import { Header } from './components/Header';
import { BannerSlider } from './components/BannerSlider';
import { SponsorSection } from './components/SponsorSection';
import { ScheduleView } from './components/ScheduleView';
import { DocumentationGallery } from './components/DocumentationGallery';
import { ParticipantsList } from './components/ParticipantsList';
import { LeadersList } from './components/LeadersList';
import { QRVerificationModal } from './components/QRVerificationModal';
import { NotificationCenter } from './components/NotificationCenter';
import { GASIntegrationModal } from './components/GASIntegrationModal';
import { IDCardModal } from './components/IDCardModal';
import { BottomNavigation } from './components/BottomNavigation';
import { AdminDashboard } from './components/AdminDashboard';
import { UserRoleModal } from './components/UserRoleModal';
import { VisitorRegistrationModal } from './components/VisitorRegistrationModal';
import { LeaderboardView } from './components/LeaderboardView';
import { PostQRModal } from './components/PostQRModal';
import {
  Calendar,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  Award,
  Sparkles,
  Compass,
  Tent,
  Radio,
  Clock,
  ChevronRight,
  Flame,
  Shield,
  Ticket,
  UserCheck,
  CheckCircle2,
  Edit3,
  Sliders,
  Handshake,
  Instagram,
  Trophy,
  Target,
  QrCode,
  Star,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('beranda');

  // Role State (Admin, Member, Public)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      role: 'admin',
      name: 'Kak H. Budi Santoso (Admin Panitia)',
      regId: 'ADM-001',
      memberType: 'admin',
    };
  });

  // Core Data States with localStorage caching
  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.BANNERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_BANNERS;
  });

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SPONSORS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_SPONSORS;
  });

  const [homeContent, setHomeContent] = useState<HomeContent>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.HOME_CONTENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_HOME_CONTENT;
  });

  // Admin Quick Edit Sub-tab & Target Banner
  const [adminInitialTab, setAdminInitialTab] = useState<'docs' | 'banners' | 'homeContent' | 'sponsors'>('docs');
  const [adminTargetBanner, setAdminTargetBanner] = useState<Banner | null>(null);

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SCHEDULES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_SCHEDULE;
  });

  const [documentation, setDocumentation] = useState<DocumentationItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.DOCS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_DOCUMENTATION;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PARTICIPANTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_PARTICIPANTS;
  });

  const [leaders, setLeaders] = useState<Leader[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_LEADERS;
  });

  const [visitors, setVisitors] = useState<VisitorRegistration[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.VISITORS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_VISITORS;
  });

  const [activeVisitor, setActiveVisitor] = useState<VisitorRegistration | null>(null);

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVITY_POSTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_ACTIVITY_POSTS;
  });

  // GAS Configuration
  const [gasConfig, setGasConfig] = useState<GASConfig>(getStoredGASConfig);

  // Modals
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showGASModal, setShowGASModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [selectedPostForQR, setSelectedPostForQR] = useState<ActivityPost | null>(null);
  const [idCardData, setIdCardData] = useState<{
    person: Participant | Leader;
    type: 'peserta' | 'pembina';
  } | null>(null);

  // Connectivity
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Live Toast Banner
  const [toastAlert, setToastAlert] = useState<{ title: string; message: string } | null>(null);

  // Check URL query parameters for direct QR scan via standard phone camera (e.g. ?pos=POS-PIONERING)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const posParam = searchParams.get('pos') || searchParams.get('scan');
      const ticketParam = searchParams.get('ticket');

      if (posParam) {
        const cleanPos = posParam.replace(/^JAMBOREE-POS:/i, '').trim();
        const found = activityPosts.find(
          (p) =>
            p.code.toLowerCase() === cleanPos.toLowerCase() ||
            p.id.toLowerCase() === cleanPos.toLowerCase() ||
            p.title.toLowerCase() === cleanPos.toLowerCase()
        );
        if (found) {
          setSelectedPostForQR(found);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (ticketParam) {
        const foundVis = visitors.find(
          (v) => v.ticketNumber.toLowerCase() === ticketParam.toLowerCase()
        );
        if (foundVis) {
          setActiveVisitor(foundVis);
          setShowVisitorModal(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [activityPosts, visitors]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DOCS, JSON.stringify(documentation));
  }, [documentation]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BANNERS, JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LEADERS, JSON.stringify(leaders));
  }, [leaders]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGS, JSON.stringify(verificationLogs));
  }, [verificationLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SPONSORS, JSON.stringify(sponsors));
  }, [sponsors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.HOME_CONTENT, JSON.stringify(homeContent));
  }, [homeContent]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVITY_POSTS, JSON.stringify(activityPosts));
  }, [activityPosts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  // Real-time Push Notification Broadcast Handler
  const handleBroadcastNotification = (
    notifData: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>
  ) => {
    const newNotif: PushNotification = {
      id: 'notif_' + Date.now(),
      ...notifData,
      timestamp: 'Baru saja',
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    soundEffects.playNotificationChime();

    // Show floating toast
    setToastAlert({ title: notifData.title, message: notifData.message });
    setTimeout(() => setToastAlert(null), 5000);
  };

  // Schedule update trigger with broadcast
  const handleTriggerScheduleUpdate = (updatedItem: ScheduleItem, note: string) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem, isLiveUpdated: true } : item
      )
    );

    handleBroadcastNotification({
      title: `📢 Perubahan Jadwal: ${updatedItem.title}`,
      message: `${note}. Waktu: ${updatedItem.time} di ${updatedItem.location}.`,
      type: 'jadwal',
    });
  };

  // Participant updates
  const handleUpdateParticipant = (updated: Participant) => {
    setParticipants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAwardPoints = (participantId: string, postId: string) => {
    const targetPost = activityPosts.find(
      (p) => p.id === postId || p.code === postId || ('JAMBOREE-POS:' + p.code) === postId
    );
    if (!targetPost) return;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const alreadyCompleted =
            p.completedPosts?.includes(targetPost.code) ||
            p.completedPosts?.includes(targetPost.id);
          if (alreadyCompleted) return p;

          const pts = targetPost.points || 10;
          const newPts = (p.points || 0) + pts;
          const newCompleted = [...(p.completedPosts || []), targetPost.code];
          const timeStr =
            new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) +
            ', ' +
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
            ' WIB';

          const newHistory = [
            {
              postId: targetPost.id,
              postCode: targetPost.code,
              postTitle: targetPost.title,
              points: pts,
              scannedAt: timeStr,
            },
            ...(p.pointsHistory || []),
          ];

          return {
            ...p,
            points: newPts,
            completedPosts: newCompleted,
            pointsHistory: newHistory,
          };
        }
        return p;
      })
    );

    // Increment completed count for this activity post
    setActivityPosts((prev) =>
      prev.map((post) =>
        post.id === targetPost.id || post.code === targetPost.code
          ? { ...post, completedCount: (post.completedCount || 0) + 1 }
          : post
      )
    );

    // Sync to GAS if configured
    const targetParticipant = participants.find((p) => p.id === participantId);
    if (gasConfig.gasWebAppUrl && targetParticipant) {
      postAwardPointsToGAS(gasConfig.gasWebAppUrl, {
        participantId: targetParticipant.id,
        participantName: targetParticipant.fullName,
        postCode: targetPost.code,
        postTitle: targetPost.title,
        points: targetPost.points,
        totalPoints: (targetParticipant.points || 0) + targetPost.points,
      });
    }

    // Audio & Toast notification
    soundEffects.play('success');
    setToastAlert({
      title: `⭐ +${targetPost.points} Poin Berhasil Ditambahkan!`,
      message: `${targetParticipant?.fullName || 'Peserta'} berhasil menyelesaikan pos "${targetPost.title}". Ranking otomatis diperbarui!`,
    });
  };

  const handleAddParticipant = (newP: Participant) => {
    setParticipants((prev) => [newP, ...prev]);
  };

  // Leader updates
  const handleUpdateLeader = (updated: Leader) => {
    setLeaders((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleAddLeader = (newL: Leader) => {
    setLeaders((prev) => [newL, ...prev]);
  };

  // Visitor updates & registration
  const handleAddVisitor = (newVisitor: VisitorRegistration) => {
    setVisitors((prev) => [newVisitor, ...prev]);
    setActiveVisitor(newVisitor);
    soundEffects.play('success');
    setToastAlert({
      title: 'Pendaftaran Pengunjung Berhasil!',
      message: `Tiket ${newVisitor.ticketNumber} untuk ${newVisitor.fullName} telah dibuat. Silakan simpan QR Code Anda.`,
    });
    if (gasConfig.gasWebAppUrl) {
      postVisitorToGAS(gasConfig.gasWebAppUrl, newVisitor);
    }
  };

  const handleUpdateVisitor = (updated: VisitorRegistration) => {
    setVisitors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  // Member ID Card handler
  const handleOpenMyIDCard = () => {
    if (currentUser.role === 'member') {
      if (currentUser.memberType === 'pembina') {
        const found = leaders.find((l) => l.regId === currentUser.memberId) || leaders[0];
        if (found) setIdCardData({ person: found, type: 'pembina' });
      } else {
        const found = participants.find((p) => p.regId === currentUser.memberId) || participants[0];
        if (found) setIdCardData({ person: found, type: 'peserta' });
      }
    } else if (currentUser.role === 'public') {
      setShowVisitorModal(true);
    } else {
      if (participants[0]) {
        setIdCardData({ person: participants[0], type: 'peserta' });
      }
    }
  };

  // Verification Log
  const handleAddVerificationLog = (log: VerificationLog) => {
    setVerificationLogs((prev) => [log, ...prev]);
  };

  // Documentation updates
  const handleAddDocumentation = (item: DocumentationItem) => {
    setDocumentation((prev) => [item, ...prev]);
  };

  // Save GAS config
  const handleSaveGASConfig = (cfg: GASConfig) => {
    setGasConfig(cfg);
    saveStoredGASConfig(cfg);
  };

  // Apply remote GAS data
  const handleApplyRemoteData = (data: any) => {
    if (data.participants && Array.isArray(data.participants) && data.participants.length > 0) {
      console.log('Sinkronisasi data peserta dari GAS...');
    }
    if (data.visitors && Array.isArray(data.visitors) && data.visitors.length > 0) {
      console.log('Sinkronisasi data pengunjung dari GAS...');
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20 md:pb-8 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenRoleModal={() => setShowRoleModal(true)}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifDrawer={() => setShowNotifDrawer(true)}
        onOpenGASModal={() => setShowGASModal(true)}
        onOpenQRScanner={() => setShowQRScanner(true)}
        onOpenAdminDashboard={() => setShowAdminDashboard(true)}
        onOpenMyIDCard={handleOpenMyIDCard}
        onOpenVisitorModal={() => setShowVisitorModal(true)}
        isOnline={isOnline}
        isGASSynced={Boolean(gasConfig.gasWebAppUrl)}
      />

      {/* Real-time Floating Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-16 inset-x-4 z-50 mx-auto max-w-md animate-fadeIn">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-900 p-4 text-white shadow-2xl border-2 border-amber-400">
            <Radio className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold leading-tight">{toastAlert.title}</h4>
              <p className="text-xs text-amber-100 mt-0.5 leading-relaxed">{toastAlert.message}</p>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-amber-300 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-6 space-y-5">
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm border border-slate-200">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('beranda')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'beranda'
                  ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Beranda &amp; Banner</span>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'jadwal'
                  ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Jadwal Kegiatan</span>
            </button>

            {/* Role-based desktop tabs */}
            {currentUser.role === 'member' && (
              <button
                onClick={handleOpenMyIDCard}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition"
              >
                <Award className="h-4 w-4 text-red-800" />
                <span>ID Card &amp; QR Presensi Saya</span>
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'member') && (
              <>
                <button
                  onClick={() => setActiveTab('peserta')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'peserta'
                      ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Data Peserta ({participants.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('pembina')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeTab === 'pembina'
                      ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>Pembina Pendamping ({leaders.length})</span>
                </button>
              </>
            )}

            {/* Visitor Tab */}
            <button
              onClick={() => setActiveTab('pengunjung')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'pengunjung'
                  ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>
                {currentUser.role === 'public'
                  ? 'Tiket Kunjungan Saya'
                  : `Pengunjung (${visitors.length})`}
              </span>
            </button>

            {/* Ranking / Gamification Tab */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Peringkat &amp; Poin Pos</span>
            </button>

            <button
              onClick={() => setActiveTab('dokumentasi')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'dokumentasi'
                  ? 'bg-red-800 text-amber-200 shadow-sm border border-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Galeri &amp; Video ({documentation.length})</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-900 hover:bg-red-100 transition shadow-xs ml-1"
              >
                <Shield className="h-3.5 w-3.5 text-red-700" />
                <span>Dashboard Admin</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pr-2 text-xs text-slate-500">
            <span className="font-bold text-red-900">{homeContent.eventLocation}</span>
            <span>•</span>
            <span>{homeContent.eventStatusBadge}</span>
          </div>
        </div>

        {/* View Routing */}
        {activeTab === 'beranda' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Admin Live Editing Control Bar */}
            {currentUser.role === 'admin' && (
              <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-800 text-amber-300 font-bold shadow-xs">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-red-950 flex items-center gap-1.5">
                      <span>Panel Kontrol Admin Beranda</span>
                      <span className="rounded-full bg-red-100 px-2 py-0.2 text-[9px] font-bold text-red-800">
                        Live Edit Mode
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Seluruh teks judul kegiatan, tema, gambar banner, logo sponsor, &amp; URL video dapat diedit manual.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setAdminInitialTab('homeContent');
                      setShowAdminDashboard(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 hover:bg-red-900 px-3 py-1.5 text-xs font-bold text-amber-200 shadow-xs transition active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Edit Teks &amp; Judul</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminInitialTab('banners');
                      setShowAdminDashboard(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-black text-red-950 shadow-xs transition active:scale-95"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Kelola Banner ({banners.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminInitialTab('sponsors');
                      setShowAdminDashboard(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs transition active:scale-95"
                  >
                    <Handshake className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Kelola Sponsor ({sponsors.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminInitialTab('activityPosts');
                      setShowAdminDashboard(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-red-900 hover:bg-black border border-red-800 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-xs transition active:scale-95"
                  >
                    <Target className="h-3.5 w-3.5 text-amber-400" />
                    <span>Pos &amp; Poin ({activityPosts.length})</span>
                  </button>

                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95 ml-auto"
                    title="Uji tampilan sebagai Member atau Publik"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-slate-700" />
                    <span>Ubah Level Akses</span>
                  </button>
                </div>
              </div>
            )}

            {/* Member Personalized Status Card on Beranda */}
            {currentUser.role === 'member' && (() => {
              const currentMember =
                currentUser.memberType === 'pembina'
                  ? leaders.find((l) => l.regId === currentUser.memberId) || leaders[0]
                  : participants.find((p) => p.regId === currentUser.memberId) || participants[0];

              const isParticipant = currentUser.memberType !== 'pembina';
              const participantData = isParticipant ? (currentMember as Participant) : null;
              
              const sortedParticipants = [...participants].sort(
                (a, b) => (b.points || 0) - (a.points || 0)
              );
              const myRank = participantData
                ? sortedParticipants.findIndex((p) => p.id === participantData.id) + 1
                : null;

              return (
                <div className="rounded-3xl border border-emerald-300/60 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 sm:p-5 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Member Profile Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={
                            currentMember?.photoUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={currentMember?.fullName}
                          className="h-14 w-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-black ${
                            currentMember?.checkInStatus
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                          title={currentMember?.checkInStatus ? 'Sudah Presensi' : 'Belum Presensi'}
                        >
                          ✓
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            {currentUser.memberType === 'pembina' ? 'Pembina Pendamping' : 'Peserta Pramuka'}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-200">
                            {currentMember?.regId}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-black ${
                              currentMember?.checkInStatus
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {currentMember?.checkInStatus ? 'Hadir di Perkemahan' : 'Belum Presensi Masuk'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
                          {currentMember?.fullName}
                        </h3>
                        <p className="text-xs text-emerald-100/90 truncate">
                          {participantData
                            ? `${participantData.regu} • ${participantData.pangkalan}`
                            : (currentMember as Leader)?.role}
                        </p>
                      </div>
                    </div>

                    {/* Member Points & Actions */}
                    <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 shrink-0">
                      {isParticipant && participantData && (
                        <div className="flex items-center gap-3 bg-black/30 rounded-2xl px-4 py-2 border border-white/10">
                          <div className="text-center">
                            <span className="block text-[10px] font-bold uppercase text-amber-300">Poin Saya</span>
                            <span className="text-lg font-black text-white">{participantData.points || 0}</span>
                          </div>
                          <div className="h-7 w-px bg-white/20" />
                          <div className="text-center">
                            <span className="block text-[10px] font-bold uppercase text-emerald-300">Klasemen</span>
                            <span className="text-lg font-black text-amber-400">
                              #{myRank || 1} <span className="text-[10px] font-normal text-slate-300">/ {participants.length}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleOpenMyIDCard}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 transition shadow active:scale-95"
                        >
                          <Award className="h-4 w-4 text-red-950" />
                          <span>ID Card &amp; QR</span>
                        </button>
                        <button
                          onClick={() => setShowQRScanner(true)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition shadow active:scale-95"
                        >
                          <QrCode className="h-4 w-4 text-emerald-200" />
                          <span>Scan Pos</span>
                        </button>
                        <button
                          onClick={() => setShowRoleModal(true)}
                          className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-2 text-xs font-medium text-slate-300 transition"
                          title="Ganti Profil Member"
                        >
                          <span>Ganti Profil</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Public Visitor Personalized Status Card on Beranda */}
            {currentUser.role === 'public' && (() => {
              const visitorTicket =
                activeVisitor ||
                visitors.find(
                  (v) =>
                    v.fullName.toLowerCase() === currentUser.name.toLowerCase() ||
                    (currentUser.visitorTicketNumber && v.ticketNumber === currentUser.visitorTicketNumber)
                ) ||
                visitors[0] ||
                null;

              return (
                <div className="rounded-3xl border border-red-300/40 bg-gradient-to-r from-slate-950 via-red-950 to-slate-950 p-4 sm:p-5 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-red-950 font-black shadow-md">
                        <Ticket className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                            Akses Tamu &amp; Pengunjung
                          </span>
                          {visitorTicket && (
                            <span className="font-mono text-[10px] text-amber-200">
                              {visitorTicket.ticketNumber}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-800 px-2 py-0.2 text-[9px] font-medium text-slate-300">
                            Jam Berkunjung: 08:00 - 17:00 WIB
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                          {visitorTicket ? `E-Tiket: ${visitorTicket.fullName}` : 'Selamat Datang di Jambore'}
                        </h3>
                        <p className="text-xs text-red-100 max-w-xl">
                          {visitorTicket
                            ? `Rombongan: ${visitorTicket.paxCount || 1} orang • Tanggal: ${visitorTicket.visitDate} • Status: ${visitorTicket.checkInStatus ? 'Sudah Masuk / Hadir di Gerbang' : 'Menunggu Check-In di Pintu Masuk'}`
                            : 'Dapatkan E-Tiket QR Kunjungan resmi untuk mempermudah akses masuk pos perkemahan & pemantauan kunjungan.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 flex-wrap">
                      <button
                        onClick={() => {
                          if (visitorTicket) {
                            setActiveVisitor(visitorTicket);
                          }
                          setShowVisitorModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-black text-red-950 transition shadow active:scale-95"
                      >
                        <Ticket className="h-4 w-4" />
                        <span>{visitorTicket ? 'Tampilkan E-Tiket QR' : 'Daftar Tiket Kunjungan'}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('jadwal')}
                        className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95"
                      >
                        <Calendar className="h-4 w-4 text-amber-300" />
                        <span>Jadwal Terbuka</span>
                      </button>

                      <button
                        onClick={() => setShowRoleModal(true)}
                        className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-2 text-xs font-medium text-slate-300 transition"
                        title="Ganti Level Pengguna"
                      >
                        <span>Ganti Level</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 1. Banner Kegiatan */}
            <BannerSlider
              banners={banners}
              onNavigateTab={(tab) => setActiveTab(tab)}
              isAdmin={currentUser.role === 'admin'}
              onOpenEditBanners={(b) => {
                setAdminTargetBanner(b || null);
                setAdminInitialTab('banners');
                setShowAdminDashboard(true);
              }}
            />

            {/* Quick Access Action Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-red-500 hover:shadow-md transition text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-900 group-hover:bg-red-600 group-hover:text-white transition">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      Scan QR
                    </h4>
                    <p className="text-[11px] text-slate-500">Verifikasi Presensi</p>
                  </div>
                </button>
              )}

              {currentUser.role === 'member' && (
                <button
                  onClick={handleOpenMyIDCard}
                  className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-3.5 shadow-sm hover:border-amber-500 hover:shadow-md transition text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-red-950 group-hover:scale-105 transition">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-red-950 leading-tight">
                      ID Card Saya
                    </h4>
                    <p className="text-[11px] text-amber-800">Tampilkan QR Presensi</p>
                  </div>
                </button>
              )}

              {currentUser.role === 'public' && (
                <button
                  onClick={() => setShowVisitorModal(true)}
                  className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-3.5 shadow-sm hover:border-amber-500 hover:shadow-md transition text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-red-950 group-hover:scale-105 transition">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-red-950 leading-tight">
                      Daftar Kunjungan
                    </h4>
                    <p className="text-[11px] text-amber-800">Dapatkan QR Tiket</p>
                  </div>
                </button>
              )}

              {/* Ranking & Gamification Card */}
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/80 to-white p-3.5 shadow-sm hover:border-amber-500 hover:shadow-md transition text-left group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-red-950 group-hover:scale-105 transition shadow-xs">
                  <Trophy className="h-6 w-6 text-red-950" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Ranking Peserta
                  </h4>
                  <p className="text-[11px] text-amber-900 font-semibold">Poin Pos &amp; Juara</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('jadwal')}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-red-500 hover:shadow-md transition text-left group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 group-hover:bg-amber-400 group-hover:text-red-950 transition">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Jadwal
                  </h4>
                  <p className="text-[11px] text-slate-500">Rundown Hari 1-4</p>
                </div>
              </button>

              {currentUser.role === 'public' ? (
                <button
                  onClick={() => setActiveTab('pengunjung')}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-red-500 hover:shadow-md transition text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-red-800 group-hover:text-white transition">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      Tiket Saya
                    </h4>
                    <p className="text-[11px] text-slate-500">Cek Status Kunjungan</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('peserta')}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-red-500 hover:shadow-md transition text-left group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-red-800 group-hover:text-white transition">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      Peserta
                    </h4>
                    <p className="text-[11px] text-slate-500">{participants.length} Terdaftar</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setActiveTab('dokumentasi')}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-red-500 hover:shadow-md transition text-left group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Galeri
                  </h4>
                  <p className="text-[11px] text-slate-500">Foto &amp; Video</p>
                </div>
              </button>
            </div>

            {/* Event Countdown & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Highlight Agenda Hari Ini */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {homeContent.highlightAgendaTitle}
                      </h3>
                      {homeContent.highlightAgendaSubtitle && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {homeContent.highlightAgendaSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setAdminInitialTab('homeContent');
                          setShowAdminDashboard(true);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-900 hover:bg-red-100 transition"
                        title="Edit Teks Agenda"
                      >
                        <Edit3 className="h-3 w-3 text-red-700" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('jadwal')}
                      className="flex items-center gap-1 text-xs font-bold text-red-800 hover:text-red-900 ml-1"
                    >
                      <span>Selengkapnya</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {schedules.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-50 transition"
                    >
                      <div className="rounded-xl bg-red-800 px-2.5 py-1 text-center text-white shrink-0">
                        <span className="block text-[10px] font-bold uppercase text-amber-200">HARI</span>
                        <span className="text-sm font-black">{item.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.location} • {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Kontingen & Quick Presensi summary */}
              <div className="rounded-3xl border border-red-950/20 bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-5 text-white shadow-md space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                      {homeContent.presenceBoxBadge}
                    </span>
                    <div className="flex items-center gap-2">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setAdminInitialTab('homeContent');
                            setShowAdminDashboard(true);
                          }}
                          className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-red-800 transition border border-white/10"
                          title="Edit Teks Presensi"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      <span className="text-xs text-red-200">Total {participants.length} Orang</span>
                    </div>
                  </div>
                  <h4 className="text-base font-black mt-2 text-white">
                    {homeContent.presenceBoxTitle}
                  </h4>
                  <p className="text-xs text-red-100 mt-1 leading-relaxed">
                    {homeContent.presenceBoxDescription}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/20 p-3 backdrop-blur-sm space-y-1 text-xs border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-red-200">Tingkat Kehadiran:</span>
                    <span className="font-black text-amber-300">
                      {Math.round(
                        (participants.filter((p) => p.checkInStatus).length /
                          (participants.length || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-red-950">
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          (participants.filter((p) => p.checkInStatus).length /
                            (participants.length || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {currentUser.role === 'admin' ? (
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-2.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow"
                  >
                    <ShieldCheck className="h-4 w-4 text-red-950" />
                    <span>Buka Scanner Kamera</span>
                  </button>
                ) : currentUser.role === 'member' ? (
                  <button
                    onClick={handleOpenMyIDCard}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-2.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow"
                  >
                    <Award className="h-4 w-4 text-red-950" />
                    <span>Buka ID Card &amp; QR Presensi</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowVisitorModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-2.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow"
                  >
                    <Ticket className="h-4 w-4 text-red-950" />
                    <span>Daftar Tiket Pengunjung (QR)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Gamification & Visitor Scan Statistics Widget on Beranda */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-red-950 font-bold shadow-xs">
                    <Trophy className="h-5 w-5 text-red-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-sm sm:text-base">
                        Papan Peringkat &amp; Statistik Kunjungan Real-Time
                      </h3>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-800 border border-red-200">
                        Live Score
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Perhitungan otomatis dari pemindaian QR Code pos kegiatan dan tiket pengunjung
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setAdminInitialTab('activityPosts');
                        setShowAdminDashboard(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-100 transition shadow-xs"
                    >
                      <Target className="h-3.5 w-3.5 text-red-700" />
                      <span>Atur Pos &amp; Nilai Poin</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="flex items-center gap-1 rounded-xl bg-red-800 px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-red-900 transition shadow-xs"
                  >
                    <span>Lihat Klasemen Lengkap</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Jumlah Kunjungan (Scan QR Pengunjung) */}
                <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 to-white p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                    <span className="text-red-900 font-extrabold uppercase">Jumlah Kunjungan</span>
                    <Users className="h-4 w-4 text-red-700" />
                  </div>
                  <div className="my-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">
                        {visitors
                          .filter((v) => v.checkInStatus)
                          .reduce((sum, v) => sum + (v.paxCount || 1), 0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Orang Hadir</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Dihitung dari scan QR tiket ({visitors.filter((v) => v.checkInStatus).length} rombongan terverifikasi)
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('pengunjung')}
                    className="text-[11px] font-bold text-red-800 hover:text-red-950 inline-flex items-center gap-1"
                  >
                    <span>Data Pengunjung</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 2. Jumlah Peserta Aktif (Berpoin dari Pos QR) */}
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                    <span className="text-amber-900 font-extrabold uppercase">Peserta Aktif Berpoin</span>
                    <Flame className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="my-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">
                        {participants.filter((p) => (p.points || 0) > 0).length}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        / {participants.length} Peserta
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Menyelesaikan tantangan di {activityPosts.length} pos kegiatan ber-QR
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    <span>Cek Poin Peserta</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* 3. Ranking Tertinggi (Top Leader) */}
                <div className="rounded-2xl border border-red-950/20 bg-gradient-to-br from-red-950 to-red-900 p-3.5 text-white flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="uppercase font-black">Peringkat Tertinggi (#1)</span>
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  {(() => {
                    const sorted = [...participants].sort(
                      (a, b) => (b.points || 0) - (a.points || 0)
                    );
                    const top = sorted[0];
                    return (
                      <div className="my-2 flex items-center gap-2.5">
                        <img
                          src={
                            top?.photoUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={top?.fullName}
                          className="h-11 w-11 rounded-xl object-cover border-2 border-amber-400 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate">
                            {top?.fullName || 'Belum Ada'}
                          </h4>
                          <p className="text-[11px] text-red-200 truncate">
                            {top?.regu} • {top?.pangkalan}
                          </p>
                          <div className="flex items-center gap-1 text-amber-300 font-black text-xs mt-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{top?.points || 0} Poin</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-[11px] font-bold text-amber-300 hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Lihat Klasemen Juara</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Top 3 Quick Preview Strip */}
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-700 text-xs">Top 3 Peringkat Sementara:</span>
                  {[...participants]
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 3)
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1 border border-slate-200 shadow-2xs"
                      >
                        <span className="font-black text-amber-600">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-bold text-slate-800 truncate max-w-[110px]">
                          {p.nickname || p.fullName.split(' ')[0]}
                        </span>
                        <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-black text-red-900">
                          {p.points || 0} Pts
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentUser.role === 'public' ? (
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow-2xs shrink-0"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Lihat Peringkat Lengkap</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow-2xs shrink-0"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Scan QR Pos Sekarang</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Iklan Sponsor Section */}
            <SponsorSection
              sponsors={sponsors}
              title={homeContent.sponsorSectionTitle}
              subtitle={homeContent.sponsorSectionSubtitle}
              isAdmin={currentUser.role === 'admin'}
              onOpenEditSponsors={() => {
                setAdminInitialTab('sponsors');
                setShowAdminDashboard(true);
              }}
            />
          </div>
        )}

        {/* View: Jadwal Kegiatan */}
        {activeTab === 'jadwal' && (
          <div className="animate-fadeIn">
            <ScheduleView
              schedules={schedules}
              isAdmin={currentUser.role === 'admin'}
              onTriggerScheduleUpdate={handleTriggerScheduleUpdate}
              onOpenBroadcastModal={() => setShowNotifDrawer(true)}
            />
          </div>
        )}

        {/* View: Data Peserta */}
        {activeTab === 'peserta' && (
          <div className="animate-fadeIn">
            <ParticipantsList
              participants={participants}
              isAdmin={currentUser.role === 'admin'}
              onSelectParticipantForID={(p) => setIdCardData({ person: p, type: 'peserta' })}
              onUpdateParticipant={handleUpdateParticipant}
              onAddParticipant={handleAddParticipant}
            />
          </div>
        )}

        {/* View: Data Pembina Pendamping */}
        {activeTab === 'pembina' && (
          <div className="animate-fadeIn">
            <LeadersList
              leaders={leaders}
              isAdmin={currentUser.role === 'admin'}
              onSelectLeaderForID={(l) => setIdCardData({ person: l, type: 'pembina' })}
              onUpdateLeader={handleUpdateLeader}
              onAddLeader={handleAddLeader}
            />
          </div>
        )}

        {/* View: Pengunjung / Visitor */}
        {activeTab === 'pengunjung' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 p-4 sm:p-5 text-white shadow-md border border-red-900/30">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wider">
                  <Ticket className="h-3.5 w-3.5 text-amber-400" />
                  <span>Sistem Tiket Pengunjung &amp; Publik</span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-0.5 text-white">
                  Pendaftaran &amp; E-Tiket Pengunjung Kegiatan
                </h3>
                <p className="text-xs text-red-100">
                  Pengunjung umum dan keluarga peserta dapat mendaftar mandiri untuk mendapatkan QR Code kunjungan resmi.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveVisitor(null);
                  setShowVisitorModal(true);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow-md active:scale-95 shrink-0"
              >
                <Ticket className="h-4 w-4" />
                <span>Daftar E-Tiket Pengunjung</span>
              </button>
            </div>

            {/* Registered Visitors List */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Daftar Pengunjung Terdaftar ({visitors.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Klik pada tiket untuk melihat dan mengunduh QR Code digital resmi
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {visitors.filter((v) => v.checkInStatus).length} Hadir
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {visitors.filter((v) => !v.checkInStatus).length} Menunggu
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visitors.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
                          {v.ticketNumber}
                        </span>
                        {v.checkInStatus ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                            ✓ Sudah Masuk
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                            Menunggu Kunjungan
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-slate-900 text-sm mt-2">{v.fullName}</h5>
                      <p className="text-xs text-slate-500">{v.institutionOrCity}</p>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Keperluan:</span>
                          <span className="font-semibold">{v.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Jumlah Orang:</span>
                          <span className="font-semibold">{v.paxCount} Orang</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tanggal Kunjungan:</span>
                          <span className="font-semibold">{v.visitDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setActiveVisitor(v);
                          setShowVisitorModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-800 py-1.5 px-3 text-xs font-bold text-amber-200 hover:bg-red-900 transition"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>Buka E-Tiket QR</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            const nowStr = new Date().toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) + ' WIB';
                            handleUpdateVisitor({
                              ...v,
                              checkInStatus: !v.checkInStatus,
                              checkInTime: !v.checkInStatus ? nowStr : undefined,
                            });
                          }}
                          className={`rounded-xl py-1.5 px-2.5 text-xs font-bold border transition ${
                            v.checkInStatus
                              ? 'border-slate-300 text-slate-600 hover:bg-slate-200'
                              : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                          title="Ubah status presensi masuk"
                        >
                          {v.checkInStatus ? 'Batal Masuk' : 'Check-In'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View: Dokumentasi Kegiatan */}
        {activeTab === 'dokumentasi' && (
          <div className="animate-fadeIn">
            <DocumentationGallery
              documentation={documentation}
              isAdmin={currentUser.role === 'admin'}
              onAddDocumentation={handleAddDocumentation}
              onOpenAdminDashboard={() => setShowAdminDashboard(true)}
            />
          </div>
        )}

        {/* View: Papan Peringkat & Gamifikasi Pos */}
        {activeTab === 'leaderboard' && (
          <div className="animate-fadeIn">
            <LeaderboardView
              participants={participants}
              activityPosts={activityPosts}
              visitors={visitors}
              isAdmin={currentUser.role === 'admin'}
              currentUser={currentUser}
              onOpenQRScanner={() => setShowQRScanner(true)}
              onOpenAdminPosts={() => {
                setAdminInitialTab('activityPosts');
                setShowAdminDashboard(true);
              }}
              onSelectParticipant={(p) => setIdCardData({ person: p, type: 'peserta' })}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>⚜️ Gerakan Pramuka Indonesia • Jambore 2026</span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700">JamboApp</span>
            <span>|</span>
            <span>Copyright : Rohadi Wijaya</span>
            <a
              href="https://instagram.com/sang_pandunegeri"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-pink-600 transition font-medium ml-1 group"
              title="Instagram @sang_pandunegeri"
            >
              <Instagram className="h-3.5 w-3.5 text-pink-600 group-hover:scale-110 transition-transform" />
              <span>sang_pandunegeri</span>
            </a>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        role={currentUser.role}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenQRScanner={() => setShowQRScanner(true)}
        onOpenMyIDCard={handleOpenMyIDCard}
        onOpenVisitorModal={() => setShowVisitorModal(true)}
        onOpenAdminDashboard={() => setShowAdminDashboard(true)}
      />

      {/* QR Code Verification Modal */}
      {showQRScanner && (
        <QRVerificationModal
          participants={participants}
          leaders={leaders}
          visitors={visitors}
          activityPosts={activityPosts}
          currentUser={currentUser}
          onUpdateParticipant={handleUpdateParticipant}
          onUpdateLeader={handleUpdateLeader}
          onUpdateVisitor={handleUpdateVisitor}
          onAwardPoints={handleAwardPoints}
          verificationLogs={verificationLogs}
          onAddVerificationLog={handleAddVerificationLog}
          gasUrl={gasConfig.gasWebAppUrl}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* User Role Switching Modal (Admin / Member / Publik) */}
      {showRoleModal && (
        <UserRoleModal
          currentUser={currentUser}
          participants={participants}
          leaders={leaders}
          onSelectRole={(newUser) => {
            setCurrentUser(newUser);
            soundEffects.play('success');
            setToastAlert({
              title: 'Hak Akses Berhasil Diubah',
              message: `Mode aktif: ${
                newUser.role === 'admin'
                  ? 'Admin Panitia'
                  : newUser.role === 'member'
                  ? 'Member (Peserta/Pembina)'
                  : 'Publik (Pengunjung Umum)'
              }. Tampilan dan fitur telah disesuaikan.`,
            });
          }}
          onOpenVisitorRegister={() => {
            setShowRoleModal(false);
            setShowVisitorModal(true);
          }}
          onClose={() => setShowRoleModal(false)}
        />
      )}

      {/* Visitor Registration Modal */}
      {showVisitorModal && (
        <VisitorRegistrationModal
          visitors={visitors}
          onAddVisitor={handleAddVisitor}
          activeVisitor={activeVisitor}
          onSetActiveVisitor={setActiveVisitor}
          onClose={() => setShowVisitorModal(false)}
        />
      )}

      {/* Notification Center Modal / Drawer */}
      {showNotifDrawer && (
        <NotificationCenter
          notifications={notifications}
          onMarkAllAsRead={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          }}
          onClearAll={() => setNotifications([])}
          onBroadcastNotification={handleBroadcastNotification}
          onClose={() => setShowNotifDrawer(false)}
        />
      )}

      {/* Google Apps Script & Google Spreadsheet Integration Modal */}
      {showGASModal && (
        <GASIntegrationModal
          config={gasConfig}
          onSaveConfig={handleSaveGASConfig}
          onApplyRemoteData={handleApplyRemoteData}
          participants={participants}
          leaders={leaders}
          visitors={visitors}
          schedules={schedules}
          onClose={() => setShowGASModal(false)}
        />
      )}

      {/* Printable Scout ID Card & QR Modal */}
      {idCardData && (
        <IDCardModal
          person={idCardData.person}
          type={idCardData.type}
          onClose={() => setIdCardData(null)}
        />
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <AdminDashboard
          documentation={documentation}
          banners={banners}
          schedules={schedules}
          sponsors={sponsors}
          homeContent={homeContent}
          activityPosts={activityPosts}
          initialTab={adminInitialTab}
          targetBannerToEdit={adminTargetBanner}
          onUpdateDocumentation={(docs) => setDocumentation(docs)}
          onUpdateBanners={(b) => setBanners(b)}
          onUpdateSchedules={(s) => setSchedules(s)}
          onUpdateSponsors={(sps) => setSponsors(sps)}
          onUpdateHomeContent={(hc) => setHomeContent(hc)}
          onResetHomeContent={() => setHomeContent(INITIAL_HOME_CONTENT)}
          onUpdateActivityPosts={(posts) => setActivityPosts(posts)}
          onOpenPostQR={(post) => {
            setSelectedPostForQR(post);
          }}
          onOpenGASModal={() => {
            setShowAdminDashboard(false);
            setShowGASModal(true);
          }}
          onClose={() => {
            setShowAdminDashboard(false);
            setAdminTargetBanner(null);
          }}
        />
      )}

      {/* Printable Scout Post QR Code Modal */}
      {selectedPostForQR && (
        <PostQRModal
          post={selectedPostForQR}
          participants={participants}
          onAwardPoints={handleAwardPoints}
          onClose={() => setSelectedPostForQR(null)}
        />
      )}
    </div>
  );
}
