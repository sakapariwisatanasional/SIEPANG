import React, { useState } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Shirt,
  Search,
  Radio,
  Bell,
  Sparkles,
  PlusCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  isAdmin?: boolean;
  onTriggerScheduleUpdate: (item: ScheduleItem, note: string) => void;
  onOpenBroadcastModal: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  isAdmin = false,
  onTriggerScheduleUpdate,
  onOpenBroadcastModal,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [updateNote, setUpdateNote] = useState('');

  const filteredSchedules = schedules.filter((item) => {
    const matchDay = selectedDay === 'all' || item.day === selectedDay;
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDay && matchCategory && matchSearch;
  });

  const categoryLabels: Record<ScheduleCategory, { label: string; color: string }> = {
    upacara: { label: 'Upacara', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    lomba: { label: 'Lomba & Ujian', color: 'bg-red-100 text-red-900 border-red-300' },
    survival: { label: 'Survival & Pioneering', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    malam_gembira: { label: 'Api Unggun & Seni', color: 'bg-orange-100 text-orange-900 border-orange-300' },
    keagamaan: { label: 'Keagamaan & Rohani', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    umum: { label: 'Umum & Logistik', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  };

  const handleOpenEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setUpdateNote(`Perubahan waktu/lokasi untuk agenda ${item.title}`);
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onTriggerScheduleUpdate(editingItem, updateNote);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Push Notification Broadcast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 p-4 sm:p-5 text-white shadow-md border border-red-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Sinkronisasi Jadwal Real-Time
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            Rundown &amp; Agenda Jambore Pramuka 2026
          </h3>
          <p className="text-xs text-red-100">
            Pembaruan jadwal terkoneksi live dengan server dan mengirimkan notifikasi instan ke perangkat mobile
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={onOpenBroadcastModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-xs font-black text-red-950 hover:bg-amber-300 transition shadow-lg shrink-0 active:scale-95"
          >
            <Radio className="h-4 w-4 animate-pulse text-red-950" />
            <span>Kirim Notifikasi Jadwal Baru</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-red-900/70 border border-red-700/50 px-3 py-2 text-xs font-semibold text-amber-200 shrink-0">
            <Bell className="h-4 w-4 text-amber-300" />
            <span>Notifikasi Perubahan Aktif</span>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-3">
        {/* Day selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedDay('all')}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition whitespace-nowrap ${
              selectedDay === 'all'
                ? 'bg-red-800 text-amber-200 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Hari
          </button>
          {[1, 2, 3, 4].map((dayNum) => (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition whitespace-nowrap ${
                selectedDay === dayNum
                  ? 'bg-red-800 text-amber-200 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hari {dayNum}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan, lokasi, atau nama PIC..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs focus:border-red-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-2.5 py-1.5 transition text-[11px] font-bold whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori
            </button>
            {Object.entries(categoryLabels).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`rounded-lg px-2.5 py-1.5 transition text-[11px] font-bold whitespace-nowrap ${
                  selectedCategory === key
                    ? 'bg-red-800 text-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-xs text-stone-500">
            Tidak ada kegiatan yang sesuai dengan filter atau pencarian Anda.
          </div>
        ) : (
          filteredSchedules.map((item) => {
            const catInfo = categoryLabels[item.category] || categoryLabels.umum;
            const isOngoing = item.status === 'ongoing';

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border bg-white p-4 transition shadow-sm hover:shadow-md ${
                  isOngoing
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : item.isLiveUpdated
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-stone-200'
                }`}
              >
                {/* Header row with badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${catInfo.color}`}
                    >
                      {catInfo.label}
                    </span>

                    {item.isLiveUpdated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300 animate-pulse">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        Pembaruan Terkini
                      </span>
                    )}

                    {isOngoing && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-stone-500">
                    {item.date}
                  </span>
                </div>

                {/* Main title & description */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1 text-[10px] font-bold text-red-800 hover:bg-red-100 hover:text-red-900 transition shrink-0"
                        title="Ubah Waktu/Lokasi & Siarkan Notifikasi"
                      >
                        Ubah / Siarkan
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Details Footer */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-stone-100 pt-2.5 text-[11px] text-stone-600">
                  <div className="flex items-center gap-1.5 font-medium text-stone-800">
                    <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>{item.time}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{item.pic}</span>
                  </div>
                </div>

                {item.dressCode && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1 text-[10px] text-stone-600">
                    <Shirt className="h-3 w-3 text-stone-500" />
                    <span>Pakaian: <strong>{item.dressCode}</strong></span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit & Broadcast Single Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">
              Ubah &amp; Siarkan Pembaruan Jadwal
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pembaruan akan otomatis mengirim push notifikasi dan memperbarui jadwal di perangkat peserta.
            </p>

            <form onSubmit={handleSaveUpdate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Judul Agenda</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Waktu</label>
                  <input
                    type="text"
                    value={editingItem.time}
                    onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="upcoming">Akan Datang</option>
                    <option value="ongoing">Sedang Berlangsung</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan / Ditunda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Lokasi</label>
                <input
                  type="text"
                  value={editingItem.location}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Pesan Notifikasi Push ke Peserta
                </label>
                <textarea
                  rows={2}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Ketik keterangan pengumuman perubahan..."
                  className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Simpan &amp; Siarkan Push
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
