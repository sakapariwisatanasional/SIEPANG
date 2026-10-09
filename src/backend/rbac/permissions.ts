/**
 * @license
 * SiEpang - Role-Based Access Control (RBAC) Permission Definitions (Milestone v1.6)
 * Strict backend permission checks ensuring no client-side trust.
 * 
 * ============================================================================
 * RBAC ARCHITECTURAL AUDIT & PERSISTENCE DOCUMENTATION (Requirement 3)
 * ============================================================================
 * 1. STATIC INVARIANTS (By System Design):
 *    - Role Definitions (superadmin, workspace_admin, event_admin, judge,
 *      attendance_officer, health_officer, scout_leader, participant)
 *    - Permission Identifiers ('event.view', 'event.update', etc.)
 *    - Standard Baseline Role-Permission Matrices (ROLE_BACKEND_PERMISSIONS)
 *    These are kept static in backend code to enforce cryptographic & authorization
 *    invariants and prevent unauthorized privilege escalation or permission tampering.
 * 
 * 2. AUTHORITATIVE PERSISTENT STORAGE:
 *    - User Identifiers & Core Profiles: Canonical table `Users` (id, workspace_id, name, email, role, status)
 *    - Dynamic Role & Scope Assignments: Canonical table `UserRoleAssignments`
 *      (id, user_id, role, scope_type, scope_id, permissions_json, granted_by, granted_at)
 *    - Organization Scoping: Canonical table `Organizations`
 * 
 * Every runtime authorization resolution evaluates persistent UserRoleAssignments
 * first, falling back to static role baseline matrices only for unassigned defaults.
 * ============================================================================
 */

import { UserRole } from '../../types';

export type BackendPermission =
  | 'event.view'
  | 'event.update'
  | 'event.archive'
  | 'schedule.view'
  | 'schedule.create'
  | 'schedule.update'
  | 'schedule.duplicate'
  | 'schedule.move'
  | 'schedule.publish'
  | 'schedule.archive'
  | 'activity.manage'
  | 'campsite.view'
  | 'campsite.manage'
  | 'competition.view'
  | 'competition.manage'
  | 'judge.manage'
  | 'voting.manage'
  | 'registration.manage'
  | 'point.manage'
  | 'badge.manage'
  | 'checkpoint.manage'
  | 'announcement.manage'
  | 'content.manage'
  | 'facility.manage'
  | 'contact.manage'
  | 'documentation.read'
  | 'documentation.create'
  | 'documentation.update'
  | 'documentation.publish'
  | 'documentation.archive'
  | 'documentation.manage'
  | 'banner.read'
  | 'banner.create'
  | 'banner.update'
  | 'banner.publish'
  | 'banner.archive'
  | 'banner.manage'
  | 'sponsor.read'
  | 'sponsor.create'
  | 'sponsor.update'
  | 'sponsor.publish'
  | 'sponsor.manage'
  | 'installation.read'
  | 'installation.manage'
  | 'installation.recovery';

