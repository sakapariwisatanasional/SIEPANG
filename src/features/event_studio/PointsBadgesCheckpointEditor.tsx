/**
 * @license
 * SiEpang - Points (XP), Badge Builder & QR Checkpoint Studio
 * Configures XP rules, gamification badges, and builds scannable QR adventure checkpoints
 * with downloadable printable QR passes and scan counters.
 */

import React, { useState } from 'react';
import {
  Zap,
  Award,
  QrCode,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { eventStudioService } from '../../services/eventStudioService';
import { PointRuleConfig, BadgeConfig, QrCheckpoint } from '../../types';

export const PointsBadgesCheckpointEditor: React.FC = () => {
  const currentEvent = eventStudioService.getEvent();
  const [subTab, setSubTab] = useState<'rules' | 'badges' | 'checkpoints'>('rules');
  const [pointRules, setPointRules] = useState<PointRuleConfig[]>(eventStudioService.getPointRules());
  const [badges, setBadges] = useState<BadgeConfig[]>(eventStudioService.getBadges());
  const [checkpoints, setCheckpoints] = useState<QrCheckpoint[]>(eventStudioService.getCheckpoints());

  // Modal states
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [activePrintCheckpoint, setActivePrintCheckpoint] = useState<QrCheckpoint | null>(null);

  // New Rule form
  const [ruleForm, setRuleForm] = useState<Omit<PointRuleConfig, 'id'>>({
    name: '',
    xp: 10,
    category: 'activity',
    dailyLimit: 40,
    enabled: true,
    description: '',
  });

  // New Badge form
  const [badgeForm, setBadgeForm] = useState<Omit<BadgeConfig, 'id'>>({
    name: '',
    icon: 'Trophy',
    description: '',
    condition: 'Kumpulkan 200 XP dari giat kepramukaan',
    xpRequired: 200,
    status: 'active',
  });

  // New Checkpoint form
  const [chkForm, setChkForm] = useState<Omit<QrCheckpoint, 'id' | 'scanCount'>>({
    name: '',
    location: '',
    rewardXp: 15,
    activeHours: '08:00 - 16:00',
    qrCode: `CHK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    status: 'active',
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name) return;
    try {
      await eventStudioService.createPointRule(ruleForm);
      setPointRules([...eventStudioService.listPointRules()]);
      setShowRuleModal(false);
      showToast('⚡ Aturan perolehan XP berhasil ditambahkan!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeForm.name) return;
    try {
      await eventStudioService.createBadge(badgeForm);
      setBadges([...eventStudioService.listBadges()]);
      setShowBadgeModal(false);
      showToast('🎖 Lencana prestasi pramuka berhasil dibuat!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chkForm.name) return;
    try {
      await eventStudioService.createCheckpoint(chkForm);
      setCheckpoints([...eventStudioService.listCheckpoints()]);
      setShowCheckpointModal(false);
      showToast('📍 Pos QR Checkpoint berhasil dibuat!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleRegenerateQr = async (id: string) => {
    try {
      const newCode = await eventStudioService.regenerateCheckpointQr(id);
      setCheckpoints([...eventStudioService.listCheckpoints()]);
      showToast(`Kode QR diperbarui: ${newCode}`);
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleToggleRule = async (id: string, current: boolean) => {
    try {
      await eventStudioService.updatePointRule(id, { enabled: !current });
      setPointRules([...eventStudioService.listPointRules()]);
      showToast(`Aturan XP ${!current ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Gamifikasi: Aturan XP, Lencana & QR Checkpoint</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola sistem gamifikasi event, lencana kepramukaan, dan pos pemindaian QR penjelajahan buper.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {subTab === 'rules' && (
              <button
                onClick={() => setShowRuleModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Aturan XP</span>
              </button>
            )}
            {subTab === 'badges' && (
              <button
                onClick={() => setShowBadgeModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Buat Lencana</span>
              </button>
            )}
            {subTab === 'checkpoints' && (
              <button
                onClick={() => setShowCheckpointModal(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Pos QR Checkpoint</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#F7F7F8] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5">
          <button
            onClick={() => setSubTab('rules')}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'rules' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚡ Aturan XP ({pointRules.length})
          </button>
          <button
            onClick={() => setSubTab('badges')}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'badges' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🎖 Lencana Event ({badges.length})
          </button>
          <button
            onClick={() => setSubTab('checkpoints')}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'checkpoints' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📍 Pos QR Checkpoint ({checkpoints.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: XP RULES */}
      {subTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pointRules.map(r => (
            <div key={r.id} className="p-4 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-mono font-semibold">
                  {r.category}
                </span>
                <span className="font-mono text-sm font-black text-amber-500 dark:text-amber-400">+{r.xp} XP</span>
              </div>

              <h3 className="text-sm font-bold text-[#171717] dark:text-white">{r.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-[#ECECEF] dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                <span>Batas Harian: <strong className="text-slate-800 dark:text-white">{r.dailyLimit} XP/hari</strong></span>
                <button
                  type="button"
                  onClick={() => handleToggleRule(r.id, r.enabled)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    r.enabled ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-transparent' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {r.enabled ? 'Aktif ✓' : 'Nonaktif'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: BADGE BUILDER */}
      {subTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {badges.map(b => (
            <div key={b.id} className="p-4 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 flex items-start gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0 border border-amber-200 dark:border-amber-500/30">
                ⚜️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#171717] dark:text-white truncate">{b.name}</h3>
                  <span className="text-amber-500 dark:text-amber-400 text-xs font-mono font-bold">{b.xpRequired} XP</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.description}</p>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  Syarat: {b.condition}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: QR CHECKPOINT BUILDER */}
      {subTab === 'checkpoints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {checkpoints.map(chk => (
              <div key={chk.id} className="p-4 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200 dark:border-sky-500/30">
                    Pos Penjelajahan
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>+{chk.rewardXp} XP</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#171717] dark:text-white">{chk.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>{chk.location}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Kode QR Unik:</div>
                    <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{chk.qrCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Statistik Scan:</div>
                    <div className="font-bold text-[#171717] dark:text-white">{chk.scanCount} Pramuka</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#ECECEF] dark:border-white/5 text-xs">
                  <button
                    onClick={() => handleRegenerateQr(chk.id)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak QR</span>
                  </button>

                  <button
                    onClick={() => setActivePrintCheckpoint(chk)}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#171717] dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span>Cetak Lembar QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT CHECKPOINT MODAL */}
      {activePrintCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-2xl mx-auto shadow">
              ⚜️
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                {currentEvent?.organizer || currentEvent?.name || 'Gerakan Pramuka'}
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {activePrintCheckpoint.name}
              </h3>
              <p className="text-xs text-slate-600">Lokasi: {activePrintCheckpoint.location}</p>
            </div>

            {/* QR Card Canvas for Print */}
            <div className="p-4 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 w-48 h-48 mx-auto flex flex-col items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" />
              <div className="text-[10px] font-mono font-bold text-slate-700 mt-2">
                {activePrintCheckpoint.qrCode}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              ⚡ Reward: +{activePrintCheckpoint.rewardXp} XP Pramuka
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Buka aplikasi SiEpang di smartphone kamu, pilih menu SCAN, dan arahkan kamera ke kode QR ini.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActivePrintCheckpoint(null)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  alert(`Mencetak lembar QR resmi untuk: ${activePrintCheckpoint.name}`);
                  setActivePrintCheckpoint(null);
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171717] dark:text-white">+ Tambah Aturan Perolehan XP</h3>
              <button onClick={() => setShowRuleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nama Aturan:</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="Contoh: Kerja Bakti Kebersihan Tenda"
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white focus:border-amber-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Poin Reward (XP):</label>
                  <input
                    type="number"
                    value={ruleForm.xp}
                    onChange={e => setRuleForm({ ...ruleForm, xp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-amber-600 dark:text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Batas Harian (XP):</label>
                  <input
                    type="number"
                    value={ruleForm.dailyLimit}
                    onChange={e => setRuleForm({ ...ruleForm, dailyLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={ruleForm.description}
                  onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="Syarat perolehan poin..."
                  className="w-full px-3.5 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRuleModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-medium">Batal</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold">Simpan Aturan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHECKPOINT MODAL */}
      {showCheckpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171717] dark:text-white">+ Buat Pos QR Checkpoint Baru</h3>
              <button onClick={() => setShowCheckpointModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCheckpoint} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nama Pos Checkpoint:</label>
                <input
                  type="text"
                  value={chkForm.name}
                  onChange={e => setChkForm({ ...chkForm, name: e.target.value })}
                  placeholder="Contoh: Pos 6: Menara Pandang Selogiri"
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Lokasi Pos:</label>
                <input
                  type="text"
                  value={chkForm.location}
                  onChange={e => setChkForm({ ...chkForm, location: e.target.value })}
                  placeholder="Bukit Panorama Utara"
                  className="w-full px-3.5 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Reward Scan (XP):</label>
                  <input
                    type="number"
                    value={chkForm.rewardXp}
                    onChange={e => setChkForm({ ...chkForm, rewardXp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-amber-600 dark:text-amber-400 font-mono font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Jam Operasional:</label>
                  <input
                    type="text"
                    value={chkForm.activeHours}
                    onChange={e => setChkForm({ ...chkForm, activeHours: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCheckpointModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-medium">Batal</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold">Simpan Pos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
