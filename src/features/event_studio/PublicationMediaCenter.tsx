/**
 * @license
 * SiEpang - Publication & Media Center (Sections 2 & 3)
 * Centralized administration entry for:
 * - Photo Documentation
 * - Video Documentation
 * - Albums
 * - Hero Banner
 * - Information Banner
 * - Sponsor Banner
 * - Sponsor & Partner Directory
 * - Public Homepage Layout
 * - Media Health / Broken Sources
 * - Public Preview
 */

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Film,
  Sparkles,
  Layers,
  Award,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus,
  ArrowRight,
  Monitor,
  Smartphone,
  RefreshCw,
  Bell,
  HeartHandshake,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { documentationService } from '../../services/documentationService';
import { bannerSponsorService } from '../../services/bannerSponsorService';
import { eventService } from '../../services/eventService';
import { DocumentationManager } from './DocumentationManager';
import { BannerSponsorManager } from './BannerSponsorManager';
import { IOSSegmentedControl } from '../../components/ios';

interface PublicationMediaCenterProps {
  onNavigateTab?: (tab: string) => void;
}

type MediaSubSection =
  | 'overview'
  | 'albums'
  | 'photos'
  | 'videos'
  | 'hero_banner'
  | 'info_banner'
  | 'sponsors'
  | 'homepage_layout'
  | 'media_health';

