import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { ChevronLeft, ChevronRight, Calendar, Compass, Sparkles, Clock, Edit3 } from 'lucide-react';

interface BannerSliderProps {
  banners: Banner[];
  onNavigateTab: (tab: string) => void;
  isAdmin?: boolean;
  onOpenEditBanners?: (banner?: Banner) => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  banners,
  onNavigateTab,
  isAdmin = false,
  onOpenEditBanners,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl border border-red-950/40 group">
      {/* Admin Quick Edit Button */}
      {isAdmin && onOpenEditBanners && (
        <button
          onClick={() => onOpenEditBanners(currentBanner)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 rounded-xl bg-black/60 hover:bg-red-800 text-white backdrop-blur-md px-3 py-1.5 text-xs font-bold shadow-lg transition border border-white/20"
          title="Edit Banner Ini"
        >
          <Edit3 className="h-3.5 w-3.5 text-amber-300" />
          <span>Edit Banner Ini</span>
        </button>
      )}

      {/* Banner image background with red-infused dark gradient overlay */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-slate-950/40 to-transparent" />
      </div>

      {/* Floating Banner Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
        <div className="max-w-2xl space-y-2">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-black text-red-950 shadow border border-amber-300">
            <Sparkles className="h-3 w-3" />
            <span>{currentBanner.badge}</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            {currentBanner.title}
          </h2>

          <p className="text-xs sm:text-sm text-red-100 line-clamp-2 max-w-xl font-normal drop-shadow">
            {currentBanner.subtitle}
          </p>

          {/* Action button */}
          {currentBanner.actionTab && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab(currentBanner.actionTab || 'jadwal')}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-xs font-black text-red-950 shadow-lg hover:bg-amber-300 transition active:scale-95 border border-amber-300"
              >
                <span>{currentBanner.actionText || 'Buka Info'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm hover:bg-black/70 hover:text-white transition"
            aria-label="Banner Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm hover:bg-black/70 hover:text-white transition"
            aria-label="Banner Selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-3 right-5 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
