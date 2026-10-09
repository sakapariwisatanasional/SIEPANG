/**
 * @license
 * SiEpang - Document Canvas Editor (Requirements 129 - 140, 154 - 158, 185 - 192)
 * Interactive Canva-like visual editor:
 * - Real-time element dragging and resizing (percentage-based normalized coordinates)
 * - Typography styling, photo crop modes, dynamic field binding
 * - Signatories blocks with signature, stamp, title, and organization
 * - QR code preview (Participant QR or Certificate Verify QR)
 * - Safe margin & bleed guidelines
 * - Undo / Redo support
 * - Live preview with real active event data
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Type,
  Image as ImageIcon,
  QrCode,
  Award,
  Layers,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Plus,
  Sliders,
  Users,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Undo2,
  Redo2,
  Settings,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import {
  DocumentTemplate,
  TemplateElement,
  DocumentElementType,
  Signatory,
} from '../../types';
import {
  documentStudioService,
  AVAILABLE_DYNAMIC_FIELDS,
  PAPER_DIMENSIONS,
} from '../../services/documentStudioService';
import { participantService } from '../../services/participantService';

interface DocumentCanvasProps {
  template: DocumentTemplate;
  onUpdateTemplate: (updated: DocumentTemplate) => void;
  onClose: () => void;
}

export const DocumentCanvasEditor: React.FC<DocumentCanvasProps> = ({
  template,
  onUpdateTemplate,
  onClose,
}) => {
  const [activePage, setActivePage] = useState<'FRONT' | 'BACK'>('FRONT');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showSafeGuide, setShowSafeGuide] = useState<boolean>(true);
  const [previewWithRealData, setPreviewWithRealData] = useState<boolean>(true);
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState<number>(0);
  const [signatories, setSignatories] = useState<Signatory[]>(documentStudioService.getSignatories());
  const [showFieldPicker, setShowFieldPicker] = useState<boolean>(false);
  const [history, setHistory] = useState<DocumentTemplate[]>([JSON.parse(JSON.stringify(template))]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'elements' | 'properties'>('none');

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elemX: number; elemY: number }>({ x: 0, y: 0, elemX: 0, elemY: 0 });

  const participants = participantService.getParticipants();
  const activeParticipant = participants[selectedParticipantIndex] || {
    id: '',
    name: 'Nama Peserta',
    code: 'NOMOR-001',
    role: 'Penggalang',
    contingentName: 'Nama Kontingen',
    photoUrl: '',
  };

  const currentElements = template.elements.filter(el => el.page === activePage);
  const selectedElement = template.elements.find(el => el.id === selectedElementId);

  // Push state to undo stack
  const pushHistory = (newTemplate: DocumentTemplate) => {
    const trimmed = history.slice(0, historyIndex + 1);
    setHistory([...trimmed, JSON.parse(JSON.stringify(newTemplate))]);
    setHistoryIndex(trimmed.length);
    onUpdateTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdateTemplate(JSON.parse(JSON.stringify(prev)));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onUpdateTemplate(JSON.parse(JSON.stringify(next)));
    }
  };

  // Canvas aspect ratio calculation
  const isLandscape = template.orientation === 'LANDSCAPE';
  const widthMm = template.widthMm;
  const heightMm = template.heightMm;
  const aspectRatio = widthMm / heightMm;

  // Add a new element to current page
  const handleAddElement = (type: DocumentElementType, preset?: Partial<TemplateElement>) => {
    const newElement: TemplateElement = {
      id: `EL-${Date.now()}`,
      name: preset?.name || `Elemen ${type}`,
      page: activePage,
      type,
      x: 20,
      y: 30,
      width: type === 'QR_CODE' || type === 'PHOTO' ? 25 : 60,
      height: type === 'QR_CODE' ? 25 : type === 'PHOTO' ? 30 : 8,
      rotation: 0,
      zIndex: template.elements.length + 10,
      visible: true,
      locked: false,
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
      alignment: 'center',
      ...preset,
    };

    const updated: DocumentTemplate = {
      ...template,
      elements: [...template.elements, newElement],
    };

    pushHistory(updated);
    setSelectedElementId(newElement.id);
  };

  const handleUpdateElement = (id: string, updates: Partial<TemplateElement>) => {
    const updatedElements = template.elements.map(el => (el.id === id ? { ...el, ...updates } : el));
    const updatedTemplate: DocumentTemplate = {
      ...template,
      elements: updatedElements,
    };
    pushHistory(updatedTemplate);
  };

  const handleDeleteElement = (id: string) => {
    const updatedElements = template.elements.filter(el => el.id !== id);
    const updatedTemplate: DocumentTemplate = {
      ...template,
      elements: updatedElements,
    };
    pushHistory(updatedTemplate);
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (el: TemplateElement) => {
    const copy: TemplateElement = {
      ...JSON.parse(JSON.stringify(el)),
      id: `EL-${Date.now()}`,
      name: `${el.name} (Salinan)`,
      x: Math.min(el.x + 4, 80),
      y: Math.min(el.y + 4, 80),
      zIndex: template.elements.length + 10,
    };
    const updatedTemplate: DocumentTemplate = {
      ...template,
      elements: [...template.elements, copy],
    };
    pushHistory(updatedTemplate);
    setSelectedElementId(copy.id);
  };

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    if (el.locked) return;
    e.stopPropagation();
    setSelectedElementId(el.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elemX: el.x,
      elemY: el.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedElementId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(95, Math.round(dragStart.elemX + deltaX)));
      const newY = Math.max(0, Math.min(95, Math.round(dragStart.elemY + deltaY)));

      handleUpdateElement(selectedElementId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, selectedElementId]);

  // Background active URL
  const currentBgUrl = activePage === 'FRONT' ? template.backgroundUrl : template.backBackgroundUrl;

  const handleSaveDraft = () => {
    documentStudioService.updateTemplate(template.id, { status: 'DRAFT' });
    setSaveToast('Draft template berhasil disimpan secara aman!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handlePublishActive = () => {
    documentStudioService.updateTemplate(template.id, { status: 'ACTIVE' }, true);
    setSaveToast('Template berhasil diaktifkan untuk penerbitan dokumen!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-[#0E1511] text-[#171717] dark:text-slate-100 overflow-hidden select-none">
      {/* 1. TOP TOOLBAR (Icon-First Mobile Design) */}
      <header className="h-14 bg-white dark:bg-[#141418] border-b border-[#ECECEF] dark:border-white/10 px-2 sm:px-4 flex items-center justify-between shrink-0 gap-1.5 sm:gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[100px] min-[360px]:max-w-[130px] sm:max-w-[200px]">{template.name}</h2>
              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                template.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
              }`}>
                v{template.version}
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 truncate hidden min-[360px]:block">
              {template.pageSize} · {template.orientation}
            </div>
          </div>
        </div>

        {/* Center Page Selector & Undo/Redo */}
        <div className="flex items-center gap-1 sm:gap-2">
          {template.hasBackPage && (
            <div className="flex bg-black/40 p-0.5 sm:p-1 rounded-xl border border-white/5 text-[10px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivePage('FRONT')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all ${
                  activePage === 'FRONT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Depan
              </button>
              <button
                type="button"
                onClick={() => setActivePage('BACK')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all ${
                  activePage === 'BACK' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Belakang
              </button>
            </div>
          )}

          {/* Undo / Redo with Lucide Undo2 and Redo2 (Req 123) */}
          <div className="flex items-center gap-0.5 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Live Preview Toggle with Eye Icon (Req 123) */}
          <button
            type="button"
            onClick={() => setPreviewWithRealData(!previewWithRealData)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer transition-colors ${
              previewWithRealData
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
            title={previewWithRealData ? 'Pratinjau Data Aktif' : 'Pratinjau Mode Desain'}
            aria-label="Toggle Pratinjau Data"
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              title="Perkecil"
              aria-label="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              title="Perbesar"
              aria-label="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile triggers: Plus for elements, Settings for properties */}
          <button
            type="button"
            onClick={() => setMobileDrawer(mobileDrawer === 'elements' ? 'none' : 'elements')}
            className={`md:hidden p-2 rounded-xl border text-xs font-bold flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer ${
              mobileDrawer === 'elements'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
            }`}
            title="Tambah Elemen Dokumen"
            aria-label="Tambah Elemen Dokumen"
          >
            <Plus className="w-4 h-4" />
          </button>
          {selectedElement && (
            <button
              type="button"
              onClick={() => setMobileDrawer(mobileDrawer === 'properties' ? 'none' : 'properties')}
              className={`md:hidden p-2 rounded-xl text-xs font-bold flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer ${
                mobileDrawer === 'properties'
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-white'
              }`}
              title="Pengaturan Properti Elemen"
              aria-label="Pengaturan Properti Elemen"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 flex items-center gap-1 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 cursor-pointer"
            title="Simpan Draft"
            aria-label="Simpan Draft"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Draft</span>
          </button>
          <button
            type="button"
            onClick={handlePublishActive}
            className="p-2 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-xs font-bold text-white shadow-md flex items-center gap-1 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 cursor-pointer"
            title="Aktifkan Template"
            aria-label="Aktifkan Template"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Aktifkan Template</span>
          </button>
        </div>
      </header>

      {/* Floating Save Toast */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2">
          {saveToast}
        </div>
      )}

      {/* 2. MAIN WORKSPACE (LEFT TOOLBOX, CENTER CANVAS, RIGHT PROPERTIES) */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT TOOLBOX (Insert Elements) - Hidden on mobile unless mobileDrawer === 'elements' */}
        <aside className={`${
          mobileDrawer === 'elements'
            ? 'fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#141418] max-h-[80vh] border-t border-[#ECECEF] dark:border-white/10 p-4 shadow-2xl rounded-t-[28px] overflow-y-auto animate-in slide-in-from-bottom'
            : 'hidden md:flex'
        } w-full md:w-64 bg-white dark:bg-[#141418] border-r border-[#ECECEF] dark:border-white/10 flex-col p-3 space-y-3 shrink-0 overflow-y-auto`}>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tambah Elemen
            </span>
            {mobileDrawer === 'elements' && (
              <button
                type="button"
                onClick={() => setMobileDrawer('none')}
                className="md:hidden text-xs text-slate-400 hover:text-white"
              >
                Tutup ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleAddElement('STATIC_TEXT', { staticValue: 'TEKS JUDUL', fontSize: 16 })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors"
            >
              <Type className="w-4 h-4" />
              <span className="font-semibold text-[11px]">+ Teks Statis</span>
            </button>

            <button
              onClick={() => setShowFieldPicker(true)}
              className="p-2.5 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex flex-col items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-[11px]">+ Data Binding</span>
            </button>

            <button
              onClick={() => handleAddElement('PHOTO', { name: 'Foto Peserta', dataSource: 'participant.photo' })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="font-semibold text-[11px]">+ Foto Peserta</span>
            </button>

            <button
              onClick={() => handleAddElement('QR_CODE', { name: 'Kode QR', qrType: 'PARTICIPANT_QR' })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span className="font-semibold text-[11px]">+ Kode QR</span>
            </button>

            <button
              onClick={() => handleAddElement('SIGNATORY_BLOCK', {
                name: 'Blok Penandatangan',
                signatoryId: signatories[0]?.id,
                showSignatureImage: true,
                showSignatoryName: true,
                showSignatoryTitle: true,
                showStamp: true,
                width: 35,
                height: 22,
              })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors col-span-2"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-[11px]">+ Pejabat & Tanda Tangan</span>
            </button>

            <button
              onClick={() => handleAddElement('DOCUMENT_NUMBER', {
                name: 'Nomor Dokumen',
                dataSource: 'document.number',
                staticValue: 'NO/DOKUMEN/001',
                fontSize: 11,
              })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-[11px]">+ No. Dokumen</span>
            </button>

            <button
              onClick={() => handleAddElement('STAMP_IMAGE', {
                name: 'Stempel Resmi',
                imageUrl: signatories[0]?.stampUrl,
                width: 20,
                height: 20,
              })}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-white/5 flex flex-col items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-[11px]">+ Stempel Kwarran</span>
            </button>
          </div>

          {/* Background Settings */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Background {activePage === 'FRONT' ? 'Depan' : 'Belakang'}
            </div>
            <div className="p-3 bg-white/5 rounded-2xl space-y-2 border border-white/5">
              <input
                type="text"
                placeholder="URL Gambar / Google Drive"
                value={activePage === 'FRONT' ? template.backgroundUrl : template.backBackgroundUrl || ''}
                onChange={e => {
                  if (activePage === 'FRONT') {
                    handleUpdateElement('', {}); // trigger push
                    onUpdateTemplate({ ...template, backgroundUrl: e.target.value });
                  } else {
                    onUpdateTemplate({ ...template, backBackgroundUrl: e.target.value });
                  }
                }}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[10px] text-slate-400">
                Penyimpanan: Google Drive Kwartir (/SiEpang/Templates/)
              </div>
            </div>
          </div>

          {/* Simulation Record Switcher */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pratinjau Data
              </span>
              <label className="flex items-center gap-1.5 text-[10px] text-emerald-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={previewWithRealData}
                  onChange={e => setPreviewWithRealData(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Aktif</span>
              </label>
            </div>

            <select
              value={selectedParticipantIndex}
              onChange={e => setSelectedParticipantIndex(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {participants.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Guidelines toggles */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showSafeGuide}
                onChange={e => setShowSafeGuide(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Garis Batas Aman Cetak (Safe Area)</span>
            </label>
          </div>
        </aside>

        {/* CENTER DOCUMENT CANVAS AREA (Confined viewport, Section 113) */}
        <main
          className="flex-1 w-full max-w-full bg-[#09100B] overflow-auto flex items-center justify-center p-3 sm:p-8 relative min-w-0"
          onClick={() => setSelectedElementId(null)}
        >
          <div
            ref={canvasRef}
            style={{
              width: `${(template.orientation === 'LANDSCAPE' ? 760 : 440) * (zoomLevel / 100)}px`,
              maxWidth: '100%',
              aspectRatio: `${aspectRatio}`,
              backgroundImage: currentBgUrl ? `url('${currentBgUrl}')` : undefined,
              backgroundSize: template.backgroundBehavior || 'cover',
              backgroundPosition: 'center',
            }}
            className="bg-white rounded-2xl shadow-2xl border border-white/20 relative select-none overflow-hidden transition-all shrink-0"
          >
            {/* Safe Margin / Bleed guideline overlay */}
            {showSafeGuide && (
              <div className="absolute inset-3 border border-dashed border-sky-400/40 pointer-events-none z-40 rounded-xl flex items-start justify-end p-1">
                <span className="text-[9px] font-mono text-sky-400/80 bg-black/40 px-1.5 py-0.5 rounded">
                  Area Aman Potong
                </span>
              </div>
            )}

            {/* Elements Layer */}
            {currentElements.map(el => {
              if (!el.visible) return null;
              const isSelected = selectedElementId === el.id;

              // Render live preview value
              let displayContent = el.staticValue || '';
              if (el.dataSource && previewWithRealData) {
                displayContent = documentStudioService.resolveFieldValue(el.dataSource, {
                  participant: activeParticipant,
                  customRole: el.templateString ? undefined : activeParticipant.role,
                  docNumber: 'NO/DOKUMEN/001',
                  signatories,
                });
              }

              return (
                <div
                  key={el.id}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                  onMouseDown={e => handleMouseDown(e, el)}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: el.height ? `${el.height}%` : undefined,
                    zIndex: el.zIndex,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  }}
                  className={`cursor-move transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 shadow-xl rounded-lg'
                      : 'hover:ring-1 hover:ring-emerald-400/50'
                  }`}
                >
                  {/* TEXT / DYNAMIC TEXT ELEMENT */}
                  {(el.type === 'TEXT' || el.type === 'STATIC_TEXT' || el.type === 'DYNAMIC_TEXT' || el.type === 'DOCUMENT_NUMBER') && (
                    <div
                      style={{
                        fontFamily: el.fontFamily || 'Inter',
                        fontSize: `${(el.fontSize || 14) * (zoomLevel / 100)}px`,
                        fontWeight: el.fontWeight || 'normal',
                        color: el.color || '#FFFFFF',
                        textAlign: el.alignment || 'center',
                        textTransform: el.uppercase ? 'uppercase' : 'none',
                        fontStyle: el.italic ? 'italic' : 'normal',
                        textDecoration: el.underline ? 'underline' : 'none',
                        lineHeight: el.lineHeight || 1.2,
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                        backgroundColor: el.backgroundColor || 'transparent',
                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                      }}
                      className="w-full h-full p-1 select-none whitespace-pre-wrap leading-tight"
                    >
                      {displayContent || el.name}
                    </div>
                  )}

                  {/* PHOTO ELEMENT */}
                  {el.type === 'PHOTO' && (
                    <div
                      style={{
                        borderRadius: el.photoCrop === 'circle' ? '9999px' : el.borderRadius ? `${el.borderRadius}px` : '12px',
                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
                        borderColor: el.borderColor || '#F59E0B',
                      }}
                      className="w-full h-full overflow-hidden shadow-md bg-slate-800 flex items-center justify-center border"
                    >
                      {previewWithRealData && activeParticipant.photoUrl ? (
                        <img
                          src={activeParticipant.photoUrl}
                          alt={el.name}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <Users className="w-6 h-6 mb-1 opacity-60" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Foto Resmi</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR CODE ELEMENT */}
                  {el.type === 'QR_CODE' && (
                    <div
                      style={{
                        backgroundColor: el.backgroundColor || '#FFFFFF',
                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : '8px',
                      }}
                      className="w-full h-full p-2 flex items-center justify-center shadow"
                    >
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                  )}

                  {/* STAMP IMAGE */}
                  {el.type === 'STAMP_IMAGE' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={el.imageUrl || signatories[0]?.stampUrl}
                        alt="Stempel"
                        className="w-full h-full object-contain pointer-events-none opacity-90 drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* SIGNATORY BLOCK ELEMENT */}
                  {el.type === 'SIGNATORY_BLOCK' && (() => {
                    const sig = signatories.find(s => s.id === el.signatoryId) || signatories[0];
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-between text-center p-1 relative">
                        {/* Stamp overlay if active */}
                        {el.showStamp && sig?.stampUrl && (
                          <img
                            src={sig.stampUrl}
                            alt="Stempel"
                            className="absolute -left-2 top-2 w-12 h-12 object-contain opacity-75 pointer-events-none"
                          />
                        )}

                        {/* Signature Image */}
                        {el.showSignatureImage && sig?.signatureUrl && (
                          <div className="h-10 w-24 flex items-center justify-center">
                            <img
                              src={sig.signatureUrl}
                              alt="Tanda Tangan"
                              className="max-h-full max-w-full object-contain pointer-events-none"
                            />
                          </div>
                        )}

                        {/* Name & Title */}
                        <div className="mt-1 space-y-0.5">
                          {el.showSignatoryName && (
                            <div className="text-[11px] font-bold text-slate-900 underline">
                              {sig?.fullName || 'Nama Penandatangan'}
                            </div>
                          )}
                          {el.showSignatoryTitle && (
                            <div className="text-[9px] font-semibold text-slate-700">
                              {sig?.positionTitle || 'Jabatan Penandatangan'}
                            </div>
                          )}
                          {el.showSignatoryOrganization && (
                            <div className="text-[8px] text-slate-500">
                              {sig?.organizationName || 'Kwartir Penyelenggara'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </main>

        {/* RIGHT PROPERTY INSPECTOR - Hidden on mobile unless mobileDrawer === 'properties' */}
        <aside className={`${
          mobileDrawer === 'properties'
            ? 'fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#141418] max-h-[80vh] border-t border-[#ECECEF] dark:border-white/10 p-4 shadow-2xl rounded-t-[28px] overflow-y-auto animate-in slide-in-from-bottom'
            : 'hidden md:flex'
        } w-full md:w-72 bg-white dark:bg-[#141418] border-l border-[#ECECEF] dark:border-white/10 flex-col p-4 space-y-4 shrink-0 overflow-y-auto`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {selectedElement ? 'Properti Elemen' : 'Pengaturan Lembar'}
            </span>
            <div className="flex items-center gap-1">
              {mobileDrawer === 'properties' && (
                <button
                  type="button"
                  onClick={() => setMobileDrawer('none')}
                  className="md:hidden text-xs text-slate-400 hover:text-white mr-2"
                >
                  Tutup ✕
                </button>
              )}
              {selectedElement && (
                <>
                  <button
                    onClick={() => handleDuplicateElement(selectedElement)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Duplikat"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedElement ? (
            <div className="space-y-4 text-xs">
              {/* Element Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Nama Elemen</label>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={e => handleUpdateElement(selectedElement.id, { name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              {/* Data Binding Selector */}
              {(selectedElement.type === 'DYNAMIC_TEXT' || selectedElement.type === 'TEXT') && (
                <div className="p-3 bg-white/5 rounded-2xl space-y-2 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">Sumber Data (Field)</span>
                    <button
                      onClick={() => setShowFieldPicker(true)}
                      className="text-[10px] text-emerald-400 font-bold hover:underline"
                    >
                      Ubah Field
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300 truncate">
                    {selectedElement.dataSource || '(Teks Statis)'}
                  </div>
                </div>
              )}

              {/* Static Value input */}
              {selectedElement.type === 'STATIC_TEXT' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Isi Teks Statis</label>
                  <textarea
                    rows={3}
                    value={selectedElement.staticValue || ''}
                    onChange={e => handleUpdateElement(selectedElement.id, { staticValue: e.target.value })}
                    className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white resize-none"
                  />
                </div>
              )}

              {/* Typography Controls */}
              {(selectedElement.type.includes('TEXT') || selectedElement.type === 'DOCUMENT_NUMBER') && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tipografi & Warna</div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Ukuran (pt)</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 14}
                        onChange={e => handleUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Warna Teks</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedElement.color || '#FFFFFF'}
                          onChange={e => handleUpdateElement(selectedElement.id, { color: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{selectedElement.color}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alignment & Style Buttons */}
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { alignment: 'left' })}
                      className={`p-1.5 rounded-lg flex-1 flex justify-center ${selectedElement.alignment === 'left' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { alignment: 'center' })}
                      className={`p-1.5 rounded-lg flex-1 flex justify-center ${selectedElement.alignment === 'center' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { alignment: 'right' })}
                      className={`p-1.5 rounded-lg flex-1 flex justify-center ${selectedElement.alignment === 'right' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      className={`p-1.5 rounded-lg flex-1 flex justify-center ${selectedElement.fontWeight === 'bold' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { uppercase: !selectedElement.uppercase })}
                      className={`p-1.5 rounded-lg flex-1 flex justify-center text-[10px] font-bold ${selectedElement.uppercase ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      AA
                    </button>
                  </div>
                </div>
              )}

              {/* Photo specific properties */}
              {selectedElement.type === 'PHOTO' && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Potongan Foto (Crop)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { photoCrop: 'rounded', borderRadius: 16 })}
                      className={`py-1.5 rounded-xl border text-[11px] font-semibold ${selectedElement.photoCrop === 'rounded' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 border-white/5 text-slate-400'}`}
                    >
                      Sudut Bulat
                    </button>
                    <button
                      onClick={() => handleUpdateElement(selectedElement.id, { photoCrop: 'circle' })}
                      className={`py-1.5 rounded-xl border text-[11px] font-semibold ${selectedElement.photoCrop === 'circle' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 border-white/5 text-slate-400'}`}
                    >
                      Lingkaran
                    </button>
                  </div>
                </div>
              )}

              {/* Signatory Block Properties */}
              {selectedElement.type === 'SIGNATORY_BLOCK' && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pejabat Penandatangan</div>
                  <select
                    value={selectedElement.signatoryId}
                    onChange={e => handleUpdateElement(selectedElement.id, { signatoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs"
                  >
                    {signatories.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.positionTitle})
                      </option>
                    ))}
                  </select>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedElement.showSignatureImage ?? true}
                        onChange={e => handleUpdateElement(selectedElement.id, { showSignatureImage: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Tampilkan Gambar Tanda Tangan</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedElement.showSignatoryName ?? true}
                        onChange={e => handleUpdateElement(selectedElement.id, { showSignatoryName: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Tampilkan Nama Lengkap Pejabat</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedElement.showSignatoryTitle ?? true}
                        onChange={e => handleUpdateElement(selectedElement.id, { showSignatoryTitle: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Tampilkan Jabatan</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedElement.showStamp ?? false}
                        onChange={e => handleUpdateElement(selectedElement.id, { showStamp: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span>Tampilkan Stempel Kwarran</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Position & Size slider */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Posisi & Ukuran (%)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Posisi X</span>
                      <span>{selectedElement.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.x}
                      onChange={e => handleUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Posisi Y</span>
                      <span>{selectedElement.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.y}
                      onChange={e => handleUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Lebar (W)</span>
                      <span>{selectedElement.width}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={selectedElement.width}
                      onChange={e => handleUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Rotasi</span>
                      <span>{selectedElement.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={selectedElement.rotation}
                      onChange={e => handleUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilih elemen pada lembar desain di sebelah kiri untuk mengatur posisi, font, warna, atau sumber data.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* DYNAMIC FIELD PICKER MODAL (Requirement 132) */}
      {showFieldPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Pilih Sumber Data (Field Picker)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tautkan teks elemen dengan data resmi peserta atau event dari sistem SiEpang.
                </p>
              </div>
              <button
                onClick={() => setShowFieldPicker(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {['Peserta', 'Kontingen', 'Event', 'Dokumen', 'Penandatangan'].map(cat => (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">
                    {cat}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.category === cat).map(f => (
                      <button
                        key={f.source}
                        onClick={() => {
                          if (selectedElementId) {
                            handleUpdateElement(selectedElementId, {
                              dataSource: f.source,
                              name: f.label,
                              type: 'DYNAMIC_TEXT',
                            });
                          } else {
                            handleAddElement('DYNAMIC_TEXT', {
                              dataSource: f.source,
                              name: f.label,
                            });
                          }
                          setShowFieldPicker(false);
                        }}
                        className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-left border border-white/5 hover:border-emerald-500/30 transition-all space-y-0.5"
                      >
                        <div className="text-xs font-semibold text-white">{f.label}</div>
                        <div className="text-[10px] font-mono text-emerald-400 truncate">{f.source}</div>
                        <div className="text-[9px] text-slate-400 truncate">Contoh: {f.sampleValue}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
