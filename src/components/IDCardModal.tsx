import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Participant, Leader } from '../types';
import { X, Printer, ShieldCheck, Phone, MapPin, Tent, Award, Sparkles } from 'lucide-react';

interface IDCardModalProps {
  person: Participant | Leader | null;
  type: 'peserta' | 'pembina';
  onClose: () => void;
}

export const IDCardModal: React.FC<IDCardModalProps> = ({ person, type, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!person) return;
    const qrPayload = JSON.stringify({
      id: person.regId,
      name: person.fullName,
      type: type,
      pangkalan: person.pangkalan,
      kwarcab: person.kwarcab,
    });

    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#3E2723',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [person, type]);

  if (!person) return null;

  const isParticipant = type === 'peserta';
  const participant = isParticipant ? (person as Participant) : null;
  const leader = !isParticipant ? (person as Leader) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200 dark:border-stone-800">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-4 py-3 text-white">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
            <Award className="h-4 w-4 text-amber-400" />
            <span>KARTU TANDA PENGENAL RESMI JAMBORE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-red-700 bg-red-800/80 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-red-700 transition"
              title="Cetak Kartu"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1 text-red-200 hover:bg-red-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-5" id="printable-id-card">
          <div className="relative overflow-hidden rounded-3xl border-2 border-red-700 bg-gradient-to-b from-red-50/40 via-white to-slate-50 p-5 shadow-sm">
            {/* Top Badge Brand */}
            <div className="flex items-center justify-between border-b border-red-900/20 pb-3">
              <div className="flex items-center gap-2.5">
                {/* Tunas Kelapa emblem illustration */}
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-red-950 shadow-sm font-bold text-lg border border-amber-300">
                  ⚜️
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-red-950">
                    Si-EPANG
                  </h3>
                  <p className="text-[11px] font-bold text-red-800/90">
                    Kwartir Cabang Gerakan Pramuka
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-red-800 px-3 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider shadow-xs">
                {isParticipant ? 'PESERTA' : 'BINDAMPING'}
              </div>
            </div>

            {/* Main Info Body */}
            <div className="mt-4 flex gap-4">
              {/* Photo & QR */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-24 w-20 overflow-hidden rounded-xl border-2 border-amber-700/50 bg-stone-200 shadow-inner">
                  <img
                    src={
                      person.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={person.fullName}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="text-center">
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-700">
                    {person.regId}
                  </span>
                </div>
              </div>

              {/* Personal Data */}
              <div className="flex-1 min-w-0 space-y-1 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-stone-500 font-semibold">Nama Lengkap</span>
                  <h4 className="font-bold text-stone-900 leading-snug truncate">
                    {person.fullName}
                  </h4>
                </div>

                {isParticipant && participant && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] uppercase text-stone-500 font-semibold">Regu</span>
                        <p className="font-semibold text-amber-900 truncate">{participant.regu}</p>
                      </div>
                      <div className="w-16">
                        <span className="text-[10px] uppercase text-stone-500 font-semibold">Gol. Darah</span>
                        <p className="font-bold text-red-600">{participant.bloodType || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-semibold">Pangkalan / Gudep</span>
                      <p className="text-stone-700 truncate">{participant.pangkalan}</p>
                    </div>

                    {participant.campTenda && (
                      <div className="flex items-center gap-1 text-[11px] text-stone-600">
                        <Tent className="h-3 w-3 text-amber-700" />
                        <span className="font-medium">{participant.campTenda}</span>
                      </div>
                    )}
                  </>
                )}

                {!isParticipant && leader && (
                  <>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-semibold">Jabatan</span>
                      <p className="font-semibold text-amber-900">{leader.role}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-semibold">Pangkalan</span>
                      <p className="text-stone-700 truncate">{leader.pangkalan}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-stone-500 font-semibold">Kontak HP/WA</span>
                      <p className="font-mono text-stone-800">{leader.phone}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-0.5">
                  <MapPin className="h-3 w-3 text-stone-400" />
                  <span className="truncate">{person.kwarcab}</span>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-100/50 p-3 border border-amber-200">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-stone-800">QR Verifikasi Pos</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  Pindai di Pos Registrasi, Pos Ujian Wide Game & Konsumsi
                </p>
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      person.checkInStatus
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        person.checkInStatus ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {person.checkInStatus ? 'Terverifikasi (Check-In)' : 'Belum Check-In'}
                  </span>
                </div>
              </div>

              {/* QR Image */}
              <div className="flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Verifikasi"
                    className="h-20 w-20 rounded-lg border border-stone-300 bg-white p-1 shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-200 text-[10px]">
                    Membuat QR...
                  </div>
                )}
                <span className="mt-1 font-mono text-[9px] text-stone-500">{person.regId}</span>
              </div>
            </div>

            {/* Emergency Contact */}
            {isParticipant && participant?.emergencyContact && (
              <div className="mt-2.5 flex items-center justify-between border-t border-stone-200 pt-2 text-[10px] text-stone-600">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-stone-400" />
                  Darurat: {participant.emergencyContact.name} ({participant.emergencyContact.relation})
                </span>
                <span className="font-mono font-medium text-stone-800">
                  {participant.emergencyContact.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Kwartir Cabang Gerakan Pramuka
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-amber-800 px-4 py-1.5 font-medium text-white hover:bg-amber-900 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
