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
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [selectedMemberType, setSelectedMemberType] = useState<'peserta' | 'pembina'>(
    currentUser.memberType || 'peserta'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    currentUser.memberId || (participants[0]?.regId || 'JAM-P-001')
  );

  const handleApplyRole = (role: UserRole) => {
    if (role === 'admin') {
      if (currentUser.role === 'admin') {
        onClose();
        return;
      }
      // Cannot bypass admin security! Redirect to AuthModal login
      onClose();
      if (onOpenAuthModal) {
        onOpenAuthModal('login');
      }
      return;
    } else if (role === 'public') {
      onSelectRole({
        role: 'public',
        name: 'Pengunjung Umum (Publik)',
      });
      onClose();
    } else if (role === 'member') {
      let memberName = '';
      if (selectedMemberType === 'peserta') {
        const found = participants.find((p) => p.regId === selectedMemberId);
        memberName = found ? `${found.fullName} (${found.regu})` : 'Peserta Pramuka';
      } else {
        const found = leaders.find((l) => l.regId === selectedMemberId);
        memberName = found ? `${found.fullName} (${found.role})` : 'Pembina Pendamping';
      }

      onSelectRole({
        role: 'member',
        name: memberName,
        memberId: selectedMemberId,
        memberType: selectedMemberType,
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
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Pilih Akses Pengguna
                </h3>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                  Level Akses
                </span>
              </div>
              <p className="text-xs text-red-100">
                Sistem membedakan fitur sesuai level: Admin, Member, atau Publik
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
          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Uji Coba Multi-Level Akses:</span> Silakan pilih level pengguna di bawah ini untuk melihat adaptasi antarmuka, hak izin, dan fitur yang disesuaikan secara dinamis.
            </div>
          </div>

          {/* Role Cards */}
          <div className="space-y-3">
            {/* 1. ADMIN */}
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
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">SuperAdmin / Admin Panitia</h4>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800 border border-red-200">
                        Otoritas Penuh (Wajib Login)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Memiliki akses Dashboard Admin, Pemindai QR Presensi, Pengaturan Tautan Maskot Resmi, Manajemen Banner, Sponsor, Jadwal, dan Google Sheets. Wajib login dengan akun panitia terdaftar.
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
                  {currentUser.role === 'admin' ? (
                    <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Sedang aktif: <strong>{currentUser.name}</strong></span>
                    </div>
                  ) : (
                    <div className="text-amber-800 font-medium text-[11px]">
                      🔒 Perlu verifikasi login akun SuperAdmin / Admin
                    </div>
                  )}

                  <button
                    onClick={() => handleApplyRole('admin')}
                    className="flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow transition whitespace-nowrap"
                  >
                    <span>{currentUser.role === 'admin' ? 'Tetap Sebagai Admin' : 'Login SuperAdmin / Admin'}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. MEMBER (PRAMUKA & PEMBINA) */}
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
                        Member (Peserta &amp; Pembina Terdaftar)
                      </h4>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                        Pramuka &amp; Bindamping
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Peserta kegiatan yang telah mendaftar resmi. Dapat mengakses jadwal terperinci, melihat dan mencetak ID Card pribadi dengan QR Code, serta dokumentasi kegiatan.
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
                  <div className="font-bold text-slate-800">Simulasikan Profil Anggota:</div>
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
                      Anggota Pramuka ({participants.length})
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
                      Pembina Pendamping ({leaders.length})
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
                      <span>Masuk sebagai Member</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. PUBLIK (VISITOR) */}
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
                      <h4 className="text-sm font-black text-slate-900">Publik (Pengunjung Umum)</h4>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                        Visitor &amp; Tamu
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Pengunjung biasa, orang tua peserta, atau masyarakat umum. Dapat melihat beranda, jadwal kegiatan publik, galeri video/foto, serta mendaftarkan diri untuk memperoleh <strong>QR Code E-Tiket Visitor Kunjungan</strong>.
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
                    <span>+ Daftar Tiket Kunjungan Baru</span>
                  </button>

                  <button
                    onClick={() => handleApplyRole('public')}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow transition"
                  >
                    <span>Masuk sebagai Publik</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
