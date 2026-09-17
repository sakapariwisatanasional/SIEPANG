import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ActivityPost, Participant } from '../types';
import {
  X,
  Printer,
  Award,
  Sparkles,
  MapPin,
  User,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Globe,
  HelpCircle,
} from 'lucide-react';

interface PostQRModalProps {
  post: ActivityPost | null;
  participants?: Participant[];
  onAwardPoints?: (participantId: string, postId: string) => void;
  onClose: () => void;
}

export const PostQRModal: React.FC<PostQRModalProps> = ({
  post,
  participants = [],
  onAwardPoints,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrMode, setQrMode] = useState<'url' | 'raw'>('url');
  const [copied, setCopied] = useState(false);
  const [simulatedParticipantId, setSimulatedParticipantId] = useState<string>(
    participants[0]?.id || ''
  );
  const [simulatedSuccess, setSimulatedSuccess] = useState<string | null>(null);

  const getUniversalUrl = (postCode: string) => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?pos=${encodeURIComponent(postCode)}`;
    }
    return `https://siepangapps.pramuka.id/?pos=${encodeURIComponent(postCode)}`;
  };

  useEffect(() => {
    if (!post) return;

    // Encode standardized QR payload
    const payload =
      qrMode === 'url'
        ? getUniversalUrl(post.code)
        : post.qrData || `JAMBOREE-POS:${post.code}`;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#7F1D1D', // Deep red pramuka
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR for post:', err));
  }, [post, qrMode]);

  if (!post) return null;

  const currentPayload =
    qrMode === 'url'
      ? getUniversalUrl(post.code)
      : post.qrData || `JAMBOREE-POS:${post.code}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-POS-${post.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickSimulate = () => {
    if (!simulatedParticipantId || !onAwardPoints) return;
    const target = participants.find((p) => p.id === simulatedParticipantId);
    if (!target) return;

    onAwardPoints(target.id, post.id);
    setSimulatedSuccess(`Poin berhasil ditambahkan ke ${target.fullName}!`);
    setTimeout(() => setSimulatedSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white">
      <div className="relative flex max-h-[96vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-red-950/20 print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header toolbar - Hidden on Print */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-3.5 text-white print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-red-950 shadow font-bold">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  LEMBAR RESMI QR CODE POS KEGIATAN
                </span>
              </div>
              <p className="text-[11px] text-red-200">
                Otomatis dihitung masuk Papan Peringkat &amp; Google Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-1 rounded-xl border border-red-700 bg-red-900/90 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-red-800 transition"
              title="Unduh Gambar PNG"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1 text-xs font-bold text-red-950 hover:bg-amber-300 transition shadow"
              title="Cetak Lembar Pos Siap Tempel"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Poster</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 print:p-6 print:overflow-visible">
          {/* Print Watermark Header for Physical Printing */}
          <div className="hidden print:block text-center border-b-2 border-red-900 pb-3 mb-4">
            <h2 className="text-xl font-black uppercase text-red-950 tracking-wider">
              GERAKAN PRAMUKA - JAMBORE 2026
            </h2>
            <p className="text-xs font-bold text-slate-600">
              LEMBAR RESMI QR CODE PENILAIAN POS KEGIATAN LAPANGAN
            </p>
          </div>

          {/* Format Mode Selector (Web Camera vs In-App Scanner) - Hidden on print */}
          <div className="print:hidden rounded-2xl bg-slate-50 p-2 border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 pl-2 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-red-700" />
              Format Tautan QR:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setQrMode('url')}
                className={`px-3 py-1 rounded-xl font-bold transition text-[11px] ${
                  qrMode === 'url'
                    ? 'bg-red-800 text-amber-200 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Bisa discan langsung pakai kamera bawaan HP (otomatis buka aplikasi)"
              >
                URL Aplikasi (Bisa Kamera HP)
              </button>
              <button
                type="button"
                onClick={() => setQrMode('raw')}
                className={`px-3 py-1 rounded-xl font-bold transition text-[11px] ${
                  qrMode === 'raw'
                    ? 'bg-red-800 text-amber-200 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Format kode singkat internal untuk scanner dalam aplikasi"
              >
                Kode Singkat
              </button>
            </div>
          </div>

          {/* Post Header Card */}
          <div className="rounded-2xl bg-gradient-to-br from-red-50 via-amber-50/50 to-emerald-50/30 border-2 border-red-200 p-4 sm:p-5 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 font-black px-3 py-1 text-xs mb-2 border border-red-200">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              <span>{post.category}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {post.title}
            </h3>

            {/* Points Badge */}
            <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-red-950 px-5 py-2 rounded-full font-black text-base shadow-md border-2 border-amber-300">
              <Sparkles className="h-5 w-5" />
              <span>+{post.points} Poin Kegiatan</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block text-[10px] uppercase tracking-wider">
                    Lokasi Pos:
                  </span>
                  <span className="font-semibold">{post.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <User className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block text-[10px] uppercase tracking-wider">
                    PJ Pos / PIC:
                  </span>
                  <span className="font-semibold">{post.picName || 'Panitia Jambore Penggalang'}</span>
                </div>
              </div>
            </div>

            {post.description && (
              <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-slate-200 text-left">
                <strong>Uraian Tugas / Uji Keterampilan:</strong> {post.description}
              </p>
            )}
          </div>

          {/* QR Code Canvas Frame */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-red-300 print:border-solid print:bg-white">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${post.title}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                Memuat QR Code...
              </div>
            )}

            <div className="mt-3 text-center w-full max-w-sm">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                <span>{post.code}</span>
                <button
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-slate-700 ml-1 transition"
                  title="Salin Isi QR"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-600 font-medium mt-1.5 leading-snug">
                Scan menggunakan <strong>Kamera HP</strong> atau menu <strong>Scan QR</strong> di aplikasi SiEpangApps untuk mengklaim nilai poin pos ini.
              </p>
            </div>
          </div>

          {/* Petunjuk Penggunaan untuk Panitia & Peserta */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-950 space-y-1 print:text-[10px]">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
              <span>Petunjuk Teknis Pos Lapangan:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
              <li>Tempelkan lembar ini pada tiang bendera atau papan meja pos kegiatan.</li>
              <li>Peserta yang telah lulus ujian keterampilan dapat langsung men-scan QR ini.</li>
              <li>Poin secara otomatis bertambah ke akun peserta dan terakumulasi di Papan Peringkat.</li>
              <li>Data penilaian otomatis tersinkronisasi ke Google Spreadsheet (Sheet <code>Poin_Log</code> &amp; <code>Peserta</code>).</li>
            </ul>
          </div>

          {/* Quick Simulation (Testing / Demo) - Hidden on Print */}
          {onAwardPoints && participants.length > 0 && (
            <div className="print:hidden rounded-2xl bg-slate-100 p-3 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Uji Coba Klaim Poin Mandiri (Simulasi):
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={simulatedParticipantId}
                  onChange={(e) => setSimulatedParticipantId(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {participants.map((p) => {
                    const alreadyDone =
                      p.completedPosts?.includes(post.code) ||
                      p.completedPosts?.includes(post.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.regu}) - {p.points || 0} Poin {alreadyDone ? '✓ (Sudah Selesai)' : ''}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={handleQuickSimulate}
                  className="rounded-xl bg-red-700 px-3 py-1.5 font-bold text-white hover:bg-red-800 transition active:scale-95 whitespace-nowrap"
                >
                  + Beri {post.points} Poin
                </button>
              </div>
              {simulatedSuccess && (
                <div className="mt-2 text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{simulatedSuccess}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions - Hidden on Print */}
        <div className="border-t border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between print:hidden">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Status: <span className="font-bold text-emerald-700">Aktif Digunakan</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadQR}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh PNG</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

