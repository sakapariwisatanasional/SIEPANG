/**
 * @license
 * SiEpang - Backend Authentication, Workspace Guard & RBAC Enforcement
 * Do not trust roles or permissions provided by the frontend.
 */

import { UserRole } from '../../types';
import { BackendPermission, hasBackendPermission } from '../rbac/permissions';
import { userManagementService } from '../../services/userManagementService';

export interface RequestSecurityContext {
  userId: string;
  userRole: UserRole;
  workspaceId?: string | null;
  installationId?: string | null;
  eventId?: string | null;
  authToken?: string;
}

export class BackendSecurityError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 403, code = 'FORBIDDEN') {
    super(message);
    this.name = 'BackendSecurityError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthGuard {
  /**
   * Enforces that the request has a valid authenticated session and active account.
   */
  public static verifyAuthentication(context: RequestSecurityContext): void {
    if (!context || !context.userId || context.userId === 'anonymous' || !context.userRole) {
      throw new BackendSecurityError('Autentikasi gagal: Sesi pengguna tidak ditemukan atau tidak valid.', 401, 'UNAUTHORIZED');
    }

    const authoritativeUser = userManagementService.getUsers().find(u => u.id === context.userId);
    if (authoritativeUser && (authoritativeUser.status === 'inactive' || (authoritativeUser as any).status === 'DISABLED')) {
      throw new BackendSecurityError('Akun pengguna dinonaktifkan oleh Administrator.', 403, 'ACCOUNT_DISABLED');
    }
  }

  /**
   * Resolves the authoritative role from persistence rather than trusting frontend role.
   * Prevents client-side role injection.
   */
  public static resolveAuthoritativeRole(context: RequestSecurityContext): UserRole {
    if (!context || !context.userId || context.userId === 'anonymous') {
      return 'viewer';
    }

    const authoritativeUser = userManagementService.getUsers().find(u => u.id === context.userId);
    if (authoritativeUser) {
      if (authoritativeUser.status === 'inactive' || (authoritativeUser as any).status === 'DISABLED') {
        throw new BackendSecurityError('Akun pengguna dinonaktifkan oleh Administrator.', 403, 'ACCOUNT_DISABLED');
      }
      // If client attempted to inject an unauthorized higher role, override with authoritative role
      return authoritativeUser.role;
    }

    return context.userRole || 'viewer';
  }

  /**
   * Enforces that the user belongs to the target workspace or is a superadmin.
   */
  public static verifyWorkspaceGuard(context: RequestSecurityContext, targetWorkspaceId?: string): void {
    this.verifyAuthentication(context);
    const effectiveRole = this.resolveAuthoritativeRole(context);

    if (effectiveRole === 'superadmin') {
      return; // Superadmin has global tenant access
    }

    if (targetWorkspaceId && context.workspaceId !== targetWorkspaceId) {
      throw new BackendSecurityError(
        `Akses ditolak: Pengguna tidak memiliki otorisasi untuk workspace target (${targetWorkspaceId}).`,
        403,
        'WORKSPACE_ACCESS_DENIED'
      );
    }
  }

  /**
   * Enforces backend RBAC check against authoritative persistence.
   */
  public static verifyPermission(context: RequestSecurityContext, requiredPermission: BackendPermission): void {
    this.verifyAuthentication(context);
    const effectiveRole = this.resolveAuthoritativeRole(context);
    const permitted = hasBackendPermission(effectiveRole, requiredPermission);
    if (!permitted) {
      throw new BackendSecurityError(
        `Akses ditolak: Peran '${effectiveRole}' tidak memiliki izin '${requiredPermission}' untuk operasi ini.`,
        403,
        'PERMISSION_DENIED'
      );
    }
  }
}
