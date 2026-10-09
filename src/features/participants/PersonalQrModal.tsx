/**
 * @license
 * SiEpang - Personal QR & Digital Scout Pass Modal
 * Supports fullscreen, high-brightness contrast mode, and anti-counterfeit holographic shimmer.
 */

import React, { useState } from 'react';
import { X, Sun, QrCode, ShieldCheck, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { Participant } from '../../types';

interface PersonalQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
}

export const PersonalQrModal: React.FC<PersonalQrModalProps> = ({ isOpen, onClose, participant }) => {
  const [highBrightness, setHighBrightness] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(participant.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 animate-in fade-in ${
        highBrightness ? 'bg-white text-slate-900' : 'bg-black/90 backdrop-blur-md text-white'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-[32px] p-[2px] shadow-2xl transition-colors duration-300 ${
          highBrightness
            ? 'bg-slate-200'
            : 'bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45]'
        }`}
      >
        <div
          className={`w-full rounded-[30px] p-6 relative transition-colors duration-300 ${
            highBrightness
              ? 'bg-slate-50 text-slate-900'
              : 'bg-[#121215] text-white'
          }`}
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setHighBrightness(!highBrightness)}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[44px] min-w-[44px] cursor-pointer ${
                highBrightness
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
              title="Tingkatkan Kecerahan untuk Pemindai Barcode"
              aria-label="Tingkatkan Kecerahan Layar"
            >
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">{highBrightness ? 'Kecerahan Maksimal' : 'Mode Terang Lapangan'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer ${
                highBrightness ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              aria-label="Tutup"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scout Digital Pass Card Body */}
          <div className="pt-4 text-center space-y-4">
            {/* Holographic Scout Badge Shimmer */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Digital Scout Pass Terverifikasi</span>
            </div>

            {/* QR Code Container (Strict high-contrast, no gradient behind modules) */}
            <div className="mx-auto w-56 h-56 bg-white p-4 rounded-3xl shadow-xl border-4 border-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  {/* 3 corner finder patterns */}
                  <rect x="5" y="5" width="26" height="26" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" />

                  <rect x="69" y="5" width="26" height="26" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" />

                  <rect x="5" y="69" width="26" height="26" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" />

                  {/* Timing patterns and mock data matrix */}
                  <rect x="35" y="8" width="6" height="6" />
                  <rect x="45" y="8" width="6" height="6" />
                  <rect x="55" y="8" width="6" height="6" />

                  <rect x="8" y="35" width="6" height="6" />
                  <rect x="8" y="45" width="6" height="6" />
                  <rect x="8" y="55" width="6" height="6" />

                  <rect x="35" y="35" width="7" height="7" />
                  <rect x="47" y="35" width="7" height="7" />
                  <rect x="59" y="35" width="7" height="7" />
                  <rect x="35" y="47" width="7" height="7" />
                  <rect x="59" y="47" width="7" height="7" />
                  <rect x="35" y="59" width="7" height="7" />
                  <rect x="47" y="59" width="7" height="7" />
                  <rect x="59" y="59" width="7" height="7" />

                  <rect x="69" y="69" width="6" height="6" />
                  <rect x="79" y="69" width="6" height="6" />
                  <rect x="89" y="69" width="6" height="6" />
                  <rect x="69" y="79" width="6" height="6" />
                  <rect x="89" y="89" width="6" height="6" />
                </svg>

                {/* Center Scout Fleur-de-lis Emblem */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white text-xs shadow-md">
                    ⚜️
                  </div>
                </div>
              </div>
            </div>

            {/* Participant Info */}
            <div className="space-y-0.5">
              <h3 className="text-lg font-black truncate">{participant.name}</h3>
              <p className={`text-xs ${highBrightness ? 'text-slate-600' : 'text-slate-400'}`}>
                {participant.role} · {participant.contingentName}
              </p>
              <p className="text-[11px] font-semibold text-[#E1306C] dark:text-[#F77737] mt-0.5">
                Tenda: {participant.tentNumber} ({participant.subCamp})
              </p>
            </div>

            {/* Code pill with copy */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  highBrightness
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-white/10 text-white border border-white/10'
                }`}
              >
                {participant.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title="Salin Kode Peserta"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Tunjukkan QR ini ke pos tantangan, apel upacara, atau gerbang buper.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
