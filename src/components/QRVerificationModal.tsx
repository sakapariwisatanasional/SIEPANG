import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  Participant,
  Leader,
  VerificationLog,
  VisitorRegistration,
  ActivityPost,
  CurrentUser,
} from '../types';
import { soundEffects } from '../utils/audioNotify';
import { postCheckInToGAS } from '../services/gasSyncService';
import {
  X,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Building2,
  ShieldCheck,
  History,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Ticket,
  Users,
  Target,
  Award,
  Trophy,
} from 'lucide-react';

interface QRVerificationModalProps {
  participants: Participant[];
  leaders: Leader[];
  visitors?: VisitorRegistration[];
  activityPosts?: ActivityPost[];
  currentUser?: CurrentUser;
  onUpdateParticipant: (updated: Participant) => void;
  onUpdateLeader: (updated: Leader) => void;
  onUpdateVisitor?: (updated: VisitorRegistration) => void;
  onAwardPoints?: (participantId: string, postId: string) => void;
  verificationLogs: VerificationLog[];
  onAddVerificationLog: (log: VerificationLog) => void;
  gasUrl: string;
  onClose: () => void;
}

export const QRVerificationModal: React.FC<QRVerificationModalProps> = ({
  participants,
  leaders,
  visitors = [],
  activityPosts = [],
  currentUser,
  onUpdateParticipant,
  onUpdateLeader,
  onUpdateVisitor,
  onAwardPoints,
  verificationLogs,
  onAddVerificationLog,
  gasUrl,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'history'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    type: 'peserta' | 'pembina' | 'visitor' | 'post';
    person?: Participant | Leader | VisitorRegistration;
    post?: ActivityPost;
    selectedParticipant?: Participant | null;
    awardedSuccess?: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera when camera tab is active
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan berikan izin di browser atau gunakan tab "Input Manual" / "Upload Gambar".'
          : 'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleProcessScannedCode(code.data);
            return; // stop scanning while showing result
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tickScan);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleProcessScannedCode(code.data);
        } else {
          soundEffects.playErrorBuzz();
          setErrorMessage('Tidak dapat menemukan QR Code pada gambar yang diunggah. Coba foto yang lebih jelas.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProcessScannedCode = (rawPayload: string) => {
    setErrorMessage(null);
    let targetId = rawPayload.trim();

    // Check if rawPayload is a URL (e.g. from camera scan: https://domain/?pos=POS-PIONERING or ?ticket=VIS-2026-...)
    if (targetId.includes('?') && (targetId.includes('pos=') || targetId.includes('ticket=') || targetId.includes('reg='))) {
      try {
        // Support relative or absolute URLs
        const dummyBase = 'https://jamboapp.local';
        const parsedUrl = new URL(targetId.startsWith('http') ? targetId : `${dummyBase}/${targetId.startsWith('/') ? targetId.slice(1) : targetId}`);
        const posParam = parsedUrl.searchParams.get('pos') || parsedUrl.searchParams.get('scan');
        const ticketParam = parsedUrl.searchParams.get('ticket');
        const regParam = parsedUrl.searchParams.get('reg') || parsedUrl.searchParams.get('id');

        if (posParam) {
          targetId = posParam;
        } else if (ticketParam) {
          targetId = ticketParam;
        } else if (regParam) {
          targetId = regParam;
        }
      } catch (err) {
        console.warn('URL parsing failed, falling back to regex:', err);
        const matchPos = targetId.match(/[?&]pos=([^&#]+)/i);
        const matchTicket = targetId.match(/[?&]ticket=([^&#]+)/i);
        const matchReg = targetId.match(/[?&]reg=([^&#]+)/i);
        if (matchPos) targetId = decodeURIComponent(matchPos[1]);
        else if (matchTicket) targetId = decodeURIComponent(matchTicket[1]);
        else if (matchReg) targetId = decodeURIComponent(matchReg[1]);
      }
    }

    // Try parsing JSON payload if formatted as { id, name, ... }
    try {
      if (rawPayload.startsWith('{') && rawPayload.endsWith('}')) {
        const parsed = JSON.parse(rawPayload);
        if (parsed.ticketNumber) {
          targetId = parsed.ticketNumber;
        } else if (parsed.id) {
          targetId = parsed.id;
        }
      }
    } catch {
      // not JSON, use raw
    }

    // 0. Search in Activity Posts (for Gamification & Points!)
    if (activityPosts && activityPosts.length > 0) {
      const cleanTarget = targetId.replace(/^JAMBOREE-POS:/i, '').trim();
      const foundPost = activityPosts.find(
        (pos) =>
          pos.code.toLowerCase() === cleanTarget.toLowerCase() ||
          pos.code.toLowerCase() === targetId.toLowerCase() ||
          pos.id.toLowerCase() === cleanTarget.toLowerCase() ||
          pos.title.toLowerCase() === cleanTarget.toLowerCase() ||
          (pos.qrData && pos.qrData.toLowerCase() === targetId.toLowerCase())
      );

      if (foundPost) {
        soundEffects.playScanSuccess();
        let targetParticipant: Participant | null = null;
        if (currentUser?.role === 'member') {
          targetParticipant =
            participants.find((p) => p.regId === currentUser.memberId) ||
            participants.find((p) => p.fullName.toLowerCase() === currentUser.name.toLowerCase()) ||
            participants[0] ||
            null;
        } else {
          targetParticipant = participants[0] || null;
        }

        setScanResult({
          type: 'post',
          post: foundPost,
          selectedParticipant: targetParticipant,
          awardedSuccess: false,
        });
        stopCamera();
        return;
      }
    }

    // 1. Search in participants
    const foundParticipant = participants.find(
      (p) =>
        p.regId.toLowerCase() === targetId.toLowerCase() ||
        p.fullName.toLowerCase() === targetId.toLowerCase()
    );

    if (foundParticipant) {
      soundEffects.playScanSuccess();
      setScanResult({ type: 'peserta', person: foundParticipant });
      stopCamera();
      return;
    }

    // 2. Search in leaders
    const foundLeader = leaders.find(
      (l) =>
        l.regId.toLowerCase() === targetId.toLowerCase() ||
        l.fullName.toLowerCase() === targetId.toLowerCase()
    );

    if (foundLeader) {
      soundEffects.playScanSuccess();
      setScanResult({ type: 'pembina', person: foundLeader });
      stopCamera();
      return;
    }

    // 3. Search in visitors
    const foundVisitor = visitors.find(
      (v) =>
        v.ticketNumber.toLowerCase() === targetId.toLowerCase() ||
        v.fullName.toLowerCase() === targetId.toLowerCase() ||
        v.phone.toLowerCase() === targetId.toLowerCase()
    );

    if (foundVisitor) {
      soundEffects.playScanSuccess();
      setScanResult({ type: 'visitor', person: foundVisitor });
      stopCamera();
      return;
    }

    // Not found
    soundEffects.playErrorBuzz();
    setErrorMessage(`Data tidak ditemukan untuk kode: "${targetId}". Pastikan QR Code resmi Jambore, Tiket Visitor, atau Pos Kegiatan.`);
  };

  const handleConfirmAwardPoints = () => {
    if (!scanResult || scanResult.type !== 'post' || !scanResult.post || !scanResult.selectedParticipant) return;
    setIsProcessing(true);

    const post = scanResult.post;
    const participant = scanResult.selectedParticipant;

    if (onAwardPoints) {
      onAwardPoints(participant.id, post.id);
    } else {
      const alreadyCompleted =
        participant.completedPosts?.includes(post.code) ||
        participant.completedPosts?.includes(post.id);

      if (!alreadyCompleted) {
        const pts = post.points || 10;
        const updated: Participant = {
          ...participant,
          points: (participant.points || 0) + pts,
          completedPosts: [...(participant.completedPosts || []), post.code],
          pointsHistory: [
            {
              postId: post.id,
              postCode: post.code,
              postTitle: post.title,
              points: pts,
              scannedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            },
            ...(participant.pointsHistory || []),
          ],
        };
        onUpdateParticipant(updated);
      }
    }

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const newLog: VerificationLog = {
      id: 'log_' + Date.now(),
      regId: participant.regId,
      name: participant.fullName,
      type: 'Peserta',
      organization: `${participant.pangkalan} (${participant.regu})`,
      timestamp: nowStr,
      status: 'valid',
      scannerDevice: 'Kamera / QR Scanner Pos',
      pointsEarned: post.points,
      postTitle: post.title,
      notes: `Klaim Pos Kegiatan: ${post.title} (+${post.points} Poin)`,
    };
    onAddVerificationLog(newLog);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    soundEffects.play('success');

    const alreadyCompleted =
      participant.completedPosts?.includes(post.code) ||
      participant.completedPosts?.includes(post.id);

    const updatedP: Participant = {
      ...participant,
      points: alreadyCompleted ? participant.points : (participant.points || 0) + (post.points || 10),
      completedPosts: alreadyCompleted ? participant.completedPosts : [...(participant.completedPosts || []), post.code],
    };

    setScanResult({
      type: 'post',
      post,
      selectedParticipant: updatedP,
      awardedSuccess: true,
    });
    setIsProcessing(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScannedCode(manualCode.trim());
  };

  const handleConfirmCheckIn = async () => {
    if (!scanResult) return;
    setIsProcessing(true);

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    let org = '';
    let regCode = '';
    let logType: 'Peserta' | 'Pembina' | 'Pengunjung (Visitor)' = 'Peserta';

    if (scanResult.type === 'peserta') {
      const p = scanResult.person as Participant;
      const updated: Participant = {
        ...p,
        checkInStatus: true,
        checkInTime: nowStr,
      };
      onUpdateParticipant(updated);
      setScanResult({ type: 'peserta', person: updated });
      org = `${p.pangkalan} (${p.regu})`;
      regCode = p.regId;
      logType = 'Peserta';
    } else if (scanResult.type === 'pembina') {
      const l = scanResult.person as Leader;
      const updated: Leader = {
        ...l,
        checkInStatus: true,
        checkInTime: nowStr,
      };
      onUpdateLeader(updated);
      setScanResult({ type: 'pembina', person: updated });
      org = l.pangkalan;
      regCode = l.regId;
      logType = 'Pembina';
    } else {
      const v = scanResult.person as VisitorRegistration;
      const updated: VisitorRegistration = {
        ...v,
        checkInStatus: true,
        checkInTime: nowStr,
      };
      if (onUpdateVisitor) {
        onUpdateVisitor(updated);
      }
      setScanResult({ type: 'visitor', person: updated });
      org = `${v.institutionOrCity} (${v.paxCount} pax - ${v.purpose})`;
      regCode = v.ticketNumber;
      logType = 'Pengunjung (Visitor)';
    }

    // Create verification log
    const newLog: VerificationLog = {
      id: 'log_' + Date.now(),
      regId: regCode,
      name: scanResult.person.fullName,
      type: logType,
      organization: org,
      timestamp: nowStr,
      status: 'valid',
      scannerDevice: 'Kamera / PWA Scanner',
      notes: logType === 'Pengunjung (Visitor)' ? 'Verifikasi Tamu/Visitor Pos Gerbang' : 'Presensi Berhasil Terverifikasi',
    };

    onAddVerificationLog(newLog);

    // Trigger celebratory confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    soundEffects.playScanSuccess();

    // Async sync to Google Apps Script if URL provided
    if (gasUrl) {
      postCheckInToGAS(gasUrl, newLog).catch(() => {});
    }

    setIsProcessing(false);
  };

  const handleResetScan = () => {
    setScanResult(null);
    setErrorMessage(null);
    setManualCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-red-950 shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight sm:text-base text-white">
                  Verifikasi QR Code Presensi &amp; Visitor
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  Pos Gerbang &amp; Panitia
                </span>
              </div>
              <p className="text-xs text-red-100">
                Pindai ID Card Peserta, Pembina, atau E-Tiket Kunjungan Pengunjung
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('camera');
              setScanResult(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeTab === 'camera'
                ? 'border-red-700 font-bold text-red-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Kamera Langsung</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              setScanResult(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeTab === 'upload'
                ? 'border-red-700 font-bold text-red-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Foto QR</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setScanResult(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeTab === 'manual'
                ? 'border-red-700 font-bold text-red-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Input Manual</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setScanResult(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeTab === 'history'
                ? 'border-red-700 font-bold text-red-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Log Presensi ({verificationLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Scan result display */}
          {scanResult ? (
            <div className="space-y-4 animate-scaleUp">
              {scanResult.type === 'post' && scanResult.post ? (
                /* ================= ACTIVITY POST GAMIFICATION RESULT ================= */
                <div className="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50/90 via-red-50/50 to-amber-50/90 p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-amber-200/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-red-950 font-black shadow-md border-2 border-amber-300">
                        <Target className="h-6 w-6 text-red-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-950 uppercase border border-amber-300">
                            POS KEGIATAN BER-QR
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {scanResult.post.code}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight mt-0.5">
                          {scanResult.post.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-red-800 to-red-900 px-3.5 py-1.5 font-black text-amber-300 shadow-md border border-red-700">
                        <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
                        <span className="text-base sm:text-lg">+{scanResult.post.points}</span>
                        <span className="text-xs text-amber-200">Poin</span>
                      </div>
                    </div>
                  </div>

                  {/* Post details */}
                  <div className="mt-3.5 rounded-2xl bg-white p-4 shadow-xs border border-amber-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-semibold">Kategori Pos</span>
                        <span className="font-bold text-slate-800">{scanResult.post.category}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-semibold">Lokasi Kegiatan</span>
                        <span className="font-bold text-slate-800">📍 {scanResult.post.location}</span>
                      </div>
                    </div>

                    {scanResult.post.description && (
                      <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 italic">
                        "{scanResult.post.description}"
                      </p>
                    )}

                    {/* Recipient Participant Selection */}
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span>Peserta Penerima Poin:</span>
                        </label>
                        {scanResult.selectedParticipant && (
                          <span className="text-[11px] font-black text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                            Total: {scanResult.selectedParticipant.points || 0} Pts
                          </span>
                        )}
                      </div>

                      {currentUser?.role === 'admin' ? (
                        <div>
                          <select
                            value={scanResult.selectedParticipant?.id || ''}
                            onChange={(e) => {
                              const p = participants.find((part) => part.id === e.target.value);
                              setScanResult((prev) => (prev ? { ...prev, selectedParticipant: p || null } : null));
                            }}
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold bg-white focus:border-red-700 focus:outline-none shadow-xs"
                          >
                            {participants.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.fullName} ({p.regu} - {p.pangkalan}) — {p.points || 0} Poin
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Admin dapat memilih peserta yang berhak mendapatkan poin tantangan pos ini.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold">
                              <Trophy className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                {scanResult.selectedParticipant?.fullName || 'Peserta Terpilih'}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {scanResult.selectedParticipant?.regu} • {scanResult.selectedParticipant?.pangkalan}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
                            {scanResult.selectedParticipant?.points || 0} Poin
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Completion status feedback */}
                    {scanResult.selectedParticipant && (() => {
                      const isCompleted =
                        scanResult.selectedParticipant.completedPosts?.includes(scanResult.post.code) ||
                        scanResult.selectedParticipant.completedPosts?.includes(scanResult.post.id);

                      if (scanResult.awardedSuccess) {
                        return (
                          <div className="rounded-xl bg-emerald-100 p-3 text-center text-xs font-bold text-emerald-900 border border-emerald-300 flex items-center justify-center gap-1.5 animate-fadeIn">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            <span>
                              🎉 Selamat! +{scanResult.post.points} Poin berhasil ditambahkan ke akun{' '}
                              <strong>{scanResult.selectedParticipant.fullName}</strong>. Langsung tampil di Papan Peringkat (Ranking)!
                            </span>
                          </div>
                        );
                      }

                      if (isCompleted) {
                        return (
                          <div className="rounded-xl bg-amber-100 p-3 text-center text-xs font-bold text-amber-900 border border-amber-300 flex items-center justify-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-700" />
                            <span>
                              Peserta ini sudah pernah menyelesaikan pos <strong>{scanResult.post.title}</strong> sebelumnya.
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                    {scanResult.selectedParticipant &&
                    !(
                      scanResult.selectedParticipant.completedPosts?.includes(scanResult.post.code) ||
                      scanResult.selectedParticipant.completedPosts?.includes(scanResult.post.id)
                    ) &&
                    !scanResult.awardedSuccess ? (
                      <button
                        onClick={handleConfirmAwardPoints}
                        disabled={isProcessing}
                        className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-red-800 to-red-900 py-3 font-bold text-amber-200 shadow-md hover:from-red-900 hover:to-red-950 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>
                          {isProcessing ? 'Menyimpan Poin...' : `Klaim +${scanResult.post.points} Poin Sekarang`}
                        </span>
                      </button>
                    ) : (
                      <div className="w-full sm:flex-1 rounded-xl bg-emerald-100/90 py-2.5 text-center text-xs font-bold text-emerald-900 border border-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>
                          {scanResult.awardedSuccess
                            ? `Poin pos berhasil disimpan (+${scanResult.post.points} Poin).`
                            : 'Pos kegiatan ini sudah pernah diselesaikan.'}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleResetScan}
                      className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Pindai Pos Lainnya</span>
                    </button>
                  </div>
                </div>
              ) : scanResult.person ? (
                /* ================= PARTICIPANT / LEADER / VISITOR CHECK-IN RESULT ================= */
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
                          QR Code Terverifikasi!
                        </h3>
                        <p className="text-xs text-emerald-800">
                          {scanResult.type === 'peserta'
                            ? 'Data Peserta Resmi (Anggota Pramuka)'
                            : scanResult.type === 'pembina'
                            ? 'Data Pembina Pendamping'
                            : 'E-Tiket Tamu / Pengunjung (Visitor)'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        scanResult.person.checkInStatus
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {scanResult.person.checkInStatus ? 'Sudah Masuk / Check-In' : 'Siap Verifikasi Masuk'}
                    </span>
                  </div>

                  {/* Person or Visitor details card */}
                  <div className="mt-4 flex gap-4 rounded-xl bg-white p-3.5 shadow-sm border border-emerald-100">
                    {scanResult.type !== 'visitor' ? (
                      <img
                        src={
                          (scanResult.person as Participant | Leader).photoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                        }
                        alt={scanResult.person.fullName}
                        className="h-20 w-16 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-red-100 text-red-900 border border-red-300 shadow-xs">
                        <Ticket className="h-7 w-7" />
                        <span className="text-[10px] font-black mt-1">VISITOR</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-red-950 bg-amber-200 px-2 py-0.5 rounded-md text-[11px] border border-amber-300">
                          {scanResult.type === 'visitor'
                            ? (scanResult.person as VisitorRegistration).ticketNumber
                            : (scanResult.person as Participant | Leader).regId}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {scanResult.type === 'visitor'
                            ? (scanResult.person as VisitorRegistration).institutionOrCity
                            : (scanResult.person as Participant | Leader).kwarcab}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {scanResult.person.fullName}
                      </h4>

                      {scanResult.type === 'peserta' && (
                        <>
                          <p className="font-bold text-amber-800">
                            {(scanResult.person as Participant).regu}
                          </p>
                          <p className="text-slate-600 truncate">{(scanResult.person as Participant).pangkalan}</p>
                          {(scanResult.person as Participant).points !== undefined && (
                            <p className="text-[11px] font-bold text-red-700">
                              ⭐ Poin Kegiatan: {(scanResult.person as Participant).points || 0} Pts
                            </p>
                          )}
                        </>
                      )}

                      {scanResult.type === 'pembina' && (
                        <>
                          <p className="font-bold text-amber-800">{(scanResult.person as Leader).role}</p>
                          <p className="text-slate-600 truncate">{(scanResult.person as Leader).pangkalan}</p>
                        </>
                      )}

                      {scanResult.type === 'visitor' && (
                        <div className="space-y-0.5 pt-0.5 text-[11px] text-slate-700">
                          <p className="font-semibold text-red-800">
                            Keperluan: {(scanResult.person as VisitorRegistration).purpose} ({(scanResult.person as VisitorRegistration).paxCount} Orang)
                          </p>
                          <p className="text-slate-500">
                            Rencana Tanggal: {(scanResult.person as VisitorRegistration).visitDate}
                          </p>
                        </div>
                      )}

                      {scanResult.person.checkInTime && (
                        <p className="text-[11px] text-emerald-800 flex items-center gap-1 pt-1 font-semibold">
                          <Clock className="h-3 w-3 text-emerald-600" />
                          Tercatat Masuk: {scanResult.person.checkInTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                    {!scanResult.person.checkInStatus ? (
                      <button
                        onClick={handleConfirmCheckIn}
                        disabled={isProcessing}
                        className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 font-bold text-white shadow-md hover:from-emerald-700 hover:to-emerald-800 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>{isProcessing ? 'Memproses...' : 'Konfirmasi Masuk / Check-In Sekarang'}</span>
                      </button>
                    ) : (
                      <div className="w-full sm:flex-1 rounded-xl bg-emerald-100/90 py-2 text-center text-xs font-bold text-emerald-900 border border-emerald-300">
                        Tanda pengenal ini sudah berhasil diverifikasi masuk pos.
                      </div>
                    )}

                    <button
                      onClick={handleResetScan}
                      className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Pindai Lainnya</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Tab 1: Live Camera */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  <div className="relative mx-auto aspect-square max-w-xs overflow-hidden rounded-2xl bg-black shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* QR Target Overlay Box */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="relative h-48 w-48 rounded-xl border-2 border-amber-400/90 shadow-2xl">
                        <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-amber-500 rounded-tl" />
                        <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-amber-500 rounded-tr" />
                        <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-amber-500 rounded-bl" />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-amber-500 rounded-br" />
                        {cameraActive && (
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {!cameraActive && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 p-4 text-center text-white">
                        <RefreshCw className="h-8 w-8 animate-spin text-amber-400 mb-2" />
                        <p className="text-xs">Menyiapkan kamera perangkat...</p>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/95 p-4 text-center text-white">
                        <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
                        <p className="text-xs text-stone-300 mb-3">{cameraError}</p>
                        <button
                          onClick={startCamera}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-stone-500">
                    Arahkan kamera ke QR Code pada Tanda Peserta / ID Card Pembina Jambore
                  </p>
                </div>
              )}

              {/* Tab 2: File Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 p-6 hover:border-amber-600 transition bg-stone-50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-800">Unggah Gambar QR Code</h4>
                    <p className="text-xs text-stone-500 mt-1 mb-4">
                      Pilih foto atau tangkapan layar ID Card / QR Code dari galeri perangkat Anda
                    </p>
                    <label className="cursor-pointer rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-900 transition">
                      <span>Pilih Foto dari Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: Manual Input */}
              {activeTab === 'manual' && (
                <div className="space-y-4 py-2">
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nomor ID Registrasi Peserta / Pembina
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          placeholder="Contoh: JAM-P-001 atau JAM-B-001"
                          className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono uppercase focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900 transition"
                        >
                          Cari
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Quick sample chips */}
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-[11px] font-semibold text-stone-500 mb-2">
                      Atau coba verifikasi cepat sampel ID:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {participants.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProcessScannedCode(p.regId)}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-700 hover:bg-amber-50 hover:border-amber-300 transition"
                        >
                          {p.regId} ({p.nickname})
                        </button>
                      ))}
                      {leaders.slice(0, 2).map((l) => (
                        <button
                          key={l.id}
                          onClick={() => handleProcessScannedCode(l.regId)}
                          className="rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1 text-[11px] text-amber-900 hover:bg-amber-100 transition"
                        >
                          {l.regId} (Pembina)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: History Logs */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Riwayat pemindaian pos verifikasi</span>
                    <span className="font-semibold text-stone-800">
                      Total: {verificationLogs.length} Entri
                    </span>
                  </div>

                  {verificationLogs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
                      Belum ada riwayat verifikasi. Lakukan scan QR peserta untuk mencatat presensi.
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto rounded-xl border border-stone-200 bg-white">
                      {verificationLogs.map((log) => (
                        <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-stone-50">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1 rounded">
                                {log.regId}
                              </span>
                              <span className="font-bold text-stone-900">{log.name}</span>
                              <span className="text-[10px] text-stone-500">({log.type})</span>
                            </div>
                            <p className="text-[11px] text-stone-500">{log.organization}</p>
                            <p className="text-[10px] text-stone-400">{log.timestamp}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Valid
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error alert */}
              {errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Verifikasi Gagal</p>
                    <p className="text-[11px]">{errorMessage}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-2.5 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Terhubung ke Sistem Registrasi Jambore</span>
          </div>
          {gasUrl ? (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Tersinkron ke Spreadsheet
            </span>
          ) : (
            <span className="text-stone-400">Penyimpanan Lokal (Offline Ready)</span>
          )}
        </div>
      </div>
    </div>
  );
};
