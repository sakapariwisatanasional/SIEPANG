/**
 * @license
 * SiEpang - Production API Transport Layer
 * Standard transport abstraction for communication between the React/Vite frontend
 * and the customer-owned Google Apps Script Web App over HTTPS.
 * Enforces canonical request/response envelopes, timeout handling, and error normalization.
 */

import { customerInstallationService } from './customerInstallationService';
import { authService } from './authService';
import { workspaceService } from './workspaceService';
import { eventService } from './eventService';

export interface ApiRequestEnvelope<T = any> {
  action: string;
  installation_id?: string | null;
  workspace_id?: string | null;
  event_id?: string | null;
  session_token: string;
  request_id: string;
  client_version: string;
  timestamp?: string;
  context?: {
    workspace_id: string | null;
    event_id: string | null;
    session_token: string | null;
    device_public_id: string | null;
    installation_id?: string | null;
  };
  payload: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponseEnvelope<T = any> {
  ok: boolean;
  request_id: string;
  data: T | null;
  error: ApiErrorPayload | null;
}

export class ApiTransportError extends Error {
  public code: string;
  public details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiTransportError';
    this.code = code;
    this.details = details;
  }
}

class ApiTransport {
  private defaultTimeoutMs = 20000;
  private clientVersion = '1.9.0-rc1';

  /**
   * Dispatches a canonical request envelope to the customer's verified GAS Web App.
   * STRICT: Real HTTPS call to customer-owned Google Apps Script Web App. Zero simulation.
   */
  public async send<T = any>(
    action: string,
    payload: any = {},
    options?: {
      timeoutMs?: number;
      overrideUrl?: string;
      overrideInstallationId?: string;
      overrideWorkspaceId?: string;
      skipAuth?: boolean;
    }
  ): Promise<ApiResponseEnvelope<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const record = customerInstallationService.getInstallationRecord();
    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;
    const targetUrl = options?.overrideUrl || envUrl || record.web_app_url;

    // If GAS URL is missing or not configured
    if (!targetUrl || !targetUrl.trim().startsWith('https://script.google.com/macros/s/')) {
      if (action === 'bootstrap.status') {
        return {
          ok: true,
          request_id: requestId,
          data: {
            installation_ready: false,
            backend_reachable: false,
          } as any,
          error: null,
        };
      }
      return {
        ok: false,
        request_id: requestId,
        data: null,
        error: {
          code: 'INSTALLATION_NOT_CONFIGURED',
          message: 'Backend Google Apps Script belum dikonfigurasi.',
        },
      };
    }

    const currentWorkspace = workspaceService.getCurrentWorkspace();
    const currentEvent = eventService.getCurrentEvent();
    const authState = authService.getAuthState();
    const device = authService.getOrCreateDevicePayload();

    const resolvedInstId = options?.overrideInstallationId || record.installation_id || null;
    const resolvedWsId = options?.overrideWorkspaceId || currentWorkspace?.id || record.workspace_id || null;
    const resolvedEvtId = currentEvent?.id || record.active_event_id || null;

    const envelope: ApiRequestEnvelope = {
      action,
      payload,
      context: {
        workspace_id: resolvedWsId,
        event_id: resolvedEvtId,
        session_token: authState.sessionToken || null,
        device_public_id: device.device_public_id || null,
        installation_id: resolvedInstId,
      },
      installation_id: resolvedInstId,
      workspace_id: resolvedWsId,
      event_id: resolvedEvtId,
      session_token: authState.sessionToken || '',
      request_id: requestId,
      client_version: this.clientVersion,
      timestamp: new Date().toISOString(),
    };

    const timeout = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Use text/plain to avoid browser CORS preflight issues with Google Apps Script Web App redirects
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(envelope),
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 302) {
        return {
          ok: false,
          request_id: requestId,
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: `Server backend merespons dengan kode status HTTP ${response.status}.`,
          },
        };
      }

      const text = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          ok: false,
          request_id: requestId,
          data: null,
          error: {
            code: 'INVALID_JSON_RESPONSE',
            message: 'Respons dari Google Apps Script bukan format JSON yang valid.',
            details: text.slice(0, 200),
          },
        };
      }

      // Standardize response envelope: supports both { ok, data, error } and legacy { success, data, error }
      if (typeof parsed.ok === 'boolean') {
        return {
          ok: parsed.ok,
          request_id: parsed.request_id || requestId,
          data: parsed.data ?? null,
          error: parsed.error || null,
        };
      }

      if (typeof parsed.success === 'boolean') {
        return {
          ok: parsed.success,
          request_id: requestId,
          data: parsed.data ?? null,
          error: parsed.success
            ? null
            : {
                code: typeof parsed.error === 'object' && parsed.error?.code ? parsed.error.code : 'BACKEND_ERROR',
                message: typeof parsed.error === 'object' && parsed.error?.message ? parsed.error.message : String(parsed.error || 'Operasi backend gagal.'),
              },
        };
      }

      return {
        ok: true,
        request_id: requestId,
        data: parsed as T,
        error: null,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          ok: false,
          request_id: requestId,
          data: null,
          error: {
            code: 'TIMEOUT',
            message: `Permintaan ke Google Apps Script melampaui batas waktu (${timeout / 1000} detik).`,
          },
        };
      }

      return {
        ok: false,
        request_id: requestId,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Gagal terhubung ke URL Google Apps Script customer.',
          details: String(err),
        },
      };
    }
  }

  /**
   * Health Check request directly to GAS endpoint
   */
  public async checkHealth(url: string, nonce?: string): Promise<{
    ok: boolean;
    data?: any;
    error?: string;
  }> {
    const checkNonce = nonce || `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      // 1. Try POST system.health
      const postRes = await this.send('system.health', { nonce: checkNonce }, {
        overrideUrl: url,
        timeoutMs: 12000,
      });

      if (postRes.ok && postRes.data) {
        return { ok: true, data: postRes.data };
      }

      // 2. Fallback to GET ?action=health&nonce=...
      const separator = url.includes('?') ? '&' : '?';
      const getUrl = `${url}${separator}action=health&nonce=${encodeURIComponent(checkNonce)}`;
      const res = await fetch(getUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      if (json.success || json.ok) {
        return { ok: true, data: json.data };
      }

      return { ok: false, error: json.error?.message || json.error || 'Health check mengembalikan status gagal' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Koneksi ke backend Apps Script gagal' };
    }
  }
}

export const apiTransport = new ApiTransport();
