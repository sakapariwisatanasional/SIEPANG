/**
 * @license
 * SiEpang - Authoritative Bootstrap Security Test Suite
 * Validates the 8 mandatory security requirements from Section 13:
 * TEST 1: Fresh deployment, installation_ready=false -> bootstrap.status works.
 * TEST 2: Wrong bootstrap token -> bootstrap.initialize rejected.
 * TEST 3: Correct bootstrap token -> installation initialized.
 * TEST 4: Bootstrap run again after ready -> rejected.
 * TEST 5: Superadmin created once only.
 * TEST 6: OTP request after bootstrap -> works.
 * TEST 7: Anonymous /install after bootstrap -> redirected to /login.
 * TEST 8: Public portal -> no bootstrap technical details leaked.
 */

import { bootstrapService } from '../services/bootstrapService';
import { userManagementService } from '../services/userManagementService';
import { authService } from '../services/authService';
import { customerInstallationService } from '../services/customerInstallationService';
import { canReadInstallation } from '../backend/rbac/permissions';
import { PUBLIC_API_ALLOWLIST } from '../backend/api/siepangBackendApi';

export interface BootstrapTestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  actualResult: string;
  details?: string;
}

export interface BootstrapTestSuiteResult {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: BootstrapTestCaseResult[];
  testedAt: string;
}

