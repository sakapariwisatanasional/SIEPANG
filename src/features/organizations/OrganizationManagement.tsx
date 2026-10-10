/**
 * @license
 * SiEpang - Organization Management & Hierarchical Kwartir Tree Engine
 * Kwarnas -> Kwarda -> Kwarcab -> Kwarran -> Gudep
 * Features:
 * - Interactive Visual Hierarchy Tree with expand/collapse
 * - Mobile-friendly Drill-down card navigation with breadcrumbs
 * - Full CRUD & status toggle (active/inactive)
 * - Child organization creator with automatic cascading inheritance
 * - Workspace linking & Active Event indicators
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Compass,
  ArrowLeft,
  Tent,
  Server,
  Share2,
  Sparkles,
  School,
  X,
  Check,
} from 'lucide-react';
import { Organization, OrganizationLevel, Workspace } from '../../types';
import { organizationService, OrganizationTreeNode } from '../../services/organizationService';
import { workspaceService } from '../../services/workspaceService';
import { eventService } from '../../services/eventService';

const LEVEL_COLORS: Record<OrganizationLevel, { bg: string; text: string; border: string; badge: string; icon: string }> = {
  KWARNAS: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    badge: 'bg-red-950/80 text-red-300 border border-red-500/30',
    icon: '🇮🇩',
  },
  KWARDA: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30',
    icon: '🏛️',
  },
  KWARCAB: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30',
    icon: '🏕️',
  },
  KWARRAN: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-950/80 text-amber-300 border border-amber-500/30',
    icon: '🧭',
  },
  GUDEP: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-950/80 text-purple-300 border border-purple-500/30',
    icon: '⚜️',
  },
};

const NEXT_LEVEL_MAP: Record<OrganizationLevel, OrganizationLevel | null> = {
  KWARNAS: 'KWARDA',
  KWARDA: 'KWARCAB',
  KWARCAB: 'KWARRAN',
  KWARRAN: 'GUDEP',
  GUDEP: null,
};

interface OrganizationManagementProps {
  onNavigateToWorkspace?: (workspaceId: string) => void;
  onOpenWorkspaceWizard?: (preselectedOrgId?: string) => void;
}

export const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  onNavigateToWorkspace,
  onOpenWorkspaceWizard,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>(organizationService.listOrganizations());
  const [workspaces, setWorkspaces] = useState<Workspace[]>(workspaceService.getWorkspaces());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<OrganizationLevel | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'tree' | 'drilldown' | 'cards'>('tree');
  
  // Drill-down navigation stack on mobile/card mode
  const [drilldownStack, setDrilldownStack] = useState<Organization[]>([]);
  
  // Expanded tree nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['org_kwarnas', 'org_kwarda_jatim', 'org_kwarcab_bwi']));

  // Modal State for Create/Edit
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'child' | null>(null);
  const [editingOrg, setEditingOrg] = useState<Partial<Organization> | null>(null);
  const [parentOrgForChild, setParentOrgForChild] = useState<Organization | null>(null);

  // Link Workspace Modal
  const [linkingOrg, setLinkingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    const unsub = organizationService.subscribe(() => {
      setOrganizations(organizationService.listOrganizations());
      setWorkspaces(workspaceService.getWorkspaces());
    });
    return () => unsub();
  }, []);

  const orgTree = useMemo(() => organizationService.getTree(), [organizations, workspaces]);

  // High-level counts
  const stats = useMemo(() => {
    const kwarnas = organizations.filter(o => o.organization_level === 'KWARNAS').length;
    const kwarda = organizations.filter(o => o.organization_level === 'KWARDA').length;
    const kwarcab = organizations.filter(o => o.organization_level === 'KWARCAB').length;
    const kwarran = organizations.filter(o => o.organization_level === 'KWARRAN').length;
    const gudep = organizations.filter(o => o.organization_level === 'GUDEP').length;
    const active = organizations.filter(o => o.status === 'active').length;
    return { kwarnas, kwarda, kwarcab, kwarran, gudep, active, total: organizations.length };
  }, [organizations]);

  // Toggle tree node expansion
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(organizations.map(o => o.organization_id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Toggle organization active/inactive status
  const handleToggleStatus = (org: Organization) => {
    try {
      organizationService.toggleStatus(org.organization_id);
    } catch (e: any) {
      alert(e.message || 'Gagal mengubah status');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingOrg({
      organization_code: '',
      organization_name: '',
      organization_level: 'KWARCAB',
      parent_organization_id: 'org_kwarda_jatim',
      status: 'active',
      province_name: 'Jawa Timur',
      province_code: '35',
      city_name: '',
      city_code: '',
      district_name: '',
      district_code: '',
      gudep_number: '',
      base_institution: '',
    });
    setParentOrgForChild(null);
    setModalMode('create');
  };

  // Open Create Child Modal
  const handleOpenCreateChild = (parent: Organization) => {
    const childLevel = NEXT_LEVEL_MAP[parent.organization_level] || 'GUDEP';
    setParentOrgForChild(parent);
    setEditingOrg({
      organization_code: `${parent.organization_code}.`,
      organization_name: '',
      organization_level: childLevel,
      parent_organization_id: parent.organization_id,
      status: 'active',
      province_code: parent.province_code,
      province_name: parent.province_name,
      city_code: parent.city_code,
      city_name: parent.city_name,
      district_code: parent.district_code,
      district_name: parent.district_name,
      gudep_number: childLevel === 'GUDEP' ? '01.001' : '',
      base_institution: childLevel === 'GUDEP' ? 'Pangkalan ' : '',
    });
    setModalMode('child');
  };

  // Open Edit Modal
  const handleOpenEdit = (org: Organization) => {
    setEditingOrg({ ...org });
    setParentOrgForChild(org.parent_organization_id ? organizationService.getOrganizationById(org.parent_organization_id) || null : null);
    setModalMode('edit');
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !editingOrg.organization_name || !editingOrg.organization_code) {
      alert('Nama dan Kode Organisasi wajib diisi!');
      return;
    }

    try {
      if (modalMode === 'edit' && editingOrg.organization_id) {
        organizationService.updateOrganization(editingOrg.organization_id, editingOrg);
      } else {
        organizationService.createOrganization(editingOrg as Omit<Organization, 'organization_id'>);
      }
      setModalMode(null);
      setEditingOrg(null);
      setParentOrgForChild(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data organisasi');
    }
  };

  // Filtered organizations for list/cards view
  const filteredList = useMemo(() => {
    let result = organizations;
    if (selectedLevelFilter !== 'ALL') {
      result = result.filter(o => o.organization_level === selectedLevelFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o =>
          o.organization_name.toLowerCase().includes(q) ||
          o.organization_code.toLowerCase().includes(q) ||
          (o.city_name && o.city_name.toLowerCase().includes(q)) ||
          (o.district_name && o.district_name.toLowerCase().includes(q)) ||
          (o.base_institution && o.base_institution.toLowerCase().includes(q)) ||
          (o.gudep_number && o.gudep_number.toLowerCase().includes(q))
      );
    }
    return result;
  }, [organizations, selectedLevelFilter, searchQuery]);

  // Current drill-down item and its children
  const currentDrilldownOrg = drilldownStack.length > 0 ? drilldownStack[drilldownStack.length - 1] : null;
  const drilldownChildren = useMemo(() => {
    if (!currentDrilldownOrg) {
      // Top level: Kwarnas roots
      return organizations.filter(o => !o.parent_organization_id || o.organization_level === 'KWARNAS');
    }
    return organizations.filter(o => o.parent_organization_id === currentDrilldownOrg.organization_id);
  }, [currentDrilldownOrg, organizations]);

  const handleDrilldownPush = (org: Organization) => {
    setDrilldownStack(prev => [...prev, org]);
  };

  const handleDrilldownPop = () => {
    setDrilldownStack(prev => prev.slice(0, -1));
  };

  const handleDrilldownTo = (index: number) => {
    if (index === -1) {
      setDrilldownStack([]);
    } else {
      setDrilldownStack(prev => prev.slice(0, index + 1));
    }
  };

  // Helper to get linked workspace
  const getLinkedWorkspace = (orgId: string): Workspace | undefined => {
    return workspaces.find(w => w.organization_id === orgId);
  };

  // RENDER TREE NODE RECURSIVE
  const renderTreeNode = (node: OrganizationTreeNode, depth: number = 0, isLast: boolean = false) => {
    const isExpanded = expandedNodes.has(node.organization_id);
    const hasChildren = node.children && node.children.length > 0;
    const linkedWs = getLinkedWorkspace(node.organization_id);
    const levelStyle = LEVEL_COLORS[node.organization_level];

    // Branch symbol representation
    const branchPrefix = depth === 0 ? '' : isLast ? '└── ' : '├── ';

    return (
      <div key={node.organization_id} className="relative">
        <div
          className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 my-1.5 rounded-2xl border transition-all ${
            node.status === 'active'
              ? 'bg-white dark:bg-[#141418] border-[#ECECEF] dark:border-white/10 hover:border-[#F47743]/40 shadow-xs'
              : 'bg-[#FAFAFA] dark:bg-black/30 border-[#ECECEF] dark:border-white/5 opacity-70 hover:opacity-100'
          }`}
          style={{ marginLeft: `${Math.min(depth * 20, 120)}px` }}
        >
          {/* Left: Indicator, Level, Name & Hierarchy Line */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            {/* Visual branch connector for tree view */}
            {depth > 0 && (
              <span className="font-mono text-[#208C60] dark:text-purple-400 font-bold select-none text-xs hidden sm:inline">
                {branchPrefix}
              </span>
            )}

            {/* Expand / Collapse toggle button */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.organization_id)}
                className="p-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[#FFF0F4] text-[#6B7280] hover:text-[#F47743] transition-colors shrink-0 mt-0.5 sm:mt-0 cursor-pointer"
                title={isExpanded ? 'Tutup cabang' : 'Buka cabang'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 shrink-0 text-center text-slate-600 select-none text-xs">•</span>
            )}

            {/* Level Icon & Badge */}
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${levelStyle.badge}`}>
              <span className="mr-1">{levelStyle.icon}</span>
              <span>{node.organization_level}</span>
            </div>

            {/* Name, Code, and Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                  {node.organization_name}
                </span>
                <span className="font-mono text-[10px] text-emerald-400/90 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {node.organization_code}
                </span>
                {node.gudep_number && (
                  <span className="text-[10px] text-purple-300 font-semibold bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-500/20">
                    Gudep {node.gudep_number}
                  </span>
                )}
              </div>

              {/* Sub details: Pangkalan, Wilayah */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                {node.base_institution && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <School className="w-3 h-3 text-purple-400" />
                    <span>{node.base_institution}</span>
                  </span>
                )}
                {(node.city_name || node.province_name) && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{[node.district_name, node.city_name, node.province_name].filter(Boolean).join(', ')}</span>
                  </span>
                )}
                {hasChildren && (
                  <span className="text-slate-400 text-[10px]">
                    ({node.children.length} anak organisasi)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status Badges, Workspace Link & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECECEF] dark:border-white/5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Linked Workspace Indicator */}
            {linkedWs ? (
              <div
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1"
                title={`Workspace '${linkedWs.name}' aktif pada instalasi ini.`}
              >
                <Server className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[120px]">{linkedWs.name}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenWorkspaceWizard) {
                    onOpenWorkspaceWizard(node.organization_id);
                  } else {
                    setLinkingOrg(node);
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-[#FAFAFA] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-[#ECECEF] dark:border-white/10 text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                title="Tautkan atau buat workspace baru untuk organisasi ini"
              >
                <Plus className="w-3 h-3" />
                <span>Tautkan Workspace</span>
              </button>
            )}

            {/* Active Status Badge */}
            <button
              onClick={() => handleToggleStatus(node)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-colors cursor-pointer ${
                node.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/30 hover:bg-rose-100'
              }`}
              title="Klik untuk ubah status aktif/nonaktif"
            >
              {node.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Aktif</span>
                </>
              ) : (
                <>
                  <XCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                  <span>Nonaktif</span>
                </>
              )}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Add Child Org */}
              {NEXT_LEVEL_MAP[node.organization_level] && (
                <button
                  onClick={() => handleOpenCreateChild(node)}
                  className="p-1.5 rounded-xl bg-[#FFF0F4] hover:bg-[#FFE0E8] text-[#F47743] border border-[#FFE0E8] dark:bg-white/5 dark:border-white/10 text-xs transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title={`Tambah ${NEXT_LEVEL_MAP[node.organization_level]} di bawah ${node.organization_name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Edit Org */}
              <button
                onClick={() => handleOpenEdit(node)}
                className="p-1.5 rounded-xl bg-[#FAFAFA] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-[#6B7280] dark:text-slate-300 hover:text-[#171717] dark:hover:text-white border border-[#ECECEF] dark:border-white/10 text-xs transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Edit data organisasi"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recursive Children Container */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-emerald-500/20 ml-3 sm:ml-4 pl-1 sm:pl-2">
            {node.children.map((child, idx) =>
              renderTreeNode(child, depth + 1, idx === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 sm:p-6 rounded-[28px] shadow-xs relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F4] border border-[#FFE0E8] text-xs font-semibold text-[#F47743] mb-2">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Kwarnas → Kwarda → Kwarcab → Kwarran → Gudep</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-white tracking-tight">
            Struktur Organisasi Gerakan Pramuka
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Kelola entitas nyata organisasi kepramukaan dari tingkat Kwartir Nasional hingga Gugus Depan
            dengan relasi hirarki, pangkalan, penautan workspace, dan event aktif.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#208C60] via-[#F47743] to-[#F4A53A] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Organisasi</span>
          </button>
        </div>
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-2xs space-y-1">
          <div className="text-[11px] text-[#6B7280] dark:text-slate-400">Total Organisasi</div>
          <div className="text-xl font-black text-[#171717] dark:text-white font-mono">{stats.total}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{stats.active} Aktif</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFF1F2] dark:bg-red-950/20 border border-[#FECDD3] dark:border-red-500/20 space-y-1">
          <div className="text-[11px] text-rose-700 dark:text-red-300 font-semibold flex items-center gap-1">
            <span>Kwarnas</span>
          </div>
          <div className="text-xl font-black text-rose-950 dark:text-white font-mono">{stats.kwarnas}</div>
          <div className="text-[10px] text-[#6B7280] dark:text-slate-400">Pusat Nasional</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#EFF6FF] dark:bg-indigo-950/20 border border-[#BFDBFE] dark:border-indigo-500/20 space-y-1">
          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
            <span>Kwarda</span>
          </div>
          <div className="text-xl font-black text-indigo-950 dark:text-white font-mono">{stats.kwarda}</div>
          <div className="text-[10px] text-[#6B7280] dark:text-slate-400">Tingkat Provinsi</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#A7F3D0] dark:border-emerald-500/20 space-y-1">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
            <span>Kwarcab</span>
          </div>
          <div className="text-xl font-black text-emerald-950 dark:text-white font-mono">{stats.kwarcab}</div>
          <div className="text-[10px] text-[#6B7280] dark:text-slate-400">Kabupaten / Kota</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFF7ED] dark:bg-amber-950/20 border border-[#FED7AA] dark:border-amber-500/20 space-y-1">
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
            <span>Kwarran</span>
          </div>
          <div className="text-xl font-black text-amber-950 dark:text-white font-mono">{stats.kwarran}</div>
          <div className="text-[10px] text-[#6B7280] dark:text-slate-400">Tingkat Kecamatan</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F3FF] dark:bg-purple-950/20 border border-[#DDD6FE] dark:border-purple-500/20 space-y-1">
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
            <span>Gugus Depan</span>
          </div>
          <div className="text-xl font-black text-purple-950 dark:text-white font-mono">{stats.gudep}</div>
          <div className="text-[10px] text-[#6B7280] dark:text-slate-400">Sekolah / Pangkalan</div>
        </div>
      </div>

      {/* Controls Bar: Search, Level Filter & Presentation Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#141418] p-3.5 rounded-2xl border border-[#ECECEF] dark:border-white/10 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari organisasi, kode, pangkalan, atau wilayah..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#F47743]"
          />
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'KWARNAS', 'KWARDA', 'KWARCAB', 'KWARRAN', 'GUDEP'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedLevelFilter === lvl
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {lvl === 'ALL' ? 'Semua Tingkat' : lvl}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#FAFAFA] dark:bg-white/5 p-1 rounded-xl border border-[#ECECEF] dark:border-white/10 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'tree' ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-xs' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Pohon Hirarki</span>
          </button>
          <button
            onClick={() => setViewMode('drilldown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'drilldown' ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-xs' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Drill-Down</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717] shadow-xs' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Daftar Kartu</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL TREE VIEW */}
      {viewMode === 'tree' && (
        <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECECEF] dark:border-white/5">
            <div>
              <h2 className="text-sm font-bold text-[#171717] dark:text-white flex items-center gap-2">
                <span>Diagram Pohon Silsilah Kepramukaan</span>
              </h2>
              <p className="text-[11px] text-[#6B7280] dark:text-slate-400">
                Penyajian hirarkis berjenjang lengkap dengan tombol expand/collapse tiap cabang kwartir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 text-[11px] font-medium text-[#F47743] bg-[#FFF0F4] hover:bg-[#FFE0E8] border border-[#FFE0E8] rounded-lg transition-colors cursor-pointer"
              >
                Buka Semua Cabang
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 text-[11px] font-medium text-[#6B7280] bg-[#FAFAFA] hover:bg-white dark:bg-white/5 hover:text-[#171717] border border-[#ECECEF] dark:border-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Tutup Semua Cabang
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {orgTree.map((rootNode, idx) =>
              renderTreeNode(rootNode, 0, idx === orgTree.length - 1)
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MOBILE-FIRST DRILL-DOWN NAVIGATION */}
      {viewMode === 'drilldown' && (
        <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-4 sm:p-6 space-y-4 shadow-xs">
          {/* Breadcrumb Navigation Trail */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/5 text-xs">
            <button
              onClick={() => handleDrilldownTo(-1)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer ${
                drilldownStack.length === 0 ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717]' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white bg-white dark:bg-white/5'
              }`}
            >
              <span>🇮🇩 Kwarnas (Pusat)</span>
            </button>

            {drilldownStack.map((item, idx) => {
              const isCurrent = idx === drilldownStack.length - 1;
              return (
                <React.Fragment key={item.organization_id}>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <button
                    onClick={() => handleDrilldownTo(idx)}
                    className={`px-2.5 py-1 rounded-lg transition-colors font-semibold truncate max-w-[180px] cursor-pointer ${
                      isCurrent ? 'bg-[#171717] text-white dark:bg-white dark:text-[#171717]' : 'text-[#6B7280] dark:text-slate-400 hover:text-[#171717] dark:hover:text-white bg-white dark:bg-white/5'
                    }`}
                  >
                    <span>{item.organization_name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Drill-down Active Node Header */}
          {currentDrilldownOrg && (
            <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${LEVEL_COLORS[currentDrilldownOrg.organization_level].badge}`}>
                    {currentDrilldownOrg.organization_level}
                  </span>
                  <span className="font-mono text-xs text-[#208C60] dark:text-purple-400">{currentDrilldownOrg.organization_code}</span>
                </div>
                <h3 className="text-base font-bold text-[#171717] dark:text-white">{currentDrilldownOrg.organization_name}</h3>
                {currentDrilldownOrg.base_institution && (
                  <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">{currentDrilldownOrg.base_institution}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDrilldownPop}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-[#FAFAFA] text-[#171717] dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-[#ECECEF] dark:border-white/10 cursor-pointer min-h-[40px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Induk</span>
                </button>
                {NEXT_LEVEL_MAP[currentDrilldownOrg.organization_level] && (
                  <button
                    onClick={() => handleOpenCreateChild(currentDrilldownOrg)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#208C60] via-[#F47743] to-[#F4A53A] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah {NEXT_LEVEL_MAP[currentDrilldownOrg.organization_level]}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Children Cards in Drill-down */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentDrilldownOrg
                ? `Anak Organisasi di bawah ${currentDrilldownOrg.organization_name} (${drilldownChildren.length})`
                : `Tingkat Tertinggi / Kwartir Nasional (${drilldownChildren.length})`}
            </div>

            {drilldownChildren.length === 0 ? (
              <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs text-slate-400">Belum ada anak organisasi terdaftar di bawah kwartir ini.</p>
                {currentDrilldownOrg && NEXT_LEVEL_MAP[currentDrilldownOrg.organization_level] && (
                  <button
                    onClick={() => handleOpenCreateChild(currentDrilldownOrg)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah {NEXT_LEVEL_MAP[currentDrilldownOrg.organization_level]} Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drilldownChildren.map(child => {
                  const grandchildren = organizations.filter(o => o.parent_organization_id === child.organization_id);
                  const linkedWs = getLinkedWorkspace(child.organization_id);

                  return (
                    <div
                      key={child.organization_id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-2xs hover:border-[#F47743]/30 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${LEVEL_COLORS[child.organization_level].badge}`}>
                              {child.organization_level}
                            </span>
                            <span className="font-mono text-xs text-[#208C60] dark:text-purple-400 font-semibold">{child.organization_code}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#171717] dark:text-white">{child.organization_name}</h4>
                          {child.base_institution && (
                            <div className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1 mt-0.5">
                              <School className="w-3 h-3" />
                              <span>{child.base_institution}</span>
                            </div>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          child.status === 'active' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-red-950 text-red-300 border-red-500/30'
                        }`}>
                          {child.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                        <span className="text-slate-400">
                          {grandchildren.length} Sub-organisasi
                        </span>

                        <div className="flex items-center gap-1.5">
                          {grandchildren.length > 0 && (
                            <button
                              onClick={() => handleDrilldownPush(child)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-white/10"
                            >
                              <span>Buka Anak ({grandchildren.length})</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(child)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: COMPREHENSIVE CARDS LIST */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map(org => {
            const parent = org.parent_organization_id ? organizationService.getOrganizationById(org.parent_organization_id) : undefined;
            const children = organizationService.getChildren(org.organization_id);
            const linkedWs = getLinkedWorkspace(org.organization_id);
            const levelStyle = LEVEL_COLORS[org.organization_level];

            return (
              <div
                key={org.organization_id}
                className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#F47743]/40 transition-all space-y-3.5 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Level badge, Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${levelStyle.badge}`}>
                        <span className="mr-1">{levelStyle.icon}</span>
                        <span>{org.organization_level}</span>
                      </span>
                      <span className="font-mono text-xs text-[#208C60] dark:text-purple-400 font-semibold">{org.organization_code}</span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(org)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                        org.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/30'
                      }`}
                    >
                      {org.status}
                    </button>
                  </div>

                  {/* Title & Pangkalan */}
                  <div>
                    <h3 className="text-sm font-bold text-[#171717] dark:text-white leading-snug">{org.organization_name}</h3>
                    {org.base_institution && (
                      <p className="text-xs text-[#208C60] dark:text-purple-300 mt-0.5 flex items-center gap-1">
                        <School className="w-3.5 h-3.5" />
                        <span>{org.base_institution} {org.gudep_number ? `(${org.gudep_number})` : ''}</span>
                      </p>
                    )}
                  </div>

                  {/* Parent & Location details */}
                  <div className="bg-[#FAFAFA] dark:bg-white/5 p-2.5 rounded-2xl border border-[#ECECEF] dark:border-white/5 space-y-1 text-[11px]">
                    <div className="flex justify-between text-[#6B7280] dark:text-slate-400">
                      <span>Induk Kwartir:</span>
                      <span className="text-[#171717] dark:text-slate-200 font-medium truncate max-w-[140px]">
                        {parent ? parent.organization_name : 'Kwartir Nasional (Akar)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] dark:text-slate-400">
                      <span>Wilayah:</span>
                      <span className="text-[#171717] dark:text-slate-200 truncate max-w-[140px]">
                        {[org.city_name, org.province_name].filter(Boolean).join(', ') || 'Indonesia'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] dark:text-slate-400">
                      <span>Sub-organisasi:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{children.length} anak</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-2">
                  {linkedWs ? (
                    <div
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 flex-1 justify-center truncate min-h-[38px]"
                    >
                      <Server className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">{linkedWs.name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (onOpenWorkspaceWizard) {
                          onOpenWorkspaceWizard(org.organization_id);
                        } else {
                          setLinkingOrg(org);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-[#ECECEF] dark:border-white/10 text-[#6B7280] hover:text-[#171717] dark:text-slate-300 dark:hover:text-white text-xs font-medium flex items-center gap-1 transition-colors flex-1 justify-center cursor-pointer min-h-[38px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Workspace</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    {NEXT_LEVEL_MAP[org.organization_level] && (
                      <button
                        onClick={() => handleOpenCreateChild(org)}
                        className="p-1.5 rounded-xl bg-[#FFF0F4] hover:bg-[#FFE0E8] text-[#F47743] border border-[#FFE0E8] dark:bg-white/5 dark:border-white/10 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title={`Tambah ${NEXT_LEVEL_MAP[org.organization_level]}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(org)}
                      className="p-1.5 rounded-xl bg-[#FAFAFA] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-[#6B7280] hover:text-[#171717] dark:text-slate-300 dark:hover:text-white border border-[#ECECEF] dark:border-white/10 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Edit Organisasi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE / EDIT ORGANIZATION */}
      {modalMode && editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#171717] dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#208C60]" />
                  <span>
                    {modalMode === 'edit'
                      ? 'Edit Data Organisasi'
                      : modalMode === 'child' && parentOrgForChild
                      ? `Tambah Anak Organisasi (${parentOrgForChild.organization_name})`
                      : 'Tambah Organisasi Kepramukaan'}
                  </span>
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                  Pastikan kode wilayah dan nomor gudep sesuai Petunjuk Penyelenggaraan Kwartir Nasional.
                </p>
              </div>

              <button
                onClick={() => {
                  setModalMode(null);
                  setEditingOrg(null);
                  setParentOrgForChild(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Tingkat & Induk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#171717] dark:text-slate-200 font-semibold mb-1">Tingkat Organisasi</label>
                  <select
                    value={editingOrg.organization_level}
                    onChange={e => setEditingOrg({ ...editingOrg, organization_level: e.target.value as OrganizationLevel })}
                    className="w-full p-2.5 bg-white dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                    disabled={modalMode === 'child'}
                  >
                    <option value="KWARNAS">Kwartir Nasional (KWARNAS)</option>
                    <option value="KWARDA">Kwartir Daerah (KWARDA)</option>
                    <option value="KWARCAB">Kwartir Cabang (KWARCAB)</option>
                    <option value="KWARRAN">Kwartir Ranting (KWARRAN)</option>
                    <option value="GUDEP">Gugus Depan (GUDEP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#171717] dark:text-slate-200 font-semibold mb-1">Organisasi Induk (Parent)</label>
                  <select
                    value={editingOrg.parent_organization_id || ''}
                    onChange={e => setEditingOrg({ ...editingOrg, parent_organization_id: e.target.value || null })}
                    className="w-full p-2.5 bg-white dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                    disabled={modalMode === 'child' || editingOrg.organization_level === 'KWARNAS'}
                  >
                    <option value="">-- Tanpa Induk (Puncak Nasional) --</option>
                    {organizations
                      .filter(o => o.organization_id !== editingOrg.organization_id)
                      .map(o => (
                        <option key={o.organization_id} value={o.organization_id}>
                          [{o.organization_level}] {o.organization_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Kode & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#171717] dark:text-slate-200 font-semibold mb-1">Kode Organisasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 13.10.05"
                    value={editingOrg.organization_code || ''}
                    onChange={e => setEditingOrg({ ...editingOrg, organization_code: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white font-mono focus:outline-none focus:border-[#F47743]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#171717] dark:text-slate-200 font-semibold mb-1">Nama Organisasi / Kwartir *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kwartir Ranting Singojuruh"
                    value={editingOrg.organization_name || ''}
                    onChange={e => setEditingOrg({ ...editingOrg, organization_name: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                  />
                </div>
              </div>

              {/* Conditional Gudep & Pangkalan */}
              {editingOrg.organization_level === 'GUDEP' && (
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3">
                  <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5" />
                    <span>Identitas Gugus Depan & Pangkalan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Nomor Gudep</label>
                      <input
                        type="text"
                        placeholder="Contoh: 01.001 - 01.002"
                        value={editingOrg.gudep_number || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, gudep_number: e.target.value })}
                        className="w-full p-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base sm:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171717] dark:text-slate-300 mb-1">Pangkalan (Sekolah / Kampus)</label>
                      <input
                        type="text"
                        placeholder="Contoh: SMAN 1 Pangkalan / Gudep"
                        value={editingOrg.base_institution || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, base_institution: e.target.value, pangkalan: e.target.value })}
                        className="w-full p-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base sm:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wilayah Administratif */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#171717] dark:text-slate-300">Wilayah Administratif</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Provinsi (Contoh: Jawa Timur)"
                      value={editingOrg.province_name || ''}
                      onChange={e => setEditingOrg({ ...editingOrg, province_name: e.target.value })}
                      className="w-full p-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base sm:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Kabupaten / Kota"
                      value={editingOrg.city_name || ''}
                      onChange={e => setEditingOrg({ ...editingOrg, city_name: e.target.value })}
                      className="w-full p-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base sm:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Kecamatan"
                      value={editingOrg.district_name || ''}
                      onChange={e => setEditingOrg({ ...editingOrg, district_name: e.target.value })}
                      className="w-full p-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base sm:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#F47743]"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-slate-300 mb-1">Status Operasional</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#171717] dark:text-slate-300">
                    <input
                      type="radio"
                      name="org_status"
                      checked={editingOrg.status === 'active'}
                      onChange={() => setEditingOrg({ ...editingOrg, status: 'active' })}
                      className="accent-[#F47743]"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#6B7280] dark:text-slate-400">
                    <input
                      type="radio"
                      name="org_status"
                      checked={editingOrg.status === 'inactive'}
                      onChange={() => setEditingOrg({ ...editingOrg, status: 'inactive' })}
                      className="accent-rose-500"
                    />
                    <span>Nonaktif / Diberhentikan Sementara</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECEF] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setEditingOrg(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{modalMode === 'edit' ? 'Simpan Perubahan' : 'Daftarkan Organisasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK TO WORKSPACE */}
      {linkingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <h3 className="text-base font-bold text-[#171717] dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-[#208C60]" />
                <span>Tautkan Workspace Kwartir</span>
              </h3>
              <button
                onClick={() => setLinkingOrg(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#6B7280] dark:text-slate-300 space-y-3">
              <p>
                Pilih workspace yang akan ditautkan dengan entitas{' '}
                <strong className="text-[#171717] dark:text-white">{linkingOrg.organization_name}</strong> ({linkingOrg.organization_level}):
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      // Link workspace to organization
                      ws.organization_id = linkingOrg.organization_id;
                      ws.organization_level = linkingOrg.organization_level;
                      setWorkspaces([...workspaceService.getWorkspaces()]);
                      setLinkingOrg(null);
                    }}
                    className="w-full p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-[#ECECEF] dark:border-white/5 hover:border-purple-300 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-[#171717] dark:text-white">{ws.name}</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400">{ws.region} · Admin: {ws.adminName.split(',')[0]}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#ECECEF] dark:border-white/10 flex justify-end">
                <button
                  onClick={() => setLinkingOrg(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-[#171717] dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
