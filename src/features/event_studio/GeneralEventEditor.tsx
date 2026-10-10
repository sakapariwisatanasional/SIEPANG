/**
 * @license
 * SiEpang - General Event Settings Editor
 * Allows authorized admins to configure event identity, dates, organizational level,
 * capacity, venue, status, and contacts without spreadsheet edits.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  Layers,
  Phone,
  Save,
  ShieldAlert,
  Info,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { eventStudioService } from '../../services/eventStudioService';
import { EventCategory, EventStatus, OrganizationalLevel, ParticipationScope, Organization } from '../../types';
import { CascadingOrgSelector } from './CascadingOrgSelector';

export const GeneralEventEditor: React.FC = () => {
  const event = eventStudioService.getEvent();
  const [isSaving, setIsSaving] = useState(false);
  const [allOrgs, setAllOrgs] = useState<Organization[]>(eventStudioService.listOrganizations());
  const [orgSearch, setOrgSearch] = useState('');
  const [formData, setFormData] = useState({
    name: event.name,
    shortName: event.shortName,
    eventCode: event.eventCode || '',
    category: event.category,
    organizationalLevel: event.organizationalLevel || ('Kwarran' as OrganizationalLevel),
    organizer: event.organizer || '',
    description: event.description || '',
    theme: event.theme,
    startDate: event.startDate,
    endDate: event.endDate,
    registrationStart: event.registrationStart || '',
    registrationEnd: event.registrationEnd || '',
    location: event.location,
    venue: event.venue || '',
    campGround: event.campGround,
    participantCapacity: event.participantCapacity || 1500,
    status: event.status || ('ONGOING' as EventStatus),
    participation_scope: (event.participation_scope || 'CHILD_ORGANIZATIONS') as ParticipationScope,
    allowed_organization_ids: event.allowed_organization_ids || ['org_kwarran_glagah', 'org_kwarran_rogojampi', 'org_kwarran_genteng', 'org_kwarran_banyuwangi'],
    logoUrl: event.logoUrl || '',
    bannerUrl: event.bannerUrl || '',
    contacts: {
      medical: event.contacts?.medical || '0812-3456-7891 (Posko Medis)',
      security: event.contacts?.security || '0812-3456-7892 (Pos Keamanan)',
      info: event.contacts?.info || '0812-3456-7893 (Pusat Informasi)',
      emergency: event.contacts?.emergency || '0811-999-112 (Piket Darurat)',
      helpdesk: event.contacts?.helpdesk || '0812-3456-7894 (Sekretariat)',
    },
  });

  const [saveState, setSaveState] = useState(eventStudioService.getSaveState());

  useEffect(() => {
    const unsub = eventStudioService.subscribe(() => {
      setSaveState(eventStudioService.getSaveState());
    });
    return () => {
      unsub();
    };
  }, []);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const statusOptions: { value: EventStatus; label: string; color: string; desc: string }[] = [
    { value: 'DRAFT', label: 'DRAFT', color: 'bg-slate-700 text-slate-200 border-slate-600', desc: 'Penyusunan awal panitia, belum dapat diakses peserta' },
    { value: 'REGISTRATION', label: 'REGISTRASI', color: 'bg-sky-950 text-sky-300 border-sky-500/50', desc: 'Pendaftaran kontingen dan peserta dibuka' },
    { value: 'UPCOMING', label: 'AKAN DATANG', color: 'bg-amber-950 text-amber-300 border-amber-500/50', desc: 'Verifikasi berkas selesai, menunggu hari-H buper' },
    { value: 'ONGOING', label: 'SEDANG BERJALAN', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/50', desc: 'Kemah aktif, operasional presensi, lomba & voting' },
    { value: 'COMPLETED', label: 'SELESAI', color: 'bg-purple-950 text-purple-300 border-purple-500/50', desc: 'Kegiatan usai, piagam dan pelaporan dapat diunduh' },
    { value: 'ARCHIVED', label: 'DIARSIPKAN', color: 'bg-stone-900 text-stone-400 border-stone-700', desc: 'Arsip resmi kwartir, akses baca-saja' },
  ];

  const handleFieldChange = (updates: Partial<typeof formData>) => {
    const next = { ...formData, ...updates };
    setFormData(next);
    eventStudioService.markDirty(next);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await eventStudioService.updateGeneralSettings(formData);
      setToast({ msg: '✅ Pengaturan umum event berhasil disimpan ke cloud database!', type: 'success' });
    } catch (err: any) {
      setToast({ msg: `❌ Gagal menyimpan: ${err.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {toast && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
          toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
        }`}>
          <span>{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {/* 1. Status Lifecycle Selector */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F47743]" />
              <span>Status Operasional Event</span>
            </h2>
            <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              Menentukan hak akses sistem dan alur kegiatan kepramukaan saat ini.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider bg-pink-50 text-[#F47743] border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800">
            {formData.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {statusOptions.map(st => (
            <button
              key={st.value}
              type="button"
              onClick={() => setFormData({ ...formData, status: st.value })}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                formData.status === st.value
                  ? `${st.color} font-bold ring-2 ring-[#E1306C]/40 scale-102 shadow-xs`
                  : 'bg-[#FAFAFA] border-[#ECECEF] text-[#6B7280] hover:bg-gray-100 dark:bg-white/5 dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-black">{st.label}</div>
              <div className="text-[9px] opacity-75 mt-1 leading-tight line-clamp-2">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Core Identity Fields */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#F47743]" />
          <span>Identitas & Tingkat Organisasi</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Nama Resmi Event Perkemahan:</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white font-medium focus:border-[#F47743] focus:outline-none"
              placeholder="Contoh: Jambore Ranting / Cabang 2026"
              required
            />
          </div>

          <div>
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Nama Pendek / Singkatan:</label>
            <input
              type="text"
              value={formData.shortName}
              onChange={e => setFormData({ ...formData, shortName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white font-medium focus:border-[#F47743] focus:outline-none"
              placeholder="Contoh: Jamcab BWI 2026"
              required
            />
          </div>

          <div>
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Kode Unik Event (ID Pas Digital):</label>
            <input
              type="text"
              value={formData.eventCode}
              onChange={e => setFormData({ ...formData, eventCode: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#F47743] font-mono font-bold focus:border-[#F47743] focus:outline-none"
              placeholder="JC-BWI-2026"
              required
            />
          </div>

          <div>
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Kategori / Jenis Perkemahan:</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-[#F47743] focus:outline-none"
            >
              <option value="Jambore">Jambore (Penggalang)</option>
              <option value="Raimuna">Raimuna (Penegak/Pandega)</option>
              <option value="Lomba Tingkat">Lomba Tingkat (LT-I s.d. LT-V)</option>
              <option value="Perkemahan Wirakarya">Perkemahan Wirakarya / Bakti</option>
              <option value="Persami">Persami (Sabtu Minggu)</option>
              <option value="Kemah Bakti">Kemah Bakti Saka</option>
            </select>
          </div>

          <div className="sm:col-span-2 pt-2">
            <CascadingOrgSelector
              currentLevel={formData.organizationalLevel as any}
              currentOrganizer={formData.organizer}
              onSelect={data => {
                setFormData(prev => ({
                  ...prev,
                  organizationalLevel: data.level,
                  organizer: data.organizer,
                }));
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Tema Resmi Perkemahan:</label>
            <input
              type="text"
              value={formData.theme}
              onChange={e => setFormData({ ...formData, theme: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-amber-700 dark:text-amber-300 font-medium italic focus:border-[#F47743] focus:outline-none"
              placeholder="Pramuka Tangguh, Berkarakter & Melek Digital Menuju Generasi Emas"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[#171717] dark:text-slate-300 font-semibold block mb-1.5">Deskripsi Lengkap Kegiatan:</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-[#F47743] focus:outline-none"
              placeholder="Jelaskan tujuan, sasaran peserta, dan keunikan kegiatan perkemahan ini..."
            />
          </div>
        </div>
      </div>

      {/* 2b. Participation Scope & Hierarchical Selection (Section 5 Requirement) */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F47743]" />
            <span>Cakupan Partisipasi & Organisasi Kepramukaan (Participation Scope)</span>
          </h2>
          <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">
            Tentukan hierarki kwartir dan pangkalan yang berhak mendaftarkan kontingen atau peserta ke perkemahan ini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {[
            {
              id: 'OWN_ORGANIZATION' as ParticipationScope,
              label: 'Organisasi Sendiri',
              desc: 'Hanya internal kwartir atau pangkalan gudep penyelenggara.',
            },
            {
              id: 'CHILD_ORGANIZATIONS' as ParticipationScope,
              label: 'Seluruh Kwartir Anak',
              desc: 'Semua kwartir/gudep di bawah naungan (misal: semua Kwarran se-Kwarcab).',
            },
            {
              id: 'SELECTED_ORGANIZATIONS' as ParticipationScope,
              label: 'Kwartir Terpilih',
              desc: 'Hanya kwartir/ranting yang dipilih secara spesifik oleh panitia.',
            },
            {
              id: 'OPEN_INVITATION' as ParticipationScope,
              label: 'Undangan Terbuka',
              desc: 'Terbuka untuk kwartir dan gugus depan dari luar daerah / nasional.',
            },
            {
              id: 'CUSTOM' as ParticipationScope,
              label: 'Kustom / Khusus',
              desc: 'Kombinasi khusus saka, pandega, atau wilayah tertentu.',
            },
          ].map(scope => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setFormData({ ...formData, participation_scope: scope.id })}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                formData.participation_scope === scope.id
                  ? 'bg-pink-50 border-[#F47743] text-[#F47743] font-bold shadow-xs dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800'
                  : 'bg-[#FAFAFA] border-[#ECECEF] text-[#6B7280] hover:bg-gray-100 hover:text-[#171717] dark:bg-white/5 dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs">{scope.label}</span>
                {formData.participation_scope === scope.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F47743] shrink-0" />
                )}
              </div>
              <span className="text-[10px] font-normal opacity-75 leading-tight">{scope.desc}</span>
            </button>
          ))}
        </div>

        {/* Hierarchical Selection Box */}
        {(formData.participation_scope === 'CHILD_ORGANIZATIONS' ||
          formData.participation_scope === 'SELECTED_ORGANIZATIONS' ||
          formData.participation_scope === 'CUSTOM') && (
          <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-semibold text-[#171717] dark:text-slate-300 flex items-center gap-1.5">
                <span>Daftar Organisasi / Kwartir yang Memenuhi Syarat:</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[#F47743] border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 font-mono text-[10px]">
                  {formData.allowed_organization_ids.length} Dipilih
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = allOrgs.map(o => o.organization_id);
                    setFormData({ ...formData, allowed_organization_ids: allIds });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#F47743] border border-pink-200 text-[10px] font-bold cursor-pointer"
                >
                  Pilih Semua ({allOrgs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, allowed_organization_ids: [] })}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-[#6B7280] dark:text-slate-400 text-[10px] border border-[#ECECEF] dark:border-white/10 cursor-pointer"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari nama kwartir ranting, pangkalan, atau kode organisasi..."
              value={orgSearch}
              onChange={e => setOrgSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#F47743]"
            />

            {/* List with Toggle Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {allOrgs
                .filter(o =>
                  orgSearch
                    ? o.organization_name.toLowerCase().includes(orgSearch.toLowerCase()) ||
                      o.organization_code.toLowerCase().includes(orgSearch.toLowerCase())
                    : true
                )
                .map(org => {
                  const isChecked = formData.allowed_organization_ids.includes(org.organization_id);
                  return (
                    <label
                      key={org.organization_id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-pink-50/70 border-pink-200 text-[#171717] dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-200'
                          : 'bg-white border-[#ECECEF] text-[#6B7280] hover:text-[#171717] dark:bg-white/5 dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const nextIds = e.target.checked
                              ? [...formData.allowed_organization_ids, org.organization_id]
                              : formData.allowed_organization_ids.filter(id => id !== org.organization_id);
                            setFormData({ ...formData, allowed_organization_ids: nextIds });
                          }}
                          className="accent-[#F47743] rounded"
                        />
                        <div className="truncate">
                          <div className="font-semibold text-xs truncate">{org.organization_name}</div>
                          <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">
                            {org.organization_code} · {org.organization_level}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 2c. Branding Media (Logo & Banner) */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Identitas Visual & Media Promosi (Logo & Banner)</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Terapkan logo resmi kwartir dan banner perkemahan untuk portal peserta dan kartu pengenal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Logo Input & Preview */}
          <div className="space-y-2">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">URL Logo Resmi Event:</label>
            <input
              type="text"
              value={formData.logoUrl}
              onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white font-mono text-xs focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              placeholder="https://..."
            />
            <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 flex items-center gap-3">
              <img
                src={formData.logoUrl}
                alt="Logo Event Preview"
                className="w-12 h-12 rounded-xl object-cover border border-[#ECECEF] dark:border-white/10 bg-white dark:bg-black/50"
              />
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Pratinjau Logo</span>
                <p>Tampil pada header aplikasi, kartu pengenal, dan piagam.</p>
              </div>
            </div>
          </div>

          {/* Banner Input & Preview */}
          <div className="space-y-2">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">URL Banner / Spanduk Kegiatan:</label>
            <input
              type="text"
              value={formData.bannerUrl}
              onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white font-mono text-xs focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              placeholder="https://..."
            />
            <div className="h-20 rounded-2xl overflow-hidden border border-[#ECECEF] dark:border-white/10 relative bg-slate-100 dark:bg-black/40">
              <img
                src={formData.bannerUrl}
                alt="Banner Event Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-2 text-[10px] text-white font-bold">
                Pratinjau Banner Beranda
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dates & Capacity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Jadwal Waktu & Kuota Peserta</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Mulai Kemah:</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Selesai Kemah:</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Buka Pendaftaran:</label>
            <input
              type="date"
              value={formData.registrationStart}
              onChange={e => setFormData({ ...formData, registrationStart: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Tutup Pendaftaran:</label>
            <input
              type="date"
              value={formData.registrationEnd}
              onChange={e => setFormData({ ...formData, registrationEnd: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Kapasitas Maksimal Peserta:</label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="50000"
                value={formData.participantCapacity}
                onChange={e => setFormData({ ...formData, participantCapacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white font-mono focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-400 dark:text-slate-500 text-xs">Orang</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Bumi Perkemahan / Venue:</label>
            <input
              type="text"
              value={formData.campGround}
              onChange={e => setFormData({ ...formData, campGround: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-2xl text-[#171717] dark:text-white focus:border-emerald-500 focus:bg-white dark:focus:bg-black/60 focus:outline-none"
              placeholder="Contoh: Bumi Perkemahan Utama"
            />
          </div>
        </div>
      </div>

      {/* 4. Important Contacts */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-500" />
          <span>Kontak Darurat & Helpdesk Panitia</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Posko Medis / Kesehatan:</label>
            <input
              type="text"
              value={formData.contacts.medical}
              onChange={e => setFormData({ ...formData, contacts: { ...formData.contacts, medical: e.target.value } })}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Pos Keamanan Buper:</label>
            <input
              type="text"
              value={formData.contacts.security}
              onChange={e => setFormData({ ...formData, contacts: { ...formData.contacts, security: e.target.value } })}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Pusat Informasi:</label>
            <input
              type="text"
              value={formData.contacts.info}
              onChange={e => setFormData({ ...formData, contacts: { ...formData.contacts, info: e.target.value } })}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Piket Darurat 24 Jam:</label>
            <input
              type="text"
              value={formData.contacts.emergency}
              onChange={e => setFormData({ ...formData, contacts: { ...formData.contacts, emergency: e.target.value } })}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-rose-600 dark:text-rose-400 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Helpdesk Kontingen / Sekretariat:</label>
            <input
              type="text"
              value={formData.contacts.helpdesk}
              onChange={e => setFormData({ ...formData, contacts: { ...formData.contacts, helpdesk: e.target.value } })}
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            saveState.status === 'Saving…'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/40 animate-pulse'
              : saveState.status === 'Save Failed'
              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40'
              : saveState.status === 'Unsaved Changes'
              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
          }`}>
            {saveState.status === 'Saving…' ? (
              <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            ) : saveState.status === 'Save Failed' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            ) : saveState.status === 'Unsaved Changes' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>
              {saveState.status === 'Saving…' && 'Saving…'}
              {saveState.status === 'Save Failed' && 'Save Failed'}
              {saveState.status === 'Unsaved Changes' && 'Unsaved Changes'}
              {saveState.status === 'Saved ✓' && `Saved ✓ (${saveState.lastSaved || 'Tersimpan'})`}
            </span>
          </div>

          {saveState.status === 'Save Failed' && (
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan ke Backend…' : 'Simpan Pengaturan Umum Event'}</span>
        </button>
      </div>
    </form>
  );
};
