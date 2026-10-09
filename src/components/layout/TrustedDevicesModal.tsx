/**
 * @license
 * SiEpang - Trusted Device & Security Management Modal (Parts 21 & 22)
 * Allows users to inspect active trusted devices, see current device badges,
 * revoke specific devices, and terminate all remote sessions.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Laptop, Smartphone, Monitor, Trash2, LogOut, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { TrustedDeviceRecord } from '../../types';

interface TrustedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrustedDevicesModal: React.FC<TrustedDevicesModalProps> = ({ isOpen, onClose }) => {
  const [devices, setDevices] = useState<TrustedDeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await authService.listTrustedDevices();
      setDevices(list);
    } catch {
      setError('Gagal memuat daftar perangkat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDevice = authService.getOrCreateDevicePayload();

  const handleRevoke = async (devicePublicId: string) => {
    if (!confirm('Apakah Anda yakin ingin mencabut akses perangkat ini? Sesi login pada perangkat tersebut akan langsung ditutup.')) {
      return;
    }

    setRevokingId(devicePublicId);
    setError(null);
    const res = await authService.revokeDevice(devicePublicId);
    setRevokingId(null);

    if (res.success) {
      setSuccessMsg('Akses perangkat berhasil dicabut.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadDevices();
    } else {
      setError(res.error || 'Gagal mencabut akses perangkat.');
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Anda akan keluar dari semua perangkat termasuk perangkat ini. Lanjutkan?')) {
      return;
    }
    await authService.logoutAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141418] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Keamanan & Perangkat Terpercaya
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola perangkat yang memiliki sesi login aktif tanpa meminta OTP ulang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Daftar Perangkat Aktif ({devices.filter(d => d.status === 'active').length})
            </div>

            {isLoading && devices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Memuat daftar perangkat...
              </div>
            ) : devices.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 text-center text-xs text-slate-500">
                <Laptop className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <span>Perangkat ini adalah perangkat terpercaya pertama Anda.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map(device => {
                  const isCurrent = device.device_public_id === currentDevice.device_public_id;
                  const isMobile = device.platform === 'Android' || device.platform === 'iOS';

                  return (
                    <div
                      key={device.trusted_device_id || device.device_public_id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-800/40'
                          : device.status === 'revoked'
                          ? 'bg-slate-50/50 dark:bg-white/2 opacity-60 border-slate-200 dark:border-white/5'
                          : 'bg-white dark:bg-[#18181D] border-slate-200/70 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {device.device_name || `${device.browser_family} · ${device.platform}`}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shrink-0">
                                Perangkat ini
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {device.status === 'revoked' ? 'Dicabut' : 'Aktif'}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                              {device.device_public_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {device.status !== 'revoked' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(device.device_public_id)}
                          disabled={revokingId === device.device_public_id}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                          title="Cabut akses perangkat ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cabut</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#101014] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLogoutAll}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Semua Perangkat</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
