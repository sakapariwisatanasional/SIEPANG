/**
 * @license
 * SiEpang - Logistics Officer (Petugas Logistik) Home Screen
 * Prioritizes: Inventaris Gudang, Peminjaman & Pengembalian Alat,
 * Status Tenda & Perlengkapan, Distribusi Kontingen.
 */

import React from 'react';
import {
  Boxes,
  Tent,
  CheckCircle2,
  Clock,
  Plus,
  PackageCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard } from '../../components/common/GlobalUxComponents';

interface LogisticsOfficerHomeProps {
  onNavigate: (tab: NavTab) => void;
}

export const LogisticsOfficerHome: React.FC<LogisticsOfficerHomeProps> = ({
  onNavigate,
}) => {
  const quickItems = [
    { id: '1', name: 'Tenda Dome Regu (Kapasitas 6-8)', total: 120, loaned: 98, ready: 22 },
    { id: '2', name: 'Matras Gulung Pramuka', total: 500, loaned: 420, ready: 80 },
    { id: '3', name: 'Lampu Penerangan Lapangan & Genset', total: 24, loaned: 18, ready: 6 },
    { id: '4', name: 'Sound System Portable Pos Giat', total: 10, loaned: 8, ready: 2 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Header Greeting & Role Identity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
            <span>📦 Gudang & Logistik Buper</span>
            <span>·</span>
            <span>Manajemen Perlengkapan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Perlengkapan & Distribusi Perkemahan
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Kontrol stok tenda, alokasi sarana pos giat, dan pencatatan peminjaman kontingen.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => onNavigate('logistics')}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-[#E1306C] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
          <span>Catat Peminjaman / Distribusi</span>
        </button>
      </div>

      {/* 2. Key Metrics for Logistics (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value="48 Item"
          label="Kategori Barang"
          sublabel="Semua inventaris"
          color="purple"
          icon={Boxes}
          onClick={() => onNavigate('logistics')}
        />
        <MetricCard
          value="98 Tenda"
          label="Tenda Terpasang"
          sublabel="Alokasi kontingen"
          color="emerald"
          icon={Tent}
        />
        <MetricCard
          value="14 Peminjaman"
          label="Sedang Dipinjam"
          sublabel="Pos giat & panitia"
          color="amber"
          icon={Clock}
          onClick={() => onNavigate('logistics')}
        />
        <MetricCard
          value="100% Siap"
          label="Kesiapan Genset"
          sublabel="Bahan bakar terisi"
          color="blue"
          icon={CheckCircle2}
        />
      </div>

      {/* 3. Quick Item Status Table */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-500" />
            <span>Ketersediaan Sarana Utama</span>
          </h3>
          <button
            onClick={() => onNavigate('logistics')}
            className="text-[11px] font-bold text-[#833AB4] hover:underline"
          >
            Buka Inventaris Lengkap ›
          </button>
        </div>

        <div className="divide-y divide-[#ECECEF] dark:divide-white/5">
          {quickItems.map(item => (
            <div
              key={item.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-[#171717] dark:text-white">{item.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Total aset: {item.total} unit
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Dipinjam: <strong className="text-amber-600">{item.loaned}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  Tersedia: {item.ready}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
