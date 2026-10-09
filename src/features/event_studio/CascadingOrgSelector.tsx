/**
 * @license
 * SiEpang - Cascading Scout Organization Hierarchy Selector
 * Enforces KWARNAS -> KWARDA -> KWARCAB -> KWARRAN -> GUDEP
 * with Gudep number and base institution / pangkalan support.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronRight,
  ShieldCheck,
  Plus,
  School,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Organization, OrganizationLevel } from '../../types';
import { eventStudioService } from '../../services/eventStudioService';

interface CascadingOrgSelectorProps {
  currentLevel: OrganizationLevel;
  currentOrganizer: string;
  onSelect: (data: {
    level: OrganizationLevel;
    organizer: string;
    organizationId?: string;
    gudepNumber?: string;
    pangkalan?: string;
  }) => void;
}

export const CascadingOrgSelector: React.FC<CascadingOrgSelectorProps> = ({
  currentLevel,
  currentOrganizer,
  onSelect,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>(
    eventStudioService.listOrganizations()
  );
  const [selectedLevel, setSelectedLevel] = useState<OrganizationLevel>(currentLevel || 'KWARCAB');

  // Cascade selections
  const [selectedKwarnasId, setSelectedKwarnasId] = useState<string>(() => organizations.find(o => o.organization_level === 'KWARNAS')?.organization_id || '');
  const [selectedKwardaId, setSelectedKwardaId] = useState<string>(() => organizations.find(o => o.organization_level === 'KWARDA')?.organization_id || '');
  const [selectedKwarcabId, setSelectedKwarcabId] = useState<string>(() => organizations.find(o => o.organization_level === 'KWARCAB')?.organization_id || '');
  const [selectedKwarranId, setSelectedKwarranId] = useState<string>(() => organizations.find(o => o.organization_level === 'KWARRAN')?.organization_id || '');
  const [selectedGudepId, setSelectedGudepId] = useState<string>(() => organizations.find(o => o.organization_level === 'GUDEP')?.organization_id || '');

  // Custom Gudep specific fields
  const [customGudepNumber, setCustomGudepNumber] = useState<string>('');
  const [customPangkalan, setCustomPangkalan] = useState<string>('');

  // Modal for new organization creation
  const [showAddOrgModal, setShowAddOrgModal] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [newOrgCode, setNewOrgCode] = useState<string>('');

  useEffect(() => {
    const unsub = eventStudioService.subscribe(() => {
      setOrganizations(eventStudioService.listOrganizations());
    });
    return () => {
      unsub();
    };
  }, []);

  // Filter lists based on hierarchy parents
  const kwarnasOrgs = organizations.filter(o => o.organization_level === 'KWARNAS');
  const kwardaOrgs = organizations.filter(
    o => o.organization_level === 'KWARDA' && (!selectedKwarnasId || o.parent_organization_id === selectedKwarnasId)
  );
  const kwarcabOrgs = organizations.filter(
    o => o.organization_level === 'KWARCAB' && (!selectedKwardaId || o.parent_organization_id === selectedKwardaId)
  );
  const kwarranOrgs = organizations.filter(
    o => o.organization_level === 'KWARRAN' && (!selectedKwarcabId || o.parent_organization_id === selectedKwarcabId)
  );
  const gudepOrgs = organizations.filter(
    o => o.organization_level === 'GUDEP' && (!selectedKwarranId || o.parent_organization_id === selectedKwarranId)
  );

  // Emit change whenever selection updates
  const emitSelection = (level: OrganizationLevel) => {
    let organizerName = currentOrganizer;
    let orgId: string | undefined = undefined;

    if (level === 'KWARNAS') {
      const org = organizations.find(o => o.organization_id === selectedKwarnasId);
      organizerName = org ? org.organization_name : 'Kwartir Nasional Gerakan Pramuka';
      orgId = org?.organization_id;
    } else if (level === 'KWARDA') {
      const org = organizations.find(o => o.organization_id === selectedKwardaId);
      organizerName = org ? org.organization_name : 'Kwartir Daerah Gerakan Pramuka';
      orgId = org?.organization_id;
    } else if (level === 'KWARCAB') {
      const org = organizations.find(o => o.organization_id === selectedKwarcabId);
      organizerName = org ? org.organization_name : 'Kwartir Cabang Gerakan Pramuka';
      orgId = org?.organization_id;
    } else if (level === 'KWARRAN') {
      const org = organizations.find(o => o.organization_id === selectedKwarranId);
      organizerName = org ? org.organization_name : 'Kwartir Ranting Gerakan Pramuka';
      orgId = org?.organization_id;
    } else if (level === 'GUDEP') {
      const org = organizations.find(o => o.organization_id === selectedGudepId);
      organizerName = org
        ? `${org.organization_name} (Pangkalan: ${org.base_institution || customPangkalan})`
        : `Gudep ${customGudepNumber} (Pangkalan: ${customPangkalan})`;
      orgId = org?.organization_id;
    }

    onSelect({
      level,
      organizer: organizerName,
      organizationId: orgId,
      gudepNumber: level === 'GUDEP' ? customGudepNumber : undefined,
      pangkalan: level === 'GUDEP' ? customPangkalan : undefined,
    });
  };

  const handleLevelChange = (lvl: OrganizationLevel) => {
    setSelectedLevel(lvl);
    emitSelection(lvl);
  };

  const handleCreateNewOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    let parentId: string | null = null;
    if (selectedLevel === 'KWARDA') parentId = selectedKwarnasId;
    else if (selectedLevel === 'KWARCAB') parentId = selectedKwardaId;
    else if (selectedLevel === 'KWARRAN') parentId = selectedKwarcabId;
    else if (selectedLevel === 'GUDEP') parentId = selectedKwarranId;

    try {
      const created = await eventStudioService.createOrganization({
        organization_name: newOrgName,
        organization_code: newOrgCode || `ORG-${Date.now().toString().slice(-4)}`,
        organization_level: selectedLevel,
        parent_organization_id: parentId,
        gudep_number: selectedLevel === 'GUDEP' ? customGudepNumber : undefined,
        base_institution: selectedLevel === 'GUDEP' ? customPangkalan : undefined,
        pangkalan: selectedLevel === 'GUDEP' ? customPangkalan : undefined,
        status: 'active',
      });

      if (selectedLevel === 'KWARDA') setSelectedKwardaId(created.organization_id);
      else if (selectedLevel === 'KWARCAB') setSelectedKwarcabId(created.organization_id);
      else if (selectedLevel === 'KWARRAN') setSelectedKwarranId(created.organization_id);
      else if (selectedLevel === 'GUDEP') setSelectedGudepId(created.organization_id);

      setShowAddOrgModal(false);
      setNewOrgName('');
      setNewOrgCode('');
      emitSelection(selectedLevel);
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan organisasi.');
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Hierarki Kwartir Penyelenggara (Scout Hierarchy)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tingkatan bertingkat resmi: KWARNAS → KWARDA → KWARCAB → KWARRAN → GUDEP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddOrgModal(true)}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Organisasi</span>
        </button>
      </div>

      {/* 1. Level Selector Pills */}
      <div>
        <label className="text-slate-300 font-semibold text-[11px] block mb-1.5">Pilih Tingkat Penyelenggara:</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          {(['KWARNAS', 'KWARDA', 'KWARCAB', 'KWARRAN', 'GUDEP'] as OrganizationLevel[]).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => handleLevelChange(lvl)}
              className={`p-2 rounded-xl text-center font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                selectedLevel === lvl
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span>{lvl}</span>
              {selectedLevel === lvl && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Cascading Dropdown Selectors */}
      <div className="space-y-3 pt-1">
        {/* KWARNAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
          <label className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>1. Kwartir Nasional:</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={selectedKwarnasId}
              onChange={e => {
                setSelectedKwarnasId(e.target.value);
                if (selectedLevel === 'KWARNAS') emitSelection('KWARNAS');
              }}
              className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
            >
              {kwarnasOrgs.map(o => (
                <option key={o.organization_id} value={o.organization_id}>
                  {o.organization_name} ({o.organization_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KWARDA (Requires KWARNAS) */}
        {(selectedLevel === 'KWARDA' || selectedLevel === 'KWARCAB' || selectedLevel === 'KWARRAN' || selectedLevel === 'GUDEP') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
            <label className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>2. Kwartir Daerah (Kwarda):</span>
            </label>
            <div className="sm:col-span-2">
              <select
                value={selectedKwardaId}
                onChange={e => {
                  setSelectedKwardaId(e.target.value);
                  if (selectedLevel === 'KWARDA') emitSelection('KWARDA');
                }}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                {kwardaOrgs.map(o => (
                  <option key={o.organization_id} value={o.organization_id}>
                    {o.organization_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* KWARCAB (Requires KWARDA) */}
        {(selectedLevel === 'KWARCAB' || selectedLevel === 'KWARRAN' || selectedLevel === 'GUDEP') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
            <label className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>3. Kwartir Cabang (Kwarcab):</span>
            </label>
            <div className="sm:col-span-2">
              <select
                value={selectedKwarcabId}
                onChange={e => {
                  setSelectedKwarcabId(e.target.value);
                  if (selectedLevel === 'KWARCAB') emitSelection('KWARCAB');
                }}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                {kwarcabOrgs.map(o => (
                  <option key={o.organization_id} value={o.organization_id}>
                    {o.organization_name} ({o.organization_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* KWARRAN (Requires KWARCAB) */}
        {(selectedLevel === 'KWARRAN' || selectedLevel === 'GUDEP') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs">
            <label className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>4. Kwartir Ranting (Kwarran):</span>
            </label>
            <div className="sm:col-span-2">
              <select
                value={selectedKwarranId}
                onChange={e => {
                  setSelectedKwarranId(e.target.value);
                  if (selectedLevel === 'KWARRAN') emitSelection('KWARRAN');
                }}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                {kwarranOrgs.map(o => (
                  <option key={o.organization_id} value={o.organization_id}>
                    {o.organization_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* GUDEP (Requires KWARRAN, plus Gudep Number & Base Institution) */}
        {selectedLevel === 'GUDEP' && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <School className="w-4 h-4" />
              <span>5. Konfigurasi Gugus Depan (Gudep) & Pangkalan:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] font-medium block mb-1">Pilih Gudep Terdaftar:</label>
                <select
                  value={selectedGudepId}
                  onChange={e => {
                    const sel = gudepOrgs.find(g => g.organization_id === e.target.value);
                    setSelectedGudepId(e.target.value);
                    if (sel) {
                      if (sel.gudep_number) setCustomGudepNumber(sel.gudep_number);
                      if (sel.base_institution || sel.pangkalan) setCustomPangkalan(sel.base_institution || sel.pangkalan || '');
                    }
                    emitSelection('GUDEP');
                  }}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  {gudepOrgs.map(o => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.organization_name} - {o.base_institution || o.pangkalan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-medium block mb-1">Nomor Gudep (Putra - Putri):</label>
                <input
                  type="text"
                  value={customGudepNumber}
                  onChange={e => {
                    setCustomGudepNumber(e.target.value);
                    emitSelection('GUDEP');
                  }}
                  placeholder="Contoh: 10.03.001 - 10.03.002"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 text-[11px] font-medium block mb-1">Nama Pangkalan / Lembaga Sekolah:</label>
                <input
                  type="text"
                  value={customPangkalan}
                  onChange={e => {
                    setCustomPangkalan(e.target.value);
                    emitSelection('GUDEP');
                  }}
                  placeholder="Contoh: SMP Negeri 1 Pangkalan / Gudep"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Summary Breadcrumb */}
      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400">Hierarki Aktif:</span>
          <span className="text-white font-semibold">{selectedLevel}</span>
          <ChevronRight className="w-3 h-3 text-slate-500 inline" />
          <span className="text-emerald-300 font-bold">{currentOrganizer}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
          TERVERIFIKASI
        </span>
      </div>

      {/* Modal Add Organization */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#171717] dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>+ Daftarkan Organisasi {selectedLevel}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddOrgModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewOrg} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nama Organisasi:</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder={`Contoh: Kwartir ${selectedLevel.toLowerCase()} ...`}
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kode Organisasi:</label>
                <input
                  type="text"
                  value={newOrgCode}
                  onChange={e => setNewOrgCode(e.target.value)}
                  placeholder="Contoh: 13.10.06"
                  className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-emerald-600 dark:text-emerald-400 font-mono font-bold placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Daftarkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
