/**
 * @license
 * SiEpang - Single-Event Installation Architecture Notice Modal
 * In a single-event installation: 1 Installation = 1 Kegiatan.
 * Second event or workspace creation is prevented with clear guidance.
 */

import React from 'react';
import { workspaceService } from '../../services/workspaceService';
import { eventService } from '../../services/eventService';

interface WorkspaceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedOrgId?: string;
}

export const WorkspaceWizardModal: React.FC<WorkspaceWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentWs = workspaceService.getCurrentWorkspace();
  const currentEvt = eventService.getCurrentEvent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl border border-amber-200/50">
          ⚜️
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-[#171717] dark:text-white">
            1 Instalasi = 1 Kegiatan
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
            Instalasi SiEpang ini terikat pada satu kegiatan. Buat instalasi SiEpang baru untuk kegiatan lainnya.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 text-left text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="font-bold text-slate-900 dark:text-white">Identitas Instalasi Ini:</div>
          <div>• Workspace: <strong>{currentWs.name}</strong></div>
          <div>• Event Aktif: <strong>{currentEvt.name}</strong></div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            Untuk kegiatan tahun berikutnya atau kegiatan tingkat lainnya, deploy instalasi Google Apps Script SiEpang mandiri baru.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-2xl text-xs font-bold transition-all cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
