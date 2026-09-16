import React from 'react';
import { Sponsor } from '../types';
import { ExternalLink, Handshake, Crown, Sparkles, ShieldCheck, Edit3 } from 'lucide-react';

interface SponsorSectionProps {
  sponsors: Sponsor[];
  title?: string;
  subtitle?: string;
  isAdmin?: boolean;
  onOpenEditSponsors?: () => void;
}

export const SponsorSection: React.FC<SponsorSectionProps> = ({
  sponsors,
  title = 'Mitra & Iklan Sponsor Kegiatan',
  subtitle = 'Didukung oleh mitra resmi Gerakan Pramuka Jambore 2026',
  isAdmin = false,
  onOpenEditSponsors,
}) => {
  const platinumSponsors = sponsors.filter((s) => s.tier === 'platinum');
  const goldSponsors = sponsors.filter((s) => s.tier === 'gold');
  const partnerSponsors = sponsors.filter((s) => s.tier === 'partner' || s.tier === 'silver');

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-900">
            <Handshake className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && onOpenEditSponsors && (
            <button
              onClick={onOpenEditSponsors}
              className="flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-900 hover:bg-red-100 transition shadow-xs"
              title="Edit Mitra Sponsor"
            >
              <Edit3 className="h-3.5 w-3.5 text-red-700" />
              <span>Kelola Sponsor</span>
            </button>
          )}
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {sponsors.length} Mitra
          </span>
        </div>
      </div>

      {/* Platinum Sponsors */}
      {platinumSponsors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-800">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>Sponsor Utama (Platinum)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platinumSponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl || '#'}
                target={sponsor.websiteUrl && sponsor.websiteUrl !== '#' ? '_blank' : '_self'}
                rel="noreferrer"
                className="group flex items-center gap-3.5 rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/40 via-white to-slate-50 p-3.5 transition hover:border-red-400 hover:shadow-md"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-900 truncate">
                      {sponsor.name}
                    </h4>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-red-700 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                    {sponsor.tagline}
                  </p>
                  <span className="mt-1 inline-block rounded bg-red-800 px-1.5 py-0.2 text-[9px] font-bold text-amber-200">
                    Platinum Partner
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Gold & Partners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
        {goldSponsors.concat(partnerSponsors).map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.websiteUrl || '#'}
            target={sponsor.websiteUrl && sponsor.websiteUrl !== '#' ? '_blank' : '_self'}
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 hover:bg-white hover:border-red-300 transition"
          >
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name}
              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-slate-800 truncate">{sponsor.name}</h5>
              <p className="text-[10px] text-slate-500 truncate">{sponsor.tagline}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Sponsorship Call-to-action banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-4 py-3 text-white border border-red-900/30">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 hidden sm:block" />
          <p className="text-xs text-red-100">
            Ingin bermitra atau memasang iklan sponsor untuk Jambore Pramuka?
          </p>
        </div>
        <a
          href="https://wa.me/628122334455?text=Halo%20Sekretariat%20Jambore,%20kami%20tertarik%20menjadi%20sponsor"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-red-950 hover:bg-amber-300 transition shrink-0"
        >
          Hubungi Sekretariat
        </a>
      </div>
    </section>
  );
};
