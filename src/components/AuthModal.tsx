import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  User,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tent,
  KeyRound,
  ArrowRight,
  School,
  Mail,
  Phone,
  Compass,
} from 'lucide-react';
import { CurrentUser, Participant, Leader, UserRole } from '../types';
import { LOCAL_STORAGE_KEYS } from '../services/gasSyncService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  currentUser: CurrentUser;
  onLoginSuccess: (user: CurrentUser) => void;
  onRegisterParticipant?: (participant: Participant) => void;
  onRegisterLeader?: (leader: Leader) => void;
  participants: Participant[];
  leaders: Leader[];
}

export interface StoredAccount {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  passwordHash: string;
  identifierNumber?: string;
  organization?: string;
  regu?: string;
  division?: string;
  registeredAt: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  currentUser,
  onLoginSuccess,
  onRegisterParticipant,
  onRegisterLeader,
  participants,
  leaders,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [loginRole, setLoginRole] = useState<'member' | 'admin'>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [registerType, setRegisterType] = useState<'peserta' | 'pembina'>('peserta');
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regKwarcab, setRegKwarcab] = useState('Kwarcab Jakarta Timur');
  const [regRegu, setRegRegu] = useState('Rajawali');
  const [regGender, setRegGender] = useState<'Putra' | 'Putri'>('Putra');
  const [regBloodType, setRegBloodType] = useState('O');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  // Load custom registered accounts from localStorage (Strictly enforce no admin accounts in custom storage)
  const getRegisteredAccounts = (): StoredAccount[] => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNTS);
      if (!raw) return [];
      const accounts: StoredAccount[] = JSON.parse(raw);
      // Ensure no custom admin accounts exist in storage
      return accounts.filter((acc) => acc.role !== 'admin');
    } catch {
      return [];
    }
  };

  const saveRegisteredAccounts = (accounts: StoredAccount[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  };

  // 1-Click Instant Demo Logins
  const handleQuickLogin = (roleType: 'superadmin' | 'admin' | 'peserta' | 'pembina' | 'public') => {
    setErrorMessage('');
    let targetUser: CurrentUser;

    if (roleType === 'superadmin') {
      targetUser = {
        role: 'admin',
        adminLevel: 'superadmin',
        id: 'SUPERADM-001',
        name: 'Kak Dr. H. Adhyaksa (SuperAdmin Panitia Pusat)',
        organization: 'Kwartir Nasional Gerakan Pramuka',
      };
    } else if (roleType === 'admin') {
      targetUser = {
        role: 'admin',
        adminLevel: 'admin',
        id: 'ADM-001',
        name: 'Kak H. Budi Santoso, M.Pd (Admin Panitia)',
        organization: 'Kwarcab Gerakan Pramuka',
      };
    } else if (roleType === 'peserta') {
      const p = participants[0];
      targetUser = {
        role: 'member',
        id: p ? p.regId : 'JAM-P-001',
        name: p ? p.fullName : 'Ahmad Fauzi',
        organization: p ? p.pangkalan : 'SMPN 1 Cibubur',
        regu: p ? p.regu : 'Regu Rajawali',
        points: p ? p.points : 450,
      };
    } else if (roleType === 'pembina') {
      const l = leaders[0];
      targetUser = {
        role: 'member',
        id: l ? l.regId : 'JAM-B-001',
        name: l ? l.fullName : 'Kak Suryanto, S.Pd',
        organization: l ? l.pangkalan : 'SMPN 1 Cibubur',
      };
    } else {
      targetUser = {
        role: 'public',
        id: 'PUB-' + Math.floor(Math.random() * 900 + 100),
        name: 'Pengunjung / Wali Peserta',
        organization: 'Umum',
      };
    }

    triggerCelebration();
    setSuccessMessage(`Berhasil masuk sebagai ${targetUser.name}!`);
    setTimeout(() => {
      onLoginSuccess(targetUser);
      onClose();
    }, 600);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setErrorMessage('Harap masukkan Email, NTA Pramuka, atau Nomor Registrasi.');
      return;
    }

    if (!password) {
      setErrorMessage('Harap masukkan kata sandi.');
      return;
    }

    // 1. Check custom registered accounts
    const registered = getRegisteredAccounts();
    const foundCustom = registered.find(
      (acc) =>
        acc.email.toLowerCase() === identifier ||
        (acc.identifierNumber && acc.identifierNumber.toLowerCase() === identifier) ||
        acc.name.toLowerCase() === identifier
    );

    if (foundCustom) {
      if (foundCustom.passwordHash !== password) {
        setErrorMessage('Kata sandi salah. Silakan coba lagi.');
        return;
      }

      const loggedUser: CurrentUser = {
        role: foundCustom.role,
        id: foundCustom.id,
        name: foundCustom.name,
        organization: foundCustom.organization,
        regu: foundCustom.regu,
      };

      triggerCelebration();
      setSuccessMessage(`Selamat datang kembali, ${foundCustom.name}!`);
      setTimeout(() => {
        onLoginSuccess(loggedUser);
        onClose();
      }, 700);
      return;
    }

    // 2. Check Admin / SuperAdmin credentials (Master Password Enforced)
    if (loginRole === 'admin') {
      const isUsernameMatch =
        identifier === 'siepang' ||
        identifier === 'siepang@pramuka.id' ||
        identifier === 'siepang@siepang.id';
      const isPasswordMatch = password === 'siepang#2026!';

      if (isUsernameMatch && isPasswordMatch) {
        const superAdminUser: CurrentUser = {
          role: 'admin',
          adminLevel: 'superadmin',
          id: 'SUPERADM-SIEPANG',
          name: 'SuperAdmin SIEPANG',
          organization: 'Kwarcab Gerakan Pramuka',
          isSuperAdminSession: true,
          isSimulating: false,
        };
        triggerCelebration();
        setSuccessMessage('Login Master SuperAdmin Berhasil! Hak akses penuh dan level akses aktif.');
        setTimeout(() => {
          onLoginSuccess(superAdminUser);
          onClose();
        }, 700);
        return;
      }

      setErrorMessage(
        'Akses Ditolak: Username atau kata sandi SuperAdmin salah. Tidak ada akun lain yang tersedia untuk level superadmin/admin.'
      );
      return;
    }

    // 3. Check existing participant data
    const matchedParticipant = participants.find(
      (p) =>
        p.id.toLowerCase() === identifier ||
        p.regId.toLowerCase() === identifier ||
        p.fullName.toLowerCase().includes(identifier) ||
        p.nickname.toLowerCase() === identifier
    );

    if (matchedParticipant) {
      const user: CurrentUser = {
        role: 'member',
        id: matchedParticipant.regId,
        name: matchedParticipant.fullName,
        organization: matchedParticipant.pangkalan,
        regu: matchedParticipant.regu,
        points: matchedParticipant.points,
      };
      triggerCelebration();
      setSuccessMessage(`Login Peserta Berhasil: ${matchedParticipant.fullName}!`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 700);
      return;
    }

    // 4. Check existing leader data
    const matchedLeader = leaders.find(
      (l) =>
        l.id.toLowerCase() === identifier ||
        l.regId.toLowerCase() === identifier ||
        l.fullName.toLowerCase().includes(identifier) ||
        (l.email && l.email.toLowerCase() === identifier) ||
        (l.phone && l.phone.includes(identifier))
    );

    if (matchedLeader) {
      const user: CurrentUser = {
        role: 'member',
        id: matchedLeader.regId,
        name: matchedLeader.fullName,
        organization: matchedLeader.pangkalan,
      };
      triggerCelebration();
      setSuccessMessage(`Login Pembina Berhasil: ${matchedLeader.fullName}!`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 700);
      return;
    }

    // Fallback: If not strictly matched, allow login for member role only
    if (loginRole === 'member' && password.length >= 4) {
      const fallbackUser: CurrentUser = {
        role: 'member',
        id: 'JAM-' + Math.floor(Math.random() * 800 + 100),
        name: loginIdentifier.split('@')[0],
        organization: 'Gudep Pangkalan Pramuka',
      };
      triggerCelebration();
      setSuccessMessage(`Login berhasil sebagai ${fallbackUser.name}!`);
      setTimeout(() => {
        onLoginSuccess(fallbackUser);
        onClose();
      }, 700);
    } else {
      setErrorMessage(
        'Akun tidak ditemukan. Silakan periksa kembali Email/ID Registrasi atau daftar akun baru.'
      );
    }
  };

  // Submit Registration (Strictly for Member: Peserta & Pembina)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim()) {
      setErrorMessage('Harap isi Nama Lengkap.');
      return;
    }

    if (!regPassword.trim() || regPassword.length < 4) {
      setErrorMessage('Kata sandi minimal 4 karakter.');
      return;
    }

    const newId =
      registerType === 'peserta'
        ? `JAM-P-${Math.floor(100 + Math.random() * 900)}`
        : `JAM-B-${Math.floor(100 + Math.random() * 900)}`;

    const userRole: UserRole = 'member';

    // Store in accounts list
    const newAccount: StoredAccount = {
      id: newId,
      name: regName.trim(),
      role: userRole,
      email: regEmail.trim() || `${newId.toLowerCase()}@pramuka.id`,
      passwordHash: regPassword.trim(),
      identifierNumber: newId,
      organization: regSchool.trim() || regKwarcab,
      regu: registerType === 'peserta' ? regRegu : undefined,
      registeredAt: new Date().toLocaleDateString('id-ID'),
    };

    const existing = getRegisteredAccounts();
    saveRegisteredAccounts([...existing, newAccount]);

    // If Peserta, append to participants
    if (registerType === 'peserta' && onRegisterParticipant) {
      const newParticipant: Participant = {
        id: newId,
        regId: newId,
        fullName: regName.trim(),
        nickname: regNickname.trim() || regName.trim().split(' ')[0],
        pangkalan: regSchool.trim() || 'Gugus Depan Pangkalan',
        kwarcab: regKwarcab,
        kwarda: 'Kwarda DKI Jakarta',
        regu: `Regu ${regRegu}`,
        gender: regGender,
        bloodType: regBloodType,
        emergencyContact: {
          name: 'Orang Tua / Wali',
          relation: 'Wali',
          phone: regPhone || '0812-3456-7890',
        },
        checkInStatus: true,
        checkInTime: 'Baru Saja Terdaftar',
        campTenda: `Tenda ${regGender === 'Putra' ? 'PA' : 'PI'}-${Math.floor(Math.random() * 20 + 1)}`,
        points: 100, // starting point bonus
        completedPosts: ['POS-REGISTRASI'],
      };
      onRegisterParticipant(newParticipant);
    }

    // If Pembina, append to leaders
    if (registerType === 'pembina' && onRegisterLeader) {
      const newLeader: Leader = {
        id: newId,
        regId: newId,
        fullName: regName.trim(),
        pangkalan: regSchool.trim() || 'Gugus Depan Pangkalan',
        kwarcab: regKwarcab,
        phone: regPhone || '0812-3456-7890',
        email: regEmail || `${newId.toLowerCase()}@pramuka.id`,
        role: 'Pembina Pendamping Gugus Depan',
        assignedRegu: [regRegu ? `Regu ${regRegu}` : 'Regu Penggalang'],
        checkInStatus: true,
        checkInTime: 'Baru Saja Terdaftar',
      };
      onRegisterLeader(newLeader);
    }

    const newUser: CurrentUser = {
      role: userRole,
      id: newId,
      name: regName.trim(),
      organization: regSchool.trim() || regKwarcab,
      regu: registerType === 'peserta' ? `Regu ${regRegu}` : undefined,
      points: registerType === 'peserta' ? 100 : undefined,
    };

    triggerCelebration();
    setSuccessMessage(
      `Registrasi Berhasil! ID Anda: ${newId}. Anda sekarang masuk sebagai ${regName.trim()}.`
    );

    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 1000);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#ffffff', '#10b981'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400 text-red-950 font-black text-sm shadow-md">
                ⚜️
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Autentikasi SIEPANG</span>
                </h3>
                <p className="text-[11px] text-red-200">
                  Jambore Penggalang Gerakan Pramuka 2026
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-red-900/60 p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs: Login vs Register */}
          <div className="mt-4 flex rounded-xl bg-red-950/70 p-1 border border-red-800/60">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === 'login'
                  ? 'bg-amber-400 text-red-950 shadow-sm'
                  : 'text-red-200 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk Akun (Login)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === 'register'
                  ? 'bg-amber-400 text-red-950 shadow-sm'
                  : 'text-red-200 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Daftar Akun Baru (Registrasi)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================= TAB 1: LOGIN ======================= */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Role Switcher Pill for Login */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-slate-600">Masuk Sebagai:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('member');
                      setErrorMessage('');
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      loginRole === 'member'
                        ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <User className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Member (Peserta / Pembina)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole('admin');
                      setErrorMessage('');
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      loginRole === 'admin'
                        ? 'bg-red-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span>SuperAdmin (Master)</span>
                  </button>
                </div>
              </div>

              {loginRole === 'admin' && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-red-950">
                      <Shield className="h-4 w-4 text-amber-600" />
                      <span>Akun Master SuperAdmin Tunggal</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('siepang');
                        setLoginPassword('siepang#2026!');
                        setErrorMessage('');
                      }}
                      className="text-[11px] font-bold text-red-800 hover:text-red-950 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-xs transition"
                    >
                      Isi Otomatis
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Username: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-red-950">siepang</code> &bull; Password: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-red-950">siepang#2026!</code>
                  </p>
                  <p className="text-[10px] text-amber-800 mt-1 font-medium italic">
                    * Sesuai ketentuan, tidak ada akun lain yang tersedia untuk level superadmin dan admin.
                  </p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {loginRole === 'admin'
                      ? 'Username SuperAdmin'
                      : 'Email / ID Registrasi (JAM-P-xxx) / NTA Pramuka'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={
                        loginRole === 'admin'
                          ? 'siepang'
                          : 'peserta@pramuka.id atau JAM-P-001'
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 pl-9 text-xs focus:border-red-700 focus:ring-1 focus:ring-red-700 focus:outline-none"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {loginRole === 'admin' ? 'Master Password SuperAdmin' : 'Kata Sandi Akun'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={
                        loginRole === 'admin'
                          ? 'Masukkan password: siepang#2026!'
                          : 'Masukkan kata sandi akun Anda'
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 pl-9 pr-9 text-xs focus:border-red-700 focus:ring-1 focus:ring-red-700 focus:outline-none"
                    />
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginRole === 'member' && (
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ID Contoh: <code>JAM-P-001</code> / Sandi: <code>pramuka123</code></span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier('JAM-P-001');
                          setLoginPassword('pramuka123');
                        }}
                        className="text-emerald-700 font-medium hover:underline"
                      >
                        Isi Contoh Peserta
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-800 to-red-900 py-3 text-xs font-black text-white hover:from-red-700 hover:to-red-800 transition shadow-md active:scale-98"
                >
                  <LogIn className="h-4 w-4 text-amber-300" />
                  <span>{loginRole === 'admin' ? 'Masuk Sebagai SuperAdmin' : 'Masuk Sebagai Member'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================= TAB 2: REGISTER ======================= */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              {/* Type Selector: Peserta, Pembina (No Admin Registration) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Sebagai Tipe Pengguna:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterType('peserta')}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition border ${
                      registerType === 'peserta'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="h-4 w-4 mb-1 text-emerald-600" />
                    <span className="text-xs">Member Peserta</span>
                    <span className="text-[9px] text-slate-400">Penggalang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterType('pembina')}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition border ${
                      registerType === 'pembina'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Compass className="h-4 w-4 mb-1 text-amber-600" />
                    <span className="text-xs">Member Pembina</span>
                    <span className="text-[9px] text-slate-400">Pendamping</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Pratama Arya Wijaya"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>

                  {registerType === 'peserta' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Panggilan
                      </label>
                      <input
                        type="text"
                        value={regNickname}
                        onChange={(e) => setRegNickname(e.target.value)}
                        placeholder="Contoh: Arya"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. WhatsApp / HP *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pangkalan / Asal Sekolah
                    </label>
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="Contoh: SMP Negeri 1 Cibubur"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kwartir Cabang (Kwarcab)
                    </label>
                    <input
                      type="text"
                      value={regKwarcab}
                      onChange={(e) => setRegKwarcab(e.target.value)}
                      placeholder="Contoh: Kwarcab Jakarta Timur"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>

                {registerType === 'peserta' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Regu
                      </label>
                      <input
                        type="text"
                        value={regRegu}
                        onChange={(e) => setRegRegu(e.target.value)}
                        placeholder="Rajawali / Mawar"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as 'Putra' | 'Putri')}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      >
                        <option value="Putra">Putra</option>
                        <option value="Putri">Putri</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gol. Darah
                      </label>
                      <select
                        value={regBloodType}
                        onChange={(e) => setRegBloodType(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Akun
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@gmail.com"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-800 py-3 text-xs font-black text-white hover:from-emerald-600 hover:to-emerald-700 transition shadow-md active:scale-98 mt-2"
                >
                  <UserPlus className="h-4 w-4 text-amber-300" />
                  <span>Daftar &amp; Dapatkan ID Card Pramuka</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <span>SIEPANG - SiEpangApps 2026</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
