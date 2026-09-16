import React, { useState } from 'react';
import { Participant } from '../types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  QrCode,
  Download,
  Plus,
  X,
  Phone,
  Tent,
  UserCheck,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { exportToCSV } from '../services/gasSyncService';

interface ParticipantsListProps {
  participants: Participant[];
  isAdmin?: boolean;
  onSelectParticipantForID: (p: Participant) => void;
  onUpdateParticipant: (p: Participant) => void;
  onAddParticipant: (p: Participant) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  isAdmin = false,
  onSelectParticipantForID,
  onUpdateParticipant,
  onAddParticipant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Putra' | 'Putri'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [reguFilter, setReguFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New participant state
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [pangkalan, setPangkalan] = useState('');
  const [kwarcab, setKwarcab] = useState('Kwarcab Kota Bandung');
  const [regu, setRegu] = useState('Regu Rajawali');
  const [gender, setGender] = useState<'Putra' | 'Putri'>('Putra');
  const [bloodType, setBloodType] = useState('O');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [campTenda, setCampTenda] = useState('Tenda Sektor Barat');

  // Extract unique regu list
  const uniqueRegus = Array.from(new Set(participants.map((p) => p.regu))).sort();

  const filtered = participants.filter((p) => {
    const matchSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pangkalan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kwarcab.toLowerCase().includes(searchQuery.toLowerCase());

    const matchGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'checked_in' && p.checkInStatus) ||
      (statusFilter === 'pending' && !p.checkInStatus);
    const matchRegu = reguFilter === 'all' || p.regu === reguFilter;

    return matchSearch && matchGender && matchStatus && matchRegu;
  });

  const checkedInCount = participants.filter((p) => p.checkInStatus).length;
  const pendingCount = participants.length - checkedInCount;

  const handleExportCSV = () => {
    exportToCSV(participants, 'Data_Peserta_Jambore_Pramuka_2026');
  };

  const handleToggleCheckIn = (p: Participant) => {
    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const updated: Participant = {
      ...p,
      checkInStatus: !p.checkInStatus,
      checkInTime: !p.checkInStatus ? nowStr : undefined,
    };
    onUpdateParticipant(updated);
  };

  const handleCreateParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !pangkalan.trim()) return;

    const nextNumber = participants.length + 1;
    const regId = `JAM-P-${String(nextNumber).padStart(3, '0')}`;

    const newP: Participant = {
      id: 'p_' + Date.now(),
      regId,
      fullName: fullName.trim(),
      nickname: nickname.trim() || fullName.trim().split(' ')[0],
      pangkalan: pangkalan.trim(),
      kwarcab: kwarcab.trim(),
      kwarda: 'Kwarda Jawa Barat',
      regu: regu.trim(),
      gender,
      bloodType,
      emergencyContact: {
        name: emergencyName.trim() || 'Orang Tua Peserta',
        relation: 'Orang Tua',
        phone: emergencyPhone.trim() || '08123456789',
      },
      checkInStatus: false,
      campTenda,
      photoUrl:
        gender === 'Putra'
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    };

    onAddParticipant(newP);
    setShowAddModal(false);

    // Reset form
    setFullName('');
    setNickname('');
    setPangkalan('');
    setEmergencyPhone('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Total Peserta</span>
          <p className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5">{participants.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase">Sudah Check-In</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{checkedInCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-800 uppercase">Belum Hadir</span>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Data Ekspor</span>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              title="Download CSV untuk Google Sheets"
            >
              <Download className="h-3 w-3" />
              <span>Ekspor CSV</span>
            </button>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-red-800 py-1.5 text-xs font-bold text-amber-200 hover:bg-red-900 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Peserta</span>
            </button>
          ) : (
            <div className="mt-1 text-[11px] text-slate-400 italic">
              Akses Tambah: Khusus Panitia
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-stone-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, ID reg, pangkalan gudep, atau regu..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-4 py-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Quick Filter dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Semua Gender</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="checked_in">Sudah Check-In</option>
              <option value="pending">Belum Check-In</option>
            </select>

            <select
              value={reguFilter}
              onChange={(e) => setReguFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Semua Regu</option>
              {uniqueRegus.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-500">
            Tidak ada peserta yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                p.checkInStatus ? 'border-stone-200' : 'border-amber-200 bg-amber-50/10'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg">
                    {p.regId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      p.checkInStatus
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.checkInStatus ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Check-In
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-amber-600" />
                        Belum Hadir
                      </>
                    )}
                  </span>
                </div>

                {/* Identity info */}
                <div className="mt-3 flex gap-3">
                  <img
                    src={
                      p.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={p.fullName}
                    className="h-16 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate leading-snug">
                      {p.fullName}
                    </h4>
                    <p className="text-[11px] font-medium text-amber-900 truncate">{p.regu}</p>
                    <p className="text-[11px] text-stone-500 truncate">{p.pangkalan}</p>
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-stone-400">
                      <span>{p.gender}</span>
                      <span>•</span>
                      <span>Gol. Darah {p.bloodType}</span>
                    </div>
                  </div>
                </div>

                {p.campTenda && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-stone-600 bg-stone-50 rounded-lg px-2 py-1">
                    <Tent className="h-3 w-3 text-amber-700" />
                    <span className="truncate">{p.campTenda}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-2.5 gap-2">
                <button
                  onClick={() => onSelectParticipantForID(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition"
                  title="Lihat ID Card Pramuka & QR"
                >
                  <QrCode className="h-3.5 w-3.5 text-amber-800" />
                  <span>Lihat ID Card</span>
                </button>

                <button
                  onClick={() => handleToggleCheckIn(p)}
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    p.checkInStatus
                      ? 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title={p.checkInStatus ? 'Batalkan Presensi' : 'Check-In Manual'}
                >
                  {p.checkInStatus ? 'Batal' : 'Check-In'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Tambah Data Peserta Jambore
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateParticipant} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzan"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Contoh: Fauzan"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
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
                  <label className="font-semibold text-stone-700 block mb-1">Nama Regu</label>
                  <input
                    type="text"
                    required
                    value={regu}
                    onChange={(e) => setRegu(e.target.value)}
                    placeholder="Contoh: Regu Rajawali"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Gol. Darah</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Lokasi Tenda</label>
                  <input
                    type="text"
                    value={campTenda}
                    onChange={(e) => setCampTenda(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Kontak Darurat</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Nama Orang Tua / Wali"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nomor HP/WA Darurat</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none font-mono"
                  />
                </div>
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
                  Simpan Peserta Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