export const PublicationMediaCenter: React.FC<PublicationMediaCenterProps> = ({
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<MediaSubSection>('overview');
  const [toast, setToast] = useState<string | null>(null);

  const event = eventService.getCurrentEvent();
  const albums = documentationService.getAlbums();
  const photos = documentationService.getMediaItems({ type: 'PHOTO' });
  const videos = documentationService.getMediaItems({ type: 'VIDEO' });
  const banners = bannerSponsorService.getBanners();
  const sponsors = bannerSponsorService.getSponsors();
  const activeBannersCount = banners.filter(b => b.publication_status === 'PUBLISHED').length;

  // Media Health & Broken source monitor logic (Section 3 & 6)
  const brokenAlbums = albums.filter(
    a =>
      a.folder_access_status === 'PRIVATE' ||
      a.folder_access_status === 'BROKEN_SOURCE' ||
      a.folder_access_status === 'INVALID_URL'
  );
  const brokenPhotos = photos.filter(
    p =>
      p.metadata_status === 'BROKEN_SOURCE' ||
      p.metadata_status === 'INVALID_URL' ||
      p.metadata_status === 'PRIVATE'
  );
  const brokenCount = brokenAlbums.length + brokenPhotos.length;

  const handleCheckSources = () => {
    const res = documentationService.refreshMediaMetadata();
    setToast(`Hasil verifikasi: ${res.refreshedCount} media aktif, ${res.brokenCount} sumber bermasalah.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in z-50">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white dark:hover:text-black">✕</button>
        </div>
      )}

      {/* 1. Header with Public Preview Launcher */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 shadow-xs">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-[#F47743] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pusat Publikasi & Media Resmi</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Publikasi & Media
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Pusat komando terpadu untuk galeri dokumentasi foto/video, hero banner, sponsor resmi, dan portal publik kegiatan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.('public_home')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#208C60] to-[#F47743] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:opacity-90 active:scale-98 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>Buka Portal Publik</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. MAIN CARDS (Section 2) */}
        {/* Modern Grouped Mobile Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Card 1: Dokumentasi Foto */}
          <div
            onClick={() => setActiveSection(activeSection === 'albums' ? 'overview' : 'albums')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
              activeSection === 'albums' || activeSection === 'photos'
                ? 'bg-[#208C60]/10 border-[#208C60]/40 shadow-xs ring-2 ring-[#208C60]/20'
                : 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 hover:border-[#208C60]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 mb-2">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {albums.length} <span className="text-sm font-semibold text-slate-500">Album</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dokumentasi Foto ({photos.length} Foto)
              </div>
            </div>
          </div>

          {/* Card 2: Video Kegiatan */}
          <div
            onClick={() => setActiveSection(activeSection === 'videos' ? 'overview' : 'videos')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
              activeSection === 'videos'
                ? 'bg-[#F47743]/10 border-[#F47743]/40 shadow-xs ring-2 ring-[#F47743]/20'
                : 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 hover:border-[#F47743]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-pink-600 dark:text-pink-400 mb-2">
              <Film className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {videos.length} <span className="text-sm font-semibold text-slate-500">Video</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Video Kegiatan
              </div>
            </div>
          </div>

          {/* Card 3: Hero & Banner */}
          <div
            onClick={() => setActiveSection(activeSection === 'hero_banner' ? 'overview' : 'hero_banner')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
              activeSection === 'hero_banner' || activeSection === 'info_banner'
                ? 'bg-[#F4A53A]/10 border-[#F4A53A]/40 shadow-xs ring-2 ring-[#F4A53A]/20'
                : 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 hover:border-[#F4A53A]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400 mb-2">
              <Layers className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Banner</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {activeBannersCount} <span className="text-sm font-semibold text-slate-500">Aktif</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hero & Banner
              </div>
            </div>
          </div>

          {/* Card 4: Sponsor & Partner */}
          <div
            onClick={() => setActiveSection(activeSection === 'sponsors' ? 'overview' : 'sponsors')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
              activeSection === 'sponsors'
                ? 'bg-[#FFD36A]/10 border-[#FFD36A]/40 shadow-xs ring-2 ring-[#FFD36A]/20'
                : 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 hover:border-[#FFD36A]/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sponsor</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {sponsors.length} <span className="text-sm font-semibold text-slate-500">Sponsor</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sponsor & Partner
              </div>
            </div>
          </div>

          {/* Card 5: Halaman Publik */}
          <div
            onClick={() => setActiveSection(activeSection === 'homepage_layout' ? 'overview' : 'homepage_layout')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between col-span-2 sm:col-span-1 ${
              activeSection === 'homepage_layout'
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 hover:border-emerald-500/30 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
            </div>
            <div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Published</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Halaman Publik
              </div>
            </div>
          </div>
        </div>

        {/* 3. PUBLICATION CENTER SECTIONS NAVIGATION (Section 3) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Akses Langsung Bagian Publikasi:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border ${
                activeSection === 'overview'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-black/20'
              }`}
            >
              Semua Menu
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('albums')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'albums'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-purple-500/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Albums ({albums.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('photos')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'photos'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-purple-500/40'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Documentation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('videos')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'videos'
                  ? 'bg-[#F47743] text-white border-[#F47743] shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-[#F47743]/40'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Documentation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('hero_banner')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'hero_banner'
                  ? 'bg-[#F4A53A] text-white border-[#F4A53A] shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-[#F4A53A]/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hero Banner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('info_banner')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'info_banner'
                  ? 'bg-[#F4A53A] text-white border-[#F4A53A] shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-[#F4A53A]/40'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Information Banner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('sponsors')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'sponsors'
                  ? 'bg-[#FFD36A] text-slate-900 border-[#FFD36A] shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-[#FFD36A]/40'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Sponsor Banner & Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('homepage_layout')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'homepage_layout'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-emerald-500/40'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Public Homepage Layout</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('media_health')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                activeSection === 'media_health'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : brokenCount > 0
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/10 hover:border-black/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Media Health ({brokenCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('public_home')}
              className="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Public Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Section Renderers */}
      {/* Media Health Monitor (Section 3 & 6) */}
      {(activeSection === 'overview' || activeSection === 'media_health') && (
        <div
          className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            brokenCount > 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                brokenCount > 0
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {brokenCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold">
                {brokenCount > 0
                  ? `${brokenCount} sumber media memerlukan perhatian (Media Health Alert)`
                  : 'Seluruh sumber media foto & video terverifikasi dapat diakses publik'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {brokenCount > 0
                  ? 'Terdapat tautan Google Drive berstatus PRIVATE atau BROKEN_SOURCE yang belum dapat diakses pengunjung.'
                  : 'Folder Google Drive publik, CDN thumbnail, dan embed YouTube berjalan lancar.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckSources}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Periksa Sumber</span>
          </button>
        </div>
      )}

      {/* Render Documentation Manager for photo/video/album workflows */}
      {(activeSection === 'overview' ||
        activeSection === 'albums' ||
        activeSection === 'photos' ||
        activeSection === 'videos') && (
        <div className="space-y-4">
          <DocumentationManager />
        </div>
      )}

      {/* Render Banner & Sponsor Manager for hero/info/sponsor workflows */}
      {(activeSection === 'overview' ||
        activeSection === 'hero_banner' ||
        activeSection === 'info_banner' ||
        activeSection === 'sponsors') && (
        <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
          <BannerSponsorManager
            initialTab={
              activeSection === 'sponsors'
                ? 'sponsors'
                : activeSection === 'info_banner'
                ? 'info_banners'
                : 'hero'
            }
          />
        </div>
      )}

      {/* Render Public Homepage Layout Info */}
      {(activeSection === 'overview' || activeSection === 'homepage_layout') && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tata Letak & Portal Microsite Publik Kegiatan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dapat diakses langsung oleh orang tua, pembina, pengunjung umum, sponsor, dan media tanpa perlu login.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab?.('public_home')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#208C60] to-[#F47743] text-white font-bold text-xs flex items-center gap-2 shadow-xs shrink-0 hover:opacity-90"
            >
              <span>Buka Pratinjau Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1">
              <span className="text-slate-400 text-[11px] block">URL Portal Publik:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono break-all">
                https://buper.siepang.id/{event.id}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1">
              <span className="text-slate-400 text-[11px] block">Registrasi Pengunjung:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tiket Digital Online Aktif</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-1">
              <span className="text-slate-400 text-[11px] block">Galeri Foto & Video:</span>
              <span className="font-bold text-[#F47743] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terhubung ke Google Drive</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
