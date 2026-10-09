/**
 * @license
 * SiEpang - Public Information & Notice Banner Component (Requirements 38-41)
 * Renders priority safety/visitor notices (URGENT / IMPORTANT / NORMAL)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Bell, ArrowRight, ExternalLink } from 'lucide-react';
import { bannerSponsorService } from '../../services/bannerSponsorService';
import { BannerItem } from '../../types';

interface PublicInformationBannerProps {
  onNavigateRoute?: (route: string) => void;
  location?: 'PUBLIC_HOME_MIDDLE' | 'PUBLIC_HOME_BOTTOM' | 'VISITOR_PAGE' | 'SCHEDULE_PAGE';
}

export const PublicInformationBanner: React.FC<PublicInformationBannerProps> = ({
  onNavigateRoute,
  location = 'PUBLIC_HOME_MIDDLE',
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);

  useEffect(() => {
    const loadBanners = () => {
      const active = bannerSponsorService.getBanners({
        location,
        type: 'INFORMATION',
        onlyActiveNow: true,
      });
      setBanners(active);
    };

    loadBanners();
    const unsub = bannerSponsorService.subscribe(loadBanners);
    return () => unsub();
  }, [location]);

  if (banners.length === 0) return null;

  const handleBannerClick = (b: BannerItem) => {
    bannerSponsorService.recordBannerClick(b.banner_id);
    if (b.target_type === 'INTERNAL_ROUTE' && b.target_url) {
      onNavigateRoute?.(b.target_url);
    } else if (b.target_type === 'EXTERNAL_URL' && b.target_url) {
      window.open(b.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3 w-full">
      {banners.map(banner => {
        const isUrgent = banner.priority === 'URGENT';
        const isImportant = banner.priority === 'IMPORTANT';

        return (
          <div
            key={banner.banner_id}
            onClick={() => handleBannerClick(banner)}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xs relative overflow-hidden group bg-white dark:bg-[#141418] ${
              isUrgent
                ? 'border-rose-500/40 hover:border-rose-500'
                : isImportant
                ? 'border-amber-500/40 hover:border-amber-500'
                : 'border-sky-500/40 hover:border-sky-500'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUrgent
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : isImportant
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {isUrgent ? (
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  ) : isImportant ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : isImportant
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {banner.priority} NOTICE
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {banner.title}
                    </h3>
                  </div>

                  {banner.subtitle && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {banner.cta_label && (
                <div className="w-full sm:w-auto sm:self-center shrink-0 pt-2 sm:pt-0">
                  <span
                    className={`inline-flex w-full sm:w-auto justify-center sm:justify-start items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-transform group-hover:translate-x-1 ${
                      isUrgent
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : isImportant
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <span>{banner.cta_label}</span>
                    {banner.target_type === 'EXTERNAL_URL' ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
