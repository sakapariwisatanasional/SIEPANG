import React, { useState } from 'react';
import { UserRole, CurrentUser, Participant, Leader } from '../types';
import {
  X,
  Shield,
  UserCheck,
  Globe,
  Check,
  Sparkles,
  Award,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';

interface UserRoleModalProps {
  currentUser: CurrentUser;
  participants: Participant[];
  leaders: Leader[];
  onSelectRole: (newUser: CurrentUser) => void;
  onOpenVisitorRegister: () => void;
  onOpenAuthModal?: (tab?: 'login' | 'register') => void;
  onClose: () => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  currentUser,
  participants,
  leaders,
  onSelectRole,
  onOpenVisitorRegister,
  onOpenAuthModal,
  onClose,
}) => {
  const isSuperAdmin = Boolean(
    currentUser.adminLevel === 'superadmin' || currentUser.isSuperAdminSession
  );

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    currentUser.role === 'admin' ? 'admin' : currentUser.role
  );
  const [selectedMemberType, setSelectedMemberType] = useState<'peserta' | 'pembina'>(
    currentUser.memberType || 'peserta'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    currentUser.memberId || (participants[0]?.regId || 'JAM-P-001')
  );

  const handleApplyRole = (role: UserRole) => {
    if (!isSuperAdmin) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }

    if (role === 'admin') {
      onSelectRole({
        role: 'admin',
        name: 'SuperAdmin SIEPANG',
        id: 'SA-MASTER',
        adminLevel: 'superadmin',
        organization: 'Kwartir Pusat SIEPANG',
        isSuperAdminSession: true,
        isSimulating: false,
      });
      onClose();
    } else if (role === 'public') {
      onSelectRole({
        role: 'public',
        name: 'Pengunjung Umum (Demo Publik)',
        id: 'PUB-DEMO',
        organization: 'Tamu / Umum (Simulasi)',
        isSuperAdminSession: true,
        isSimulating: true,
      });
      onClose();
    } else if (role === 'member') {
      let memberName = '';
      if (selectedMemberType === 'peserta') {
        const found = participants.find((p) => p.regId === selectedMemberId);
        memberName = found ? `${found.fullName} (${found.regu})` : 'Peserta Pramuka (Demo)';
      } else {
        const found = leaders.find((l) => l.regId === selectedMemberId);
        memberName = found ? `${found.fullName} (${found.role})` : 'Pembina (Demo)';
      }

      onSelectRole({
        role: 'member',
        name: memberName,
        memberId: selectedMemberId,
        memberType: selectedMemberType,
        isSuperAdminSession: true,
        isSimulating: true,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-red-950 font-black shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Level Akses &amp; Akun Demo
                </h3>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                  Khusus SuperAdmin
                </span>
              </div>
              <p className="text-xs text-red-100">
                Uji coba tampilan antarmuka menggunakan akun demo Member &amp; Publik
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!isSuperAdmin ? (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/80 p-5 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-700 text-white shadow-md">
                <Shield className="h-6 w-6 text-amber-300" />
              </div>
              <h4 className="text-sm font-black text-red-950">Akses Terbatas: Khusus SuperAdmin</h4>
              <p className="text-xs text-red-800 leading-relaxed max-w-md mx-auto">
                Hanya SuperAdmin yang memiliki otorisasi untuk melihat dan beralih ke level akses menggunakan akun demo Member dan Publik.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal('login');
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-800 px-5 py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition"
                >
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span>Login Master SuperAdmin (siepang)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-amber-50/80 p-3 text-xs text-amber-950 border border-amber-300 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Panel Simulasi SuperAdmin:</span> Anda dapat beralih ke akun demo Member atau Publik untuk memverifikasi tampilan dan izin pengguna. Sesi SuperAdmin tetap terjaga dan Anda dapat kembali ke SuperAdmin kapan saja.
                </div>
              </div>

              {/* Role Cards */}
              <div className="space-y-3">
                {/* 1. MASTER SUPERADMIN */}
                <div
                  onClick={() => setSelectedRole('admin')}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    selectedRole === 'admin'
                      ? 'border-red-700 bg-red-50/60 shadow-md ring-1 ring-red-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-700 text-white shadow-sm">
                        <Shield className="h-5 w-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Master SuperAdmin (siepang)</h4>
                          <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800 border border-red-200">
                            Akses Master Penuh
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          Otoritas tertinggi tunggal. Hak penuh pada seluruh modul: Dashboard Panitia, Presensi QR Scanner, Manajemen Konten, Cloud Sheets, dan Tautan Maskot.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selectedRole === 'admin'
                          ? 'border-red-700 bg-red-700 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedRole === 'admin' && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {selectedRole === 'admin' && (
                    <div className="mt-3 pt-3 border-t border-red-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Akun Master Terverifikasi: <strong>siepang</strong></span>
                      </div>

                      <button
                        onClick={() => handleApplyRole('admin')}
                        className="flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow transition whitespace-nowrap"
                      >
                        <span>{currentUser.role === 'admin' && !currentUser.isSimulating ? 'Sedang Aktif' : 'Aktifkan Mode SuperAdmin'}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. DEMO MEMBER (PRAMUKA & PEMBINA) */}
                <div
                  onClick={() => setSelectedRole('member')}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    selectedRole === 'member'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">
                            Akun Demo Member (Peserta &amp; Pembina)
                          </h4>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                            Simulasi Demo
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          Uji coba sudut pandang peserta/pembina: ID Card digital, QR Code anggota, jadwal terperinci regu, dan materi kegiatan.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selectedRole === 'member'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedRole === 'member' && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {selectedRole === 'member' && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-800">Pilih Akun Demo Member yang Diuji:</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberType('peserta');
                            setSelectedMemberId(participants[0]?.regId || 'JAM-P-001');
                          }}
                          className={`rounded-lg px-3 py-1.5 font-bold transition text-xs ${
                            selectedMemberType === 'peserta'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Demo Peserta ({participants.length})
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberType('pembina');
                            setSelectedMemberId(leaders[0]?.regId || 'JAM-B-001');
                          }}
                          className={`rounded-lg px-3 py-1.5 font-bold transition text-xs ${
                            selectedMemberType === 'pembina'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Demo Pembina ({leaders.length})
                        </button>
                      </div>

                      {/* Dropdown to pick person */}
                      <div onClick={(e) => e.stopPropagation()} className="pt-1">
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                        >
                          {selectedMemberType === 'peserta'
                            ? participants.map((p) => (
                                <option key={p.id} value={p.regId}>
                                  {p.regId} - {p.fullName} ({p.regu}, {p.pangkalan})
                                </option>
                              ))
                            : leaders.map((l) => (
                                <option key={l.id} value={l.regId}>
                                  {l.regId} - {l.fullName} ({l.role})
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleApplyRole('member')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow transition"
                        >
                          <span>Terapkan Simulasi Demo Member</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. DEMO PUBLIK (VISITOR) */}
                <div
                  onClick={() => setSelectedRole('public')}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    selectedRole === 'public'
                      ? 'border-amber-500 bg-amber-50/60 shadow-md ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-red-950 font-bold shadow-sm">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Akun Demo Publik (Pengunjung Umum)</h4>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                            Simulasi Demo
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          Uji coba sudut pandang pengunjung / tamu: Hanya dapat melihat konten publik, jadwal terbuka, dan pendaftaran E-Tiket Kunjungan.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selectedRole === 'public'
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedRole === 'public' && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>

                  {selectedRole === 'public' && (
                    <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onOpenVisitorRegister();
                        }}
                        className="text-xs font-bold text-red-800 hover:underline flex items-center gap-1"
                      >
                        <span>+ Buka Form Tiket Kunjungan</span>
                      </button>

                      <button
                        onClick={() => handleApplyRole('public')}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow transition"
                      >
                        <span>Terapkan Simulasi Demo Publik</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
