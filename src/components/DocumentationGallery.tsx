import React, { useState } from 'react';
import { DocumentationItem } from '../types';
import { parseMediaUrl } from '../utils/mediaUtils';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Play,
  Plus,
  X,
  Eye,
  Calendar,
  User,
  Download,
  ExternalLink,
  Sparkles,
  Youtube,
  HardDrive,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface DocumentationGalleryProps {
  documentation: DocumentationItem[];
  isAdmin?: boolean;
  onAddDocumentation: (item: DocumentationItem) => void;
  onOpenAdminDashboard?: () => void;
}

export const DocumentationGallery: React.FC<DocumentationGalleryProps> = ({
  documentation,
  isAdmin = false,
  onAddDocumentation,
  onOpenAdminDashboard,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'video' | 'document' | 'photo'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<DocumentationItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New item form
  const [newType, setNewType] = useState<'video' | 'document' | 'photo'>('video');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentationItem['category']>('Perkemahan');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  // Live parsed info for the new URL input
  const liveParsed = parseMediaUrl(newUrl, newType);

  const categories: DocumentationItem['category'][] = [
    'Upacara',
    'Perkemahan',
    'Penjelajahan',
    'Api Unggun',
    'Pentas Seni',
    'Umum',
  ];

  const filteredItems = documentation.filter((item) => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchType && matchCategory;
  });

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const parsed = parseMediaUrl(newUrl.trim(), newType);

    const newItem: DocumentationItem = {
      id: 'doc_' + Date.now(),
      type: newType,
      sourceType: parsed.sourceType,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Dokumentasi kegiatan Jambore Penggalang Pramuka',
      url: newUrl.trim(),
      embedUrl: parsed.embedUrl || newUrl.trim(),
      downloadUrl: parsed.downloadUrl,
      thumbnailUrl: parsed.thumbnailUrl || newUrl.trim(),
      category: newCategory,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      author: newAuthor.trim() || 'Tim Dokumentasi Jambore Penggalang',
      fileSize: parsed.label,
    };

    onAddDocumentation(newItem);
    setShowUploadModal(false);

    // Reset form
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setNewAuthor('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Upload & Admin Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 p-4 sm:p-5 text-white shadow-md border border-red-900/30">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Dokumentasi &amp; Video Player (YouTube &amp; Google Drive)</span>
          </div>
          <h3 className="text-base sm:text-lg font-black mt-0.5 text-white">
            Galeri Media &amp; Dokumen Perkemahan
          </h3>
          <p className="text-xs text-red-100">
            Pemutar video YouTube &amp; Google Drive, serta pratinjau file Drive yang dapat discroll dan didownload langsung.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAdminDashboard && (
              <button
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-red-950/60 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-red-900 transition"
              >
                <span>Dashboard Admin</span>
              </button>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4 text-red-950" />
              <span>Tambah URL Media</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-red-900/60 border border-red-700/50 px-3.5 py-2 text-xs font-semibold text-amber-200 shrink-0">
            <Video className="h-4 w-4 text-amber-300" />
            <span>Akses Publik &amp; Peserta</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl bg-white p-3 shadow-sm border border-stone-200">
        {/* Type toggle */}
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 rounded-lg py-1.5 px-3 transition ${
              filterType === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            Semua ({documentation.length})
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-3 transition ${
              filterType === 'video' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-amber-600" />
            <span>Video ({documentation.filter((d) => d.type === 'video').length})</span>
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-3 transition ${
              filterType === 'document' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>Dokumen Drive</span>
          </button>
          <button
            onClick={() => setFilterType('photo')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-3 transition ${
              filterType === 'photo' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>Foto</span>
          </button>
        </div>

        {/* Categories pills */}
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setFilterCategory('all')}
            className={`rounded-lg px-2.5 py-1.5 transition text-[11px] font-medium whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-amber-800 text-white'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg px-2.5 py-1.5 transition text-[11px] font-medium whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-800 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-xs text-stone-500">
            Belum ada dokumentasi untuk kategori ini.
          </div>
        ) : (
          filteredItems.map((item) => {
            const parsed = parseMediaUrl(item.url, item.type);
            const isYouTube = parsed.sourceType === 'youtube';
            const isDrive = parsed.sourceType === 'google_drive';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-lg flex flex-col"
              >
                {/* Media Thumbnail Box */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
                  <img
                    src={item.thumbnailUrl || parsed.thumbnailUrl || item.url}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />

                  {/* Play Icon Badge if Video */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow-xl group-hover:scale-110 transition border-2 border-white/20">
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Document Badge if PDF/Doc */}
                  {item.type === 'document' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/90 text-white shadow-xl group-hover:scale-110 transition border border-white/20">
                        <FileText className="h-6 w-6" />
                      </div>
                    </div>
                  )}

                  {/* Provider Platform Badges (YouTube, Google Drive) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isYouTube && (
                      <span className="flex items-center gap-1 rounded-full bg-red-600/95 px-2.5 py-0.5 text-[10px] font-black text-white backdrop-blur-sm shadow">
                        <Youtube className="h-3 w-3" />
                        <span>YouTube</span>
                      </span>
                    )}

                    {isDrive && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm shadow">
                        <HardDrive className="h-3 w-3" />
                        <span>Google Drive</span>
                      </span>
                    )}

                    <span className="rounded-full bg-stone-950/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm border border-amber-400/30">
                      {item.category}
                    </span>
                  </div>

                  {/* Downloadability indicator badge */}
                  {parsed.downloadUrl && (
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-emerald-600/90 p-1 text-white shadow" title="Dapat Didownload">
                      <Download className="h-3 w-3" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-stone-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </span>
                    <span className="truncate max-w-[130px] font-medium text-amber-200">
                      {item.author}
                    </span>
                  </div>
                </div>

                {/* Text Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-amber-900 transition">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                    <span className="flex items-center gap-1 text-amber-900 font-semibold">
                      <Eye className="h-3.5 w-3.5" />
                      <span>
                        {item.type === 'video'
                          ? 'Putar Video'
                          : item.type === 'document'
                          ? 'Baca & Scroll Dokumen'
                          : 'Lihat Foto'}
                      </span>
                    </span>

                    {parsed.downloadUrl && (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox / Video Player & Document Preview Modal */}
      {selectedItem && (() => {
        const parsed = parseMediaUrl(selectedItem.url, selectedItem.type);
        const embedUrl = selectedItem.embedUrl || parsed.embedUrl;
        const downloadUrl = selectedItem.downloadUrl || parsed.downloadUrl;
        const isYouTube = parsed.sourceType === 'youtube';
        const isDrive = parsed.sourceType === 'google_drive';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-fadeIn">
            <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-stone-950 border border-stone-800 text-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900/90 px-4 py-3">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {selectedItem.category} • {selectedItem.date}
                    </span>
                    {isYouTube && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        <Youtube className="h-2.5 w-2.5" />
                        YouTube
                      </span>
                    )}
                    {isDrive && (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-600/90 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        <HardDrive className="h-2.5 w-2.5" />
                        Google Drive
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold truncate text-white mt-0.5">
                    {selectedItem.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Direct Download Button */}
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
                      title="Download File Langsung"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}

                  {/* External link button */}
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-stone-700 bg-stone-800 px-2.5 py-1.5 text-xs text-stone-300 hover:text-white transition"
                    title="Buka URL Asli"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Buka Sumber</span>
                  </a>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition"
                    aria-label="Tutup"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Media Player Container */}
              <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-1 sm:p-2">
                {/* 1. YouTube Player (Embedded iframe) */}
                {isYouTube ? (
                  <div className="relative w-full aspect-video max-h-[70vh] rounded-xl overflow-hidden bg-black shadow-inner">
                    <iframe
                      src={embedUrl}
                      title={selectedItem.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : isDrive ? (
                  /* 2. Google Drive Video or Document Preview (Scrollable iframe) */
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-full h-[68vh] rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl">
                      <iframe
                        src={embedUrl}
                        title={selectedItem.title}
                        className="h-full w-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : selectedItem.type === 'video' ? (
                  /* 3. HTML5 Direct Video MP4/WebM */
                  <video
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="max-h-[68vh] w-full rounded-xl object-contain"
                  >
                    Browser Anda tidak mendukung tag video.
                  </video>
                ) : (
                  /* 4. Photo / Image View */
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain"
                    crossOrigin="anonymous"
                  />
                )}
              </div>

              {/* Caption & Instructions Footer */}
              <div className="border-t border-stone-800 bg-stone-900/95 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <p className="text-xs text-stone-200 leading-relaxed">
                    {selectedItem.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-amber-500" />
                      Kontributor: {selectedItem.author}
                    </span>
                    {isDrive && (
                      <span className="text-blue-300">
                        • File Google Drive mendukung scroll halaman pratinjau
                      </span>
                    )}
                  </div>
                </div>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File ({selectedItem.fileSize || 'Unduh'})</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upload & Tambah URL Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                    Tambah URL Media &amp; Dokumen
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Mendukung YouTube, Google Drive video/file/PDF, atau direct link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="mt-4 space-y-3.5 text-xs">
              {/* Type selector */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Jenis Media</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('video')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold border transition ${
                      newType === 'video'
                        ? 'bg-amber-800 text-white border-amber-800 shadow'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('document')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold border transition ${
                      newType === 'document'
                        ? 'bg-blue-700 text-white border-blue-700 shadow'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Dokumen Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('photo')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold border transition ${
                      newType === 'photo'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Foto</span>
                  </button>
                </div>
              </div>

              {/* URL Input with Live Detection */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  URL Media (YouTube / Google Drive / URL Gambar)
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://drive.google.com/file/d/..."
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs font-mono focus:border-amber-600 focus:outline-none"
                />

                {/* Live Detection Badge */}
                {newUrl.trim() && (
                  <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-stone-50 p-2 border border-stone-200 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-stone-700">
                      Format Terdeteksi:{' '}
                      <strong className="text-amber-900">{liveParsed.label}</strong>
                    </span>
                    {liveParsed.downloadUrl && (
                      <span className="ml-auto text-emerald-700 font-bold text-[10px]">
                        ✓ Download Siap
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Judul Dokumentasi</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Video Penjelajahan Wide Game Regu Rajawali"
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Agenda</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Deskripsi kegiatan atau isi file..."
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Author */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pengunggah / Kontributor</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Contoh: Tim Media Kwarcab / Kak Pembina"
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-800 px-5 py-2 text-xs font-bold text-white hover:bg-amber-900 shadow transition"
                >
                  Simpan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
