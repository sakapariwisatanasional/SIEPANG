import React from 'react';
import { X, Sparkles, Compass, Shield, Smartphone, Heart, Award, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { CurrentUser } from '../types';
import { normalizeMascotUrl } from '../utils/mediaUtils';

interface MascotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mascotUrl?: string;
  onUpdateMascotUrl?: (url: string) => void;
  currentUser?: CurrentUser;
  onOpenAuthModal?: (tab?: 'login' | 'register') => void;
}

export const MascotDetailModal: React.FC<MascotDetailModalProps> = ({
  isOpen,
  onClose,
  mascotUrl = '/MASKOT.png',
  onUpdateMascotUrl,
  currentUser,
  onOpenAuthModal,
}) => {
  const isSuperOrAdmin = currentUser?.role === 'admin';
  const [customLinkInput, setCustomLinkInput] = React.useState(mascotUrl);
  const [linkSavedMsg, setLinkSavedMsg] = React.useState<string | null>(null);
  const [showUrlEditor, setShowUrlEditor] = React.useState(false);
  const [previewTestUrl, setPreviewTestUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCustomLinkInput(mascotUrl);
  }, [mascotUrl]);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperOrAdmin) {
      alert('Akses Ditolak: Hanya SuperAdmin atau Admin yang berhak mengubah tautan maskot.');
      return;
    }
    if (!customLinkInput.trim()) return;
    const cleanUrl = normalizeMascotUrl(customLinkInput);
    setCustomLinkInput(cleanUrl);
    if (onUpdateMascotUrl) {
      onUpdateMascotUrl(cleanUrl);
      setLinkSavedMsg('Tautan gambar maskot berhasil diperbarui & disimpan oleh ' + (currentUser?.name || 'Admin') + '!');
      setPreviewTestUrl(null);
      setTimeout(() => setLinkSavedMsg(null), 3500);
    }
  };

  const handleResetDefault = () => {
    if (!isSuperOrAdmin) {
      alert('Akses Ditolak: Hanya SuperAdmin atau Admin yang berhak mereset tautan maskot.');
      return;
    }
    const defaultUrl = '/MASKOT.png';
    setCustomLinkInput(defaultUrl);
    setPreviewTestUrl(null);
    if (onUpdateMascotUrl) {
      onUpdateMascotUrl(defaultUrl);
      setLinkSavedMsg('Tautan gambar maskot dikembalikan ke default bawaan (/MASKOT.png).');
      setTimeout(() => setLinkSavedMsg(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-stone-900 shadow-2xl border border-amber-500/30 text-white">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 border-b border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-red-950 font-black text-lg shadow-md">
                🦋
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight text-white">
                    Maskot Resmi SIEPANG
                  </h3>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-red-950">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-red-200">
                  Filosofi &amp; Karakter Jambore Penggalang Gerakan Pramuka 2026
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-red-900/80 p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Showcase: Large Mascot Image & Short Intro */}
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-stone-950/80 p-4 border border-stone-800">
            <div className="relative flex h-60 w-44 sm:h-72 sm:w-48 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-stone-800/80 via-stone-900 to-black p-2 shadow-inner border border-amber-400/40">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/10 blur-md" />
              <img
                src={mascotUrl}
                alt="Maskot Resmi SIEPANG"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('MASKOT.png') && !target.src.includes('Maskot.png')) {
                    target.src = '/MASKOT.png';
                  } else if (target.src.includes('MASKOT.png')) {
                    target.src = '/Maskot.png';
                  }
                }}
                className="relative z-10 h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
              />
              <div className="absolute -bottom-2 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-0.5 text-[9px] font-black tracking-wider text-red-950 shadow-md">
                PANDU TANGKAS
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                Sahabat Elektronik Penggalang
              </span>
              <h4 className="text-xl font-black text-white">
                SIEPANG si Pandu Cilik Berwawasan Digital
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                SIEPANG adalah personifikasi karakter Pramuka Penggalang yang riang, tangkas, berbudi luhur, dan adaptif terhadap kemajuan era teknologi digital perkemahan modern tanpa melupakan nilai Tri Satya dan Dasa Darma.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="rounded-lg bg-stone-800 px-2.5 py-1 text-[11px] text-amber-200 border border-stone-700">
                  🎖️ Tangkas &amp; Mandiri
                </span>
                <span className="rounded-lg bg-stone-800 px-2.5 py-1 text-[11px] text-amber-200 border border-stone-700">
                  📱 Melek Digital
                </span>
                <span className="rounded-lg bg-stone-800 px-2.5 py-1 text-[11px] text-amber-200 border border-stone-700">
                  🌿 Cinta Alam
                </span>
              </div>
            </div>
          </div>

          {/* 6 Core Philosophies Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Filosofi Detail Setiap Bagian Maskot</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Sayap Kupu-Kupu Batik */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-base">
                    🦋
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Sayap Kupu-Kupu Bermotif Batik
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Melambangkan proses <strong>metamorfosis</strong> pembinaan pramuka penggalang yang bertransformasi menjadi pribadi tangguh berakar budaya luhur Nusantara.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Topi Rimba & Antena Sensor */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-base">
                    🤠
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Topi Rimba &amp; Antena Kepekaan
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Simbol kecintaan pada alam terbuka serta kepekaan sensorik terhadap lingkungan hidup dan kepedulian sosial sesama manusia.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Smartphone Aplikasi SIEPANG (SiEpangApps) */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-base">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Gawai Cerdas Terintegrasi
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Mewakili perkemahan pintar (<em>Smart Camp</em>) dengan presensi QR pos giat, jadwal interaktif, e-sertifikat, dan papan skor regu digital.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Setangan Leher & Tunas Kelapa */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-base">
                    🎗️
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Kacu Merah Putih &amp; Ring Tunas
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Ikrar kehormatan Tri Satya dan Dasa Darma serta kesetiaan tanpa pamrih pada keutuhan Negara Kesatuan Republik Indonesia.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Kompas & Perlengkapan Survival */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-base">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Kompas Penuntun Moralitas
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Pedoman arah hidup yang lurus serta kemahiran kepramukaan (<em>scouting skills</em>) dalam memecahkan setiap tantangan giat prestasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Sepatu Lapangan Petualang */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600/20 text-amber-300 border border-amber-600/30 font-bold text-base">
                    🥾
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-100">
                      Sepatu Bot Lapangan Tangguh
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-normal mt-1">
                      Kesiapsiagaan melangkah di bumi perkemahan dengan langkah tegap, berani, pantang menyerah, dan penuh optimisme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Link Configuration Card - Restricted to SuperAdmin / Admin */}
          {isSuperOrAdmin ? (
            <div className="rounded-2xl border border-amber-500/40 bg-stone-950 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">
                        Pengaturan Tautan Gambar Maskot
                      </h4>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                        {currentUser?.adminLevel === 'superadmin' ? 'SuperAdmin' : 'Admin'} Terverifikasi
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Anda memiliki otoritas penuh untuk mengganti URL gambar maskot kegiatan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUrlEditor(!showUrlEditor)}
                  className="rounded-lg bg-stone-800 hover:bg-stone-700 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition"
                >
                  {showUrlEditor ? 'Tutup Form' : 'Atur Link Maskot'}
                </button>
              </div>

              {linkSavedMsg && (
                <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{linkSavedMsg}</span>
                </div>
              )}

              {showUrlEditor && (
                <form onSubmit={handleSaveUrl} className="space-y-2.5 pt-1">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customLinkInput}
                      onChange={(e) => {
                        setCustomLinkInput(e.target.value);
                        setPreviewTestUrl(null);
                      }}
                      placeholder="Contoh: https://i.ibb.co/... atau link web direct image"
                      className="flex-1 rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTestUrl(customLinkInput.trim())}
                        className="rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold px-3 py-2 text-xs transition whitespace-nowrap border border-stone-700"
                      >
                        Cek Preview
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-red-950 font-bold px-3.5 py-2 text-xs transition shadow-xs whitespace-nowrap"
                      >
                        Terapkan Link
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDefault}
                        className="rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold px-2.5 py-2 text-xs transition whitespace-nowrap"
                        title="Kembalikan ke Maskot Bawaan"
                      >
                        Default
                      </button>
                    </div>
                  </div>

                  {previewTestUrl && (
                    <div className="rounded-xl border border-amber-500/30 bg-stone-900 p-3 flex items-center gap-3">
                      <img
                        src={previewTestUrl}
                        alt="Test Preview"
                        className="h-14 w-12 object-contain rounded-lg border border-stone-700 bg-black/50"
                        onError={() => alert('Gagal memuat pratinjau gambar dari URL tersebut. Pastikan URL berupa link langsung ke file gambar (png/jpg/webp).')}
                      />
                      <div className="text-[11px] text-stone-300">
                        <p className="font-semibold text-amber-300">Pratinjau Gambar:</p>
                        <p className="text-[10px] text-stone-400 break-all">{previewTestUrl}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400">
                    Tautan saat ini: <code className="text-amber-300 bg-stone-900 px-1 py-0.5 rounded font-mono text-[9px]">{mascotUrl}</code>
                  </p>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-400 border border-stone-700">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <span>Pengaturan URL Maskot Terkunci</span>
                    <span className="text-[9px] font-normal text-amber-400/90 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                      Khusus SuperAdmin / Admin
                    </span>
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Hanya akun yang terdaftar sebagai SuperAdmin atau Admin Panitia yang memiliki wewenang mengedit gambar maskot.
                  </p>
                </div>
              </div>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('login');
                  }}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-bold text-red-950 transition whitespace-nowrap shadow-xs"
                >
                  🔑 Login Akun Admin
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 bg-stone-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>Hak Cipta Maskot Resmi Jambore Penggalang 2026</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-red-950 hover:from-amber-400 hover:to-amber-500 transition shadow"
          >
            <span>Tutup Penjelasan Maskot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
