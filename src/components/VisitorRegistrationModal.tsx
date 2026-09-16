import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { VisitorRegistration } from '../types';
import {
  X,
  QrCode,
  CheckCircle2,
  Printer,
  Download,
  Building2,
  Calendar,
  Users,
  Phone,
  Mail,
  FileText,
  Sparkles,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface VisitorRegistrationModalProps {
  visitors: VisitorRegistration[];
  onAddVisitor: (visitor: VisitorRegistration) => void;
  activeVisitor: VisitorRegistration | null;
  onSetActiveVisitor: (visitor: VisitorRegistration | null) => void;
  onClose: () => void;
}

export const VisitorRegistrationModal: React.FC<VisitorRegistrationModalProps> = ({
  visitors,
  onAddVisitor,
  activeVisitor,
  onSetActiveVisitor,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'ticket'>(activeVisitor ? 'ticket' : 'form');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [institutionOrCity, setInstitutionOrCity] = useState('');
  const [visitDate, setVisitDate] = useState('16 Sep 2026');
  const [purpose, setPurpose] = useState<VisitorRegistration['purpose']>('Keluarga Peserta');
  const [paxCount, setPaxCount] = useState(1);
  const [notes, setNotes] = useState('');

  // Generated QR data URL for the active ticket
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentTicket = activeVisitor;

  useEffect(() => {
    if (currentTicket) {
      const qrPayload = JSON.stringify({
        type: 'visitor',
        ticketNumber: currentTicket.ticketNumber,
        name: currentTicket.fullName,
        visitDate: currentTicket.visitDate,
        purpose: currentTicket.purpose,
        pax: currentTicket.paxCount,
        origin: currentTicket.institutionOrCity,
      });

      QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#7F1D1D', // Deep Red
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR for visitor:', err));
    }
  }, [currentTicket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !institutionOrCity.trim()) return;

    // Generate ticket number e.g. VIS-2026-0429
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newTicketNumber = `VIS-2026-${randomCode}`;

    const newVisitor: VisitorRegistration = {
      id: 'vis_' + Date.now(),
      ticketNumber: newTicketNumber,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      institutionOrCity: institutionOrCity.trim(),
      visitDate,
      purpose,
      paxCount: Number(paxCount) || 1,
      notes: notes.trim() || undefined,
      registeredAt: new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB',
      checkInStatus: false,
    };

    onAddVisitor(newVisitor);
    onSetActiveVisitor(newVisitor);
    setActiveTab('ticket');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-red-950 shadow-md">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Pendaftaran Visitor &amp; E-Tiket Kunjungan
                </h3>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  Akses Publik
                </span>
              </div>
              <p className="text-xs text-red-100">
                Dapatkan QR Code resmi untuk verifikasi masuk di gerbang perkemahan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition ${
              activeTab === 'form'
                ? 'border-red-700 text-red-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Formulir Pendaftaran</span>
          </button>

          <button
            onClick={() => setActiveTab('ticket')}
            disabled={!currentTicket}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition ${
              activeTab === 'ticket'
                ? 'border-red-700 text-red-700 bg-white rounded-t-xl'
                : !currentTicket
                ? 'border-transparent text-slate-400 cursor-not-allowed'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>
              E-Tiket QR Kunjungan {currentTicket ? `(${currentTicket.ticketNumber})` : ''}
            </span>
          </button>

          {visitors.length > 0 && (
            <div className="ml-auto flex items-center gap-1 py-1">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Pilih Tiket:</span>
              <select
                value={currentTicket?.ticketNumber || ''}
                onChange={(e) => {
                  const found = visitors.find((v) => v.ticketNumber === e.target.value);
                  if (found) {
                    onSetActiveVisitor(found);
                    setActiveTab('ticket');
                  }
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:border-red-600 focus:outline-none"
              >
                <option value="">-- Tiket Tersimpan ({visitors.length}) --</option>
                {visitors.map((v) => (
                  <option key={v.id} value={v.ticketNumber}>
                    {v.ticketNumber} - {v.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'form' ? (
            /* ================= FORMULIR PENDAFTARAN VISITOR ================= */
            <div className="space-y-4">
              {/* Highlight Guide Banner */}
              <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-bold shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-red-950">
                      Buku Tamu Digital &amp; Registrasi Pengunjung Perkemahan
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Pengunjung umum, orang tua/keluarga peserta, instansi pembina, maupun awak media diwajibkan mendaftar untuk memperoleh QR Code resmi. Petugas pos gerbang akan memindai QR Code untuk izin akses masuk area perkemahan.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Full Name */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Nama Lengkap Pengunjung <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Bpk. Suryadi / Ibu Ratna Dewi"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      No. WhatsApp / HP Aktif <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Email (Opsional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Institution & City */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Asal Instansi / Asal Kota / Hubungan <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={institutionOrCity}
                      onChange={(e) => setInstitutionOrCity(e.target.value)}
                      placeholder="Contoh: Orang Tua Peserta (SMPN 1 Cibubur) / Kwarcab Sleman / Warga Cibubur"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Purpose & Date & Pax */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Keperluan Kunjungan</label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                    >
                      <option value="Keluarga Peserta">Keluarga Peserta (Menjenguk)</option>
                      <option value="Kunjungan Dinas / Pramuka">Kunjungan Dinas / Pembina / Kwarcab</option>
                      <option value="Media & Liputan">Media &amp; Liputan Dokumentasi</option>
                      <option value="Masyarakat Umum">Masyarakat Umum (Pameran / Bazar)</option>
                      <option value="Lainnya">Keperluan Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Rencana Tanggal Kunjungan</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <select
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-2 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                      >
                        <option value="16 Sep 2026">16 Sep 2026 (Hari ke-1 - Pembukaan)</option>
                        <option value="17 Sep 2026">17 Sep 2026 (Hari ke-2 - Penjelajahan)</option>
                        <option value="18 Sep 2026">18 Sep 2026 (Hari ke-3 - Api Unggun)</option>
                        <option value="19 Sep 2026">19 Sep 2026 (Hari ke-4 - Penutupan)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Jumlah Rombongan (Pax)</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={paxCount}
                        onChange={(e) => setPaxCount(parseInt(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Catatan Tambahan (Nama adik/anak yang dijenguk atau instansi pengirim)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Menjenguk adik Farhan Ramadhan di Regu Rajawali tapak kemah barat."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-700 to-red-800 px-5 py-2.5 text-xs font-bold text-white hover:from-red-800 hover:to-red-900 shadow-md transition active:scale-95"
                  >
                    <span>Daftar &amp; Terbitkan QR Tiket</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= TIKET QR KUNJUNGAN VISITOR ================= */
            currentTicket && (
              <div className="space-y-4">
                {/* Print and Download Actions */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Tiket QR berhasil terbit dan tersimpan otomatis!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                    >
                      <Printer className="h-3.5 w-3.5 text-red-700" />
                      <span>Cetak / PDF</span>
                    </button>
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={`QR_Visitor_${currentTicket.ticketNumber}.png`}
                        className="flex items-center gap-1.5 rounded-xl bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh QR</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Printable Ticket Card Layout */}
                <div
                  id="printable-visitor-ticket"
                  className="mx-auto max-w-md overflow-hidden rounded-3xl border-2 border-red-700 bg-white shadow-xl"
                >
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 p-4 text-white text-center relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest text-amber-300">
                        Si-EPANG - JAMBORE
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight">
                      E-TIKET KUNJUNGAN PERKEMAHAN
                    </h3>
                    <p className="text-[11px] text-red-100">
                      Tanda Pengenal Tamu &amp; Pengunjung Resmi (Visitor Pass)
                    </p>
                  </div>

                  {/* Red/Yellow/Green Scout ribbon bar */}
                  <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-600" />

                  {/* Ticket Body with QR Code */}
                  <div className="p-5 text-center space-y-4">
                    {/* QR Display */}
                    <div className="mx-auto flex w-fit flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-300 bg-red-50/50 p-3 shadow-inner">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code Visitor"
                          className="h-48 w-48 object-contain rounded-xl bg-white p-2 shadow"
                        />
                      ) : (
                        <div className="flex h-48 w-48 items-center justify-center text-slate-400 text-xs">
                          Membuat QR Code...
                        </div>
                      )}
                      <div className="mt-2 text-center">
                        <span className="font-mono text-xs font-black tracking-wider text-red-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                          {currentTicket.ticketNumber}
                        </span>
                      </div>
                    </div>

                    {/* Visitor Details */}
                    <div className="rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Nama Pengunjung:</span>
                        <strong className="text-slate-900 text-sm font-black text-right">
                          {currentTicket.fullName}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Asal / Instansi:</span>
                        <span className="text-slate-800 font-semibold text-right max-w-[200px] truncate">
                          {currentTicket.institutionOrCity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Keperluan:</span>
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-900 text-right">
                          {currentTicket.purpose}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Tanggal Kunjungan:</span>
                        <span className="text-slate-800 font-bold">
                          {currentTicket.visitDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Jumlah Rombongan:</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {currentTicket.paxCount} Orang
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status Gerbang:</span>
                        {currentTicket.checkInStatus ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked In ({currentTicket.checkInTime})
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Menunggu Verifikasi Pos Masuk
                          </span>
                        )}
                      </div>

                      {currentTicket.notes && (
                        <div className="pt-1 text-[11px] text-slate-500 italic">
                          Catatan: &ldquo;{currentTicket.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Notice */}
                    <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                      Perlihatkan QR Code ini ke petugas keamanan di Pos Masuk Bumi Perkemahan Jambore. Harap mematuhi tata tertib perkemahan.
                    </div>
                  </div>
                </div>

                {/* Footer Switcher */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveTab('form')}
                    className="text-xs text-red-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>+ Daftarkan Pengunjung Lain</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
