import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { brandingService } from '../../services/brandingService';

/** Globally accessible theme switch, including unauthenticated public routes. */
export function ScoutThemeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>(brandingService.getResolvedTheme());
  useEffect(() => brandingService.subscribe((_appearance, resolved) => setMode(resolved)), []);
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      className="scout-theme-toggle"
      onClick={() => brandingService.setAppearance(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Aktifkan mode cerah' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode cerah' : 'Mode gelap'}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span>{isDark ? 'Mode Cerah' : 'Mode Gelap'}</span>
    </button>
  );
}
