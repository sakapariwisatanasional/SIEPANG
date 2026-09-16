import React, { useState } from 'react';
import { Leader } from '../types';
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  QrCode,
  Plus,
  X,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building,
} from 'lucide-react';

interface LeadersListProps {
  leaders: Leader[];
  isAdmin?: boolean;
  onSelectLeaderForID: (l: Leader) => void;
  onUpdateLeader: (l: Leader) => void;
  onAddLeader: (l: Leader) => void;
}

export const LeadersList: React.FC<LeadersListProps> = ({
  leaders,
  isAdmin = false,
  onSelectLeaderForID,
  onUpdateLeader,
  onAddLeader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New leader form
  const [fullName, setFullName] = useState('');
  const [pangkalan, setPangkalan] = useState('');
  const [kwarcab, setKwarcab] = useState('Kwarcab Kota Bandung');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Pembina Pendamping Putra (Bindamping Pa)');
  const [assignedReguInput, setAssignedReguInput] = useState('Regu Rajawali');

  const filtered = leaders.filter((l) => {
    return (
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.regId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pangkalan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.kwarcab.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleToggleCheckIn = (l: Leader) => {
    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const updated: Leader = {
      ...l,
      checkInStatus: !l.checkInStatus,
      checkInTime: !l.checkInStatus ? nowStr : undefined,
    };
    onUpdateLeader(updated);
  };

  const handleCreateLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !pangkalan.trim() || !phone.trim()) return;

    const nextNumber = leaders.length + 1;
    const regId = `JAM-B-${String(nextNumber).padStart(3, '0')}`;

    const reguList = assignedReguInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const newLeader: Leader = {
      id: 'l_' + Date.now(),
      regId,
      fullName: fullName.trim(),
      pangkalan: pangkalan.trim(),
      kwarcab: kwarcab.trim(),
      phone: phone.trim(),
      email: email.trim() || 'pembina@pramuka.or.id',
      assignedRegu: reguList.length > 0 ? reguList : ['Regu Umum'],
      role: role.trim(),
      checkInStatus: false,
      photoUrl:
        role.includes('Putri') || role.includes('Pi')
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    };

    onAddLeader(newLeader);
    setShowAddModal(false);

    // Reset form
    setFullName('');
    setPangkalan('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 p-4 sm:p-5 text-white shadow-md border border-red-900/30">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Data Pembina Pendamping (Bindamping)
          </h3>
          <p className="text-xs text-red-100">
            Daftar pembina resmi pendamping kontingen &amp; pangkalan Gugus Depan
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pembina</span>
          </button>
        ) : (
          <div className="text-xs text-amber-200 bg-red-900/60 px-3 py-1.5 rounded-xl border border-red-700/50">
            Total Bindamping: {leaders.length} Pembina
          </div>
        )}
      </div>

      {/* Search Filter */}
      <div className="rounded-2xl bg-white p-3 shadow-sm border border-stone-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pembina, jabatan, pangkalan, atau nomor kontak..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-4 py-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Leaders List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-500">
            Tidak ada pembina yang cocok dengan pencarian Anda.
          </div>
        ) : (
          filtered.map((leader) => {
            const cleanPhone = leader.phone.replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.startsWith('0')
              ? '62' + cleanPhone.slice(1)
              : cleanPhone;

            return (
              <div
                key={leader.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg">
                      {leader.regId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        leader.checkInStatus
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {leader.checkInStatus ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Hadir di Lokasi
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-amber-600" />
                          Belum Check-In
                        </>
                      )}
                    </span>
                  </div>

                  {/* Leader identity */}
                  <div className="mt-3 flex gap-3">
                    <img
                      src={
                        leader.photoUrl ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={leader.fullName}
                      className="h-16 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                        {leader.fullName}
                      </h4>
                      <p className="text-[11px] font-semibold text-amber-900 truncate">
                        {leader.role}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{leader.pangkalan}</p>
                      <p className="text-[10px] text-stone-400 truncate">{leader.kwarcab}</p>
                    </div>
                  </div>

                  {/* Assigned regu tags */}
                  <div className="mt-3">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">
                      Regu Binaan / Pendampingan:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {leader.assignedRegu.map((r, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700 border border-stone-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-2.5 gap-2">
                  <a
                    href={`https://wa.me/${waNumber}?text=Salam%20Pramuka%20Kak%20${encodeURIComponent(
                      leader.fullName
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                    title="Kirim Pesan WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => onSelectLeaderForID(leader)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition"
                  >
                    <QrCode className="h-3.5 w-3.5 text-amber-800" />
                    <span>ID Card &amp; QR</span>
                  </button>

                  <button
                    onClick={() => handleToggleCheckIn(leader)}
                    className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      leader.checkInStatus
                        ? 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-700'
                        : 'bg-amber-800 text-white hover:bg-amber-900'
                    }`}
                  >
                    {leader.checkInStatus ? 'Batal' : 'Hadir'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Leader Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Tambah Pembina Pendamping
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeader} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Kak Wahyu Hidayat, S.Pd."
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Pangkalan (Sekolah/Gudep)</label>
                  <input
                    type="text"
                    required
                    value={pangkalan}
                    onChange={(e) => setPangkalan(e.target.value)}
                    placeholder="Contoh: SMPN 1 Merdeka"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Jabatan / Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Pembina Pendamping Putra (Bindamping Pa)">Bindamping Putra (Pa)</option>
                    <option value="Pembina Pendamping Putri (Bindamping Pi)">Bindamping Putri (Pi)</option>
                    <option value="Pimpinan Kontingen Cabang (Pinkoncab)">Pimpinan Kontingen (Pinkoncab)</option>
                    <option value="Tenaga Medis / Kesehatan Kontingen">Tenaga Medis Kontingen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pembina@email.com"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Regu yang Didampingi (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={assignedReguInput}
                  onChange={(e) => setAssignedReguInput(e.target.value)}
                  placeholder="Contoh: Regu Rajawali, Regu Elang"
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900"
                >
                  Simpan Pembina Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
