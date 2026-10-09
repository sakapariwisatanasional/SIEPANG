/**
 * @license
 * SiEpang - Backend Feature Guard (Section 28)
 * Enforces server-side feature control:
 * Authentication -> Workspace Guard -> RBAC Guard -> Feature Guard -> Business Service.
 * Hiding menu in the UI is not sufficient; operations verify feature state here.
 */

import { RequestSecurityContext, BackendSecurityError } from './authGuard';
import { SystemFeatureKey } from '../../types';
import { featureControlService } from '../../services/featureControlService';

export class FeatureGuard {
  /**
   * Enforces that the requested feature is enabled in the current event/workspace scope.
   */
  public static verifyFeature(
    context: RequestSecurityContext,
    requiredFeature: SystemFeatureKey
  ): void {
    const eventId = context.eventId || '';
    const workspaceId = context.workspaceId || '';

    const detail = featureControlService.resolveFeatureDetail(requiredFeature, eventId, workspaceId);

    if (!detail.effectiveEnabled) {
      if (detail.isLocked) {
        throw new BackendSecurityError(
          `Operasi ditolak: Fitur '${detail.definition.name}' (${requiredFeature}) dinonaktifkan dan ${detail.lockReason}.`,
          403,
          'FEATURE_LOCKED'
        );
      }

      if (detail.missingDependencies.length > 0) {
        throw new BackendSecurityError(
          `Operasi ditolak: Fitur '${detail.definition.name}' memerlukan fitur induk (${detail.missingDependencies.join(', ')}) yang sedang tidak aktif.`,
          403,
          'FEATURE_DEPENDENCY_MISSING'
        );
      }

      throw new BackendSecurityError(
        `Operasi ditolak: Fitur '${detail.definition.name}' (${requiredFeature}) saat ini tidak diaktifkan pada event perkemahan ini.`,
        403,
        'FEATURE_DISABLED'
      );
    }
  }
}