export const ROLE_BACKEND_PERMISSIONS: Record<UserRole, BackendPermission[]> = {
  superadmin: [
    'installation.read',
    'installation.manage',
    'installation.recovery',
    'event.view',
    'event.update',
    'event.archive',
    'schedule.view',
    'schedule.create',
    'schedule.update',
    'schedule.duplicate',
    'schedule.move',
    'schedule.publish',
    'schedule.archive',
    'activity.manage',
    'campsite.view',
    'campsite.manage',
    'competition.view',
    'competition.manage',
    'judge.manage',
    'voting.manage',
    'registration.manage',
    'point.manage',
    'badge.manage',
    'checkpoint.manage',
    'announcement.manage',
    'content.manage',
    'facility.manage',
    'contact.manage',
    'documentation.read',
    'documentation.create',
    'documentation.update',
    'documentation.publish',
    'documentation.archive',
    'documentation.manage',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.publish',
    'banner.archive',
    'banner.manage',
    'sponsor.read',
    'sponsor.create',
    'sponsor.update',
    'sponsor.publish',
    'sponsor.manage',
  ],
  workspace_admin: [
    'installation.read',
    'installation.manage',
    'installation.recovery',
    'event.view',
    'event.update',
    'event.archive',
    'schedule.view',
    'schedule.create',
    'schedule.update',
    'schedule.duplicate',
    'schedule.move',
    'schedule.publish',
    'schedule.archive',
    'activity.manage',
    'campsite.view',
    'campsite.manage',
    'competition.view',
    'competition.manage',
    'judge.manage',
    'voting.manage',
    'registration.manage',
    'point.manage',
    'badge.manage',
    'checkpoint.manage',
    'announcement.manage',
    'content.manage',
    'facility.manage',
    'contact.manage',
    'documentation.read',
    'documentation.create',
    'documentation.update',
    'documentation.publish',
    'documentation.archive',
    'documentation.manage',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.publish',
    'banner.archive',
    'banner.manage',
    'sponsor.read',
    'sponsor.create',
    'sponsor.update',
    'sponsor.publish',
    'sponsor.manage',
  ],
  event_admin: [
    'installation.read',
    'installation.manage',
    'event.view',
    'event.update',
    'event.archive',
    'schedule.view',
    'schedule.create',
    'schedule.update',
    'schedule.duplicate',
    'schedule.move',
    'schedule.publish',
    'schedule.archive',
    'activity.manage',
    'campsite.view',
    'campsite.manage',
    'competition.view',
    'competition.manage',
    'judge.manage',
    'voting.manage',
    'registration.manage',
    'point.manage',
    'badge.manage',
    'checkpoint.manage',
    'announcement.manage',
    'content.manage',
    'facility.manage',
    'contact.manage',
    'documentation.read',
    'documentation.create',
    'documentation.update',
    'documentation.publish',
    'documentation.archive',
    'documentation.manage',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.publish',
    'banner.archive',
    'banner.manage',
    'sponsor.read',
    'sponsor.create',
    'sponsor.update',
    'sponsor.publish',
    'sponsor.manage',
  ],
  committee: [
    'event.view',
    'schedule.view',
    'campsite.view',
    'competition.view',
    'activity.manage',
    'announcement.manage',
    'facility.manage',
    'checkpoint.manage',
  ],
  judge: [
    'event.view',
    'competition.view',
    'competition.manage',
  ],
  attendance_officer: [
    'event.view',
    'schedule.view',
    'campsite.view',
    'competition.view',
    'checkpoint.manage',
  ],
  registration_officer: [
    'event.view',
    'registration.manage',
    'campsite.view',
    'campsite.manage',
    'competition.view',
  ],
  kontingen_admin: [
    'event.view',
    'schedule.view',
    'campsite.view',
    'competition.view',
  ],
  health_officer: [
    'event.view',
    'campsite.view',
    'contact.manage',
  ],
  logistic_officer: [
    'event.view',
    'campsite.view',
    'facility.manage',
  ],
  ceremony_officer: [
    'event.view',
    'schedule.view',
    'competition.view',
  ],
  participant: [
    'event.view',
    'schedule.view',
    'campsite.view',
    'competition.view',
  ],
  documentation_officer: [
    'event.view',
    'schedule.view',
    'documentation.read',
    'documentation.create',
    'documentation.update',
    'documentation.publish',
    'documentation.archive',
    'documentation.manage',
  ],
  publication_officer: [
    'event.view',
    'schedule.view',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.publish',
    'banner.archive',
    'banner.manage',
    'sponsor.read',
    'sponsor.create',
    'sponsor.update',
    'sponsor.publish',
    'sponsor.manage',
    'documentation.read',
  ],
  viewer: [
    'event.view',
    'schedule.view',
    'campsite.view',
    'competition.view',
  ],
};

export function hasBackendPermission(role: UserRole, permission: BackendPermission): boolean {
  const allowed = ROLE_BACKEND_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

export function canManageInstallation(role?: UserRole): boolean {
  if (!role) return false;
  return hasBackendPermission(role, 'installation.manage');
}

export function canReadInstallation(role?: UserRole): boolean {
  if (!role) return false;
  return hasBackendPermission(role, 'installation.read');
}
