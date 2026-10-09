/**
 * @license
 * SiEpang - Campsite & Facility Visual Management
 * Visual campsite management with interactive map preview, flexible hierarchy
 * (Sub Camp -> Zone -> Block -> Lot), lot occupancy tracking, gender allocation,
 * contingent assignment, and buper facilities catalog.
 */

import React, { useState } from 'react';
import {
  Tent,
  MapPin,
  Users,
  Compass,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Shield,
  Eye,
} from 'lucide-react';
import { eventStudioService } from '../../services/eventStudioService';
import { CampsiteLot, CampFacility, FacilityCategory, Contingent } from '../../types';
import { participantService } from '../../services/participantService';

export const CampsiteManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'lots' | 'assignment' | 'facilities'>('map');
  const [lots, setLots] = useState<CampsiteLot[]>(eventStudioService.getCampsiteLots());
  const [facilities, setFacilities] = useState<CampFacility[]>(eventStudioService.getFacilities());
  const [selectedLot, setSelectedLot] = useState<CampsiteLot | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<CampFacility | null>(null);

  // Auto-Assign Wizard state (Requirement 17)
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [autoAssignRule, setAutoAssignRule] = useState({
    respectGender: true,
    fitCapacity: true,
    sameDistrictProximity: true,
  });
  const [suggestedAssignments, setSuggestedAssignments] = useState<
    Array<{ contingent: Contingent; lot: CampsiteLot; reason: string }>
  >([]);

  // Assignment search filter (Requirement 16)
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // Modal state
  const [showAddLotModal, setShowAddLotModal] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);

  const contingents = participantService.getContingents();

  const [lotForm, setLotForm] = useState<Omit<CampsiteLot, 'id'>>({
    subCamp: 'Sektor Utama',
    zone: 'Zona A (Putra)',
    block: 'Blok A-01',
    lotNumber: 'Kavling 01',
    capacity: 32,
    gender: 'male',
    contingentId: '',
    contingentName: '',
    status: 'available',
    coordinates: { x: 30, y: 50 },
    notes: '',
  });

  const [facilityForm, setFacilityForm] = useState<Omit<CampFacility, 'id'>>({
    name: '',
    category: 'toilet',
    description: '',
    location: 'Sektor Lapangan',
    openingHours: '24 Jam',
    status: 'active',
    coordinates: { x: 50, y: 50 },
    icon: '🚻',
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const selCont = contingents.find(c => c.id === lotForm.contingentId);
    try {
      await eventStudioService.createLot({
        ...lotForm,
        contingentName: selCont ? selCont.name : undefined,
      });
      setLots([...eventStudioService.listLots()]);
      setShowAddLotModal(false);
      showToast('✅ Kavling tenda baru berhasil ditambahkan!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.name) return;
    try {
      await eventStudioService.createFacility(facilityForm);
      setFacilities([...eventStudioService.listFacilities()]);
      setShowAddFacilityModal(false);
      showToast('✅ Fasilitas perkemahan berhasil didaftarkan!');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleDeleteLot = async (id: string) => {
    if (confirm('Hapus kavling tenda ini?')) {
      try {
        eventStudioService.deleteCampsiteLot(id);
        setLots([...eventStudioService.listLots()]);
        setSelectedLot(null);
        showToast('Kavling telah dihapus.');
      } catch (err: any) {
        showToast(`❌ Gagal: ${err.message}`);
      }
    }
  };

  const handleAssignContingent = async (lotId: string, contingentId: string) => {
    try {
      const c = contingents.find(x => x.id === contingentId);
      const cName = c ? c.name : '';
      const updated = await eventStudioService.assignContingentToLot(lotId, contingentId, cName);
      setLots([...eventStudioService.listLots()]);
      setSelectedLot(updated);
      showToast(contingentId ? `✅ Alokasi kavling untuk '${cName}' berhasil disimpan!` : 'Alokasi kontingen dibatalkan.');
    } catch (err: any) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  // ==================== AUTO-ASSIGN WIZARD (Requirement 17) ====================
  const handleGenerateAutoAssignSuggestions = () => {
    const unassigned = contingents.filter(c => !lots.some(l => l.contingentId === c.id));
    const availableLots = lots.filter(l => !l.contingentId && l.status !== 'occupied');

    const suggestions: Array<{ contingent: Contingent; lot: CampsiteLot; reason: string }> = [];
    const usedLotIds = new Set<string>();

    unassigned.forEach(c => {
      const match = availableLots.find(l => {
        if (usedLotIds.has(l.id)) return false;
        if (autoAssignRule.fitCapacity && l.capacity < (c.quota || 32)) return false;
        return true;
      });

      if (match) {
        usedLotIds.add(match.id);
        suggestions.push({
          contingent: c,
          lot: match,
          reason: `Kapasitas lot (${match.capacity}) sesuai kuota kontingen (${c.quota || 32}) di ${match.zone || match.block}`,
        });
      }
    });

    setSuggestedAssignments(suggestions);
  };

  const handleApplyAutoAssign = async () => {
    if (suggestedAssignments.length === 0) return;
    for (const item of suggestedAssignments) {
      await eventStudioService.assignContingentToLot(item.lot.id, item.contingent.id, item.contingent.name);
    }
    setLots([...eventStudioService.listLots()]);
    setShowAutoAssignModal(false);
    showToast(`✅ ${suggestedAssignments.length} kontingen berhasil dialokasikan otomatis ke kavling!`);
  };

  const handleResetAllAssignments = async () => {
    if (!confirm('Batalkan seluruh penetapan kavling kontingen? Semua kavling akan kembali berstatus tersedia.')) return;
    for (const lot of lots) {
      if (lot.contingentId) {
        await eventStudioService.assignContingentToLot(lot.id, '', '');
      }
    }
    setLots([...eventStudioService.listLots()]);
    showToast('Seluruh penetapan kavling buper berhasil di-reset.');
  };

  const totalCapacity = lots.reduce((sum, l) => sum + l.capacity, 0);
  const occupiedCount = lots.filter(l => l.status === 'occupied').length;
  const assignedPopulation = lots.filter(l => l.contingentId).reduce((sum, l) => sum + (l.capacity || 0), 0);
  const remainingCapacity = totalCapacity - assignedPopulation;
  const isOverflow = remainingCapacity < 0;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Overflow Warning Banner */}
      {isOverflow && (
        <div className="p-4 rounded-3xl bg-rose-950/40 border-2 border-rose-500/40 flex items-start justify-between gap-3 text-xs text-rose-200 shadow-xl">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-white text-sm">
                Peringatan: Populasi Kontingen Melebihi Daya Tampung Buper ({Math.abs(remainingCapacity)} Peserta Melebihi Kuota)
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Total populasi kontingen yang terdaftar ({assignedPopulation}) melampaui kapasitas kavling tenda ({totalCapacity}).
                Perlu penambahan blok kavling baru atau izin override khusus administrator.
              </p>
            </div>
          </div>
          <button
            onClick={() => showToast('🛡️ Override kapasitas disetujui & dicatat dalam Log Audit Enterprise.')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[11px] shrink-0"
          >
            Override Panitia
          </button>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#171717] dark:text-white tracking-tight flex items-center gap-2">
              <Tent className="w-4 h-4 text-emerald-500" />
              <span>Manajemen Tata Ruang Bumi Perkemahan (Campsite)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola hierarki Sub Camp, Zona, Blok, Kavling Tenda, serta titik fasilitas umum buper.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddLotModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Kavling Tenda</span>
            </button>
            <button
              onClick={() => setShowAddFacilityModal(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#ECECEF] dark:border-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Fasilitas</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total Kapasitas Buper</div>
            <div className="text-base font-black text-[#171717] dark:text-white mt-0.5 font-mono">{totalCapacity} Kuota</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Populasi Terisi</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{assignedPopulation} Peserta</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Sisa Kuota / Overflow</div>
            <div className={`text-base font-black mt-0.5 font-mono ${isOverflow ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isOverflow ? `Overflow +${Math.abs(remainingCapacity)}` : `${remainingCapacity} Sisa`}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5">
            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Kavling & Fasilitas</div>
            <div className="text-base font-black text-sky-600 dark:text-sky-400 mt-0.5 font-mono">{lots.length} Lot · {facilities.length} Faskes</div>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex flex-wrap p-1 rounded-2xl bg-[#F7F7F8] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5 gap-1">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'map' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🗺️ Peta Interaktif Buper
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lots' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⛺ Daftar Kavling & Kontingen
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex-1 min-w-[140px] py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'assignment' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📋 Papan Alokasi ({contingents.filter(c => !lots.some(l => l.contingentId === c.id)).length} Belum)
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'facilities' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏥 Katalog Fasilitas Buper
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE 2D CAMPSITE MAP PREVIEW */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Peta Skematis Bumi Perkemahan Selogiri (Klik pin untuk detail):
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Putra</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Putri</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Fasilitas</span>
              </div>
            </div>

            {/* Simulated 2D Map Canvas */}
            <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl bg-gradient-to-b from-[#0c2415] via-[#091e12] to-[#06140b] border-2 border-emerald-500/30 overflow-hidden shadow-2xl p-4 select-none">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

              {/* Geographic Landmarks */}
              <div className="absolute top-4 left-6 text-[10px] uppercase font-mono tracking-widest text-emerald-400/40">
                ▲ Lereng Gunung Kalipuro (Utara)
              </div>
              <div className="absolute bottom-4 left-6 text-[10px] uppercase font-mono tracking-widest text-emerald-400/40">
                ▼ Gerbang Masuk & Jalan Raya Selogiri (Selatan)
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/10 pointer-events-none" />

              {/* Central Campfire Ring Visual */}
              <div className="absolute top-[55%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-amber-400/30 bg-amber-500/10 flex items-center justify-center text-xs pointer-events-none">
                <span className="text-base animate-pulse">🔥</span>
              </div>

              {/* Facilities Pins */}
              {facilities.map(fac => (
                <button
                  key={fac.id}
                  onClick={() => { setSelectedFacility(fac); setSelectedLot(null); }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg transition-transform hover:scale-125 z-20 ${
                    selectedFacility?.id === fac.id ? 'ring-2 ring-white scale-125 bg-amber-500 text-slate-950' : 'bg-black/60 border border-amber-400/40 text-white'
                  }`}
                  style={{ left: `${fac.coordinates.x}%`, top: `${fac.coordinates.y}%` }}
                  title={`${fac.name} (${fac.category})`}
                >
                  {fac.icon}
                </button>
              ))}

              {/* Campsite Lots Pins */}
              {lots.map(lot => (
                <button
                  key={lot.id}
                  onClick={() => { setSelectedLot(lot); setSelectedFacility(null); }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-xl text-[10px] font-bold shadow-lg transition-transform hover:scale-115 flex items-center gap-1 z-10 ${
                    selectedLot?.id === lot.id
                      ? 'ring-2 ring-white scale-115 bg-white text-slate-900'
                      : lot.gender === 'male'
                      ? 'bg-emerald-700/80 border border-emerald-400/50 text-white'
                      : 'bg-pink-700/80 border border-pink-400/50 text-white'
                  }`}
                  style={{ left: `${lot.coordinates.x}%`, top: `${lot.coordinates.y}%` }}
                >
                  <span>⛺</span>
                  <span className="font-mono">{lot.lotNumber.replace('Kavling ', 'K')}</span>
                </button>
              ))}
            </div>

            {/* Selected Pin Detail Sheet */}
            {selectedLot && (
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{selectedLot.subCamp} · {selectedLot.lotNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {selectedLot.gender === 'male' ? 'Sektor Putra' : 'Sektor Putri'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px]">
                      {selectedLot.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    Kontingen Penghuni: <strong className="text-amber-300">{selectedLot.contingentName || 'Belum Ditugaskan'}</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">Tugaskan:</span>
                    <select
                      value={selectedLot.contingentId || ''}
                      onChange={(e) => handleAssignContingent(selectedLot.id, e.target.value)}
                      className="px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-white text-[11px] focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Kosongkan / Cadangan --</option>
                      {contingents.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{selectedLot.notes}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteLot(selectedLot.id)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl"
                  >
                    Hapus Kavling
                  </button>
                  <button
                    onClick={() => setSelectedLot(null)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {selectedFacility && (
              <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedFacility.icon}</span>
                    <span className="font-bold text-white text-sm">{selectedFacility.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold capitalize">
                      {selectedFacility.category}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{selectedFacility.description}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Lokasi: {selectedFacility.location} · Jam Operasional: {selectedFacility.openingHours}</p>
                </div>

                <button
                  onClick={() => setSelectedFacility(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: LOTS LIST */}
      {activeTab === 'lots' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lots.map(lot => (
              <div key={lot.id} className="p-4 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#171717] dark:text-white text-sm">{lot.lotNumber}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">({lot.block})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lot.status === 'occupied' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                  }`}>
                    {lot.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Kontingen: </span>
                  <span className="font-semibold text-[#171717] dark:text-white">{lot.contingentName || 'Belum dialokasikan'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-[#ECECEF] dark:border-white/5">
                  <div>Sub Camp: <span className="text-slate-800 dark:text-white font-medium">{lot.subCamp}</span></div>
                  <div>Sektor: <span className="text-slate-800 dark:text-white font-medium">{lot.gender === 'male' ? 'Putra' : 'Putri'}</span></div>
                  <div>Kapasitas: <span className="text-slate-800 dark:text-white font-medium">{lot.capacity} Peserta</span></div>
                  <div>Posisi Map: <span className="font-mono text-emerald-600 dark:text-emerald-400">X:{lot.coordinates.x}%, Y:{lot.coordinates.y}%</span></div>
                </div>

                {lot.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">{lot.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: FACILITIES CATALOG */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {facilities.map(fac => (
            <div key={fac.id} className="p-4 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{fac.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#171717] dark:text-white">{fac.name}</h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">{fac.category}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                  {fac.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{fac.description}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-[#ECECEF] dark:border-white/5 flex justify-between">
                <span>📍 {fac.location}</span>
                <span>⏰ {fac.openingHours}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 4: CAMPSITE ASSIGNMENT BOARD (Requirements 16 & 17) */}
      {activeTab === 'assignment' && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="p-4 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#171717] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Papan Penetapan Kavling Tenda (Campsite Assignment Board)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tetapkan kontingen ke kavling buper dengan cek kapasitas, pembagian gender, dan opsi asisten auto-assign.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleGenerateAutoAssignSuggestions();
                  setShowAutoAssignModal(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bantuan Auto-Assign</span>
              </button>

              <button
                onClick={handleResetAllAssignments}
                className="px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-[#ECECEF] dark:border-white/10 rounded-xl text-xs font-semibold cursor-pointer"
                title="Batalkan semua alokasi kavling"
              >
                Reset Alokasi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT COLUMN: UNASSIGNED CONTINGENTS */}
            <div className="p-4 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kontingen Belum Memiliki Kavling</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                  {contingents.filter(c => !lots.some(l => l.contingentId === c.id)).length} Antre
                </span>
              </div>

              <input
                type="text"
                placeholder="Cari kontingen..."
                value={assignmentSearch}
                onChange={e => setAssignmentSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-xs text-[#171717] dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {contingents
                  .filter(c => !lots.some(l => l.contingentId === c.id))
                  .filter(c => (assignmentSearch ? c.name.toLowerCase().includes(assignmentSearch.toLowerCase()) : true))
                  .map(ctg => (
                    <div
                      key={ctg.id}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/5 hover:border-emerald-500/30 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#171717] dark:text-white text-xs">{ctg.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{ctg.region} · Pimpinan: {ctg.leaderName}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-[10px]">
                          {ctg.quota || 32} Kuota
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Pilih Kavling:</span>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              handleAssignContingent(e.target.value, ctg.id);
                            }
                          }}
                          defaultValue=""
                          className="flex-1 px-2 py-1 bg-white dark:bg-black/50 border border-emerald-500/40 rounded-lg text-emerald-700 dark:text-emerald-300 text-[11px] focus:outline-none"
                        >
                          <option value="">-- Tetapkan ke Kavling --</option>
                          {lots
                            .filter(l => !l.contingentId)
                            .map(l => (
                              <option key={l.id} value={l.id}>
                                {l.lotNumber} ({l.block} · {l.gender === 'male' ? 'Putra' : l.gender === 'female' ? 'Putri' : 'Mix'} · Kap: {l.capacity})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))}

                {contingents.filter(c => !lots.some(l => l.contingentId === c.id)).length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400 bg-[#FAFAFA] dark:bg-black/20 rounded-2xl p-4 border border-[#ECECEF] dark:border-transparent">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>Semua kontingen telah mendapatkan kavling tenda buper!</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LOTS OCCUPANCY BOARD */}
            <div className="p-4 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Tent className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kavling Buper & Status Keterisian</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                  {lots.filter(l => l.contingentId).length} / {lots.length} Terisi
                </span>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {lots.map(lot => {
                  const assignedCtg = contingents.find(c => c.id === lot.contingentId);

                  return (
                    <div
                      key={lot.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        assignedCtg
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-[#FAFAFA] dark:bg-white/5 border-[#ECECEF] dark:border-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#171717] dark:text-white text-xs flex items-center gap-1.5">
                            <span>{lot.lotNumber}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">({lot.block} · {lot.subCamp})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Kapasitas: <strong className="text-slate-800 dark:text-white">{lot.capacity} Orang</strong> · Sektor: {lot.gender === 'male' ? 'Putra' : lot.gender === 'female' ? 'Putri' : 'Campuran'}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            assignedCtg
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {assignedCtg ? 'Terisi' : 'Tersedia'}
                        </span>
                      </div>

                      {assignedCtg ? (
                        <div className="pt-2 mt-2 border-t border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Kontingen Penghuni:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">{assignedCtg.name}</span>
                          </div>
                          <button
                            onClick={() => handleAssignContingent(lot.id, '')}
                            className="px-2.5 py-1 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 rounded-lg text-[10px] border border-[#ECECEF] dark:border-white/10 cursor-pointer"
                          >
                            Lepas Alokasi
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-ASSIGN WIZARD MODAL (Requirement 17) */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-bold text-[#171717] dark:text-white">Bantuan Alokasi Massal Otomatis</h3>
              </div>
              <button onClick={() => setShowAutoAssignModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Sistem menghitung kecocokan kapasitas kavling dan pemisahan gender kontingen secara otomatis.
              </p>

              {/* Rules Selector */}
              <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/5 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aturan Alokasi Cerdas:</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssignRule.fitCapacity}
                    onChange={e => setAutoAssignRule({ ...autoAssignRule, fitCapacity: e.target.checked })}
                    className="accent-emerald-600 rounded"
                  />
                  <span className="text-slate-700 dark:text-slate-200">Kapasitas kavling harus mencukupi kuota kontingen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssignRule.respectGender}
                    onChange={e => setAutoAssignRule({ ...autoAssignRule, respectGender: e.target.checked })}
                    className="accent-emerald-600 rounded"
                  />
                  <span className="text-slate-700 dark:text-slate-200">Pisahkan zona perkemahan putra dan putri</span>
                </label>
              </div>

              {/* Suggested Pairs Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Saran Pasangan Alokasi:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{suggestedAssignments.length} Kontingen</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {suggestedAssignments.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#171717] dark:text-white">{item.contingent.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.reason}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                        → {item.lot.lotNumber}
                      </span>
                    </div>
                  ))}

                  {suggestedAssignments.length === 0 && (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-xs">
                      Tidak ada kontingen unassigned atau kavling kosong yang cocok.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300">
                Catatan: Penetapan ini dapat dibatalkan atau di-override kapan saja oleh administrator (tidak permanen/irreversible).
              </div>
            </div>

            <div className="pt-2 border-t border-[#ECECEF] dark:border-white/8 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAutoAssignModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={suggestedAssignments.length === 0}
                onClick={handleApplyAutoAssign}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 shadow-xs cursor-pointer"
              >
                Konfirmasi & Terapkan Alokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LOT MODAL */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171717] dark:text-white">+ Tambah Alokasi Kavling Tenda</h3>
              <button onClick={() => setShowAddLotModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveLot} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Sub Camp:</label>
                  <input
                    type="text"
                    value={lotForm.subCamp}
                    onChange={e => setLotForm({ ...lotForm, subCamp: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Zona & Sektor:</label>
                  <input
                    type="text"
                    value={lotForm.zone}
                    onChange={e => setLotForm({ ...lotForm, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Blok Kavling:</label>
                  <input
                    type="text"
                    value={lotForm.block}
                    onChange={e => setLotForm({ ...lotForm, block: e.target.value })}
                    placeholder="Contoh: Blok A-04"
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nomor Kavling:</label>
                  <input
                    type="text"
                    value={lotForm.lotNumber}
                    onChange={e => setLotForm({ ...lotForm, lotNumber: e.target.value })}
                    placeholder="Contoh: Kavling 12"
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Sektor Peserta:</label>
                  <select
                    value={lotForm.gender}
                    onChange={e => setLotForm({ ...lotForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white"
                  >
                    <option value="male">Putra</option>
                    <option value="female">Putri</option>
                    <option value="mixed">Campuran / Pembina</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kapasitas Orang:</label>
                  <input
                    type="number"
                    value={lotForm.capacity}
                    onChange={e => setLotForm({ ...lotForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kontingen Penghuni:</label>
                <select
                  value={lotForm.contingentId}
                  onChange={e => setLotForm({ ...lotForm, contingentId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white"
                >
                  <option value="">-- Belum Ditugaskan / Cadangan --</option>
                  {contingents.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Catatan Tambahan:</label>
                <input
                  type="text"
                  value={lotForm.notes}
                  onChange={e => setLotForm({ ...lotForm, notes: e.target.value })}
                  placeholder="Kondisi tanah, dekat kran air, dsb."
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddLotModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">Simpan Kavling</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FACILITY MODAL */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171717] dark:text-white">+ Tambah Titik Fasilitas Buper</h3>
              <button onClick={() => setShowAddFacilityModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nama Fasilitas:</label>
                <input
                  type="text"
                  value={facilityForm.name}
                  onChange={e => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  placeholder="Contoh: Pos Pengisian Air Bersih Sektor Timur"
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kategori Fasilitas:</label>
                  <select
                    value={facilityForm.category}
                    onChange={e => {
                      const cat = e.target.value as FacilityCategory;
                      let icon = '📍';
                      if (cat === 'toilet') icon = '🚻';
                      else if (cat === 'health') icon = '🏥';
                      else if (cat === 'kitchen') icon = '🍽';
                      else if (cat === 'prayer') icon = '🕌';
                      else if (cat === 'parking') icon = '🅿';
                      else if (cat === 'campfire') icon = '🔥';
                      else if (cat === 'competition') icon = '🏆';
                      else if (cat === 'info') icon = '📢';
                      setFacilityForm({ ...facilityForm, category: cat, icon });
                    }}
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white"
                  >
                    <option value="health">🏥 Medis & P3K</option>
                    <option value="toilet">🚻 Toilet & MCK</option>
                    <option value="kitchen">🍽 Dapur & Logistik</option>
                    <option value="prayer">🕌 Musholla & Ibadah</option>
                    <option value="parking">🅿 Parkir & Muatan</option>
                    <option value="campfire">🔥 Api Unggun</option>
                    <option value="competition">🏆 Lapangan Lomba</option>
                    <option value="info">📢 Informasi & Sekretariat</option>
                    <option value="security">🛡 Pos Keamanan</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Jam Operasional:</label>
                  <input
                    type="text"
                    value={facilityForm.openingHours}
                    onChange={e => setFacilityForm({ ...facilityForm, openingHours: e.target.value })}
                    placeholder="24 Jam / 06:00 - 22:00"
                    className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Deskripsi & Petunjuk:</label>
                <textarea
                  rows={2}
                  value={facilityForm.description}
                  onChange={e => setFacilityForm({ ...facilityForm, description: e.target.value })}
                  placeholder="Kapasitas, fasilitas kran, penanggung jawab posko..."
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddFacilityModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">Simpan Fasilitas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
