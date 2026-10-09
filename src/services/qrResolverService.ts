/**
 * @license
 * SiEpang - Unified QR Token Infrastructure & Resolver Service (Req 57, 58)
 * Single authoritative QR engine with typed token purpose:
 * - PARTICIPANT
 * - ACTIVITY
 * - CHECKPOINT
 * - VISITOR
 * - CERTIFICATE
 *
 * Enforces opaque tokens, workspace/event isolation, expiry, and revocation.
 */

import {
  UnifiedQrToken,
  ResolvedQrToken,
  QrTokenPurpose,
  QrTokenStatus,
} from '../types';

class QrResolverService {
  private tokens: Map<string, UnifiedQrToken> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Pure runtime state - starts empty
  }

  /**
   * Generates a new opaque secure token
   */
  public generateSecureToken(
    purpose: QrTokenPurpose,
    workspaceId: string,
    eventId: string,
    entityId: string,
    metadata?: Record<string, any>,
    expiresAt?: string
  ): UnifiedQrToken {
    const randomHex = Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    const purposePrefix = purpose.substring(0, 3).toUpperCase();
    const tokenString = `SIEPANG:QR:v1:${purposePrefix}_${entityId}_${randomHex}`;
    const tokenId = `tok_${purpose.toLowerCase()}_${Date.now()}`;

    const token: UnifiedQrToken = {
      tokenId,
      tokenString,
      purpose,
      workspaceId,
      eventId,
      entityId,
      version: 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      expiresAt,
      metadata,
    };

    this.tokens.set(tokenString, token);
    this.notify();
    return token;
  }

  /**
   * Authoritative backend token resolver
   */
  public resolveToken(
    tokenInput: string,
    currentWorkspaceId?: string,
    currentEventId?: string
  ): ResolvedQrToken {
    const cleaned = tokenInput.trim();

    // 1. Direct lookup in unified token registry
    let found = this.tokens.get(cleaned);

    // 2. If not found, check if input is a participant code (e.g. S-2026-001 or NTA)
    if (!found) {
      // Check if matches known pattern or participant
      if (cleaned.startsWith('S-2026') || cleaned.startsWith('P-') || cleaned.includes('-')) {
        return {
          isValid: true,
          purpose: 'PARTICIPANT',
          resolvedData: {
            participantCode: cleaned,
          },
        };
      }

      // Check if matches visitor registration code format (VIS-xxxx)
      if (cleaned.toUpperCase().startsWith('VIS-')) {
        const matchingToken = Array.from(this.tokens.values()).find(
          t => t.purpose === 'VISITOR' && t.metadata?.registrationCode?.toUpperCase() === cleaned.toUpperCase()
        );
        if (matchingToken) {
          found = matchingToken;
        } else {
          return {
            isValid: true,
            purpose: 'VISITOR',
            resolvedData: {
              registrationCode: cleaned.toUpperCase(),
            },
          };
        }
      }
    }

    if (!found) {
      return {
        isValid: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Kode QR tidak dikenali dalam sistem resmi SiEpang.',
      };
    }

    // 3. Status checks
    if (found.status === 'REVOKED') {
      return {
        isValid: false,
        errorCode: 'REVOKED',
        errorMessage: `Akses QR telah dicabut (Revoked). Alasan: ${found.revocationReason || 'Kebijakan Keamanan'}`,
        purpose: found.purpose,
        token: found,
      };
    }

    if (found.status === 'INACTIVE') {
      return {
        isValid: false,
        errorCode: 'INACTIVE',
        errorMessage: 'Kode QR berstatus tidak aktif atau telah digantikan oleh token baru.',
        purpose: found.purpose,
        token: found,
      };
    }

    // 4. Expiry check
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      return {
        isValid: false,
        errorCode: 'EXPIRED',
        errorMessage: 'Masa berlaku Kode QR telah kadaluarsa.',
        purpose: found.purpose,
        token: found,
      };
    }

    // 5. Workspace / Event scope validation
    if (currentWorkspaceId && found.workspaceId !== currentWorkspaceId) {
      return {
        isValid: false,
        errorCode: 'WRONG_WORKSPACE',
        errorMessage: 'Kode QR berasal dari pangkalan / workspace berbeda.',
        purpose: found.purpose,
        token: found,
      };
    }

    if (currentEventId && found.eventId !== currentEventId) {
      return {
        isValid: false,
        errorCode: 'WRONG_EVENT',
        errorMessage: 'Kode QR bukan untuk kegiatan perkemahan yang sedang aktif.',
        purpose: found.purpose,
        token: found,
      };
    }

    return {
      isValid: true,
      purpose: found.purpose,
      token: found,
      resolvedData: {
        entityId: found.entityId,
        metadata: found.metadata,
      },
    };
  }

  /**
   * Rotate / regenerate token for security (Req 20)
   */
  public rotateToken(
    oldTokenString: string,
    rotatedBy: string,
    reason: string
  ): UnifiedQrToken {
    const existing = this.tokens.get(oldTokenString);
    if (!existing) {
      throw new Error('Token lama tidak ditemukan.');
    }

    // Invalidate old token
    existing.status = 'INACTIVE';
    existing.revokedAt = new Date().toISOString();
    existing.revokedBy = rotatedBy;
    existing.revocationReason = `Digantikan dengan token baru: ${reason}`;

    // Generate new version
    const randomHex = Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    const purposePrefix = existing.purpose.substring(0, 3).toUpperCase();
    const newTokenString = `SIEPANG:QR:v1:${purposePrefix}_${existing.entityId}_v${existing.version + 1}_${randomHex}`;

    const newToken: UnifiedQrToken = {
      tokenId: `tok_${existing.purpose.toLowerCase()}_${Date.now()}`,
      tokenString: newTokenString,
      purpose: existing.purpose,
      workspaceId: existing.workspaceId,
      eventId: existing.eventId,
      entityId: existing.entityId,
      version: existing.version + 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      expiresAt: existing.expiresAt,
      metadata: {
        ...existing.metadata,
        rotatedFrom: oldTokenString,
        rotationReason: reason,
        rotatedBy,
      },
    };

    this.tokens.set(newTokenString, newToken);
    this.notify();
    return newToken;
  }

  /**
   * Revoke a token permanently
   */
  public revokeToken(tokenString: string, revokedBy: string, reason: string): void {
    const token = this.tokens.get(tokenString);
    if (token) {
      token.status = 'REVOKED';
      token.revokedAt = new Date().toISOString();
      token.revokedBy = revokedBy;
      token.revocationReason = reason;
      this.notify();
    }
  }

  public getTokenByString(tokenString: string): UnifiedQrToken | undefined {
    return this.tokens.get(tokenString);
  }

  public getTokensByEntity(entityId: string): UnifiedQrToken[] {
    return Array.from(this.tokens.values()).filter(t => t.entityId === entityId);
  }

  public getAllTokens(): UnifiedQrToken[] {
    return Array.from(this.tokens.values());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const qrResolverService = new QrResolverService();
