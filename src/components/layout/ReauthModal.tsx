/**
 * @license
 * SiEpang - Production Online Reauthentication Modal
 * Catches session expiration and presents a friendly reauthentication screen
 * without discarding unsaved form data.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { onlineSessionService } from '../../services/onlineSessionService';
import { authService } from '../../services/authService';

export const ReauthModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(onlineSessionService.getIsReauthModalOpen());
  const [session, setSession] = useState(onlineSessionService.getSession());
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsub = onlineSessionService.subscribe(() => {
      setIsOpen(onlineSessionService.getIsReauthModalOpen());
      setSession(onlineSessionService.getSession());
    });
    return () => unsub();
  }, []);

  const currentUser = authService.getCurrentUser();
  if (!isOpen || !currentUser) return null;

  const handleReauth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Simulate backend re-authentication
    setTimeout(() => {
      const success = onlineSessionService.reauthenticate(currentUser.email);
      setIsSubmitting(false);
      if (!success) {
        setErrorMsg('Gagal memperbarui sesi. Silakan coba lagi.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 relative">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-2xl shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-[#171717] dark:text-white tracking-tight">
            Sesi Cloud SiEpang Telah Berakhir
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
            Untuk menjaga keamanan data kepramukaan, silakan konfirmasi kembali akun Anda.
          </p>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/8 flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-xl object-cover border border-[#ECECEF] dark:border-white/10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#171717] dark:text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
            {currentUser.role}
          </span>
        </div>

        {/* Unsaved Draft Protection Notice */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
          <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#171717] dark:text-white">Draft Formulir Tersimpan Aman</span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
              Seluruh isian formulir yang belum sempat Anda simpan telah diamankan di penyimpanan lokal. Anda dapat langsung melanjutkan setelah masuk kembali.
            </p>
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Action */}
        <form onSubmit={handleReauth} className="space-y-3">
          <div>
            <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Kata Sandi / Verifikasi Cepat Akun
            </label>
            <input
              type="password"
              placeholder="Masukkan kata sandi atau klik Lanjutkan"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 bg-[#FAFAFA] dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-xs text-[#171717] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memperbarui Sesi...</span>
              </>
            ) : (
              <>
                <span>Masuk Kembali & Lanjutkan Sesi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer options */}
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => {
              onlineSessionService.setReauthModalOpen(false);
            }}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            Batal (Kembali ke Halaman Masuk)
          </button>
        </div>
      </div>
    </div>
  );
};