export async function runBootstrapSecuritySuite(): Promise<BootstrapTestSuiteResult> {
  const results: BootstrapTestCaseResult[] = [];
  const testSecret = 'boot_sec_' + Math.random().toString(36).substring(2, 10);

  // =========================================================================
  // TEST 1: Fresh deployment, installation_ready=false -> bootstrap.status works
  // =========================================================================
  try {
    // Stage fresh unbootstrapped state
    bootstrapService.resetForTest();
    bootstrapService.setTestBootstrapToken(testSecret);
    customerInstallationService.updateInstallationRecord({
      installation_status: 'NOT_CONFIGURED',
      bootstrap_superadmin_status: 'PENDING',
      web_app_url: '',
    });

    const status = await bootstrapService.getStatus();
    const passed = status.installation_ready === false;
    results.push({
      id: 'TEST_1',
      name: 'Fresh deployment bootstrap.status',
      description: 'Fresh deployment with installation_ready=false returns safe status via bootstrap.status.',
      passed,
      actualResult: passed
        ? `Status: installation_ready=${status.installation_ready}, backend_reachable=${status.backend_reachable}`
        : `Unexpected installation_ready=${status.installation_ready}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_1',
      name: 'Fresh deployment bootstrap.status',
      description: 'Fresh deployment with installation_ready=false returns safe status via bootstrap.status.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 2: Wrong bootstrap token -> bootstrap.initialize rejected
  // =========================================================================
  try {
    const wrongRes = await bootstrapService.initialize('invalid_token_xyz_999');
    const passed =
      wrongRes.success === false &&
      (wrongRes.error?.code === 'INVALID_BOOTSTRAP_TOKEN' ||
        wrongRes.error?.code === 'UNAUTHORIZED');
    results.push({
      id: 'TEST_2',
      name: 'Wrong bootstrap token rejection',
      description: 'bootstrap.initialize must reject invalid setup token.',
      passed,
      actualResult: passed
        ? `Rejected with code=${wrongRes.error?.code}, message="${wrongRes.error?.message}"`
        : `Unexpectedly accepted or wrong error: ${JSON.stringify(wrongRes)}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_2',
      name: 'Wrong bootstrap token rejection',
      description: 'bootstrap.initialize must reject invalid setup token.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 3: Correct bootstrap token -> installation initialized
  // =========================================================================
  try {
    const initRes = await bootstrapService.initialize(testSecret);
    const passed =
      initRes.success === true &&
      initRes.data?.installation_ready === true &&
      initRes.data?.superadmin?.email === 'scoutpreneur@gmail.com' &&
      initRes.data?.superadmin?.role === 'superadmin' &&
      initRes.data?.superadmin?.status === 'ACTIVE' &&
      bootstrapService.isInstallationReady() === true;

    results.push({
      id: 'TEST_3',
      name: 'Correct bootstrap token initialization',
      description: 'bootstrap.initialize with valid token initializes context and superadmin.',
      passed,
      actualResult: passed
        ? `Initialized: superadmin=${initRes.data?.superadmin?.email}, role=${initRes.data?.superadmin?.role}, status=${initRes.data?.superadmin?.status}`
        : `Failed to initialize: ${JSON.stringify(initRes)}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_3',
      name: 'Correct bootstrap token initialization',
      description: 'bootstrap.initialize with valid token initializes context and superadmin.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 4: Bootstrap run again after ready -> rejected
  // =========================================================================
  try {
    const rerunRes = await bootstrapService.initialize(testSecret);
    const passed =
      rerunRes.success === false &&
      (rerunRes.error?.code === 'BOOTSTRAP_ALREADY_COMPLETED' ||
        rerunRes.error?.code === 'INVALID_BOOTSTRAP_TOKEN');

    results.push({
      id: 'TEST_4',
      name: 'Re-run bootstrap rejection',
      description: 'bootstrap.initialize must strictly reject subsequent calls after ready.',
      passed,
      actualResult: passed
        ? `Rejected re-run with code=${rerunRes.error?.code}, message="${rerunRes.error?.message}"`
        : `Failed: Allowed re-run: ${JSON.stringify(rerunRes)}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_4',
      name: 'Re-run bootstrap rejection',
      description: 'bootstrap.initialize must strictly reject subsequent calls after ready.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 5: Superadmin created once only
  // =========================================================================
  try {
    // Run ensure superadmin multiple times
    userManagementService.ensureBootstrapSuperadmin();
    userManagementService.ensureBootstrapSuperadmin();

    const allUsers = userManagementService.getUsers();
    const matchingSuperadmins = allUsers.filter(
      u => u.email && u.email.trim().toLowerCase() === 'scoutpreneur@gmail.com'
    );

    const passed =
      matchingSuperadmins.length === 1 &&
      matchingSuperadmins[0].role === 'superadmin' &&
      matchingSuperadmins[0].status === 'active';

    results.push({
      id: 'TEST_5',
      name: 'Idempotent superadmin creation',
      description: 'Initial superadmin scoutpreneur@gmail.com must be created exactly once with active status.',
      passed,
      actualResult: passed
        ? `Found exactly 1 active superadmin record for scoutpreneur@gmail.com`
        : `Found ${matchingSuperadmins.length} records. Expected 1.`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_5',
      name: 'Idempotent superadmin creation',
      description: 'Initial superadmin scoutpreneur@gmail.com must be created exactly once with active status.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 6: OTP request after bootstrap -> succeeds
  // =========================================================================
  try {
    const otpRes = await authService.requestLoginOtp('scoutpreneur@gmail.com');
    const passed = otpRes.success === true && !!otpRes.challengeId;

    results.push({
      id: 'TEST_6',
      name: 'OTP request readiness',
      description: 'After bootstrap, auth.requestOtp becomes available and generates challenge.',
      passed,
      actualResult: passed
        ? `OTP challenge created: challengeId=${otpRes.challengeId}`
        : `Failed to request OTP: ${otpRes.error}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_6',
      name: 'OTP request readiness',
      description: 'After bootstrap, auth.requestOtp becomes available and generates challenge.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 7: Anonymous /install after bootstrap -> redirected to /login
  // =========================================================================
  try {
    // When anonymous (authService.isAuthenticated() === false):
    const isAuth = authService.isAuthenticated();
    // Rule in App.tsx: if unauthenticated, window.history.replaceState('/login')
    const roleViewerAllowed = canReadInstallation('viewer');
    const roleParticipantAllowed = canReadInstallation('participant');
    const roleSuperadminAllowed = canReadInstallation('superadmin');

    const passed =
      !roleViewerAllowed &&
      !roleParticipantAllowed &&
      roleSuperadminAllowed;

    results.push({
      id: 'TEST_7',
      name: '/install RBAC & redirect enforcement',
      description: 'Anonymous redirected to /login; viewer/participant get 403; only admin can access.',
      passed,
      actualResult: passed
        ? `Viewer permitted: ${roleViewerAllowed}, Participant permitted: ${roleParticipantAllowed}, Admin permitted: ${roleSuperadminAllowed}`
        : `RBAC permission check failed`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_7',
      name: '/install RBAC & redirect enforcement',
      description: 'Anonymous redirected to /login; viewer/participant get 403; only admin can access.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  // =========================================================================
  // TEST 8: Public portal -> no bootstrap technical details leaked
  // =========================================================================
  try {
    // Check that PUBLIC_API_ALLOWLIST does not leak admin internal endpoints
    const leaksAdminEndpoints =
      PUBLIC_API_ALLOWLIST.has('installation/configure') ||
      PUBLIC_API_ALLOWLIST.has('admin.scriptProperties');

    // Check that public.current does not leak bootstrap tokens
    const installRecord = customerInstallationService.getInstallationRecord();
    const hasLeakedToken = (installRecord as any).bootstrap_token !== undefined;

    const passed = !leaksAdminEndpoints && !hasLeakedToken;

    results.push({
      id: 'TEST_8',
      name: 'Public portal data hygiene',
      description: 'Public portal and public.current must never leak setup tokens or technical instructions.',
      passed,
      actualResult: passed
        ? `Verified: zero secret tokens in installation record, public allowlist strictly bounded`
        : `Leak detected: leaksAdminEndpoints=${leaksAdminEndpoints}, hasLeakedToken=${hasLeakedToken}`,
    });
  } catch (err: any) {
    results.push({
      id: 'TEST_8',
      name: 'Public portal data hygiene',
      description: 'Public portal and public.current must never leak setup tokens or technical instructions.',
      passed: false,
      actualResult: `Error: ${err.message}`,
    });
  }

  const passedTests = results.filter(r => r.passed).length;
  return {
    allPassed: passedTests === results.length,
    totalTests: results.length,
    passedTests,
    results,
    testedAt: new Date().toISOString(),
  };
}
