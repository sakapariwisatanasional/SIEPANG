/**
 * @license
 * SiEpang - Public Responsive Hero Banner Rotator (Requirements 21-27, 30-32, 52, 58)
 * Standard banner presets: 970x250 desktop, 320x100 mobile, 16:9 cinematic
 * Safe crop & focal point support, swipe navigation, tracking
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, ArrowRight } from 'lucide-react';
import { bannerSponsorService } from '../../services/bannerSponsorService';
import { BannerItem } from '../../types';

interface PublicHeroBannerProps {
  onNavigateRoute?: (route: string) => void;
  location?: 'PUBLIC_HOME_TOP' | 'PUBLIC_HOME_MIDDLE' | 'PUBLIC_HOME_BOTTOM' | 'GALLERY_TOP';
}

export const PublicHeroBanner: React.FC<PublicHeroBannerProps> = ({
  onNavigateRoute,
  location = 'PUBLIC_HOME_TOP',
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const rotatorConfig = bannerSponsorService.getRotatorConfig();

  useEffect(() => {
    const loadBanners = () => {
      const active = bannerSponsorService.getBanners({
        location,
        type: 'HERO',
        onlyActiveNow: true,
      });
      setBanners(active);
    };

    loadBanners();
    const unsub = bannerSponsorService.subscribe(loadBanners);
    return () => unsub();
  }, [location]);

  // Record impression for current banner
  useEffect(() => {
    if (banners[currentIndex]) {
      bannerSponsorService.recordBannerImpression(banners[currentIndex].banner_id);
    }
  }, [currentIndex, banners]);

  // Autoplay / Rotation timer
  useEffect(() => {
    if (banners.length <= 1 || rotatorConfig.mode !== 'AUTO_ROTATE' || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, (rotatorConfig.rotationIntervalSeconds || 6) * 1000);

    return () => clearInterval(interval);
  }, [banners.length, rotatorConfig.mode, rotatorConfig.rotationIntervalSeconds, isPaused]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleClickBanner = () => {
    if (!currentBanner) return;
    bannerSponsorService.recordBannerClick(currentBanner.banner_id);

    if (currentBanner.target_type === 'INTERNAL_ROUTE' && currentBanner.target_url) {
      onNavigateRoute?.(currentBanner.target_url);
    } else if (currentBanner.target_type === 'EXTERNAL_URL' && currentBanner.target_url) {
      window.open(currentBanner.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-black/10 dark:border-white/10 bg-slate-950 shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Aspect Ratio Container with mobile vertical breathing room */}
      <div
        onClick={handleClickBanner}
        className="cursor-pointer relative w-full min-h-[210px] aspect-[4/3] sm:min-h-0 sm:aspect-[16/6] md:aspect-[970/250] overflow-hidden"
      >
        {/* Banner Image with Focal Point and Safe Fit Mode (Requirement 26) */}
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-all duration-700 select-none"
          style={{
            objectFit: currentBanner.fit_mode.toLowerCase() as any,
            objectPosition: `${currentBanner.focal_x}% ${currentBanner.focal_y}%`,
          }}
          loading="eager"
        />

        {/* Gradient Overlay for Readable Typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent sm:bg-gradient-to-r sm:from-black/90 sm:via-black/50 sm:to-transparent flex flex-col justify-end sm:justify-center p-4 sm:p-8 md:p-10 text-left">
          <div className="max-w-xl space-y-1.5 sm:space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              Event Highlights
            </span>
            <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md break-words">
              {currentBanner.title}
            </h2>
            {currentBanner.subtitle && (
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 line-clamp-2 max-w-lg drop-shadow">
                {currentBanner.subtitle}
              </p>
            )}

            {currentBanner.cta_label && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#208C60] via-[#F47743] to-[#F4A53A] hover:opacity-95 text-white text-xs font-bold shadow-lg transition-transform group-hover:translate-x-1">
                  <span>{currentBanner.cta_label}</span>
                  {currentBanner.target_type === 'EXTERNAL_URL' ? (
                    <ExternalLink className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows for multiple hero banners (Requirement 32) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={e => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Banner Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Banner Selanjutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={e => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-gradient-to-r from-[#F47743] to-[#FFD36A]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
