import React, { useState, useEffect } from 'react';
import { DocumentationItem, Banner, ScheduleItem, Sponsor, HomeContent, ActivityPost } from '../types';
import { parseMediaUrl } from '../utils/mediaUtils';
import {
  Shield,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  ExternalLink,
  Youtube,
  HardDrive,
  Video,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Link2,
  RefreshCw,
  Eye,
  Sliders,
  Calendar,
  Layers,
  Handshake,
  Upload,
  Crown,
  Info,
  Type,
  Check,
  AlertCircle,
  Home,
  Target,
  QrCode,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  documentation: DocumentationItem[];
  banners: Banner[];
  schedules: ScheduleItem[];
  sponsors: Sponsor[];
  homeContent: HomeContent;
  activityPosts?: ActivityPost[];
  initialTab?: 'docs' | 'banners' | 'homeContent' | 'sponsors' | 'activityPosts' | 'mascot';
  targetBannerToEdit?: Banner | null;
  mascotUrl?: string;
  onUpdateMascotUrl?: (url: string) => void;
  onUpdateDocumentation: (docs: DocumentationItem[]) => void;
  onUpdateBanners: (banners: Banner[]) => void;
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
  onUpdateSponsors: (sponsors: Sponsor[]) => void;
  onUpdateHomeContent: (content: HomeContent) => void;
  onUpdateActivityPosts?: (posts: ActivityPost[]) => void;
  onOpenPostQR?: (post: ActivityPost) => void;
  onResetHomeContent?: () => void;
  onOpenGASModal: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  documentation,
  banners,
  schedules,
  sponsors,
  homeContent,
  activityPosts = [],
  initialTab = 'docs',
  targetBannerToEdit = null,
  mascotUrl = '/MASKOT.png',
  onUpdateMascotUrl,
  onUpdateDocumentation,
  onUpdateBanners,
  onUpdateSchedules,
  onUpdateSponsors,
  onUpdateHomeContent,
  onUpdateActivityPosts,
  onOpenPostQR,
  onResetHomeContent,
  onOpenGASModal,
  onClose,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'docs' | 'banners' | 'homeContent' | 'sponsors' | 'activityPosts' | 'mascot'>(
    initialTab
  );

  // Mascot Edit State
  const [mascotInput, setMascotInput] = useState(mascotUrl);
  const [mascotPreviewUrl, setMascotPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setMascotInput(mascotUrl);
  }, [mascotUrl]);

  // Success alert message inside dashboard
  const [saveAlert, setSaveAlert] = useState<string | null>(null);
  const showSavedNotification = (msg: string) => {
    setSaveAlert(msg);
    setTimeout(() => setSaveAlert(null), 3000);
  };

  // -------------------------------------------------------------
  // 1. KONTEN BERANDA (HOME CONTENT) EDITING STATE
  // -------------------------------------------------------------
  const [formHome, setFormHome] = useState<HomeContent>({ ...homeContent });

  useEffect(() => {
    setFormHome({ ...homeContent });
  }, [homeContent]);

  const handleSaveHomeContent = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHomeContent(formHome);
    showSavedNotification('Teks dan judul informasi Beranda berhasil diperbarui!');
  };

  const handleResetHomeContent = () => {
    if (confirm('Kembalikan teks dan informasi Beranda ke susunan awal bawaan?')) {
      if (onResetHomeContent) {
        onResetHomeContent();
      }
      showSavedNotification('Konten Beranda dikembalikan ke default.');
    }
  };

  // -------------------------------------------------------------
  // 2. DOCUMENTATION (YOUTUBE / DRIVE) EDITING STATE
  // -------------------------------------------------------------
  const [editingDoc, setEditingDoc] = useState<DocumentationItem | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocUrl, setEditDocUrl] = useState('');
  const [editDocType, setEditDocType] = useState<'video' | 'document' | 'photo'>('video');
  const [editDocCategory, setEditDocCategory] = useState<DocumentationItem['category']>('Perkemahan');
  const [editDocDescription, setEditDocDescription] = useState('');
  const [editDocAuthor, setEditDocAuthor] = useState('');

  const liveParsedDoc = parseMediaUrl(editDocUrl, editDocType);

  const handleOpenEditDoc = (doc: DocumentationItem) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocUrl(doc.url);
    setEditDocType(doc.type);
    setEditDocCategory(doc.category);
    setEditDocDescription(doc.description);
    setEditDocAuthor(doc.author);
  };

  const handleOpenAddDoc = () => {
    setEditingDoc(null);
    setEditDocTitle('');
    setEditDocUrl('');
    setEditDocType('video');
    setEditDocCategory('Perkemahan');
    setEditDocDescription('');
    setEditDocAuthor('Panitia Jambore Penggalang');
    setShowAddDocModal(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDocTitle.trim() || !editDocUrl.trim()) return;

    const parsed = parseMediaUrl(editDocUrl.trim(), editDocType);

    if (editingDoc) {
      const updatedDocs = documentation.map((d) => {
        if (d.id === editingDoc.id) {
          return {
            ...d,
            title: editDocTitle.trim(),
            url: editDocUrl.trim(),
            type: editDocType,
            sourceType: parsed.sourceType,
            embedUrl: parsed.embedUrl,
            downloadUrl: parsed.downloadUrl,
            thumbnailUrl: parsed.thumbnailUrl || d.thumbnailUrl,
            category: editDocCategory,
            description: editDocDescription.trim(),
            author: editDocAuthor.trim(),
            fileSize: parsed.label,
          };
        }
        return d;
      });
      onUpdateDocumentation(updatedDocs);
      showSavedNotification('Media dokumentasi berhasil diperbarui!');
    } else {
      const newDoc: DocumentationItem = {
        id: 'doc_' + Date.now(),
        type: editDocType,
        title: editDocTitle.trim(),
        description: editDocDescription.trim(),
        url: editDocUrl.trim(),
        sourceType: parsed.sourceType,
        embedUrl: parsed.embedUrl,
        downloadUrl: parsed.downloadUrl,
        thumbnailUrl:
          parsed.thumbnailUrl ||
          (editDocType === 'video'
            ? 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80'),
        date: 'Hari Ini',
        category: editDocCategory,
        author: editDocAuthor.trim() || 'Panitia Jambore Penggalang',
        fileSize: parsed.label,
      };
      onUpdateDocumentation([newDoc, ...documentation]);
      showSavedNotification('Media dokumentasi baru berhasil ditambahkan!');
    }

    setEditingDoc(null);
    setShowAddDocModal(false);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Yakin ingin menghapus item dokumentasi ini?')) {
      onUpdateDocumentation(documentation.filter((d) => d.id !== id));
      showSavedNotification('Media dokumentasi telah dihapus.');
    }
  };

  // Sample presets for quick testing
  const setSampleYouTube = () => {
    setEditDocUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setEditDocType('video');
    setEditDocTitle('Video Atraksi Kreasi Pramuka Penggalang (YouTube)');
    setEditDocDescription('Cuplikan video resolusi tinggi diputar langsung via YouTube iframe player.');
  };

  const setSampleGoogleDriveVideo = () => {
    setEditDocUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing');
    setEditDocType('video');
    setEditDocTitle('Video Dokumentasi Drone Tapak Kemah (Google Drive)');
    setEditDocDescription('Pemutar video Google Drive dengan pratinjau dan tombol direct download.');
  };

  const setSampleGoogleDrivePdf = () => {
    setEditDocUrl('https://drive.google.com/file/d/1_9j_Q52YpA7r6oW9M4Xo0T3eP8l_sample/view?usp=sharing');
    setEditDocType('document');
    setEditDocTitle('Juklak & Petunjuk Teknis Jambore Penggalang (Google Drive PDF)');
    setEditDocDescription('Dokumen file Google Drive yang dapat discroll langsung di aplikasi dan didownload.');
  };

  // -------------------------------------------------------------
  // 3. BANNER CAROUSEL EDITING STATE
  // -------------------------------------------------------------
  const [editingBanner, setEditingBanner] = useState<Banner | null>(targetBannerToEdit);
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerBadge, setBannerBadge] = useState('');
  const [bannerActionText, setBannerActionText] = useState('Buka Info');
  const [bannerActionTab, setBannerActionTab] = useState('jadwal');
  const [bannerIsActive, setBannerIsActive] = useState(true);

  // If targetBannerToEdit provided via props, open it directly
  useEffect(() => {
    if (targetBannerToEdit) {
      handleOpenEditBanner(targetBannerToEdit);
      setActiveAdminTab('banners');
    }
  }, [targetBannerToEdit]);

  const handleOpenEditBanner = (b: Banner) => {
    setEditingBanner(b);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle);
    setBannerImageUrl(b.imageUrl);
    setBannerBadge(b.badge);
    setBannerActionText(b.actionText || 'Lihat Info');
    setBannerActionTab(b.actionTab || 'jadwal');
    setBannerIsActive(b.isActive);
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImageUrl('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=80');
    setBannerBadge('Highlight Acara');
    setBannerActionText('Lihat Jadwal');
    setBannerActionTab('jadwal');
    setBannerIsActive(true);
    setShowAddBannerModal(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImageUrl.trim()) return;

    if (editingBanner) {
      const updated = banners.map((b) => {
        if (b.id === editingBanner.id) {
          return {
            ...b,
            title: bannerTitle.trim(),
            subtitle: bannerSubtitle.trim(),
            imageUrl: bannerImageUrl.trim(),
            badge: bannerBadge.trim() || 'Info Kemah',
            actionText: bannerActionText.trim(),
            actionTab: bannerActionTab,
            isActive: bannerIsActive,
          };
        }
        return b;
      });
      onUpdateBanners(updated);
      showSavedNotification('Banner carousel berhasil diperbarui!');
    } else {
      const newBanner: Banner = {
        id: 'b_' + Date.now(),
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        imageUrl: bannerImageUrl.trim(),
        badge: bannerBadge.trim() || 'Info Baru',
        actionText: bannerActionText.trim(),
        actionTab: bannerActionTab,
        isActive: bannerIsActive,
      };
      onUpdateBanners([...banners, newBanner]);
      showSavedNotification('Banner carousel baru berhasil ditambahkan!');
    }

    setEditingBanner(null);
    setShowAddBannerModal(false);
  };

  const handleDeleteBanner = (id: string) => {
    if (banners.length <= 1) {
      alert('Minimal harus ada 1 banner aktif di Beranda.');
      return;
    }
    if (confirm('Yakin ingin menghapus banner ini dari Beranda?')) {
      onUpdateBanners(banners.filter((b) => b.id !== id));
      showSavedNotification('Banner telah dihapus dari Beranda.');
    }
  };

  // -------------------------------------------------------------
  // 4. SPONSOR EDITING STATE
  // -------------------------------------------------------------
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);

  const [sponsorName, setSponsorName] = useState('');
  const [sponsorTier, setSponsorTier] = useState<Sponsor['tier']>('gold');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [sponsorWebsiteUrl, setSponsorWebsiteUrl] = useState('');
  const [sponsorTagline, setSponsorTagline] = useState('');

  const handleOpenEditSponsor = (sp: Sponsor) => {
    setEditingSponsor(sp);
    setSponsorName(sp.name);
    setSponsorTier(sp.tier);
    setSponsorLogoUrl(sp.logoUrl);
    setSponsorWebsiteUrl(sp.websiteUrl || '');
    setSponsorTagline(sp.tagline);
  };

  const handleOpenAddSponsor = () => {
    setEditingSponsor(null);
    setSponsorName('');
    setSponsorTier('gold');
    setSponsorLogoUrl('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=300&q=80');
    setSponsorWebsiteUrl('https://');
    setSponsorTagline('');
    setShowAddSponsorModal(true);
  };

  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim() || !sponsorLogoUrl.trim()) return;

    if (editingSponsor) {
      const updated = sponsors.map((sp) => {
        if (sp.id === editingSponsor.id) {
          return {
            ...sp,
            name: sponsorName.trim(),
            tier: sponsorTier,
            logoUrl: sponsorLogoUrl.trim(),
            websiteUrl: sponsorWebsiteUrl.trim() || '#',
            tagline: sponsorTagline.trim(),
          };
        }
        return sp;
      });
      onUpdateSponsors(updated);
      showSavedNotification('Data sponsor berhasil diperbarui!');
    } else {
      const newSp: Sponsor = {
        id: 'sp_' + Date.now(),
        name: sponsorName.trim(),
        tier: sponsorTier,
        logoUrl: sponsorLogoUrl.trim(),
        websiteUrl: sponsorWebsiteUrl.trim() || '#',
        tagline: sponsorTagline.trim(),
      };
      onUpdateSponsors([...sponsors, newSp]);
      showSavedNotification('Sponsor baru berhasil ditambahkan!');
    }

    setEditingSponsor(null);
    setShowAddSponsorModal(false);
  };

  const handleDeleteSponsor = (id: string) => {
    if (confirm('Yakin ingin menghapus mitra sponsor ini?')) {
      onUpdateSponsors(sponsors.filter((sp) => sp.id !== id));
      showSavedNotification('Mitra sponsor telah dihapus.');
    }
  };

  // -------------------------------------------------------------
  // 5. POS & POIN KEGIATAN (ACTIVITY POSTS) EDITING STATE
  // -------------------------------------------------------------
  const [editingPost, setEditingPost] = useState<ActivityPost | null>(null);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCode, setPostCode] = useState('');
  const [postCategory, setPostCategory] = useState<ActivityPost['category']>('Teknik Kepramukaan');
  const [postPoints, setPostPoints] = useState<number>(10);
  const [postLocation, setPostLocation] = useState('');
  const [postPic, setPostPic] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postIsActive, setPostIsActive] = useState(true);

  const handleOpenAddPost = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostCode('POS-' + Math.floor(100 + Math.random() * 900));
    setPostCategory('Teknik Kepramukaan');
    setPostPoints(10);
    setPostLocation('Bumi Perkemahan Utama');
    setPostPic('Panitia Pos');
    setPostDescription('');
    setPostIsActive(true);
    setShowAddPostModal(true);
  };

  const handleOpenEditPost = (p: ActivityPost) => {
    setEditingPost(p);
    setPostTitle(p.title);
    setPostCode(p.code);
    setPostCategory(p.category);
    setPostPoints(p.points);
    setPostLocation(p.location);
    setPostPic(p.picName || '');
    setPostDescription(p.description);
    setPostIsActive(p.isActive);
    setShowAddPostModal(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    if (!onUpdateActivityPosts) return;

    const normalizedCode = (postCode.trim() || ('POS-' + Date.now())).toUpperCase().replace(/\s+/g, '-');
    const qrData = `JAMBOREE-POS:${normalizedCode}`;

    if (editingPost) {
      const updated = activityPosts.map((p) => {
        if (p.id === editingPost.id) {
          return {
            ...p,
            title: postTitle.trim(),
            code: normalizedCode,
            category: postCategory,
            points: Number(postPoints) || 10,
            location: postLocation.trim() || 'Bumi Perkemahan Utama',
            picName: postPic.trim() || 'Panitia Pos',
            description: postDescription.trim(),
            qrData,
            isActive: postIsActive,
          };
        }
        return p;
      });
      onUpdateActivityPosts(updated);
      showSavedNotification(`Pos "${postTitle}" berhasil diperbarui dengan nilai ${postPoints} Poin!`);
    } else {
      const newPost: ActivityPost = {
        id: 'post_' + Date.now(),
        title: postTitle.trim(),
        code: normalizedCode,
        category: postCategory,
        points: Number(postPoints) || 10,
        location: postLocation.trim() || 'Bumi Perkemahan Utama',
        picName: postPic.trim() || 'Panitia Pos',
        description: postDescription.trim(),
        qrData,
        isActive: postIsActive,
        completedCount: 0,
      };
      onUpdateActivityPosts([...activityPosts, newPost]);
      showSavedNotification(`Pos "${postTitle}" berhasil dibuat dengan nilai ${postPoints} Poin!`);
    }

    setEditingPost(null);
    setShowAddPostModal(false);
  };

  const handleDeletePost = (id: string) => {
    if (!onUpdateActivityPosts) return;
    if (confirm('Yakin ingin menghapus pos kegiatan ini?')) {
      onUpdateActivityPosts(activityPosts.filter((p) => p.id !== id));
      showSavedNotification('Pos kegiatan telah dihapus.');
    }
  };

  const handleQuickChangePoints = (postId: string, delta: number) => {
    if (!onUpdateActivityPosts) return;
    const targetPost = activityPosts.find((p) => p.id === postId);
    const newPts = Math.max(1, ((targetPost?.points) || 10) + delta);
    const updated = activityPosts.map((p) => {
      if (p.id === postId) {
        return { ...p, points: newPts };
      }
      return p;
    });
    onUpdateActivityPosts(updated);
    showSavedNotification(`Poin pos "${targetPost?.title || ''}" diubah menjadi ${newPts} Poin!`);
  };

  const handleSaveMascotUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascotInput.trim()) return;
    if (onUpdateMascotUrl) {
      onUpdateMascotUrl(mascotInput.trim());
      setMascotPreviewUrl(null);
      showSavedNotification('Tautan URL Maskot Si-EPANG berhasil diperbarui & disimpan!');
    }
  };

  const handleResetMascotUrl = () => {
    const def = '/MASKOT.png';
    setMascotInput(def);
    setMascotPreviewUrl(null);
    if (onUpdateMascotUrl) {
      onUpdateMascotUrl(def);
      showSavedNotification('Tautan Maskot dikembalikan ke gambar resmi default (/MASKOT.png)');
    }
  };

  // Helper file upload handler
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
        showSavedNotification('Gambar berhasil diunggah dari perangkat!');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-red-950 shadow-md font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Dashboard Admin &amp; Pengelolaan Beranda
                </h3>
                <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30">
                  Mode Panitia
                </span>
              </div>
              <p className="text-xs text-red-100">
                Ubah seluruh teks, judul, banner gambar, sponsor, dan media dokumentasi Beranda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGASModal}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-red-700 bg-red-900/80 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-red-800 transition"
            >
              <span>Sync Google Sheets</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global Save Alert Banner */}
        {saveAlert && (
          <div className="flex items-center gap-2 bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-inner animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{saveAlert}</span>
          </div>
        )}

        {/* Sub Navigation Bar - 4 Comprehensive Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveAdminTab('homeContent')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'homeContent'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="h-4 w-4 text-red-700" />
            <span>Teks &amp; Judul Beranda</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('banners')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'banners'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="h-4 w-4 text-amber-700" />
            <span>Banner Carousel ({banners.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('sponsors')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'sponsors'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Handshake className="h-4 w-4 text-emerald-700" />
            <span>Mitra Sponsor ({sponsors.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('docs')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'docs'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="h-4 w-4 text-blue-700" />
            <span>Video &amp; Dokumentasi ({documentation.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('activityPosts')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'activityPosts'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="h-4 w-4 text-amber-600" />
            <span>Pos &amp; Poin Kegiatan ({activityPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('mascot')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition whitespace-nowrap ${
              activeAdminTab === 'mascot'
                ? 'border-red-700 text-red-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Maskot Resmi Si-EPANG</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ========================================================= */}
          {/* TAB 1: KELOLA TEKS & JUDUL BERANDA                        */}
          {/* ========================================================= */}
          {activeAdminTab === 'homeContent' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-red-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Kustomisasi Teks &amp; Informasi Halaman Beranda
                  </h4>
                  <p className="text-[11px] text-red-900 mt-0.5 leading-relaxed">
                    Setiap teks, judul perkemahan, tema, lokasi buper, dan deskripsi kotak informasi di Beranda dapat Anda edit manual di bawah ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetHomeContent}
                  className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 transition shrink-0"
                >
                  Reset Default
                </button>
              </div>

              <form onSubmit={handleSaveHomeContent} className="space-y-4">
                {/* 1. Bagian Identitas Kegiatan */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-red-700" />
                    <span>Identitas Utama Kegiatan</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">
                        Judul Utama Perkemahan / Event
                      </label>
                      <input
                        type="text"
                        required
                        value={formHome.eventTitle}
                        onChange={(e) => setFormHome({ ...formHome, eventTitle: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">
                        Subjudul / Semboyan / Tema Kegiatan
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={formHome.eventSubtitle}
                        onChange={(e) => setFormHome({ ...formHome, eventSubtitle: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Lokasi / Nama Bumi Perkemahan
                      </label>
                      <input
                        type="text"
                        required
                        value={formHome.eventLocation}
                        onChange={(e) => setFormHome({ ...formHome, eventLocation: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Tanggal Pelaksanaan Kegiatan
                      </label>
                      <input
                        type="text"
                        required
                        value={formHome.eventDates}
                        onChange={(e) => setFormHome({ ...formHome, eventDates: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">
                        Label Status Live Beranda
                      </label>
                      <input
                        type="text"
                        required
                        value={formHome.eventStatusBadge}
                        onChange={(e) => setFormHome({ ...formHome, eventStatusBadge: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Contoh: <code>Bumi Perkemahan • 🟢 Live</code> atau <code>Posko Utama • Terhubung</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Kartu Highlight Agenda & Kartu Presensi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kartu Agenda Puncak */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-xs">
                    <h5 className="font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span>Kartu Agenda Puncak</span>
                    </h5>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Judul Kartu</label>
                      <input
                        type="text"
                        required
                        value={formHome.highlightAgendaTitle}
                        onChange={(e) =>
                          setFormHome({ ...formHome, highlightAgendaTitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Subjudul / Catatan</label>
                      <input
                        type="text"
                        value={formHome.highlightAgendaSubtitle}
                        onChange={(e) =>
                          setFormHome({ ...formHome, highlightAgendaSubtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Kartu Presensi Mandiri */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-xs">
                    <h5 className="font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>Kartu Verifikasi Presensi Pos</span>
                    </h5>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="font-bold text-slate-800 block mb-1">Judul Kotak Presensi</label>
                        <input
                          type="text"
                          required
                          value={formHome.presenceBoxTitle}
                          onChange={(e) =>
                            setFormHome({ ...formHome, presenceBoxTitle: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Label Badge Pos</label>
                        <input
                          type="text"
                          value={formHome.presenceBoxBadge}
                          onChange={(e) =>
                            setFormHome({ ...formHome, presenceBoxBadge: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Deskripsi Petunjuk Presensi</label>
                      <textarea
                        rows={2}
                        value={formHome.presenceBoxDescription}
                        onChange={(e) =>
                          setFormHome({ ...formHome, presenceBoxDescription: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Judul Section Sponsor */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-xs">
                  <h5 className="font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                    <Handshake className="h-4 w-4 text-amber-700" />
                    <span>Judul &amp; Keterangan Section Sponsor di Beranda</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Judul Section Sponsor</label>
                      <input
                        type="text"
                        required
                        value={formHome.sponsorSectionTitle}
                        onChange={(e) =>
                          setFormHome({ ...formHome, sponsorSectionTitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Subjudul Section Sponsor</label>
                      <input
                        type="text"
                        required
                        value={formHome.sponsorSectionSubtitle}
                        onChange={(e) =>
                          setFormHome({ ...formHome, sponsorSectionSubtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-2xl bg-red-800 px-6 py-2.5 text-xs font-black text-amber-200 hover:bg-red-900 shadow-md transition"
                  >
                    <Save className="h-4 w-4 text-amber-400" />
                    <span>Simpan Seluruh Teks Beranda</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: KELOLA BANNER CAROUSEL                             */}
          {/* ========================================================= */}
          {activeAdminTab === 'banners' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div>
                  <h4 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-700" />
                    Pengelolaan Banner Carousel Beranda
                  </h4>
                  <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                    Anda dapat mengubah judul, subtitle, tombol aksi, serta mengganti gambar melalui URL atau unggah file foto langsung dari galeri ponsel/komputer.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddBanner}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-black text-amber-200 hover:bg-red-900 transition shadow shrink-0 active:scale-95"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  <span>Tambah Banner Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((b, idx) => (
                  <div
                    key={b.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-3 border border-slate-200">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                        <span className="absolute top-2 left-2 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/40">
                          {b.badge}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white">
                          Slide #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{b.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{b.subtitle}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          Tombol: {b.actionText || 'Lihat Info'}
                        </span>
                        <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-900">
                          Tujuan: Tab {b.actionTab || 'jadwal'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditBanner(b)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                        <span>Edit Banner</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 transition"
                        title="Hapus Banner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: KELOLA MITRA SPONSOR                               */}
          {/* ========================================================= */}
          {activeAdminTab === 'sponsors' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <Handshake className="h-4 w-4 text-emerald-700" />
                    Manajemen Mitra &amp; Iklan Sponsor di Beranda
                  </h4>
                  <p className="text-[11px] text-emerald-900 mt-0.5 leading-relaxed">
                    Kelola daftar sponsor kegiatan, logo mitra (URL atau unggah dari file perangkat), kategori/tier, dan tautan resmi.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSponsor}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-black text-amber-200 hover:bg-red-900 transition shadow shrink-0 active:scale-95"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  <span>Tambah Sponsor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sponsors.map((sp) => (
                  <div
                    key={sp.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2.5 flex flex-col justify-between hover:border-red-300 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <img
                            src={sp.logoUrl}
                            alt={sp.name}
                            className="h-full w-full object-cover rounded-lg"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{sp.name}</h5>
                          <span
                            className={`inline-block mt-0.5 rounded px-2 py-0.2 text-[9px] font-bold uppercase ${
                              sp.tier === 'platinum'
                                ? 'bg-amber-100 text-amber-900'
                                : sp.tier === 'gold'
                                ? 'bg-yellow-100 text-yellow-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Tier: {sp.tier}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2">{sp.tagline}</p>
                      {sp.websiteUrl && sp.websiteUrl !== '#' && (
                        <p className="text-[10px] text-blue-700 font-mono truncate">
                          {sp.websiteUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditSponsor(sp)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-1.5 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-red-900 transition"
                      >
                        <Edit3 className="h-3 w-3 text-red-700" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sp.id)}
                        className="rounded-xl bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                        title="Hapus Sponsor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: KELOLA DOKUMENTASI (YOUTUBE, GOOGLE DRIVE, FOTO)   */}
          {/* ========================================================= */}
          {activeAdminTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-950">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-700" />
                    Manajemen Tautan Media YouTube &amp; Google Drive
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Masukkan URL video YouTube atau URL Google Drive. Sistem otomatis mengekstrak ID, membuat iframe pemutar, mengaktifkan pratinjau yang dapat discroll, dan menyediakan link download langsung.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddDoc}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 transition shadow shrink-0 active:scale-95"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  <span>Tambah Media Baru</span>
                </button>
              </div>

              {/* Table of Documentation Items */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Media / Pratinjau</th>
                      <th className="p-3">Judul &amp; Kategori</th>
                      <th className="p-3">Tipe &amp; Provider</th>
                      <th className="p-3">URL Sumber</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentation.map((doc) => {
                      const parsed = parseMediaUrl(doc.url, doc.type);
                      const isYouTube = parsed.sourceType === 'youtube';
                      const isDrive = parsed.sourceType === 'google_drive';

                      return (
                        <tr key={doc.id} className="hover:bg-red-50/20 transition">
                          {/* Thumbnail */}
                          <td className="p-3 w-28">
                            <div className="relative aspect-video w-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                              <img
                                src={doc.thumbnailUrl || parsed.thumbnailUrl || doc.url}
                                alt={doc.title}
                                className="h-full w-full object-cover"
                                crossOrigin="anonymous"
                              />
                              {doc.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Video className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {doc.type === 'document' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-900/40">
                                  <FileText className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Title */}
                          <td className="p-3 max-w-[240px]">
                            <h5 className="font-bold text-slate-900 truncate">{doc.title}</h5>
                            <span className="inline-block mt-0.5 rounded bg-red-100 px-2 py-0.2 text-[10px] font-bold text-red-900">
                              {doc.category}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {doc.description}
                            </p>
                          </td>

                          {/* Type */}
                          <td className="p-3 whitespace-nowrap">
                            {isYouTube && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                                <Youtube className="h-3 w-3" />
                                <span>YouTube Player</span>
                              </span>
                            )}
                            {isDrive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                                <HardDrive className="h-3 w-3" />
                                <span>Google Drive</span>
                              </span>
                            )}
                            {!isYouTube && !isDrive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                <ImageIcon className="h-3 w-3" />
                                <span>Direct URL / Foto</span>
                              </span>
                            )}
                          </td>

                          {/* URL */}
                          <td className="p-3 max-w-[220px]">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-blue-700 hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{doc.url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <div className="flex items-center gap-2 mt-1">
                              {parsed.embedUrl && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  ✓ Embed Preview Aktif
                                </span>
                              )}
                              {parsed.downloadUrl && (
                                <span className="text-[10px] text-amber-800 font-bold">
                                  ✓ Download Siap
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-900 transition"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-red-700" />
                              <span>Edit URL</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="inline-flex items-center rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: KELOLA POS KEGIATAN & POIN (GAMIFIKASI)            */}
          {/* ========================================================= */}
          {activeAdminTab === 'activityPosts' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-amber-50/50 to-red-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-400/30 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-400/40 uppercase">
                      Sistem Gamifikasi &amp; Poin Kegiatan
                    </span>
                  </div>
                  <h4 className="mt-1 font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-red-700" />
                    Kelola Pos Kegiatan &amp; Penentuan Nilai Poin
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Tentukan nilai poin untuk setiap pos (misal: <strong>Kegiatan Pionering = 10 Poin</strong>). Ketika anggota men-scan QR Code di pos tersebut, nilainya secara otomatis bertambah dan masuk ke dalam Papan Peringkat (Ranking).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPost}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition shrink-0"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  <span>Tambah Pos Baru</span>
                </button>
              </div>

              {/* Activity Posts Table / Cards */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Pos &amp; Kode QR</th>
                      <th className="p-3">Kategori &amp; Lokasi</th>
                      <th className="p-3 text-center">Nilai Poin (Admin)</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Aksi &amp; Cetak QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/80 transition">
                        {/* Title & Code */}
                        <td className="p-3 max-w-[220px]">
                          <div className="flex items-start gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-800 shrink-0 mt-0.5">
                              <Target className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 leading-tight">
                                {post.title}
                              </h5>
                              <span className="inline-block mt-0.5 font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {post.code}
                              </span>
                              {post.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {post.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category & Location */}
                        <td className="p-3">
                          <span className="inline-block rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-100 mb-1">
                            {post.category}
                          </span>
                          <div className="text-[11px] text-slate-600">
                            📍 {post.location}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            PIC: {post.picName || 'Panitia'}
                          </div>
                        </td>

                        {/* Points & Quick Adjustment */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQuickChangePoints(post.id, -5)}
                              className="h-5 w-5 rounded bg-white text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs"
                              title="Kurangi 5 Poin"
                            >
                              -
                            </button>
                            <span className="font-black text-amber-900 text-sm min-w-[50px]">
                              +{post.points} Poin
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickChangePoints(post.id, 5)}
                              className="h-5 w-5 rounded bg-white text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs"
                              title="Tambah 5 Poin"
                            >
                              +
                            </button>
                          </div>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Klik +/- untuk ubah cepat
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          {post.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              Non-aktif
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {onOpenPostQR && (
                            <button
                              type="button"
                              onClick={() => onOpenPostQR(post)}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition border border-amber-300 shadow-xs"
                              title="Tampilkan & Cetak QR Code Pos"
                            >
                              <QrCode className="h-3.5 w-3.5 text-red-700" />
                              <span>Cetak QR</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditPost(post)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-900 transition"
                            title="Edit Pos & Poin"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-red-700" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="inline-flex items-center rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus Pos"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {activityPosts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Belum ada pos kegiatan ber-QR. Klik "Tambah Pos Baru" untuk membuat pos dan menentukan nilai poin!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: KELOLA MASKOT RESMI SI-EPANG                       */}
          {/* ========================================================= */}
          {activeAdminTab === 'mascot' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 p-4 sm:p-5 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-700 text-white shadow-md">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Pengaturan Maskot Resmi (Si-EPANG)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Hak akses eksklusif SuperAdmin / Admin Panitia untuk mengubah tautan URL gambar maskot resmi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Otoritas Terverifikasi</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Preview Card */}
                <div className="lg:col-span-5 rounded-3xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tampilan Maskot Saat Ini
                  </span>

                  <div className="relative group my-3 flex items-center justify-center h-64 w-64 rounded-3xl bg-radial from-amber-100/60 via-red-50/40 to-slate-100 p-4 border border-amber-200 shadow-inner overflow-hidden">
                    <img
                      src={mascotPreviewUrl || mascotUrl || '/MASKOT.png'}
                      alt="Maskot Si-EPANG"
                      className="h-full w-full object-contain filter drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/MASKOT.png';
                      }}
                    />
                    {mascotPreviewUrl && (
                      <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow">
                        Mode Pratinjau
                      </div>
                    )}
                  </div>

                  <h4 className="font-black text-slate-900 text-sm">
                    SI-EPANG (Elang Pandu Penggalang)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Karakter Burung Elang Bondol lincah berbalut seragam Pramuka Penggalang dengan atribut kepanduan lengkap.
                  </p>

                  <div className="mt-4 w-full rounded-2xl bg-slate-50 p-3 text-left border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      URL Aktif Sistem:
                    </div>
                    <div className="text-xs font-mono text-slate-700 break-all mt-0.5 select-all">
                      {mascotUrl || '/MASKOT.png'}
                    </div>
                  </div>
                </div>

                {/* Form & Config Card */}
                <div className="lg:col-span-7 rounded-3xl bg-white p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-black text-slate-900">
                      Ubah Tautan / Sumber URL Maskot
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Masukkan URL gambar baru (mendukung HTTPS, Google Drive direct link, Cloudinary, Imgur, dsb.)
                    </p>
                  </div>

                  <form onSubmit={handleSaveMascotUrl} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Alamat URL Gambar Maskot
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          required
                          value={mascotInput}
                          onChange={(e) => {
                            setMascotInput(e.target.value);
                            setMascotPreviewUrl(null);
                          }}
                          placeholder="https://example.com/maskot-si-epang.png"
                          className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100"
                        />
                        {mascotInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setMascotInput('');
                              setMascotPreviewUrl(null);
                            }}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Disarankan format PNG transparan atau WebP berkualitas tinggi agar menyatu dengan latar belakang aplikasi.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (mascotInput.trim()) {
                            setMascotPreviewUrl(mascotInput.trim());
                            showSavedNotification('Pratinjau gambar maskot ditampilkan di kartu kiri.');
                          }
                        }}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4 text-amber-600" />
                        <span>Tes Pratinjau URL</span>
                      </button>

                      <button
                        type="submit"
                        className="rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-800 transition shadow-md flex items-center gap-1.5 active:scale-98"
                      >
                        <Save className="h-4 w-4 text-amber-300" />
                        <span>Simpan &amp; Terapkan Maskot</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetMascotUrl}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        title="Kembalikan ke file maskot resmi lokal"
                      >
                        Reset Default (/MASKOT.png)
                      </button>
                    </div>
                  </form>

                  {/* Implementation Scope Info */}
                  <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/80 space-y-2 text-xs">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span>Lokasi Penayangan Maskot Si-EPANG di Aplikasi:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px]">
                      <li><strong>Layar Sambutan (Welcome Modal):</strong> Maskot menyapa seluruh pengguna pertama kali membuka aplikasi.</li>
                      <li><strong>Header Navigasi Utama:</strong> Avatar interaktif Si-EPANG di sudut kanan atas.</li>
                      <li><strong>Banner Interaktif Beranda:</strong> Card maskot yang dapat diklik untuk membaca filosofi Si-EPANG.</li>
                      <li><strong>Modal Filosofi &amp; Filosofi Karakter:</strong> Detail sayap batik, hasduk merah putih, kacu, dan gawai kepanduan.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MODAL: EDIT / ADD BANNER CAROUSEL                         */}
        {/* ========================================================= */}
        {(editingBanner || showAddBannerModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingBanner ? 'Edit Banner Carousel' : 'Tambah Banner Carousel Baru'}
                </h3>
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setShowAddBannerModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Judul Utama Banner</label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Contoh: Jambore Penggalang Gerakan Pramuka 2026"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Subtitle / Slogan Banner</label>
                  <textarea
                    rows={2}
                    required
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Keterangan singkat yang tampil di bawah judul..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Label Badge Banner</label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="Contoh: BUMI PERKEMAHAN UTAMA / RESMI"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                {/* Image URL & File Upload */}
                <div className="space-y-1.5 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                  <label className="font-bold text-slate-800 block">
                    Gambar Banner (URL atau Unggah File)
                  </label>
                  <input
                    type="url"
                    required
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau tautan gambar"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-red-700 focus:outline-none bg-white"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Unggah Gambar dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setBannerImageUrl)}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">Mendukung JPG, PNG, WebP (Maks 5MB)</span>
                  </div>

                  {bannerImageUrl && (
                    <div className="mt-2 aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-300">
                      <img
                        src={bannerImageUrl}
                        alt="Preview Banner"
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>

                {/* Action Button Link */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Teks Tombol Aksi</label>
                    <input
                      type="text"
                      value={bannerActionText}
                      onChange={(e) => setBannerActionText(e.target.value)}
                      placeholder="Lihat Jadwal Lengkap"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Tujuan Tab Navigasi</label>
                    <select
                      value={bannerActionTab}
                      onChange={(e) => setBannerActionTab(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    >
                      <option value="jadwal">Tab Jadwal</option>
                      <option value="peserta">Tab Peserta</option>
                      <option value="pembina">Tab Pembina</option>
                      <option value="dokumentasi">Tab Dokumentasi</option>
                      <option value="pengunjung">Tab Pengunjung</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBanner(null);
                      setShowAddBannerModal(false);
                    }}
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition"
                  >
                    <Save className="h-3.5 w-3.5 text-amber-400" />
                    <span>Simpan Banner</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: EDIT / ADD SPONSOR                                 */}
        {/* ========================================================= */}
        {(editingSponsor || showAddSponsorModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingSponsor ? 'Edit Mitra & Sponsor' : 'Tambah Sponsor Baru'}
                </h3>
                <button
                  onClick={() => {
                    setEditingSponsor(null);
                    setShowAddSponsorModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSponsor} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nama Sponsor / Perusahaan</label>
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Contoh: Eiger Adventure"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tingkatan / Tier Sponsor</label>
                  <select
                    value={sponsorTier}
                    onChange={(e) => setSponsorTier(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  >
                    <option value="platinum">Platinum (Sponsor Utama)</option>
                    <option value="gold">Gold Partner</option>
                    <option value="silver">Silver Partner</option>
                    <option value="partner">Official Supporter / Mitra</option>
                  </select>
                </div>

                {/* Logo URL & File Upload */}
                <div className="space-y-1.5 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                  <label className="font-bold text-slate-800 block">
                    Logo Sponsor (URL atau Unggah File)
                  </label>
                  <input
                    type="url"
                    required
                    value={sponsorLogoUrl}
                    onChange={(e) => setSponsorLogoUrl(e.target.value)}
                    placeholder="https://... atau tautan logo transparan"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-red-700 focus:outline-none bg-white"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Unggah Logo dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, setSponsorLogoUrl)}
                      />
                    </label>
                  </div>

                  {sponsorLogoUrl && (
                    <div className="mt-2 h-16 w-36 rounded-xl overflow-hidden bg-white p-2 border border-slate-300 flex items-center justify-center">
                      <img
                        src={sponsorLogoUrl}
                        alt="Preview Logo"
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tagline / Deskripsi Sponsor</label>
                  <input
                    type="text"
                    required
                    value={sponsorTagline}
                    onChange={(e) => setSponsorTagline(e.target.value)}
                    placeholder="Contoh: Perlengkapan Outdoor Resmi Jambore Penggalang Pramuka"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">URL Website Resmi Sponsor</label>
                  <input
                    type="url"
                    value={sponsorWebsiteUrl}
                    onChange={(e) => setSponsorWebsiteUrl(e.target.value)}
                    placeholder="https://www.eigeradventure.com"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSponsor(null);
                      setShowAddSponsorModal(false);
                    }}
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition"
                  >
                    <Save className="h-3.5 w-3.5 text-amber-400" />
                    <span>Simpan Sponsor</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: EDIT / ADD DOCUMENTATION URL (YOUTUBE / DRIVE)     */}
        {/* ========================================================= */}
        {(editingDoc || showAddDocModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingDoc ? 'Edit URL & Media Dokumentasi' : 'Tambah Media YouTube / Google Drive'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Masukkan URL YouTube atau URL Google Drive untuk pemutar interaktif
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingDoc(null);
                    setShowAddDocModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Sample Presets */}
              <div className="mt-3.5 rounded-2xl bg-amber-50/70 p-3 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1.5">
                  ⚡ Isi Cepat dengan Contoh Tautan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={setSampleYouTube}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-red-700 transition"
                  >
                    <Youtube className="h-3 w-3" />
                    <span>Contoh YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={setSampleGoogleDriveVideo}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <HardDrive className="h-3 w-3" />
                    <span>Contoh Drive Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={setSampleGoogleDrivePdf}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Contoh Drive PDF (Scrollable)</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDoc} className="mt-4 space-y-3 text-xs">
                {/* Type Selection */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tipe Media</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDocType('video')}
                      className={`rounded-xl py-2 font-bold border transition flex items-center justify-center gap-1.5 ${
                        editDocType === 'video'
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDocType('document')}
                      className={`rounded-xl py-2 font-bold border transition flex items-center justify-center gap-1.5 ${
                        editDocType === 'document'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Dokumen Drive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDocType('photo')}
                      className={`rounded-xl py-2 font-bold border transition flex items-center justify-center gap-1.5 ${
                        editDocType === 'photo'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Foto</span>
                    </button>
                  </div>
                </div>

                {/* URL Field with Live Detection */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    URL Media (YouTube / Google Drive / URL Gambar Langsung)
                  </label>
                  <input
                    type="url"
                    required
                    value={editDocUrl}
                    onChange={(e) => setEditDocUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... atau https://drive.google.com/file/d/..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono focus:border-red-700 focus:outline-none"
                  />

                  {editDocUrl.trim() && (
                    <div className="mt-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Format: <span className="text-amber-900">{liveParsedDoc.label}</span>
                        </span>
                        {liveParsedDoc.downloadUrl && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            ✓ Direct Download Siap
                          </span>
                        )}
                      </div>
                      {liveParsedDoc.embedUrl && (
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          Embed URL: {liveParsedDoc.embedUrl}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Judul Media</label>
                  <input
                    type="text"
                    required
                    value={editDocTitle}
                    onChange={(e) => setEditDocTitle(e.target.value)}
                    placeholder="Contoh: Video Penjelajahan Wide Game Regu Rajawali"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                {/* Category & Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Kategori Agenda</label>
                    <select
                      value={editDocCategory}
                      onChange={(e) => setEditDocCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    >
                      <option value="Upacara">Upacara</option>
                      <option value="Perkemahan">Perkemahan</option>
                      <option value="Penjelajahan">Penjelajahan</option>
                      <option value="Api Unggun">Api Unggun</option>
                      <option value="Pentas Seni">Pentas Seni</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Kontributor / Penulis</label>
                    <input
                      type="text"
                      value={editDocAuthor}
                      onChange={(e) => setEditDocAuthor(e.target.value)}
                      placeholder="Contoh: Tim Media Kwarcab"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Deskripsi Ringkas</label>
                  <textarea
                    rows={2}
                    value={editDocDescription}
                    onChange={(e) => setEditDocDescription(e.target.value)}
                    placeholder="Keterangan singkat video atau dokumen..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDoc(null);
                      setShowAddDocModal(false);
                    }}
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition"
                  >
                    <Save className="h-3.5 w-3.5 text-amber-400" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: EDIT / ADD ACTIVITY POST & POINTS                  */}
        {/* ========================================================= */}
        {(editingPost || showAddPostModal) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-red-950 font-bold">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingPost ? 'Edit Pos & Nilai Poin Kegiatan' : 'Tambah Pos Kegiatan Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Admin menentukan nilai poin yang didapatkan peserta saat scan QR pos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setShowAddPostModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePost} className="mt-4 space-y-3.5 text-xs">
                {/* Title */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Nama / Judul Kegiatan Pos <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Contoh: Kegiatan Pionering, Halang Rintang, Morse & Sandi"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:border-red-700 focus:outline-none"
                  />
                </div>

                {/* Points & Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Poin Kegiatan (Requested by user) */}
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
                    <label className="font-black text-amber-950 block mb-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>Nilai Poin Pos (Admin) *</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={postPoints}
                        onChange={(e) => setPostPoints(Number(e.target.value))}
                        className="w-24 rounded-xl border border-amber-300 bg-white p-2 text-sm font-black text-amber-900 text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="font-bold text-amber-800 text-xs">Poin / Scan</span>
                    </div>
                    <span className="block text-[10px] text-amber-700 mt-1">
                      Contoh: 10 Poin, 15 Poin, 20 Poin
                    </span>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Kategori Kegiatan</label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    >
                      <option value="Teknik Kepramukaan">Teknik Kepramukaan</option>
                      <option value="Ketangkasan & Fisik">Ketangkasan & Fisik</option>
                      <option value="Keterampilan Khusus">Keterampilan Khusus</option>
                      <option value="Wawasan & Edukasi">Wawasan & Edukasi</option>
                      <option value="Petualangan Alam">Petualangan Alam</option>
                    </select>
                  </div>
                </div>

                {/* Code & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Kode Pos QR
                    </label>
                    <input
                      type="text"
                      required
                      value={postCode}
                      onChange={(e) => setPostCode(e.target.value)}
                      placeholder="Contoh: POS-PIONERING"
                      className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs uppercase focus:border-red-700 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Kode unik payload QR code</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Lokasi Pos
                    </label>
                    <input
                      type="text"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      placeholder="Contoh: Lapangan Utama / Tenda 4"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* PIC Name */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Penanggung Jawab (PIC) Pos
                  </label>
                  <input
                    type="text"
                    value={postPic}
                    onChange={(e) => setPostPic(e.target.value)}
                    placeholder="Contoh: Kak Rohadi & Tim Panitia"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Deskripsi Singkat Tantangan / Kegiatan</label>
                  <textarea
                    rows={2}
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Keterangan singkat tentang materi atau tugas di pos ini..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="postIsActive"
                    checked={postIsActive}
                    onChange={(e) => setPostIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="postIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Aktifkan pos ini agar bisa di-scan dan memberikan poin sekarang
                  </label>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null);
                      setShowAddPostModal(false);
                    }}
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition"
                  >
                    <Save className="h-3.5 w-3.5 text-amber-400" />
                    <span>Simpan Pos &amp; Poin</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Perubahan teks, gambar, dan tautan tersimpan di memori perangkat &amp; siap disinkronkan ke Google Sheets
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 transition"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
