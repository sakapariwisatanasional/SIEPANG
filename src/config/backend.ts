/**
 * @license
 * SiEpang - Canonical Production Backend Configuration
 * 
 * Target Architecture:
 * Backend URL production harus tersedia langsung dari source aplikasi
 * tanpa bergantung pada Vercel Environment Variables.
 * 
 * VITE_SIEPANG_BACKEND_URL dapat digunakan sebagai environment override jika tersedia.
 */

export const SIEPANG_BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbwoIhDY_gyZuxDZZSj4I3C9fLIg1orvmHTyfubr4brpbr-JtsQIBCAsMXxyi7_IeWO0Fg/exec';

/**
 * Resolves the canonical backend URL:
 * - Jika VITE_SIEPANG_BACKEND_URL tersedia, digunakan sebagai override.
 * - Jika tidak tersedia, fallback ke SIEPANG_BACKEND_URL.
 */
export function resolveBackendUrl(explicitOverride?: string): string {
  if (typeof explicitOverride === 'string' && explicitOverride.trim().length > 0) {
    return explicitOverride.trim();
  }

  try {
    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;
    if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
  } catch {}

  return SIEPANG_BACKEND_URL;
}

export const getSiepangBackendUrl = resolveBackendUrl;

