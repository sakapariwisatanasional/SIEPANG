/**
 * @license
 * SiEpang - Custom Information Pages & Emergency Contacts Builder
 * Allows admins to publish event information pages (Camp rules, emergency protocols,
 * prayer schedules, FAQ) and configure emergency action cards.
 */

import React, { useState } from 'react';
import {
  FileText,
  Phone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { eventStudioService } from '../../services/eventStudioService';
import { CustomInfoPage } from '../../types';

export const CustomPagesAndContacts: React.FC = () => {
  const [pages, setPages] = useState<CustomInfoPage[]>(eventStudioService.getCustomPages());
  const [selectedPage, setSelectedPage] = useState<CustomInfoPage | null>(pages[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const event = eventStudioService.getEvent();

  const [pageForm, setPageForm] = useState<Omit<CustomInfoPage, 'id'>>({
    title: '',
    category: 'rules',
    content: '',
    icon: '📜',
    published: true,
    order: pages.length + 1,
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.title) return;
    try {
      const created = await eventStudioService.createEventPage(pageForm);
      setPages([...eventStudioService.listEventPages()]);
      setSelectedPage(created);
      setShowAddModal(false);
      showToast('📄 Halaman informasi resmi berhasil diterbitkan!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Hapus halaman informasi ini?')) {
      try {
        eventStudioService.deleteCustomPage(id);
        const remaining = eventStudioService.listEventPages();
        setPages([...remaining]);
        setSelectedPage(remaining[0] || null);
        showToast('Halaman informasi telah dihapus.');
      } catch (err: any) {
        showToast(`❌ Gagal: ${err.message}`);
      }
    }
  };

  const handleTogglePublish = async (p: CustomInfoPage) => {
    try {
      await eventStudioService.updateEventPage(p.id, { published: !p.published });
      setPages([...eventStudioService.listEventPages()]);
      showToast(`Halaman ${!p.published ? 'dipublikasikan' : 'ditarik ke draf'}.`);
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

      {/* 1. Quick Emergency Contact Cards Preview */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-500" />
          <span>Kartu Aksi Cepat Kontak Darurat (Tampilan Peserta)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Format kartu aksi cepat satu ketukan untuk panggilan darurat di buper:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-center space-y-1">
            <div className="text-xl">🚑</div>
            <div className="text-xs font-black text-rose-700 dark:text-rose-300">Posko Medis</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{event.contacts.medical}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-center space-y-1">
            <div className="text-xl">🛡️</div>
            <div className="text-xs font-black text-sky-700 dark:text-sky-300">Keamanan Buper</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{event.contacts.security}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-center space-y-1">
            <div className="text-xl">ℹ️</div>
            <div className="text-xs font-black text-amber-700 dark:text-amber-300">Pusat Informasi</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{event.contacts.info}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
            <div className="text-xl">🤝</div>
            <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">Helpdesk Kontingen</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{event.contacts.helpdesk}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 text-center space-y-1">
            <div className="text-xl">🚨</div>
            <div className="text-xs font-black text-red-700 dark:text-red-300">Piket Darurat 24 Jam</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{event.contacts.emergency}</div>
          </div>
        </div>
      </div>

      {/* 2. Custom Pages Studio */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Halaman Informasi Resmi & Panduan Teknis Buper</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola dokumen tata tertib, jadwal ibadah, panduan evakuasi darurat, dan FAQ.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Buat Halaman Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* List of Pages */}
          <div className="space-y-2">
            {pages.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPage(p)}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  selectedPage?.id === p.id
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-xs'
                    : 'bg-[#FAFAFA] dark:bg-white/5 border-[#ECECEF] dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{p.icon}</span>
                  <div className="min-w-0">
                    <h3 className={`text-xs font-bold truncate ${selectedPage?.id === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#171717] dark:text-white'}`}>
                      {p.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{p.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    p.published ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {p.published ? 'Tayang' : 'Draf'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Page Reader & Editor Preview */}
          <div className="lg:col-span-2 p-5 rounded-[24px] bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 space-y-4">
            {selectedPage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#ECECEF] dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedPage.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-[#171717] dark:text-white">{selectedPage.title}</h3>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                        Kategori: {selectedPage.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(selectedPage)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        selectedPage.published
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {selectedPage.published ? 'Tarik ke Draf' : 'Publikasikan'}
                    </button>
                    <button
                      onClick={() => handleDeletePage(selectedPage.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer"
                      title="Hapus Halaman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-white/5 p-4 rounded-2xl border border-[#ECECEF] dark:border-white/5">
                  {selectedPage.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Pilih halaman di sebelah kiri untuk membaca atau mengedit.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD PAGE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171717] dark:text-white">+ Buat Halaman Informasi Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Judul Halaman:</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={e => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="Contoh: Ketentuan Memasak & Pengambilan Kayu Bakar"
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kategori:</label>
                  <select
                    value={pageForm.category}
                    onChange={e => {
                      const cat = e.target.value as any;
                      let icon = '📄';
                      if (cat === 'rules') icon = '📜';
                      else if (cat === 'emergency') icon = '🚨';
                      else if (cat === 'prayer') icon = '🕌';
                      else if (cat === 'guidelines') icon = '📋';
                      else if (cat === 'faq') icon = '❓';
                      else if (cat === 'facilities') icon = '🏥';
                      setPageForm({ ...pageForm, category: cat, icon });
                    }}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white"
                  >
                    <option value="rules">📜 Tata Tertib & Aturan</option>
                    <option value="emergency">🚨 Keadaan Darurat & Evakuasi</option>
                    <option value="prayer">🕌 Jadwal Sholat & Ibadah</option>
                    <option value="guidelines">📋 Petunjuk Teknis Giat</option>
                    <option value="faq">❓ Tanya Jawab (FAQ)</option>
                    <option value="facilities">🏥 Informasi Fasilitas Buper</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Ikon Tampilan:</label>
                  <input
                    type="text"
                    value={pageForm.icon}
                    onChange={e => setPageForm({ ...pageForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Isi Konten Informasi:</label>
                <textarea
                  rows={6}
                  value={pageForm.content}
                  onChange={e => setPageForm({ ...pageForm, content: e.target.value })}
                  placeholder="Tuliskan butir-butir aturan, panduan, atau petunjuk operasional di sini..."
                  className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">Terbitkan Halaman</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
