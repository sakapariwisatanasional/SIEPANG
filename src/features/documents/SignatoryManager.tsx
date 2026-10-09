/**
 * @license
 * SiEpang - Signatories & Officials Management Component (Requirements 141 - 149)
 * Manage organizational officials, titles, signature assets, and official stamps.
 * Stored securely in customer Google Drive (/SiEpang/Documents/Signatures/).
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Upload,
  ShieldCheck,
  FileSignature,
  Building,
} from 'lucide-react';
import { Signatory } from '../../types';
import { documentStudioService } from '../../services/documentStudioService';

export const SignatoryManager: React.FC = () => {
  const [signatories, setSignatories] = useState<Signatory[]>(documentStudioService.getSignatories());
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSignatory, setEditingSignatory] = useState<Partial<Signatory> | null>(null);

  const handleOpenAdd = () => {
    setEditingSignatory({
      fullName: '',
      positionTitle: '',
      organizationName: '',
      nta: '',
      signatureUrl: '',
      stampUrl: '',
      status: 'ACTIVE',
      roleType: 'CHAIRPERSON',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sig: Signatory) => {
    setEditingSignatory({ ...sig });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSignatory?.fullName || !editingSignatory?.positionTitle) return;

    documentStudioService.saveSignatory(editingSignatory);
    setSignatories(documentStudioService.getSignatories());
    setShowModal(false);
    setEditingSignatory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data pejabat penandatangan ini?')) {
      documentStudioService.deleteSignatory(id);
      setSignatories(documentStudioService.getSignatories());
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Pejabat & Penandatangan Resmi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola data nama pejabat, jabatan, file tanda tangan, dan stempel kwartir untuk disematkan pada Piagam & Sertifikat.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pejabat</span>
        </button>
      </div>

      {/* Signatories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signatories.map(sig => (
          <div
            key={sig.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sig.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sig.status === 'ACTIVE' ? '✓ Aktif' : 'Nonaktif'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{sig.fullName}</h3>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{sig.positionTitle}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sig)}
                    className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Ubah Data Pejabat"
                    aria-label="Ubah Data Pejabat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sig.id)}
                    className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Hapus Data Pejabat"
                    aria-label="Hapus Data Pejabat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{sig.organizationName}</span>
              </div>

              {sig.nta && (
                <div className="text-[10px] font-mono text-slate-400">
                  NTA: {sig.nta}
                </div>
              )}

              {/* Signature & Stamp preview box */}
              <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-around gap-2">
                <div className="text-center space-y-1">
                  <div className="text-[9px] text-slate-400 font-medium">Tanda Tangan</div>
                  <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shadow-xs">
                    <img src={sig.signatureUrl} alt="TTD" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-[9px] text-slate-400 font-medium">Stempel Kwarran</div>
                  <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shadow-xs">
                    <img src={sig.stampUrl} alt="Stempel" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-2 border-t border-black/5 dark:border-white/5 flex justify-between">
              <span>Drive: /SiEpang/Documents/Signatures/</span>
              <span>Urutan: #{sig.displayOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {showModal && editingSignatory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-6 space-y-4 shadow-2xl text-[#171717] dark:text-white"
          >
            <div className="flex items-center justify-between border-b border-[#ECECEF] dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold tracking-tight">
                {editingSignatory.id ? 'Ubah Data Pejabat' : 'Tambah Pejabat Penandatangan'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] dark:text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap dan Gelar"
                  value={editingSignatory.fullName || ''}
                  onChange={e => setEditingSignatory({ ...editingSignatory, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Jabatan / Posisi Resmi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ketua Kwartir / Pimpinan Perkemahan"
                  value={editingSignatory.positionTitle || ''}
                  onChange={e => setEditingSignatory({ ...editingSignatory, positionTitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Instansi / Lembaga
                  </label>
                  <input
                    type="text"
                    value={editingSignatory.organizationName || ''}
                    onChange={e => setEditingSignatory({ ...editingSignatory, organizationName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    NTA (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="09.22.01.0001"
                    value={editingSignatory.nta || ''}
                    onChange={e => setEditingSignatory({ ...editingSignatory, nta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  URL / Aset Tanda Tangan (PNG Transparan)
                </label>
                <input
                  type="text"
                  value={editingSignatory.signatureUrl || ''}
                  onChange={e => setEditingSignatory({ ...editingSignatory, signatureUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  URL / Aset Stempel Kwarran (PNG Transparan)
                </label>
                <input
                  type="text"
                  value={editingSignatory.stampUrl || ''}
                  onChange={e => setEditingSignatory({ ...editingSignatory, stampUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Simpan Pejabat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
