import React, { useState } from 'react';
import { PushNotification } from '../types';
import { soundEffects } from '../utils/audioNotify';
import {
  Bell,
  X,
  Radio,
  CheckCheck,
  Trash2,
  Calendar,
  AlertTriangle,
  Info,
  ShieldCheck,
  Volume2,
  Send,
  Sparkles,
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: PushNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onBroadcastNotification: (notif: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onBroadcastNotification,
  onClose,
}) => {
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<PushNotification['type']>('jadwal');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const requestBrowserPush = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setBrowserPermission(res);
      if (res === 'granted') {
        new Notification('Jambore Pramuka', {
          body: 'Notifikasi push browser aktif! Anda akan menerima update jadwal secara real-time.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    onBroadcastNotification({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      highlight: true,
    });

    // Native push if allowed
    if (browserPermission === 'granted' && 'Notification' in window) {
      try {
        new Notification(newTitle.trim(), {
          body: newMessage.trim(),
        });
      } catch {
        // ignore
      }
    }

    setNewTitle('');
    setNewMessage('');
    setShowBroadcastForm(false);
  };

  const getIconForType = (type: PushNotification['type']) => {
    switch (type) {
      case 'jadwal':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'darurat':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'presensi':
        return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-950/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-red-950 shadow font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Pusat Notifikasi &amp; Siaran Jadwal</h3>
              <p className="text-xs text-red-100">Pembaruan jadwal &amp; pengumuman darurat perkemahan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBroadcastForm(!showBroadcastForm)}
              className="flex items-center gap-1.5 rounded-xl bg-red-800 px-3 py-1.5 font-bold text-amber-200 shadow-sm hover:bg-red-900 transition"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span>{showBroadcastForm ? 'Tutup Form' : 'Kirim Siaran Baru'}</span>
            </button>

            {browserPermission !== 'granted' && 'Notification' in window && (
              <button
                onClick={requestBrowserPush}
                className="flex items-center gap-1 rounded-xl border border-amber-400 bg-amber-50 px-2.5 py-1.5 font-bold text-red-950 hover:bg-amber-100 transition"
                title="Aktifkan notifikasi sistem browser"
              >
                <span>Aktifkan Push Browser</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <button
              onClick={() => soundEffects.playNotificationChime()}
              className="flex items-center gap-1 hover:text-red-900 font-medium"
              title="Cek Bunyi Lonceng Notifikasi"
            >
              <Volume2 className="h-3.5 w-3.5 text-red-700" />
              <span>Tes Nada</span>
            </button>
            <span>•</span>
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 hover:text-emerald-900 font-medium"
              title="Tandai Semua Dibaca"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Baca Semua</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Form Broadcast New Notification */}
          {showBroadcastForm && (
            <form
              onSubmit={handleBroadcast}
              className="rounded-2xl border-2 border-red-800/30 bg-red-50/30 p-4 space-y-3 text-xs animate-scaleUp"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-red-700" />
                  Siarkan Notifikasi Jadwal / Pengumuman Real-time
                </span>
                <span className="text-[10px] text-red-900 font-black bg-amber-300/80 px-2 py-0.5 rounded-full">
                  Semua Peserta
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipe Siaran</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs focus:border-red-700 focus:outline-none"
                >
                  <option value="jadwal">Pembaruan Jadwal Kegiatan</option>
                  <option value="pengumuman">Pengumuman Umum Perkemahan</option>
                  <option value="darurat">Peringatan Darurat / Cuaca</option>
                  <option value="presensi">Panggilan Verifikasi / Presensi Pos</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Notifikasi</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: 📢 Jadwal Api Unggun Dimajukan 15 Menit"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pesan Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik isi pengumuman atau instruksi untuk seluruh regu dan pangkalan..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs focus:border-red-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBroadcastForm(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-1.5 text-xs font-bold text-amber-200 hover:bg-red-900 shadow transition"
                >
                  <Send className="h-3 w-3 text-amber-400" />
                  <span>Kirim Siaran Sekarang</span>
                </button>
              </div>
            </form>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-xs text-stone-500">
              Tidak ada notifikasi saat ini.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-2xl border p-3.5 transition space-y-1 ${
                  !notif.isRead
                    ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100">
                      {getIconForType(notif.type)}
                    </div>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                      {notif.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-stone-600 pl-9 leading-relaxed">{notif.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-4 py-2.5 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            Notifikasi Push Real-time Jambore
          </span>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="h-3 w-3" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
