/**
 * @license
 * SiEpang - First Bootstrap Screen
 * Dedicated one-time setup screen for initial deployment bootstrap.
 * Strictly separate from the Public Portal.
 * Verifies SIEPANG_BOOTSTRAP_TOKEN, initializes context, provisions superadmin scoutpreneur@gmail.com,
 * and activates OTP without needing a pre-existing login session.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, AlertCircle, RefreshCw, CheckCircle2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { bootstrapService } from '../../services/bootstrapService';

interface FirstBootstrapScreenProps {
  onComplete: (superadminEmail: string) => void;
  onNavigateToLogin: () => void;
}

export const FirstBootstrapScreen: React.FC<FirstBootstrapScreenProps> = ({
  onComplete,
  onNavigateToLogin,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyReady, setIsAlreadyReady] = useState(false);
  const [backendReachable, setBackendReachable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const status = await bootstrapService.getStatus();
        if (mounted) {
          setIsAlreadyReady(status.installation_ready);
          setBackendReachable(status.backend_reachable);
          setIsLoadingStatus(false);
        }
      } catch {
        if (mounted) {
          setIsLoadingStatus(false);
        }
      }
    };
    checkStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRunBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await bootstrapService.initialize(tokenInput.trim());
      if (res.success && res.data) {
        setSuccessResult(res.data);
      } else {
        setErrorMessage(
          res.error?.message ||
            'Token bootstrap tidak valid atau sistem telah selesai diinisialisasi.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menjalankan inisialisasi awal backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F8] dark:bg-[#0E0E12] text-[#171717] dark:text-slate-100 p-6 selection:bg-[#E1306C] selection:text-white">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45] flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20 text-white animate-pulse">
          ⚜️
        </div>
        <div className="mt-4 text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Memeriksa Status Backend SiEpang...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menghubungkan ke layanan Google Apps Script
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F7F8] dark:bg-[#0E0E12] text-[#171717] dark:text-slate-100 p-4 sm:p-6 selection:bg-[#E1306C] selection:text-white">
      <div className="w-full max-w-lg mx-auto my-auto space-y-6 bg-white dark:bg-[#141418] p-6 sm:p-8 rounded-[32px] border border-[#ECECEF] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45] flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-pink-500/20 text-white">
            ⚜️
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-white tracking-tight font-display">
              Inisialisasi Awal SiEpang
            </h1>
            <p className="text-xs text-[#E1306C] font-bold">
              First Bootstrap · Sistem Informasi Perkemahan Pramuka
            </p>
          </div>
        </div>

        {/* State A: Installation already complete */}
        {isAlreadyReady && !successResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Instalasi SiEpang Telah Selesai</span>
              </div>
              <p className="leading-relaxed">
                Inisialisasi awal backend telah berhasil dilakukan sebelumnya. Endpoint token bootstrap telah dinonaktifkan secara otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <span>Menuju Halaman Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State B: Success from running bootstrap */}
        {successResult && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Bootstrap Berhasil Dijalankan!</span>
              </div>
              <div className="space-y-1.5 text-[11px] bg-white/70 dark:bg-black/30 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Superadmin:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {successResult.superadmin?.email || 'scoutpreneur@gmail.com'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Peran:</span>
                  <span className="font-bold">superadmin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status Akun:</span>
                  <span className="font-bold text-emerald-600">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Layanan OTP:</span>
                  <span className="font-bold text-emerald-600">AKTIF</span>
                </div>
              </div>
              <p className="leading-relaxed text-[11px]">
                Setup secret telah dinonaktifkan secara otomatis. Anda sekarang dapat masuk menggunakan akun superadmin resmi dengan kode verifikasi OTP.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onComplete(successResult.superadmin?.email || 'scoutpreneur@gmail.com')}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <span>Lanjut Masuk sebagai Superadmin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State C: Normal unbootstrapped form */}
        {!isAlreadyReady && !successResult && (
          <form onSubmit={handleRunBootstrap} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Otorisasi Inisialisasi Satu Kali</span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Masukkan setup secret satu kali (<strong>SIEPANG_BOOTSTRAP_TOKEN</strong>) dari Script Properties Google Apps Script backend. Token ini hanya berlaku satu kali untuk inisialisasi awal.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                One-Time Bootstrap Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  autoFocus
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="boot_xxxxxxxxxxxxxxxx"
                  className="w-full pl-4 pr-11 py-3 bg-[#F7F7F8] dark:bg-black/20 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-sm font-mono text-[#171717] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#E1306C]"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Tersimpan di Script Properties Google Apps Script (Project Settings)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !tokenInput.trim()}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menginisialisasi Sistem...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Jalankan Inisialisasi Awal</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
