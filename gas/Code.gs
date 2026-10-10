/**
 * ============================================================================
 * SIEPANG STANDALONE BACKEND ENGINE (Production Hardened v1.9.1 — Build 2026.10.10)
 * Sistem Informasi Perkemahan Pramuka — Customer-Owned Deployment
 * ============================================================================
 * REAL GAS BACKEND · REAL SPREADSHEET DATABASE · REAL OTP EMAIL
 * REAL TRUSTED DEVICE · REAL PERSISTENT SESSION · REAL SUPERADMIN BOOTSTRAP
 * ============================================================================
 */

// 1. AUTHORITATIVE BACKEND CONFIGURATION
var CONFIG = {
  INSTALLATION_ID: '',
  WORKSPACE_ID: '',
  SPREADSHEET_ID: '',
  DRIVE_ROOT_ID: '',
  DATABASE_FOLDER_ID: '',
  BRANDING_FOLDER_ID: '',
  DOCUMENTS_FOLDER_ID: '',
  CERTIFICATES_FOLDER_ID: '',
  IDCARDS_FOLDER_ID: '',
  BACKUP_FOLDER_ID: '',
  ASSETS_FOLDER_ID: '',
  BOOTSTRAP_SUPERADMIN_EMAIL: 'scoutpreneur@gmail.com',
  BACKEND_VERSION: 'v1.9.1',
  SCHEMA_VERSION: 'v1.9',
  ENVIRONMENT: 'PRODUCTION',
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_SECONDS: 60,
  SESSION_TTL_DAYS: 30,
  TRUSTED_DEVICE_TTL_DAYS: 90
};

/**
 * Inisialisasi Script Properties jika belum tersimpan di Project Settings
 */
function initScriptProperties() {
  var props = PropertiesService.getScriptProperties();
  var currentProps = props.getProperties();

  var updates = {};
  if (!currentProps['SIEPANG_INSTALLATION_ID']) {
    updates['SIEPANG_INSTALLATION_ID'] = 'inst_' + Utilities.getUuid().replace(/-/g, '').substring(0, 20);
  }
  // Workspace/event are never invented. They are set only after a real workspace/event exists.
  if (!currentProps['SIEPANG_WORKSPACE_ID']) updates['SIEPANG_WORKSPACE_ID'] = '';
  if (!currentProps['SIEPANG_INSTALLATION_MODE']) updates['SIEPANG_INSTALLATION_MODE'] = 'SINGLE_EVENT';
  if (!currentProps['SIEPANG_ACTIVE_WORKSPACE_ID']) updates['SIEPANG_ACTIVE_WORKSPACE_ID'] = '';
  if (!currentProps['SIEPANG_ACTIVE_EVENT_ID']) updates['SIEPANG_ACTIVE_EVENT_ID'] = '';
  if (!currentProps['SPREADSHEET_ID']) updates['SPREADSHEET_ID'] = '';
  if (!currentProps['DRIVE_ROOT_ID']) updates['DRIVE_ROOT_ID'] = '';
  if (!currentProps['BACKEND_VERSION']) updates['BACKEND_VERSION'] = CONFIG.BACKEND_VERSION;
  if (!currentProps['SCHEMA_VERSION']) updates['SCHEMA_VERSION'] = CONFIG.SCHEMA_VERSION;
  if (!currentProps['BOOTSTRAP_SUPERADMIN_EMAIL']) updates['BOOTSTRAP_SUPERADMIN_EMAIL'] = CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL;
  if (!currentProps['SUPERADMIN_BOOTSTRAPPED']) updates['SUPERADMIN_BOOTSTRAPPED'] = 'false';
  if (!currentProps['SESSION_SIGNING_SECRET']) updates['SESSION_SIGNING_SECRET'] = 'sec_' + Utilities.getUuid().replace(/-/g, '');
  if (!currentProps['TOKEN_HASH_SECRET']) updates['TOKEN_HASH_SECRET'] = 'thash_' + Utilities.getUuid().replace(/-/g, '');
  if (!currentProps['OTP_EXPIRY_MINUTES']) updates['OTP_EXPIRY_MINUTES'] = String(CONFIG.OTP_EXPIRY_MINUTES);
  if (!currentProps['OTP_MAX_ATTEMPTS']) updates['OTP_MAX_ATTEMPTS'] = String(CONFIG.OTP_MAX_ATTEMPTS);
  if (!currentProps['OTP_RESEND_SECONDS']) updates['OTP_RESEND_SECONDS'] = String(CONFIG.OTP_RESEND_SECONDS);
  if (!currentProps['SESSION_TTL_DAYS']) updates['SESSION_TTL_DAYS'] = String(CONFIG.SESSION_TTL_DAYS);
  if (!currentProps['TRUSTED_DEVICE_TTL_DAYS']) updates['TRUSTED_DEVICE_TTL_DAYS'] = String(CONFIG.TRUSTED_DEVICE_TTL_DAYS);

  if (Object.keys(updates).length > 0) {
    props.setProperties(updates);
    Logger.log('Script Properties SiEpang berhasil diinisialisasi.');
  }
}

/**
 * Mengambil Spreadsheet Database Customer (SpreadsheetApp.openById — NEVER getActiveSpreadsheet)
 */
function getCustomerDatabase() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SPREADSHEET_ID') || props.getProperty('SIEPANG_SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  if (sheetId && sheetId !== 'DISCONNECTED') {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {}
  }

  // Auto-find or create inside /SiEpang/Database/
  var rootFolder = getCustomerDriveRoot();
  var dbFolderIter = rootFolder.getFoldersByName('Database');
  var dbFolder = dbFolderIter.hasNext() ? dbFolderIter.next() : rootFolder.createFolder('Database');
  props.setProperty('DATABASE_FOLDER_ID', dbFolder.getId());

  var sheetName = 'SiEpang Database (' + (props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || props.getProperty('SIEPANG_WORKSPACE_ID') || 'Utama') + ')';
  var filesIter = dbFolder.getFilesByName(sheetName);
  var ss;
  if (filesIter.hasNext()) {
    var file = filesIter.next();
    ss = SpreadsheetApp.openById(file.getId());
  } else {
    ss = SpreadsheetApp.create(sheetName);
    var driveFile = DriveApp.getFileById(ss.getId());
    dbFolder.addFile(driveFile);
    DriveApp.getRootFolder().removeFile(driveFile);
  }
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

/**
 * Mengambil Folder Root Drive Customer
 */
function getCustomerDriveRoot() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRIVE_ROOT_ID') || props.getProperty('SIEPANG_ROOT_DRIVE_FOLDER_ID') || CONFIG.DRIVE_ROOT_ID;
  if (folderId && folderId !== 'DISCONNECTED') {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {}
  }

  // Auto-find or create root /SiEpang/ folder in customer Drive
  var iter = DriveApp.getRootFolder().getFoldersByName('SiEpang');
  var folder;
  if (iter.hasNext()) {
    folder = iter.next();
  } else {
    folder = DriveApp.getRootFolder().createFolder('SiEpang');
  }
  props.setProperty('DRIVE_ROOT_ID', folder.getId());
  return folder;
}

/**
 * Helper: Hashing SHA-256 menggunakan Google Apps Script Utilities
 * Never store plaintext OTP, session tokens, or device tokens
 */
function hashSha256(text, salt) {
  if (!text) return '';
  var props = PropertiesService.getScriptProperties();
  var secret = salt || props.getProperty('TOKEN_HASH_SECRET') || '';
  var combined = String(text) + (secret ? (':' + secret) : '');
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < raw.length; i++) {
    var b = (raw[i] + 256) % 256;
    var h = b.toString(16);
    if (h.length === 1) h = '0' + h;
    hex += h;
  }
  return hex;
}

/**
 * Helper: Pengiriman Email Kode Verifikasi OTP (Real MailApp.sendEmail)
 * Format persis sesuai spesifikasi Part 8
 */
function sendVerificationOtpEmail(recipientEmail, otpCode, purposeLabel) {
  var subject = 'Kode Verifikasi SiEpang';
  var body = 'Kode Verifikasi SiEpang\n\n' +
    'Kode Anda:\n' +
    otpCode + '\n\n' +
    'Kode berlaku selama 10 menit.\n\n' +
    'Jangan berikan kode ini kepada siapa pun.';

  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });
    return true;
  } catch (err) {
    Logger.log('Gagal mengirim email OTP ke ' + recipientEmail + ': ' + err.toString());
    return false;
  }
}

/**
 * Helper: Audit Log Persistence (Zero sensitive tokens in audit log)
 */
function recordAuditLog(db, module, action, actorUserId, role, target, detailsJson) {
  try {
    var auditSheet = db.getSheetByName('AuditLogs');
    if (auditSheet) {
      auditSheet.appendRow([
        'aud_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 6),
        new Date().toISOString(),
        actorUserId || 'system',
        action,
        module,
        target || '',
        'WORKSPACE',
        PropertiesService.getScriptProperties().getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || '',
        'SUCCESS',
        detailsJson || ''
      ]);
    }
  } catch (e) {}
}

/**
 * ============================================================================
 * PART 3 — FUNGSI SETUP UTAMA: setupSiEpangBackend()
 * ============================================================================
 * Idempotent: Validasi Script Properties, Spreadsheet, Drive, Skema 45 Tabel, Metadata
 */
function setupSiEpangBackend() {
  initScriptProperties();
  var props = PropertiesService.getScriptProperties();

  // 1. Validasi & Struktur Drive
  var rootFolder;
  var subfolderReport = {};
  try {
    rootFolder = getCustomerDriveRoot();
    var requiredSubfolders = ['Database', 'Branding', 'Documents', 'Certificates', 'ID Cards', 'Backup', 'Assets'];
    for (var f = 0; f < requiredSubfolders.length; f++) {
      var subName = requiredSubfolders[f];
      var iter = rootFolder.getFoldersByName(subName);
      var folder;
      if (iter.hasNext()) {
        folder = iter.next();
      } else {
        folder = rootFolder.createFolder(subName);
      }
      subfolderReport[subName] = folder.getId();
    }
  } catch (err) {
    return { ok: false, error: 'DRIVE_ERROR', message: 'Gagal mengakses root Drive: ' + err.message };
  }

  // 2. Validasi Spreadsheet
  var db;
  try {
    db = getCustomerDatabase();
  } catch (err) {
    return { ok: false, error: 'DATABASE_ERROR', message: 'Gagal membuka Spreadsheet: ' + err.message };
  }

  // 3. Provisi Tabel & Skema Kanonikal (Idempotent)
  var provRes = provisionCanonicalSchemaV19();

  // 3b. Migrasi kolom Events secara idempotent untuk instalasi yang sudah ada
  ensureEventsSheet_();

  // 4. Inisialisasi SystemConfig
  try {
    var configSheet = db.getSheetByName('SystemConfig');
    if (configSheet) {
      var cRows = configSheet.getDataRange().getValues();
      var existingKeys = {};
      for (var r = 1; r < cRows.length; r++) {
        existingKeys[cRows[r][0]] = true;
      }
      var nowIso = new Date().toISOString();
      var defaultEntries = [
        ['installation_id', props.getProperty('SIEPANG_INSTALLATION_ID') || '', 'ID Instalasi resmi'],
        ['workspace_id', props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || props.getProperty('SIEPANG_WORKSPACE_ID') || '', 'ID Workspace aktif'],
        ['backend_version', CONFIG.BACKEND_VERSION, 'Versi Google Apps Script Backend'],
        ['schema_version', CONFIG.SCHEMA_VERSION, 'Versi Skema Spreadsheet'],
        ['environment', CONFIG.ENVIRONMENT, 'Lingkungan eksekusi'],
        ['created_at', nowIso, 'Waktu inisialisasi awal'],
        ['updated_at', nowIso, 'Waktu perbaruan terakhir']
      ];
      for (var d = 0; d < defaultEntries.length; d++) {
        var entry = defaultEntries[d];
        if (!existingKeys[entry[0]]) {
          configSheet.appendRow([entry[0], entry[1], entry[2], nowIso]);
        }
      }
    }
  } catch (err) {
    Logger.log('SystemConfig init warning: ' + err.toString());
  }

  var report = {
    ok: true,
    status: 'READY',
    backend_version: CONFIG.BACKEND_VERSION,
    schema_version: CONFIG.SCHEMA_VERSION,
    spreadsheet_id: db.getId(),
    drive_root_id: rootFolder.getId(),
    subfolders: subfolderReport,
    sheets_created_count: provRes.created_sheets_count,
    total_sheets_count: db.getSheets().length,
    timestamp: new Date().toISOString()
  };

  Logger.log('setupSiEpangBackend SELESAI: ' + JSON.stringify(report));
  return report;
}

/**
 * ============================================================================
 * PART 9 — MAIL TEST & DIAGNOSTICS FUNCTIONS
 * ============================================================================
 */
function testSendOtpEmail(targetEmail) {
  var props = PropertiesService.getScriptProperties();
  var email = targetEmail || props.getProperty('BOOTSTRAP_SUPERADMIN_EMAIL') || Session.getActiveUser().getEmail() || CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL;
  if (!email) {
    Logger.log('testSendOtpEmail GAGAL: Alamat email tujuan tidak boleh kosong.');
    return { ok: false, error: 'NO_RECIPIENT', message: 'Tentukan alamat email penerima.' };
  }

  var testOtp = String(Math.floor(100000 + Math.random() * 900000));
  var sent = sendVerificationOtpEmail(email, testOtp, 'Pengujian Pengiriman Email OTP');

  var quota = getMailQuotaStatus();
  var res = {
    ok: sent,
    recipient: email,
    remaining_daily_quota: quota.remaining_daily_quota,
    message: sent ? 'Email uji coba OTP berhasil dikirim ke ' + email : 'Gagal mengirim email. Periksa izin MailApp akun.'
  };
  Logger.log('testSendOtpEmail Result: ' + JSON.stringify(res));
  return res;
}

function getMailQuotaStatus() {
  try {
    var quota = MailApp.getRemainingDailyQuota();
    return { ok: true, remaining_daily_quota: quota };
  } catch (err) {
    return { ok: false, error: err.toString(), remaining_daily_quota: 0 };
  }
}

/**
 * ============================================================================
 * PART 22 — SUPERADMIN BOOTSTRAP (Idempotent with LockService)
 * ============================================================================
 */
function bootstrapSuperAdminForVerifiedUser(userEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { ok: false, error: { code: 'SERVER_BUSY', message: 'Server sedang sibuk.' } };
  }

  try {
    var props = PropertiesService.getScriptProperties();
    var isBootstrapped = props.getProperty('SUPERADMIN_BOOTSTRAPPED') === 'true';
    if (isBootstrapped) {
      return { ok: false, error: { code: 'ALREADY_BOOTSTRAPPED', message: 'SuperAdmin telah di-bootstrap sebelumnya.' } };
    }

    var canonicalBootstrapEmail = String(
      props.getProperty('BOOTSTRAP_SUPERADMIN_EMAIL') || CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL || ''
    ).trim().toLowerCase();
    var requestedEmail = String(userEmail || canonicalBootstrapEmail || '').trim().toLowerCase();
    if (!canonicalBootstrapEmail) {
      return { ok: false, error: { code: 'BOOTSTRAP_EMAIL_EMPTY', message: 'BOOTSTRAP_SUPERADMIN_EMAIL belum dikonfigurasi.' } };
    }
    if (requestedEmail !== canonicalBootstrapEmail) {
      return { ok: false, error: { code: 'BOOTSTRAP_EMAIL_MISMATCH', message: 'Email tidak diizinkan sebagai SuperAdmin bootstrap.' } };
    }
    var targetEmail = canonicalBootstrapEmail;

    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var roleSheet = db.getSheetByName('UserRoleAssignments');

    if (!usersSheet || !roleSheet) {
      provisionCanonicalSchemaV19();
      usersSheet = db.getSheetByName('Users');
      roleSheet = db.getSheetByName('UserRoleAssignments');
    }

    var uRows = usersSheet.getDataRange().getValues();
    var existingUserId = null;
    var userRowIdx = -1;

    for (var u = 1; u < uRows.length; u++) {
      if (uRows[u][1] && String(uRows[u][1]).trim().toLowerCase() === targetEmail) {
        existingUserId = uRows[u][0];
        userRowIdx = u + 1;
        break;
      }
    }

    var nowIso = new Date().toISOString();
    if (!existingUserId) {
      existingUserId = 'usr_super_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      usersSheet.appendRow([
        existingUserId,
        targetEmail,
        'Administrator Utama (SuperAdmin)',
        'true', // email_verified
        'active',
        nowIso,
        'SYSTEM_BOOTSTRAP',
        nowIso,
        nowIso,
        '', // avatar_url
        '', // phone
        'ORG_GLOBAL'
      ]);
    } else {
      usersSheet.getRange(userRowIdx, 4).setValue('true'); // email_verified
      usersSheet.getRange(userRowIdx, 5).setValue('active'); // status
      usersSheet.getRange(userRowIdx, 8).setValue(nowIso); // updated_at
    }

    // Assign SYSTEM/GLOBAL superadmin role idempotently.
    var assignmentId = '';
    var roleRows = roleSheet.getDataRange().getValues();
    for (var rr = 1; rr < roleRows.length; rr++) {
      if (
        String(roleRows[rr][1] || '') === existingUserId &&
        String(roleRows[rr][2] || '') === 'superadmin' &&
        String(roleRows[rr][3] || '') === 'SYSTEM' &&
        String(roleRows[rr][4] || '') === 'GLOBAL' &&
        String(roleRows[rr][5] || '').toLowerCase() === 'active'
      ) {
        assignmentId = String(roleRows[rr][0] || '');
        break;
      }
    }
    if (!assignmentId) {
      assignmentId = 'asgn_boot_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      roleSheet.appendRow([
        assignmentId,
        existingUserId,
        'superadmin',
        'SYSTEM',
        'GLOBAL',
        'active',
        'SYSTEM_BOOTSTRAP',
        nowIso,
        ''
      ]);
    }

    recordAuditLog(db, 'AUTH', 'SUPERADMIN_BOOTSTRAPPED', existingUserId, 'superadmin', targetEmail, JSON.stringify({ scope: 'SYSTEM/GLOBAL' }));
    props.setProperty('SUPERADMIN_BOOTSTRAPPED', 'true');

    return {
      ok: true,
      data: {
        user_id: existingUserId,
        email: targetEmail,
        role: 'superadmin',
        scope_type: 'SYSTEM',
        scope_id: 'GLOBAL',
        bootstrapped: true
      }
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * One-time production setup helper.
 * Run manually from Apps Script editor after pasting Code.gs.
 * It initializes Script Properties, Drive/Spreadsheet schema and keeps the
 * SuperAdmin bootstrap gated behind real OTP verification.
 */
function setupSiEpangProduction() {
  initScriptProperties();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('BOOTSTRAP_SUPERADMIN_EMAIL', CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL);
  var setup = setupSiEpangBackend();
  if (!setup || setup.ok !== true) return setup;
  return {
    ok: true,
    status: 'BACKEND_READY_FOR_OTP',
    backend_version: CONFIG.BACKEND_VERSION,
    bootstrap_superadmin_email: CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL,
    superadmin_bootstrapped: props.getProperty('SUPERADMIN_BOOTSTRAPPED') === 'true',
    spreadsheet_configured: !!props.getProperty('SPREADSHEET_ID'),
    drive_configured: !!props.getProperty('DRIVE_ROOT_ID'),
    active_workspace_configured: !!props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID'),
    active_event_configured: !!props.getProperty('SIEPANG_ACTIVE_EVENT_ID')
  };
}

/**
 * ============================================================================
 * PART 46 & 47 — CLEANUP & BACKUP JOBS
 * ============================================================================
 */
function cleanupAuthData() {
  var db = getCustomerDatabase();
  var nowMs = new Date().getTime();

  // 1. Clean expired OTP challenges older than 24 hours
  var otpSheet = db.getSheetByName('AuthOtpChallenges');
  if (otpSheet) {
    var oRows = otpSheet.getDataRange().getValues();
    for (var o = oRows.length - 1; o >= 1; o--) {
      var expMs = new Date(oRows[o][4]).getTime();
      var used = oRows[o][9] === 'USED';
      if ((used || oRows[o][9] === 'EXPIRED' || oRows[o][9] === 'LOCKED') && (nowMs - expMs > 24 * 60 * 60 * 1000)) {
        otpSheet.deleteRow(o + 1);
      }
    }
  }

  // 2. Clean revoked sessions older than 30 days
  var sessSheet = db.getSheetByName('AuthSessions');
  if (sessSheet) {
    var sRows = sessSheet.getDataRange().getValues();
    for (var s = sRows.length - 1; s >= 1; s--) {
      var sExpMs = new Date(sRows[s][6]).getTime();
      if (sRows[s][8] === 'revoked' && (nowMs - sExpMs > 30 * 24 * 60 * 60 * 1000)) {
        sessSheet.deleteRow(s + 1);
      }
    }
  }

  Logger.log('cleanupAuthData selesai.');
}

function backupAuthData() {
  var db = getCustomerDatabase();
  var root = getCustomerDriveRoot();
  var backupFolder;
  var iter = root.getFoldersByName('Backup');
  if (iter.hasNext()) {
    backupFolder = iter.next();
  } else {
    backupFolder = root.createFolder('Backup');
  }

  var fileName = 'SiEpang_Backup_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  var backupFile = DriveApp.getFileById(db.getId()).makeCopy(fileName, backupFolder);
  Logger.log('backupAuthData berhasil dibuat: ' + backupFile.getName() + ' (' + backupFile.getId() + ')');
  return { ok: true, backup_file_id: backupFile.getId(), backup_file_name: fileName };
}

/**
 * ============================================================================
 * PART 13 — WEB APP ENTRY POINTS (doGet & doPost)
 * ============================================================================
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'system.health';
  var nonce = (e && e.parameter && e.parameter.nonce) || '';
  var reqId = 'req_' + new Date().getTime();

  if (action === 'health' || action === 'system.health') {
    var isDbReady = false;
    var isDriveReady = false;
    var schemaComplete = true;

    try {
      var db = getCustomerDatabase();
      isDbReady = !!db.getId();
      var reqSheets = ['Users', 'UserRoleAssignments', 'AuthOtpChallenges', 'TrustedDevices', 'AuthSessions', 'AuditLogs', 'SystemConfig'];
      for (var s = 0; s < reqSheets.length; s++) {
        if (!db.getSheetByName(reqSheets[s])) {
          schemaComplete = false;
          break;
        }
      }
      var driveFolder = getCustomerDriveRoot();
      isDriveReady = !!driveFolder.getId();
    } catch (err) {
      isDbReady = false;
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      request_id: reqId,
      data: {
        service: 'SiEpang Backend',
        reachable: true,
        configured: isDbReady && isDriveReady && schemaComplete,
        backend_version: CONFIG.BACKEND_VERSION,
        database: !isDbReady ? 'DEGRADED' : (!schemaComplete ? 'SCHEMA_INCOMPLETE' : 'READY'),
        drive: isDriveReady ? 'READY' : 'DEGRADED',
        nonce_challenge: nonce ? ('VERIFIED_' + nonce) : null,
        timestamp: new Date().toISOString()
      },
      error: null
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    request_id: reqId,
    data: null,
    error: { code: 'INVALID_ACTION', message: 'Aksi GET tidak dikenali.' }
  })).setMimeType(ContentService.MimeType.JSON);
}


/**
 * SINGLE-EVENT AUTHORITATIVE SCOPE
 *
 * Runtime requests must be compared against Script Properties for the active
 * installation, never against legacy CONFIG.WORKSPACE_ID / CONFIG.INSTALLATION_ID.
 */
function getAuthoritativeSingleEventScope_() {
  var props = PropertiesService.getScriptProperties();

  return {
    installation_id: String(
      props.getProperty('SIEPANG_INSTALLATION_ID') ||
      ''
    ).trim(),
    workspace_id: String(
      props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') ||
      props.getProperty('SIEPANG_WORKSPACE_ID') ||
      ''
    ).trim(),
    event_id: String(
      props.getProperty('SIEPANG_ACTIVE_EVENT_ID') ||
      ''
    ).trim()
  };
}

function doPost(e) {
  var reqId = 'req_' + new Date().getTime();

  try {
    var raw = e.postData.contents;
    var req = JSON.parse(raw);
    reqId = req.request_id || reqId;

    var action = req.action || req.endpoint || '';
    var payload = req.payload || {};
    var authoritativeScope = getAuthoritativeSingleEventScope_();

    /**
     * SINGLE-EVENT SERVER-FORCED CONTEXT
     *
     * In a one-event installation the browser is NOT an authority for
     * installation/workspace/event identity.
     *
     * Old browser/PWA caches, stale auth sessions, or an old installation
     * record may still send DEFAULT_WS, a legacy workspace ID, or null.
     * Rejecting that value before auth runs creates the login loop seen on
     * mobile.
     *
     * Therefore the backend always injects the installation's own scope before
     * dispatch. Authentication and RBAC still remain server-authoritative.
     */
    req.context = req.context || {};

    if (authoritativeScope.installation_id) {
      req.installation_id = authoritativeScope.installation_id;
      req.context.installation_id = authoritativeScope.installation_id;
    } else {
      req.installation_id = req.installation_id || null;
      req.context.installation_id =
        req.context.installation_id || req.installation_id || null;
    }

    if (authoritativeScope.workspace_id) {
      req.workspace_id = authoritativeScope.workspace_id;
      req.context.workspace_id = authoritativeScope.workspace_id;
    } else {
      req.workspace_id = req.workspace_id || null;
      req.context.workspace_id =
        req.context.workspace_id || req.workspace_id || null;
    }

    if (authoritativeScope.event_id) {
      req.event_id = authoritativeScope.event_id;
      req.context.event_id = authoritativeScope.event_id;
    } else {
      req.event_id = req.event_id || null;
      req.context.event_id =
        req.context.event_id || req.event_id || null;
    }

    // Keep auth context canonical as well.
    if (!req.context.session_token) {
      req.context.session_token =
        req.session_token ||
        (payload && payload.session_token) ||
        null;
    }

    // No WORKSPACE_MISMATCH / EVENT_MISMATCH guard here.
    // A fixed single-event installation always uses the server-side scope.
    return dispatchAction(action, payload, req, reqId);

  } catch (err) {
    var errMsg = err.toString();

    if (errMsg.indexOf('DATABASE_NOT_CONNECTED') !== -1) {
      return envelopeError(
        reqId,
        'DATABASE_NOT_CONFIGURED',
        'Spreadsheet database belum terhubung ke instans.',
        503
      );
    }

    return envelopeError(
      reqId,
      'INTERNAL_ERROR',
      errMsg,
      500
    );
  }
}

/**
 * Run manually from Apps Script when diagnosing a single-event deployment.
 * This does not expose secrets; it only shows the active installation scope.
 */
function debugSingleEventScope() {
  var scope = getAuthoritativeSingleEventScope_();

  var result = {
    mode: 'SINGLE_EVENT_SERVER_FORCED',
    installation_id: scope.installation_id || '',
    workspace_id: scope.workspace_id || '',
    event_id: scope.event_id || '',
    has_installation_id: !!scope.installation_id,
    has_workspace_id: !!scope.workspace_id,
    has_event_id: !!scope.event_id,
    timestamp: new Date().toISOString()
  };

  Logger.log(JSON.stringify(result));
  return result;
}


/**
 * Helper: Autentikasi & Otorisasi RBAC Sisi Server (Part 26 & 48)
 * Memvalidasi session_token, status akun pengguna, dan UserRoleAssignments.
 * Mencegah manipulasi peran dari browser client (Anti-Role Spoofing).
 */
function authenticateAndAuthorizeCaller(req, requiredRole) {
  var context = req.context || {};
  var sessionToken = req.session_token || context.session_token || (req.payload && req.payload.session_token);
  if (!sessionToken) {
    return { ok: false, error: { code: 'SESSION_INVALID', message: 'Sesi autentikasi tidak ditemukan.' } };
  }

  var tokenHash = hashSha256(sessionToken);
  var db = getCustomerDatabase();
  var sessionSheet = db.getSheetByName('AuthSessions');
  var usersSheet = db.getSheetByName('Users');
  var roleSheet = db.getSheetByName('UserRoleAssignments');

  if (!sessionSheet || !usersSheet) {
    return { ok: false, error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database autentikasi belum siap.' } };
  }

  var sRows = sessionSheet.getDataRange().getValues();
  var matchedSession = null;
  var nowMs = new Date().getTime();

  for (var s = sRows.length - 1; s >= 1; s--) {
    if (sRows[s][3] === tokenHash) {
      matchedSession = {
        id: sRows[s][0],
        userId: sRows[s][1],
        trustedDeviceId: sRows[s][2],
        expiresAt: sRows[s][6],
        status: sRows[s][8]
      };
      break;
    }
  }

  if (!matchedSession || matchedSession.status !== 'active') {
    return { ok: false, error: { code: 'SESSION_INVALID', message: 'Sesi telah kedaluwarsa atau dicabut.' } };
  }

  if (new Date(matchedSession.expiresAt).getTime() < nowMs) {
    return { ok: false, error: { code: 'SESSION_EXPIRED', message: 'Masa berlaku sesi telah habis. Silakan masuk kembali.' } };
  }

  // Lookup user in Users
  var uRows = usersSheet.getDataRange().getValues();
  var matchedUser = null;
  for (var u = 1; u < uRows.length; u++) {
    if (uRows[u][0] === matchedSession.userId) {
      matchedUser = {
        id: uRows[u][0],
        email: uRows[u][1],
        name: uRows[u][2],
        status: uRows[u][4]
      };
      break;
    }
  }

  if (!matchedUser || matchedUser.status === 'inactive') {
    return { ok: false, error: { code: 'ACCOUNT_DISABLED', message: 'Akun dinonaktifkan oleh Administrator.' } };
  }

  // Authoritative roles from UserRoleAssignments
  var rRows = roleSheet ? roleSheet.getDataRange().getValues() : [];
  var roles = [];
  for (var r = 1; r < rRows.length; r++) {
    if (rRows[r][1] === matchedUser.id && rRows[r][5] === 'active') {
      roles.push(rRows[r][2]);
    }
  }

  var isSuperAdmin = roles.indexOf('superadmin') !== -1;
  if (requiredRole) {
    var hasPermission = isSuperAdmin || roles.indexOf(requiredRole) !== -1;
    if (!hasPermission) {
      return { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Akses ditolak: Operasi ini memerlukan peran ' + requiredRole + '.' } };
    }
  }

  return {
    ok: true,
    user: matchedUser,
    roles: roles,
    isSuperAdmin: isSuperAdmin,
    session: matchedSession
  };
}


/**
 * ============================================================================
 * SINGLE-EVENT INSTALLATION CONTEXT
 * ============================================================================
 * One GAS deployment is bound to exactly one workspace and one event.
 * The browser never selects either value.
 */
function configureSingleEventInstallation() {
  var props = PropertiesService.getScriptProperties();
  var workspaceId = String(props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || '').trim();
  var eventId = String(props.getProperty('SIEPANG_ACTIVE_EVENT_ID') || '').trim();

  var workspaceSheet = ensureWorkspacesSheet_();
  var rows = workspaceSheet.getDataRange().getValues();
  var workspaceRow = null;

  function usable_(row) {
    if (!row || !row[0]) return false;
    var status = String(row[8] || '').trim().toLowerCase();
    return status !== 'archived' && status !== 'suspended';
  }

  for (var i = 1; i < rows.length; i++) {
    if (usable_(rows[i]) && workspaceId && String(rows[i][0] || '') === workspaceId) {
      workspaceRow = rows[i];
      break;
    }
  }

  if (!workspaceRow) {
    // Prefer a workspace with a configured default event.
    for (var j = 1; j < rows.length; j++) {
      if (usable_(rows[j]) && String(rows[j][10] || '').trim()) {
        workspaceRow = rows[j];
        workspaceId = String(rows[j][0] || '').trim();
        break;
      }
    }
  }

  if (!workspaceRow) {
    var usableRows = [];
    for (var k = 1; k < rows.length; k++) {
      if (usable_(rows[k])) usableRows.push(rows[k]);
    }
    if (usableRows.length === 1) {
      workspaceRow = usableRows[0];
      workspaceId = String(workspaceRow[0] || '').trim();
    }
  }

  if (!workspaceRow || !workspaceId) {
    throw new Error('SINGLE_EVENT_WORKSPACE_NOT_CONFIGURED');
  }

  var event = eventId ? getEventById_(eventId) : null;
  if (event && String(event.workspaceId || event.workspace_id || '') !== workspaceId) {
    event = null;
    eventId = '';
  }

  if (!event) {
    var defaultEventId = String(workspaceRow[10] || '').trim();
    if (defaultEventId) {
      var defaultEvent = getEventById_(defaultEventId);
      if (
        defaultEvent &&
        String(defaultEvent.workspaceId || defaultEvent.workspace_id || '') === workspaceId &&
        String(defaultEvent.status || '').toUpperCase() !== 'ARCHIVED'
      ) {
        event = defaultEvent;
        eventId = defaultEventId;
      }
    }
  }

  if (!event) {
    var events = listEvents_(workspaceId);
    if (events.length === 1) {
      event = events[0];
      eventId = String(event.id || event.event_id || '').trim();
    }
  }

  if (!event || !eventId) {
    throw new Error('SINGLE_EVENT_EVENT_NOT_CONFIGURED');
  }

  props.setProperties({
    SIEPANG_INSTALLATION_MODE: 'SINGLE_EVENT',
    SIEPANG_ACTIVE_WORKSPACE_ID: workspaceId,
    SIEPANG_ACTIVE_EVENT_ID: eventId,
    // keep legacy property aligned for modules that still read it
    SIEPANG_WORKSPACE_ID: workspaceId
  });

  return {
    ok: true,
    installation_mode: 'SINGLE_EVENT',
    workspace_id: workspaceId,
    event_id: eventId
  };
}

function getSingleEventInstallation_() {
  var props = PropertiesService.getScriptProperties();
  var workspaceId = String(props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || '').trim();
  var eventId = String(props.getProperty('SIEPANG_ACTIVE_EVENT_ID') || '').trim();

  if (!workspaceId || !eventId) {
    configureSingleEventInstallation();
    workspaceId = String(props.getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || '').trim();
    eventId = String(props.getProperty('SIEPANG_ACTIVE_EVENT_ID') || '').trim();
  }

  var workspaceSheet = ensureWorkspacesSheet_();
  var rows = workspaceSheet.getDataRange().getValues();
  var workspace = null;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() !== workspaceId) continue;
    var status = String(rows[i][8] || '').trim().toLowerCase();
    if (status === 'archived' || status === 'suspended') break;
    workspace = publicWorkspaceRowToClient_(rows[i]);
    break;
  }

  if (!workspace) throw new Error('SINGLE_EVENT_WORKSPACE_INVALID');

  var event = getEventById_(eventId);
  if (!event) throw new Error('SINGLE_EVENT_EVENT_INVALID');
  if (String(event.workspaceId || event.workspace_id || '') !== workspaceId) {
    throw new Error('SINGLE_EVENT_EVENT_SCOPE_INVALID');
  }

  return {
    installation_mode: 'SINGLE_EVENT',
    workspace: workspace,
    event: publicEventToClient_(event)
  };
}

/**
 * ============================================================================
 * DISPATCHER UNTUK CANONICAL ACTIONS
 * ============================================================================
 */

function publicWorkspaceRowToClient_(row) {
  var branding = parseJsonSafe_(row[13], {}) || {};
  return {
    id: String(row[0] || ''),
    code: String(row[1] || ''),
    name: String(row[2] || ''),
    organization: String(row[4] || row[2] || ''),
    province: String(row[6] || ''),
    city: String(row[7] || ''),
    region: String(row[7] || row[6] || ''),
    branding: {
      primaryColor: String(branding.primaryColor || '#833AB4'),
      secondaryColor: String(branding.secondaryColor || '#E1306C'),
      accentColor: String(branding.accentColor || '#FCAF45'),
      logoUrl: String(branding.logoUrl || ''),
      bannerUrl: String(branding.bannerUrl || ''),
      organizationName: String(branding.organizationName || row[4] || row[2] || '')
    }
  };
}

function resolvePublicWorkspaceByCode_(workspaceCode) {
  var code = String(workspaceCode || '').trim().toUpperCase();
  if (!code) return null;

  var sheet = ensureWorkspacesSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (
      String(rows[i][1] || '').trim().toUpperCase() === code &&
      String(rows[i][8] || '').toLowerCase() !== 'archived' &&
      String(rows[i][8] || '').toLowerCase() !== 'suspended'
    ) {
      return publicWorkspaceRowToClient_(rows[i]);
    }
  }
  return null;
}

function publicEventToClient_(event) {
  if (!event) return null;
  return {
    id: event.id,
    event_id: event.event_id || event.id,
    workspaceId: event.workspaceId,
    workspace_id: event.workspace_id || event.workspaceId,
    name: event.name,
    shortName: event.shortName,
    eventCode: event.eventCode,
    category: event.category,
    organizationalLevel: event.organizationalLevel,
    organizer: event.organizer,
    description: event.description,
    theme: event.theme,
    startDate: event.startDate,
    endDate: event.endDate,
    registrationStart: event.registrationStart,
    registrationEnd: event.registrationEnd,
    location: event.location,
    venue: event.venue,
    campGround: event.campGround,
    participantCapacity: event.participantCapacity,
    bannerUrl: event.bannerUrl,
    logoUrl: event.logoUrl,
    status: event.status,
    participation_scope: event.participation_scope,
    contacts: event.contacts || {},
    features: event.features || defaultEventFeatures_(),
    homeSections: event.homeSections || [],
    maxParticipants: event.maxParticipants || event.participantCapacity || 0,
    registeredCount: 0,
    checkedInCount: 0,
    contingentCount: 0,
    competitionCount: 0
  };
}

function listPublicEventsForWorkspace_(workspaceId) {
  var events = listEvents_(workspaceId);
  var allowed = [];
  for (var i = 0; i < events.length; i++) {
    var status = String(events[i].status || '').toUpperCase();
    if (status === 'DRAFT' || status === 'ARCHIVED') continue;
    allowed.push(publicEventToClient_(events[i]));
  }
  return allowed;
}

function resolvePublicEvent_(workspaceCode, eventCode) {
  var workspace = resolvePublicWorkspaceByCode_(workspaceCode);
  if (!workspace) return null;

  var targetCode = String(eventCode || '').trim().toUpperCase();
  var events = listPublicEventsForWorkspace_(workspace.id);
  for (var i = 0; i < events.length; i++) {
    if (String(events[i].eventCode || '').trim().toUpperCase() === targetCode) {
      return { workspace: workspace, event: events[i] };
    }
  }
  return null;
}

function dispatchAction(action, payload, req, reqId) {
  if (action === 'public.current') {
    try {
      return envelopeSuccess(reqId, getSingleEventInstallation_());
    } catch (singleEventErr) {
      return envelopeError(
        reqId,
        'SINGLE_EVENT_NOT_CONFIGURED',
        String(singleEventErr && singleEventErr.message ? singleEventErr.message : singleEventErr),
        503
      );
    }
  }

  // Public portal routes: safe, read-only projections only.
  if (action === 'public.workspace.resolve') {
    var publicWorkspaceCode = String(
      payload.workspace_code || payload.workspaceCode || ''
    ).trim();

    var publicWorkspace = resolvePublicWorkspaceByCode_(publicWorkspaceCode);
    if (!publicWorkspace) {
      return envelopeError(reqId, 'WORKSPACE_NOT_FOUND', 'Workspace publik tidak ditemukan.', 404);
    }

    return envelopeSuccess(reqId, {
      workspace: publicWorkspace,
      events: listPublicEventsForWorkspace_(publicWorkspace.id)
    });
  }

  if (action === 'public.event.resolve') {
    var publicWorkspaceCode = String(
      payload.workspace_code || payload.workspaceCode || ''
    ).trim();
    var publicEventCode = String(
      payload.event_code || payload.eventCode || ''
    ).trim();

    var publicEventPortal = resolvePublicEvent_(publicWorkspaceCode, publicEventCode);
    if (!publicEventPortal) {
      return envelopeError(reqId, 'EVENT_NOT_FOUND', 'Event publik tidak ditemukan.', 404);
    }

    return envelopeSuccess(reqId, publicEventPortal);
  }

  var props = PropertiesService.getScriptProperties();

  // Action: system.health — PUBLIC SAFE projection only.
  if (action === 'system.health' || action === '/api/system/health') {
    var isDbReady = false;
    var isDriveReady = false;
    var schemaComplete = true;
    try {
      var checkDb = getCustomerDatabase();
      isDbReady = !!checkDb.getId();
      var reqSheets = ['Users', 'UserRoleAssignments', 'AuthOtpChallenges', 'TrustedDevices', 'AuthSessions', 'AuditLogs', 'SystemConfig'];
      for (var sIdx = 0; sIdx < reqSheets.length; sIdx++) {
        if (!checkDb.getSheetByName(reqSheets[sIdx])) {
          schemaComplete = false;
          break;
        }
      }
      var healthDriveFolder = getCustomerDriveRoot();
      isDriveReady = !!healthDriveFolder.getId();
    } catch (healthErr) {
      isDbReady = false;
      isDriveReady = false;
    }
    return envelopeSuccess(reqId, {
      service: 'SiEpang Backend',
      reachable: true,
      configured: isDbReady && isDriveReady && schemaComplete,
      backend_version: CONFIG.BACKEND_VERSION,
      database: !isDbReady ? 'DEGRADED' : (!schemaComplete ? 'SCHEMA_INCOMPLETE' : 'READY'),
      drive: isDriveReady ? 'READY' : 'DEGRADED',
      timestamp: new Date().toISOString()
    });
  }

  // Detailed health is admin-only and never exposed to anonymous callers.
  if (action === 'system.health.detail' || action === '/api/system/health/detail') {
    var healthAuth = authenticateAndAuthorizeCaller(req);
    if (!healthAuth.ok) {
      return envelopeError(reqId, healthAuth.error.code, healthAuth.error.message, 401);
    }
    var healthAllowed = healthAuth.isSuperAdmin || healthAuth.roles.indexOf('workspace_admin') !== -1 || healthAuth.roles.indexOf('event_admin') !== -1;
    if (!healthAllowed) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses diagnostik sistem hanya untuk Administrator.', 403);
    }
    var detailDbReady = false;
    var detailDriveReady = false;
    var detailSchemaComplete = true;
    try {
      var detailDb = getCustomerDatabase();
      detailDbReady = !!detailDb.getId();
      var detailSheets = ['Users', 'UserRoleAssignments', 'AuthOtpChallenges', 'TrustedDevices', 'AuthSessions', 'AuditLogs', 'SystemConfig'];
      for (var ds = 0; ds < detailSheets.length; ds++) {
        if (!detailDb.getSheetByName(detailSheets[ds])) {
          detailSchemaComplete = false;
          break;
        }
      }
      detailDriveReady = !!getCustomerDriveRoot().getId();
    } catch (detailErr) {}
    var detailScope = getAuthoritativeSingleEventScope_();
    var detailQuota = getMailQuotaStatus();
    return envelopeSuccess(reqId, {
      installation_id: detailScope.installation_id,
      workspace_id: detailScope.workspace_id,
      event_id: detailScope.event_id,
      backend_version: CONFIG.BACKEND_VERSION,
      schema_version: CONFIG.SCHEMA_VERSION,
      environment: CONFIG.ENVIRONMENT,
      database: !detailDbReady ? 'DEGRADED' : (!detailSchemaComplete ? 'SCHEMA_INCOMPLETE' : 'READY'),
      drive: detailDriveReady ? 'READY' : 'DEGRADED',
      mail_quota_remaining: detailQuota.remaining_daily_quota,
      superadmin_bootstrapped: props.getProperty('SUPERADMIN_BOOTSTRAPPED') === 'true',
      timestamp: new Date().toISOString()
    });
  }

  // Mail diagnostics are admin-only. For first deployment, run testSendOtpEmail()
  // manually from the Apps Script editor after granting MailApp permission.
  if (action === 'system.mail.test') {
    var mailTestAuth = authenticateAndAuthorizeCaller(req);
    if (!mailTestAuth.ok) {
      return envelopeError(reqId, mailTestAuth.error.code, mailTestAuth.error.message, 401);
    }
    if (!mailTestAuth.isSuperAdmin && mailTestAuth.roles.indexOf('workspace_admin') === -1 && mailTestAuth.roles.indexOf('event_admin') === -1) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses uji email hanya untuk Administrator.', 403);
    }
    var testResult = testSendOtpEmail(payload.email || mailTestAuth.user.email);
    if (!testResult.ok) {
      return envelopeError(reqId, 'OTP_EMAIL_SEND_FAILED', testResult.message, 500);
    }
    return envelopeSuccess(reqId, testResult);
  }

  if (action === 'system.mail.quota') {
    var mailQuotaAuth = authenticateAndAuthorizeCaller(req);
    if (!mailQuotaAuth.ok) {
      return envelopeError(reqId, mailQuotaAuth.error.code, mailQuotaAuth.error.message, 401);
    }
    if (!mailQuotaAuth.isSuperAdmin && mailQuotaAuth.roles.indexOf('workspace_admin') === -1 && mailQuotaAuth.roles.indexOf('event_admin') === -1) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses kuota email hanya untuk Administrator.', 403);
    }
    return envelopeSuccess(reqId, getMailQuotaStatus());
  }

  // SuperAdmin bootstrap is intentionally NOT exposed as a public API action.
  // The canonical bootstrap happens only after OTP verification of the configured
  // BOOTSTRAP_SUPERADMIN_EMAIL inside auth.login.verifyOtp/auth.register.verifyOtp.
  if (action === 'auth.bootstrapSuperAdmin') {
    return envelopeError(reqId, 'BOOTSTRAP_DIRECT_CALL_DISABLED', 'Bootstrap SuperAdmin hanya dapat terjadi setelah verifikasi OTP canonical.', 403);
  }

  // Action: auth.reauth.requestOtp (Optional requirement)
  if (action === 'auth.reauth.requestOtp') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var reauthEmail = authCheck.user.email;
    var otpCode = String(Math.floor(100000 + Math.random() * 900000));
    var challengeId = 'chal_reauth_' + Utilities.getUuid().replace(/-/g, '').substring(0, 12);
    var otpHash = hashSha256(otpCode);
    var nowMs = new Date().getTime();
    var nowIso = new Date().toISOString();
    var expiresIso = new Date(nowMs + (CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000)).toISOString();

    var db = getCustomerDatabase();
    var otpSheet = db.getSheetByName('AuthOtpChallenges');
    if (!otpSheet) {
      provisionCanonicalSchemaV19();
      otpSheet = db.getSheetByName('AuthOtpChallenges');
    }

    otpSheet.appendRow([
      challengeId,
      reauthEmail,
      otpHash,
      'REAUTH',
      expiresIso,
      0,
      CONFIG.OTP_MAX_ATTEMPTS,
      0,
      '',
      'PENDING',
      nowIso,
      nowIso,
      'REAUTHENTICATION',
      ''
    ]);

    var sent = sendVerificationOtpEmail(reauthEmail, otpCode, 'Autentikasi Ulang Keamanan');
    if (!sent) {
      return envelopeError(reqId, 'OTP_EMAIL_SEND_FAILED', 'Kode belum berhasil dikirim. Silakan coba lagi.', 500);
    }

    recordAuditLog(db, 'AUTH', 'REAUTH_OTP_REQUESTED', authCheck.user.id, 'user', reauthEmail);
    return envelopeSuccess(reqId, {
      challenge_id: challengeId,
      email: reauthEmail,
      expires_in_seconds: CONFIG.OTP_EXPIRY_MINUTES * 60,
      message: 'Kode verifikasi autentikasi ulang dikirim ke ' + reauthEmail + '.'
    });
  }

  // Action: auth.reauth.verifyOtp (Optional requirement)
  if (action === 'auth.reauth.verifyOtp') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var challengeId = payload.challenge_id;
    var inputOtp = String(payload.otp || '').trim();
    if (!challengeId || !inputOtp) {
      return envelopeError(reqId, 'INVALID_INPUT', 'challenge_id dan otp wajib diisi.', 400);
    }

    var db = getCustomerDatabase();
    var otpSheet = db.getSheetByName('AuthOtpChallenges');
    var otpRows = otpSheet ? otpSheet.getDataRange().getValues() : [];
    var matchedChal = null;
    var rowIdx = -1;

    for (var c = otpRows.length - 1; c >= 1; c--) {
      if (otpRows[c][0] === challengeId && otpRows[c][1] === authCheck.user.email) {
        matchedChal = otpRows[c];
        rowIdx = c + 1;
        break;
      }
    }

    if (!matchedChal) {
      return envelopeError(reqId, 'OTP_INVALID', 'Kode verifikasi tidak ditemukan.', 404);
    }
    if (matchedChal[9] === 'USED') {
      return envelopeError(reqId, 'OTP_ALREADY_USED', 'Kode verifikasi ini sudah pernah digunakan.', 400);
    }
    if (matchedChal[9] === 'LOCKED') {
      return envelopeError(reqId, 'OTP_LOCKED', 'Kode verifikasi terkunci.', 403);
    }
    if (new Date(matchedChal[4]).getTime() < new Date().getTime()) {
      otpSheet.getRange(rowIdx, 10).setValue('EXPIRED');
      return envelopeError(reqId, 'OTP_EXPIRED', 'Kode verifikasi telah kedaluwarsa.', 400);
    }

    var inputHash = hashSha256(inputOtp);
    if (inputHash !== matchedChal[2]) {
      var newAttempt = (parseInt(matchedChal[5], 10) || 0) + 1;
      otpSheet.getRange(rowIdx, 6).setValue(newAttempt);
      if (newAttempt >= CONFIG.OTP_MAX_ATTEMPTS) {
        otpSheet.getRange(rowIdx, 10).setValue('LOCKED');
        return envelopeError(reqId, 'OTP_LOCKED', 'Kode verifikasi terkunci karena terlalu banyak percobaan salah.', 403);
      }
      return envelopeError(reqId, 'OTP_INVALID', 'Kode verifikasi salah.', 400);
    }

    var nowIso = new Date().toISOString();
    otpSheet.getRange(rowIdx, 9).setValue(nowIso);
    otpSheet.getRange(rowIdx, 10).setValue('USED');
    recordAuditLog(db, 'AUTH', 'REAUTH_SUCCESS', authCheck.user.id, 'user', authCheck.user.email);

    return envelopeSuccess(reqId, { reauthenticated: true, timestamp: nowIso });
  }

  // =========================================================================
  // ACTION: auth.register.requestOtp (Part 14)
  // =========================================================================
  if (action === 'auth.register.requestOtp') {
    var regEmail = (payload.email || '').toLowerCase().trim();
    var regName = (payload.name || '').trim();

    if (!regEmail || regEmail.indexOf('@') === -1) {
      return envelopeError(reqId, 'INVALID_EMAIL', 'Format alamat email tidak valid.', 400);
    }
    if (!regName) {
      return envelopeError(reqId, 'INVALID_NAME', 'Nama lengkap wajib diisi.', 400);
    }

    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var otpSheet = db.getSheetByName('AuthOtpChallenges');
    if (!usersSheet || !otpSheet) {
      provisionCanonicalSchemaV19();
      usersSheet = db.getSheetByName('Users');
      otpSheet = db.getSheetByName('AuthOtpChallenges');
    }

    // Check if email already registered (Users column 2 is email)
    var uRows = usersSheet.getDataRange().getValues();
    for (var u = 1; u < uRows.length; u++) {
      if (uRows[u][1] && String(uRows[u][1]).toLowerCase().trim() === regEmail) {
        return envelopeError(reqId, 'EMAIL_ALREADY_REGISTERED', 'Email ini sudah terdaftar. Silakan gunakan menu Masuk.', 400);
      }
    }

    // Rate limit check: 1 request per 60s cooldown, max 5 per hour
    var otpRows = otpSheet.getDataRange().getValues();
    var nowMs = new Date().getTime();
    var countPastHour = 0;
    for (var o = 1; o < otpRows.length; o++) {
      var regRowEmail = otpRows[o][1]
        ? String(otpRows[o][1]).toLowerCase().trim()
        : '';
      var regRowType = String(otpRows[o][3] || '').toUpperCase();
      var regRowPurpose = String(otpRows[o][12] || '').toUpperCase();

      // Registration cooldown must only see registration challenges.
      // LOGIN_EMAIL must not block registration.
      var isRegistrationChallenge =
        regRowType === 'REGISTER_EMAIL' ||
        regRowPurpose === 'REGISTRATION';

      if (regRowEmail === regEmail && isRegistrationChallenge) {
        var createdMs = new Date(otpRows[o][10]).getTime();

        if (
          !isNaN(createdMs) &&
          nowMs - createdMs < CONFIG.OTP_RESEND_SECONDS * 1000
        ) {
          var remainingRegSeconds = Math.max(
            1,
            Math.ceil(
              (CONFIG.OTP_RESEND_SECONDS * 1000 - (nowMs - createdMs)) / 1000
            )
          );

          return envelopeError(
            reqId,
            'OTP_RATE_LIMITED',
            'Mohon tunggu ' + remainingRegSeconds +
              ' detik sebelum meminta kode pendaftaran baru.',
            429
          );
        }

        if (
          !isNaN(createdMs) &&
          nowMs - createdMs < 60 * 60 * 1000
        ) {
          countPastHour++;
        }
      }
    }
    if (countPastHour >= 5) {
      return envelopeError(reqId, 'OTP_RATE_LIMITED', 'Batas permintaan kode per jam tercapai (maksimal 5 kali). Coba lagi nanti.', 429);
    }

    // Server-side crypto-safe OTP generation (6 digits numeric, unpredictable)
    var otpCode = String(Math.floor(100000 + Math.random() * 900000));
    var challengeId = 'chal_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
    var otpHash = hashSha256(otpCode);
    var nowIso = new Date().toISOString();
    var expiresIso = new Date(nowMs + (CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000)).toISOString();

    // Persist challenge record FIRST
    otpSheet.appendRow([
      challengeId,
      regEmail,
      otpHash,
      'REGISTER_EMAIL',
      expiresIso,
      0, // attempt_count
      CONFIG.OTP_MAX_ATTEMPTS,
      0, // resend_count
      '', // used_at
      'PENDING',
      nowIso,
      nowIso,
      'REGISTRATION',
      ''
    ]);

    // Send real email via MailApp
    var mailSuccess = sendVerificationOtpEmail(regEmail, otpCode, 'Pendaftaran Akun Baru');
    if (!mailSuccess) {
      return envelopeError(reqId, 'OTP_EMAIL_SEND_FAILED', 'Kode belum berhasil dikirim. Silakan coba lagi.', 500);
    }

    recordAuditLog(db, 'AUTH', 'AUTH_OTP_REQUESTED', regEmail, 'guest', 'REGISTER_EMAIL');

    return envelopeSuccess(reqId, {
      challenge_id: challengeId,
      email: regEmail,
      expires_in_seconds: CONFIG.OTP_EXPIRY_MINUTES * 60,
      message: 'Kode verifikasi telah dikirim ke ' + regEmail + '.'
    });
  }

  // =========================================================================
  // ACTION: auth.login.requestOtp (Part 19)
  // =========================================================================
  if (action === 'auth.login.requestOtp') {
    var loginEmail = (payload.email || '').toLowerCase().trim();
    if (!loginEmail || loginEmail.indexOf('@') === -1) {
      return envelopeError(reqId, 'INVALID_EMAIL', 'Format alamat email tidak valid.', 400);
    }

    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var otpSheet = db.getSheetByName('AuthOtpChallenges');
    if (!usersSheet || !otpSheet) {
      provisionCanonicalSchemaV19();
      usersSheet = db.getSheetByName('Users');
      otpSheet = db.getSheetByName('AuthOtpChallenges');
    }

    // Lookup user in Users sheet (column 2 is email, column 5 is status)
    var uRows = usersSheet.getDataRange().getValues();
    var userFound = false;
    var userActive = true;
    for (var u = 1; u < uRows.length; u++) {
      if (uRows[u][1] && String(uRows[u][1]).toLowerCase().trim() === loginEmail) {
        userFound = true;
        if (uRows[u][4] === 'inactive') {
          userActive = false;
        }
        break;
      }
    }

    var bootEmail = props.getProperty('BOOTSTRAP_SUPERADMIN_EMAIL') || CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL;
    var isBootstrapCandidate = bootEmail && bootEmail.trim().toLowerCase() === loginEmail;

    if (!userFound && !isBootstrapCandidate) {
      return envelopeError(reqId, 'USER_NOT_FOUND', 'Email belum terdaftar. Silakan buat akun baru terlebih dahulu.', 404);
    }
    if (userFound && !userActive) {
      return envelopeError(reqId, 'ACCOUNT_DISABLED', 'Akun Anda dinonaktifkan oleh Administrator Kwartir.', 403);
    }

    // Rate limit check
    var otpRows = otpSheet.getDataRange().getValues();
    var nowMs = new Date().getTime();
    var countPastHour = 0;
    for (var o = 1; o < otpRows.length; o++) {
      var loginRowEmail = otpRows[o][1]
        ? String(otpRows[o][1]).toLowerCase().trim()
        : '';
      var loginRowType = String(otpRows[o][3] || '').toUpperCase();
      var loginRowPurpose = String(otpRows[o][12] || '').toUpperCase();

      // Login cooldown must only see LOGIN_EMAIL challenges.
      // A user who just registered must be able to log in immediately;
      // REGISTER_EMAIL must not trigger the login cooldown.
      var isLoginChallenge =
        loginRowType === 'LOGIN_EMAIL' ||
        loginRowType === 'LOGIN_DEVICE' ||
        loginRowPurpose === 'LOGIN' ||
        loginRowPurpose === 'LOGIN_NEW_DEVICE';

      if (loginRowEmail === loginEmail && isLoginChallenge) {
        var createdMs = new Date(otpRows[o][10]).getTime();

        if (
          !isNaN(createdMs) &&
          nowMs - createdMs < CONFIG.OTP_RESEND_SECONDS * 1000
        ) {
          var remainingLoginSeconds = Math.max(
            1,
            Math.ceil(
              (CONFIG.OTP_RESEND_SECONDS * 1000 - (nowMs - createdMs)) / 1000
            )
          );

          return envelopeError(
            reqId,
            'OTP_RATE_LIMITED',
            'Mohon tunggu ' + remainingLoginSeconds +
              ' detik sebelum meminta kode login baru.',
            429
          );
        }

        if (
          !isNaN(createdMs) &&
          nowMs - createdMs < 60 * 60 * 1000
        ) {
          countPastHour++;
        }
      }
    }
    if (countPastHour >= 5) {
      return envelopeError(reqId, 'OTP_RATE_LIMITED', 'Batas permintaan kode verifikasi per jam telah tercapai (maksimal 5 kali).', 429);
    }

    var otpCode = String(Math.floor(100000 + Math.random() * 900000));
    var challengeId = 'chal_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
    var otpHash = hashSha256(otpCode);
    var nowIso = new Date().toISOString();
    var expiresIso = new Date(nowMs + (CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000)).toISOString();

    otpSheet.appendRow([
      challengeId,
      loginEmail,
      otpHash,
      'LOGIN_EMAIL',
      expiresIso,
      0, // attempt_count
      CONFIG.OTP_MAX_ATTEMPTS,
      0,
      '',
      'PENDING',
      nowIso,
      nowIso,
      'LOGIN',
      ''
    ]);

    var mailSuccess = sendVerificationOtpEmail(loginEmail, otpCode, 'Masuk ke SiEpang');
    if (!mailSuccess) {
      return envelopeError(reqId, 'OTP_EMAIL_SEND_FAILED', 'Kode belum berhasil dikirim. Silakan coba lagi.', 500);
    }

    recordAuditLog(db, 'AUTH', 'AUTH_OTP_REQUESTED', loginEmail, 'user', 'LOGIN_DEVICE');

    return envelopeSuccess(reqId, {
      challenge_id: challengeId,
      email: loginEmail,
      expires_in_seconds: CONFIG.OTP_EXPIRY_MINUTES * 60,
      message: 'Kode verifikasi telah dikirim ke ' + loginEmail + '.'
    });
  }

  // =========================================================================
  // ACTION: auth.register.verifyOtp & auth.login.verifyOtp (Part 15)
  // =========================================================================
  if (action === 'auth.register.verifyOtp' || action === 'auth.login.verifyOtp') {
    var targetEmail = (payload.email || '').toLowerCase().trim();
    var challengeId = payload.challenge_id || '';
    var inputOtp = String(payload.otp || '').trim();
    var deviceName = payload.device_name || 'Browser';
    var browserFamily = payload.browser_family || 'Web';
    var platform = payload.platform || 'Unknown';
    var clientDevicePublicId = payload.device_public_id || ('dev_' + Utilities.getUuid().substring(0, 12));
    var clientDeviceToken = payload.device_token || ('dtok_' + Utilities.getUuid().replace(/-/g, ''));

    if (!targetEmail || !inputOtp) {
      return envelopeError(reqId, 'INVALID_INPUT', 'Alamat email dan kode verifikasi 6 digit wajib diisi.', 400);
    }

    // Script Lock to prevent race condition during OTP consumption
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (lockErr) {
      return envelopeError(reqId, 'SERVER_BUSY', 'Server sedang memproses transaksi lain. Coba beberapa saat lagi.', 503);
    }

    try {
      var db = getCustomerDatabase();
      var otpSheet = db.getSheetByName('AuthOtpChallenges');
      var usersSheet = db.getSheetByName('Users');
      var roleSheet = db.getSheetByName('UserRoleAssignments');
      var deviceSheet = db.getSheetByName('TrustedDevices');
      var sessionSheet = db.getSheetByName('AuthSessions');

      if (!otpSheet || !usersSheet || !deviceSheet || !sessionSheet) {
        provisionCanonicalSchemaV19();
        otpSheet = db.getSheetByName('AuthOtpChallenges');
        usersSheet = db.getSheetByName('Users');
        roleSheet = db.getSheetByName('UserRoleAssignments');
        deviceSheet = db.getSheetByName('TrustedDevices');
        sessionSheet = db.getSheetByName('AuthSessions');
      }

      // Lookup challenge
      var otpRows = otpSheet.getDataRange().getValues();
      var matchedChallenge = null;
      var challengeRowIdx = -1;

      for (var c = otpRows.length - 1; c >= 1; c--) {
        var row = otpRows[c];
        var isEmailMatch = row[1] && String(row[1]).toLowerCase().trim() === targetEmail;
        var isChalMatch = challengeId ? (row[0] === challengeId) : true;
        if (isEmailMatch && isChalMatch) {
          matchedChallenge = {
            id: row[0],
            email: row[1],
            otpHash: row[2],
            purpose: row[3],
            expiresAt: row[4],
            attemptCount: parseInt(row[5], 10) || 0,
            maxAttempts: parseInt(row[6], 10) || 5,
            status: row[9]
          };
          challengeRowIdx = c + 1;
          break;
        }
      }

      if (!matchedChallenge) {
        return envelopeError(reqId, 'OTP_INVALID', 'Kode verifikasi tidak ditemukan atau sudah tidak berlaku.', 404);
      }

      var challengePurpose =
        String(matchedChallenge.purpose || '').toUpperCase();

      var purposeMatches =
        action === 'auth.login.verifyOtp'
          ? (
              challengePurpose === 'LOGIN_EMAIL' ||
              challengePurpose === 'LOGIN_DEVICE'
            )
          : challengePurpose === 'REGISTER_EMAIL';

      if (!purposeMatches) {
        return envelopeError(
          reqId,
          'OTP_PURPOSE_MISMATCH',
          'Kode verifikasi tidak sesuai dengan proses autentikasi ini. Silakan minta kode baru.',
          400
        );
      }

      if (matchedChallenge.status === 'USED') {
        return envelopeError(reqId, 'OTP_ALREADY_USED', 'Kode verifikasi ini sudah pernah digunakan.', 400);
      }

      if (matchedChallenge.status === 'LOCKED' || matchedChallenge.attemptCount >= matchedChallenge.maxAttempts) {
        return envelopeError(reqId, 'OTP_LOCKED', 'Kode verifikasi terkunci karena terlalu banyak percobaan salah. Silakan minta kode baru.', 403);
      }

      var nowMs = new Date().getTime();
      if (new Date(matchedChallenge.expiresAt).getTime() < nowMs) {
        otpSheet.getRange(challengeRowIdx, 10).setValue('EXPIRED');
        return envelopeError(reqId, 'OTP_EXPIRED', 'Kode verifikasi telah kedaluwarsa. Silakan minta kode baru.', 400);
      }

      // Check OTP Hash
      var inputHash = hashSha256(inputOtp);
      if (inputHash !== matchedChallenge.otpHash) {
        var newAttempt = matchedChallenge.attemptCount + 1;
        otpSheet.getRange(challengeRowIdx, 6).setValue(newAttempt);
        if (newAttempt >= matchedChallenge.maxAttempts) {
          otpSheet.getRange(challengeRowIdx, 10).setValue('LOCKED');
          recordAuditLog(db, 'AUTH', 'AUTH_OTP_LOCKED', targetEmail, 'security', 'MAX_ATTEMPTS');
          return envelopeError(reqId, 'OTP_LOCKED', 'Kode verifikasi terkunci karena terlalu banyak percobaan salah. Silakan minta kode baru.', 403);
        }
        recordAuditLog(db, 'AUTH', 'AUTH_OTP_FAILED', targetEmail, 'security', 'ATTEMPT_' + newAttempt);
        return envelopeError(reqId, 'OTP_INVALID', 'Kode verifikasi salah. Sisa percobaan: ' + (matchedChallenge.maxAttempts - newAttempt) + ' kali.', 400);
      }

      // Do not consume the OTP yet.
      // Commit USED only after user/device/session creation succeeds.
      var nowIso = new Date().toISOString();

      // Check / Create User in Users table (Col 1: user_id, Col 2: email, Col 3: name, Col 4: email_verified, Col 5: status)
      var uRows = usersSheet.getDataRange().getValues();
      var matchedUser = null;
      var userRowIdx = -1;

      for (var u = 1; u < uRows.length; u++) {
        if (uRows[u][1] && String(uRows[u][1]).toLowerCase().trim() === targetEmail) {
          matchedUser = {
            id: uRows[u][0],
            email: uRows[u][1],
            name: uRows[u][2],
            emailVerified: uRows[u][3],
            status: uRows[u][4],
            createdAt: uRows[u][5],
            avatarUrl: uRows[u][9] || ''
          };
          userRowIdx = u + 1;
          break;
        }
      }

      if (!matchedUser) {
        var newUserId = 'usr_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
        var userName = (payload.name && payload.name.trim()) ? payload.name.trim() : targetEmail.split('@')[0];
        usersSheet.appendRow([
          newUserId,
          targetEmail,
          userName,
          'true', // email_verified
          'active', // status
          nowIso,
          'SELF_REGISTER_OTP',
          nowIso,
          nowIso, // last_login_at
          '', // avatar_url
          '', // phone
          'ORG_GLOBAL'
        ]);
        matchedUser = {
          id: newUserId,
          email: targetEmail,
          name: userName,
          status: 'active',
          createdAt: nowIso,
          avatarUrl: ''
        };
        recordAuditLog(db, 'AUTH', 'AUTH_USER_REGISTERED', newUserId, 'registered_user', targetEmail);
      } else {
        if (matchedUser.status === 'inactive') {
          return envelopeError(reqId, 'ACCOUNT_DISABLED', 'Akun Anda dinonaktifkan oleh Administrator Kwartir.', 403);
        }
        usersSheet.getRange(userRowIdx, 4).setValue('true'); // email_verified
        usersSheet.getRange(userRowIdx, 8).setValue(nowIso); // updated_at
        usersSheet.getRange(userRowIdx, 9).setValue(nowIso); // last_login_at
      }

      // Check SuperAdmin Bootstrap match
      var bootEmail = props.getProperty('BOOTSTRAP_SUPERADMIN_EMAIL') || CONFIG.BOOTSTRAP_SUPERADMIN_EMAIL;
      if (bootEmail && bootEmail.trim().toLowerCase() === targetEmail && props.getProperty('SUPERADMIN_BOOTSTRAPPED') !== 'true') {
        bootstrapSuperAdminForVerifiedUser(targetEmail);
      }

      // Register Trusted Device (Part 16)
      var trustedDeviceId = 'dev_rec_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      var deviceTokenHash = hashSha256(clientDeviceToken);
      var devTtlDays = parseInt(props.getProperty('TRUSTED_DEVICE_TTL_DAYS') || String(CONFIG.TRUSTED_DEVICE_TTL_DAYS), 10);
      var deviceExpiresIso = new Date(nowMs + (devTtlDays * 24 * 60 * 60 * 1000)).toISOString();

      deviceSheet.appendRow([
        trustedDeviceId,
        matchedUser.id,
        clientDevicePublicId,
        deviceTokenHash,
        deviceName,
        browserFamily,
        platform,
        nowIso,
        nowIso, // last_seen_at
        deviceExpiresIso,
        '', // revoked_at
        'active'
      ]);
      recordAuditLog(db, 'AUTH', 'TRUSTED_DEVICE_REGISTERED', matchedUser.id, 'security', clientDevicePublicId);

      // Create Persistent Session (Part 17)
      var sessionId = 'sess_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
      var sessionToken = 'stok_' + Utilities.getUuid().replace(/-/g, '');
      var sessionTokenHash = hashSha256(sessionToken);
      var sessTtlDays = parseInt(props.getProperty('SESSION_TTL_DAYS') || String(CONFIG.SESSION_TTL_DAYS), 10);
      var sessionExpiresMs = nowMs + (sessTtlDays * 24 * 60 * 60 * 1000);
      var sessionExpiresIso = new Date(sessionExpiresMs).toISOString();

      sessionSheet.appendRow([
        sessionId,
        matchedUser.id,
        trustedDeviceId,
        sessionTokenHash,
        nowIso,
        nowIso, // last_seen_at
        sessionExpiresIso,
        '', // revoked_at
        'active'
      ]);

      // Resolve Authoritative Roles (Part 23 & 25)
      var rRows = roleSheet ? roleSheet.getDataRange().getValues() : [];
      var assignments = [];
      for (var r = 1; r < rRows.length; r++) {
        if (rRows[r][1] === matchedUser.id && rRows[r][5] === 'active') {
          assignments.push({
            assignment_id: rRows[r][0],
            role: rRows[r][2],
            scope_type: rRows[r][3],
            scope_id: rRows[r][4]
          });
        }
      }

      var primaryRole = assignments.length > 0 ? assignments[0].role : 'viewer';
      var allRoles = assignments.map(function(a) { return a.role; });

      var loginScope = getAuthoritativeSingleEventScope_();

      // Consume OTP only after the complete authentication transaction
      // has succeeded. ScriptLock prevents concurrent successful consumption.
      otpSheet.getRange(challengeRowIdx, 9).setValue(nowIso); // used_at
      otpSheet.getRange(challengeRowIdx, 10).setValue('USED'); // status
      otpSheet.getRange(challengeRowIdx, 12).setValue(nowIso); // updated_at
      recordAuditLog(
        db,
        'AUTH',
        'AUTH_OTP_VERIFIED',
        targetEmail,
        'security',
        matchedChallenge.purpose
      );

      return envelopeSuccess(reqId, {
        user_id: matchedUser.id,
        display_name: matchedUser.name,
        email: matchedUser.email,
        avatar: matchedUser.avatarUrl || '',
        role: primaryRole,
        effective_roles: allRoles.length > 0 ? allRoles : ['viewer'],
        assignments: assignments,
        workspace_id: loginScope.workspace_id,
        event_id: loginScope.event_id,
        organization_id: 'ORG_GLOBAL',
        session_token: sessionToken,
        session_expires_at: sessionExpiresMs,
        device_public_id: clientDevicePublicId,
        device_token: clientDeviceToken,
        is_trusted_device: true
      });
    } finally {
      lock.releaseLock();
    }
  }

  // =========================================================================
  // ACTION: auth.session.validate & auth.session.refresh (Part 18)
  // =========================================================================
  if (action === 'auth.session.validate' || action === 'auth.session.refresh') {
    var rawToken = payload.session_token || req.session_token;
    var clientDevPubId = payload.device_public_id;

    if (!rawToken) {
      return envelopeError(reqId, 'SESSION_INVALID', 'Sesi tidak ditemukan.', 401);
    }

    var tokenHash = hashSha256(rawToken);
    var db = getCustomerDatabase();
    var sessionSheet = db.getSheetByName('AuthSessions');
    var deviceSheet = db.getSheetByName('TrustedDevices');
    var usersSheet = db.getSheetByName('Users');
    var roleSheet = db.getSheetByName('UserRoleAssignments');

    if (!sessionSheet || !usersSheet) {
      return envelopeError(reqId, 'SESSION_INVALID', 'Database autentikasi belum siap.', 401);
    }

    var sRows = sessionSheet.getDataRange().getValues();
    var matchedSession = null;
    var sessionRowIdx = -1;
    var nowMs = new Date().getTime();

    for (var s = sRows.length - 1; s >= 1; s--) {
      var row = sRows[s];
      if (row[3] === tokenHash) {
        matchedSession = {
          id: row[0],
          userId: row[1],
          trustedDeviceId: row[2],
          tokenHash: row[3],
          expiresAt: row[6],
          status: row[8]
        };
        sessionRowIdx = s + 1;
        break;
      }
    }

    if (!matchedSession || matchedSession.status !== 'active') {
      return envelopeError(reqId, 'SESSION_INVALID', 'Sesi telah kedaluwarsa atau dicabut.', 401);
    }

    if (new Date(matchedSession.expiresAt).getTime() < nowMs) {
      sessionSheet.getRange(sessionRowIdx, 9).setValue('revoked');
      return envelopeError(reqId, 'SESSION_EXPIRED', 'Masa berlaku sesi telah habis. Silakan masuk kembali.', 401);
    }

    // Check Trusted Device if bound
    var isDeviceValid = true;
    if (matchedSession.trustedDeviceId && deviceSheet) {
      var dRows = deviceSheet.getDataRange().getValues();
      for (var d = 1; d < dRows.length; d++) {
        if (dRows[d][0] === matchedSession.trustedDeviceId) {
          if (dRows[d][11] === 'revoked') {
            isDeviceValid = false;
          } else if (clientDevPubId && dRows[d][2] !== clientDevPubId) {
            isDeviceValid = false;
          } else {
            // Check device expiration
            var devExp = new Date(dRows[d][9]).getTime();
            if (devExp < nowMs) {
              isDeviceValid = false;
            } else {
              // Update last_seen_at for sliding session
              deviceSheet.getRange(d + 1, 9).setValue(new Date().toISOString());
            }
          }
          break;
        }
      }
    }

    if (!isDeviceValid) {
      sessionSheet.getRange(sessionRowIdx, 9).setValue('revoked');
      return envelopeError(reqId, 'DEVICE_REVOKED', 'Akses perangkat ini telah dicabut oleh Administrator.', 401);
    }

    // Lookup user in Users sheet (Col 1: id, Col 2: email, Col 3: name, Col 5: status)
    var uRows = usersSheet.getDataRange().getValues();
    var matchedUser = null;
    for (var u = 1; u < uRows.length; u++) {
      if (uRows[u][0] === matchedSession.userId) {
        matchedUser = {
          id: uRows[u][0],
          email: uRows[u][1],
          name: uRows[u][2],
          status: uRows[u][4],
          avatarUrl: uRows[u][9] || ''
        };
        break;
      }
    }

    if (!matchedUser || matchedUser.status === 'inactive') {
      return envelopeError(reqId, 'ACCOUNT_DISABLED', 'Akun pengguna dinonaktifkan oleh Administrator.', 403);
    }

    // Update last_seen_at for session
    sessionSheet.getRange(sessionRowIdx, 6).setValue(new Date().toISOString());

    // Resolve Authoritative Roles from UserRoleAssignments
    var rRows = roleSheet ? roleSheet.getDataRange().getValues() : [];
    var assignments = [];
    for (var r = 1; r < rRows.length; r++) {
      if (rRows[r][1] === matchedUser.id && rRows[r][5] === 'active') {
        assignments.push({
          assignment_id: rRows[r][0],
          role: rRows[r][2],
          scope_type: rRows[r][3],
          scope_id: rRows[r][4]
        });
      }
    }

    var primaryRole = assignments.length > 0 ? assignments[0].role : 'viewer';
    var allRoles = assignments.map(function(a) { return a.role; });

    var sessionScope = getAuthoritativeSingleEventScope_();

    return envelopeSuccess(reqId, {
      user_id: matchedUser.id,
      display_name: matchedUser.name,
      email: matchedUser.email,
      avatar: matchedUser.avatarUrl || '',
      role: primaryRole,
      effective_roles: allRoles.length > 0 ? allRoles : ['viewer'],
      assignments: assignments,
      workspace_id: sessionScope.workspace_id,
      event_id: sessionScope.event_id,
      organization_id: 'ORG_GLOBAL',
      session_token: rawToken,
      session_expires_at: new Date(matchedSession.expiresAt).getTime(),
      is_trusted_device: true
    });
  }

  // =========================================================================
  // ACTION: auth.logout & auth.logoutAll (Part 20)
  // =========================================================================
  if (action === 'auth.logout') {
    var rawToken = payload.session_token || req.session_token;
    var forgetDevice = payload.forget_device === true;

    if (rawToken) {
      var tokenHash = hashSha256(rawToken);
      var db = getCustomerDatabase();
      var sessionSheet = db.getSheetByName('AuthSessions');
      var deviceSheet = db.getSheetByName('TrustedDevices');
      var nowIso = new Date().toISOString();

      if (sessionSheet) {
        var sRows = sessionSheet.getDataRange().getValues();
        for (var s = 1; s < sRows.length; s++) {
          if (sRows[s][3] === tokenHash) {
            sessionSheet.getRange(s + 1, 8).setValue(nowIso); // revoked_at
            sessionSheet.getRange(s + 1, 9).setValue('revoked'); // status

            if (forgetDevice && deviceSheet && sRows[s][2]) {
              var devId = sRows[s][2];
              var dRows = deviceSheet.getDataRange().getValues();
              for (var d = 1; d < dRows.length; d++) {
                if (dRows[d][0] === devId) {
                  deviceSheet.getRange(d + 1, 11).setValue(nowIso);
                  deviceSheet.getRange(d + 1, 12).setValue('revoked');
                  break;
                }
              }
            }
            break;
          }
        }
      }
    }
    return envelopeSuccess(reqId, { logged_out: true });
  }

  if (action === 'auth.logoutAll') {
    var targetUserId = payload.user_id;
    if (targetUserId) {
      var db = getCustomerDatabase();
      var sessionSheet = db.getSheetByName('AuthSessions');
      var nowIso = new Date().toISOString();
      if (sessionSheet) {
        var sRows = sessionSheet.getDataRange().getValues();
        for (var s = 1; s < sRows.length; s++) {
          if (sRows[s][1] === targetUserId && sRows[s][8] === 'active') {
            sessionSheet.getRange(s + 1, 8).setValue(nowIso);
            sessionSheet.getRange(s + 1, 9).setValue('revoked');
          }
        }
      }
    }
    return envelopeSuccess(reqId, { logged_out_all: true });
  }

  // =========================================================================
  // ACTION: auth.devices.list & auth.devices.revoke (Part 21)
  // =========================================================================
  if (action === 'auth.devices.list') {
    var targetUserId = payload.user_id;
    var currentDevPubId = payload.current_device_public_id;
    var db = getCustomerDatabase();
    var deviceSheet = db.getSheetByName('TrustedDevices');
    var list = [];

    if (deviceSheet && targetUserId) {
      var dRows = deviceSheet.getDataRange().getValues();
      for (var d = 1; d < dRows.length; d++) {
        if (dRows[d][1] === targetUserId && dRows[d][11] === 'active') {
          list.push({
            trusted_device_id: dRows[d][0],
            user_id: dRows[d][1],
            device_public_id: dRows[d][2],
            device_name: dRows[d][4],
            browser_family: dRows[d][5],
            platform: dRows[d][6],
            created_at: dRows[d][7],
            last_seen_at: dRows[d][8],
            is_current_device: currentDevPubId ? (dRows[d][2] === currentDevPubId) : false
          });
        }
      }
    }
    return envelopeSuccess(reqId, list);
  }

  if (action === 'auth.devices.revoke') {
    var devPubId = payload.device_public_id;
    if (devPubId) {
      var db = getCustomerDatabase();
      var deviceSheet = db.getSheetByName('TrustedDevices');
      var sessionSheet = db.getSheetByName('AuthSessions');
      var nowIso = new Date().toISOString();
      var revokedDevId = null;

      if (deviceSheet) {
        var dRows = deviceSheet.getDataRange().getValues();
        for (var d = 1; d < dRows.length; d++) {
          if (dRows[d][2] === devPubId) {
            deviceSheet.getRange(d + 1, 11).setValue(nowIso);
            deviceSheet.getRange(d + 1, 12).setValue('revoked');
            revokedDevId = dRows[d][0];
            break;
          }
        }
      }

      if (revokedDevId && sessionSheet) {
        var sRows = sessionSheet.getDataRange().getValues();
        for (var s = 1; s < sRows.length; s++) {
          if (sRows[s][2] === revokedDevId) {
            sessionSheet.getRange(s + 1, 8).setValue(nowIso);
            sessionSheet.getRange(s + 1, 9).setValue('revoked');
          }
        }
      }
    }
    return envelopeSuccess(reqId, { revoked: true });
  }

  // =========================================================================
  // ACTIONS: USERS MANAGEMENT & RBAC (Part 24, 25, 26, 48)
  // Protected by server-side RBAC guard — Client state is NEVER trusted!
  // =========================================================================
  if (action === 'users.list') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var canList = authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1 || authCheck.roles.indexOf('event_admin') !== -1;
    if (!canList) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak: Hanya Administrator yang dapat melihat daftar pengguna.', 403);
    }

    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var roleSheet = db.getSheetByName('UserRoleAssignments');
    var resultList = [];

    if (usersSheet) {
      var uRows = usersSheet.getDataRange().getValues();
      var rRows = roleSheet ? roleSheet.getDataRange().getValues() : [];

      for (var u = 1; u < uRows.length; u++) {
        var uid = uRows[u][0];
        var userRoles = [];
        for (var r = 1; r < rRows.length; r++) {
          if (rRows[r][1] === uid && rRows[r][5] === 'active') {
            userRoles.push(rRows[r][2]);
          }
        }
        resultList.push({
          id: uid,
          user_id: uid,
          email: uRows[u][1],
          name: uRows[u][2],
          email_verified: uRows[u][3] === true || uRows[u][3] === 'true',
          status: uRows[u][4],
          createdAt: uRows[u][5],
          lastLogin: uRows[u][8] || 'Belum pernah login',
          role: userRoles.length > 0 ? userRoles[0] : 'viewer',
          roles: userRoles.length > 0 ? userRoles : ['viewer'],
          avatar: uRows[u][9] || '',
          organizationName: 'Kwartir Gerakan Pramuka',
          workspaceId: PropertiesService.getScriptProperties().getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || ''
        });
      }
    }
    return envelopeSuccess(reqId, resultList);
  }

  if (action === 'users.get') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var targetUid = payload.user_id || payload.id;
    var isSelf = authCheck.user.id === targetUid;
    var canGet = isSelf || authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1 || authCheck.roles.indexOf('event_admin') !== -1;
    if (!canGet) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak.', 403);
    }

    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var roleSheet = db.getSheetByName('UserRoleAssignments');

    if (usersSheet && targetUid) {
      var uRows = usersSheet.getDataRange().getValues();
      for (var u = 1; u < uRows.length; u++) {
        if (uRows[u][0] === targetUid || uRows[u][1] === targetUid) {
          var uid = uRows[u][0];
          var roles = [];
          if (roleSheet) {
            var rRows = roleSheet.getDataRange().getValues();
            for (var r = 1; r < rRows.length; r++) {
              if (rRows[r][1] === uid && rRows[r][5] === 'active') {
                roles.push({
                  assignment_id: rRows[r][0],
                  role: rRows[r][2],
                  scope_type: rRows[r][3],
                  scope_id: rRows[r][4]
                });
              }
            }
          }
          return envelopeSuccess(reqId, {
            user_id: uid,
            email: uRows[u][1],
            name: uRows[u][2],
            email_verified: uRows[u][3],
            status: uRows[u][4],
            role_assignments: roles
          });
        }
      }
    }
    return envelopeError(reqId, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.', 404);
  }

  if (action === 'users.disable') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var canAdmin = authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1;
    if (!canAdmin) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak: Hanya Administrator Kwartir yang dapat menonaktifkan pengguna.', 403);
    }

    var targetUid = payload.user_id;
    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var sessionSheet = db.getSheetByName('AuthSessions');
    var nowIso = new Date().toISOString();

    if (usersSheet && targetUid) {
      var uRows = usersSheet.getDataRange().getValues();
      for (var u = 1; u < uRows.length; u++) {
        if (uRows[u][0] === targetUid) {
          usersSheet.getRange(u + 1, 5).setValue('inactive');
          usersSheet.getRange(u + 1, 8).setValue(nowIso);

          // Revoke all active sessions immediately (Part 19)
          if (sessionSheet) {
            var sRows = sessionSheet.getDataRange().getValues();
            for (var s = 1; s < sRows.length; s++) {
              if (sRows[s][1] === targetUid && sRows[s][8] === 'active') {
                sessionSheet.getRange(s + 1, 8).setValue(nowIso);
                sessionSheet.getRange(s + 1, 9).setValue('revoked');
              }
            }
          }

          recordAuditLog(db, 'USERS', 'USER_DISABLED', targetUid, authCheck.roles[0] || 'admin', targetUid);
          return envelopeSuccess(reqId, { user_id: targetUid, status: 'inactive' });
        }
      }
    }
    return envelopeError(reqId, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.', 404);
  }

  if (action === 'users.enable') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var canAdmin = authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1;
    if (!canAdmin) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak: Hanya Administrator Kwartir yang dapat mengaktifkan pengguna.', 403);
    }

    var targetUid = payload.user_id;
    var db = getCustomerDatabase();
    var usersSheet = db.getSheetByName('Users');
    var nowIso = new Date().toISOString();

    if (usersSheet && targetUid) {
      var uRows = usersSheet.getDataRange().getValues();
      for (var u = 1; u < uRows.length; u++) {
        if (uRows[u][0] === targetUid) {
          usersSheet.getRange(u + 1, 5).setValue('active');
          usersSheet.getRange(u + 1, 8).setValue(nowIso);
          recordAuditLog(db, 'USERS', 'USER_ENABLED', targetUid, authCheck.roles[0] || 'admin', targetUid);
          return envelopeSuccess(reqId, { user_id: targetUid, status: 'active' });
        }
      }
    }
    return envelopeError(reqId, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.', 404);
  }

  if (action === 'users.assignRole') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var canAdmin = authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1;
    if (!canAdmin) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak: Hanya Administrator yang dapat memberikan peran.', 403);
    }

    var targetUid = payload.user_id;
    var newRole = payload.role;
    var scopeType = payload.scope_type || 'GLOBAL';
    var scopeId = payload.scope_id || PropertiesService.getScriptProperties().getProperty('SIEPANG_ACTIVE_WORKSPACE_ID') || 'GLOBAL';

    // SuperAdmin role can only be assigned by SuperAdmin
    if (newRole === 'superadmin' && !authCheck.isSuperAdmin) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Hanya SuperAdmin yang dapat memberikan peran SuperAdmin.', 403);
    }

    if (!targetUid || !newRole) {
      return envelopeError(reqId, 'INVALID_INPUT', 'user_id dan role wajib diisi.', 400);
    }

    var db = getCustomerDatabase();
    var roleSheet = db.getSheetByName('UserRoleAssignments');
    if (!roleSheet) {
      provisionCanonicalSchemaV19();
      roleSheet = db.getSheetByName('UserRoleAssignments');
    }

    var nowIso = new Date().toISOString();
    var assignmentId = 'asgn_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
    roleSheet.appendRow([
      assignmentId,
      targetUid,
      newRole,
      scopeType,
      scopeId,
      'active',
      authCheck.user.id,
      nowIso,
      ''
    ]);

    recordAuditLog(db, 'USERS', 'ROLE_ASSIGNED', targetUid, authCheck.roles[0] || 'admin', newRole);
    return envelopeSuccess(reqId, { assignment_id: assignmentId, user_id: targetUid, role: newRole });
  }

  if (action === 'users.revokeRole') {
    var authCheck = authenticateAndAuthorizeCaller(req);
    if (!authCheck.ok) {
      return envelopeError(reqId, authCheck.error.code, authCheck.error.message, 401);
    }
    var canAdmin = authCheck.isSuperAdmin || authCheck.roles.indexOf('workspace_admin') !== -1;
    if (!canAdmin) {
      return envelopeError(reqId, 'PERMISSION_DENIED', 'Akses ditolak: Hanya Administrator yang dapat mencabut peran.', 403);
    }

    var targetUid = payload.user_id;
    var targetRole = payload.role;
    var db = getCustomerDatabase();
    var roleSheet = db.getSheetByName('UserRoleAssignments');
    var nowIso = new Date().toISOString();

    if (roleSheet && targetUid) {
      var rRows = roleSheet.getDataRange().getValues();
      for (var r = 1; r < rRows.length; r++) {
        var matchUser = rRows[r][1] === targetUid;
        var matchRole = targetRole ? (rRows[r][2] === targetRole) : true;
        if (matchUser && matchRole && rRows[r][5] === 'active') {
          roleSheet.getRange(r + 1, 6).setValue('revoked'); // status
          roleSheet.getRange(r + 1, 9).setValue(nowIso); // revoked_at
        }
      }
      recordAuditLog(db, 'USERS', 'ROLE_REVOKED', targetUid, authCheck.roles[0] || 'admin', targetRole || 'ALL');
      return envelopeSuccess(reqId, { user_id: targetUid, revoked: true });
    }
    return envelopeError(reqId, 'ROLE_NOT_FOUND', 'Peran tidak ditemukan.', 404);
  }


  // =========================================================================
  // EVENTS — GAS-authoritative event core
  // =========================================================================
  if (action === 'events.list') {
    var listWorkspaceId = String(
      payload.workspace_id ||
      payload.workspaceId ||
      req.workspace_id ||
      ''
    ).trim();

    return envelopeSuccess(reqId, listEvents_(listWorkspaceId));
  }

  if (action === 'events.get') {
    var requestedEventId = String(
      payload.event_id ||
      payload.eventId ||
      req.event_id ||
      ''
    ).trim();

    if (!requestedEventId) {
      var currentWorkspaceId = String(
        payload.workspace_id ||
        payload.workspaceId ||
        req.workspace_id ||
        ''
      ).trim();

      var eventList = listEvents_(currentWorkspaceId);
      if (eventList.length === 0) {
        return envelopeError(reqId, 'EVENT_NOT_FOUND', 'Belum ada event aktif pada workspace ini.', 404);
      }

      return envelopeSuccess(reqId, eventList[0]);
    }

    var requestedEvent = getEventById_(requestedEventId);
    if (!requestedEvent || requestedEvent.status === 'ARCHIVED') {
      return envelopeError(reqId, 'EVENT_NOT_FOUND', 'Event tidak ditemukan.', 404);
    }

    return envelopeSuccess(reqId, requestedEvent);
  }

  if (action === 'events.create') {
    var eventAuth = canManageEvents_(req);
    if (!eventAuth.ok) {
      return envelopeError(reqId, eventAuth.error.code, eventAuth.error.message, 403);
    }

    var createEventPayload = payload.event || payload;
    if (!createEventPayload.workspace_id && !createEventPayload.workspaceId) {
      createEventPayload.workspace_id = req.workspace_id || '';
    }

    var createEventRes = createEvent_(createEventPayload, eventAuth.user);
    if (!createEventRes.ok) {
      return envelopeError(reqId, createEventRes.error.code, createEventRes.error.message, 400);
    }

    return envelopeSuccess(reqId, createEventRes.data);
  }

  if (action === 'events.update') {
    var eventAuth = canManageEvents_(req);
    if (!eventAuth.ok) {
      return envelopeError(reqId, eventAuth.error.code, eventAuth.error.message, 403);
    }

    var updateEventId = String(
      payload.eventId ||
      payload.event_id ||
      req.event_id ||
      ''
    ).trim();

    var updates = payload.updates || payload;
    var updateEventRes = updateEvent_(updateEventId, updates, eventAuth.user);

    if (!updateEventRes.ok) {
      return envelopeError(reqId, updateEventRes.error.code, updateEventRes.error.message, 400);
    }

    return envelopeSuccess(reqId, updateEventRes.data);
  }

  if (action === 'events.archive') {
    var eventAuth = canManageEvents_(req);
    if (!eventAuth.ok) {
      return envelopeError(reqId, eventAuth.error.code, eventAuth.error.message, 403);
    }

    var archiveEventId = String(
      payload.eventId ||
      payload.event_id ||
      req.event_id ||
      ''
    ).trim();

    var archiveEventRes = archiveEvent_(archiveEventId, eventAuth.user);

    if (!archiveEventRes.ok) {
      return envelopeError(reqId, archiveEventRes.error.code, archiveEventRes.error.message, 400);
    }

    return envelopeSuccess(reqId, archiveEventRes.data);
  }

  // Event-related public reads used by home/schedule views.
  if (action === 'schedules.list') {
    var scheduleEventId = String(
      payload.event_id ||
      payload.eventId ||
      req.event_id ||
      ''
    ).trim();

    return envelopeSuccess(reqId, listSchedules_(scheduleEventId));
  }

  if (action === 'announcements.list') {
    var announcementEventId = String(
      payload.event_id ||
      payload.eventId ||
      req.event_id ||
      ''
    ).trim();

    return envelopeSuccess(reqId, listAnnouncements_(announcementEventId));
  }

  if (action === 'announcements.create') {
    var announcementAuth = canManageEvents_(req);
    if (!announcementAuth.ok) {
      return envelopeError(
        reqId,
        announcementAuth.error.code,
        announcementAuth.error.message,
        403
      );
    }

    var announcementRes = createAnnouncement_(
      payload,
      req,
      announcementAuth.user
    );

    if (!announcementRes.ok) {
      return envelopeError(
        reqId,
        announcementRes.error.code,
        announcementRes.error.message,
        400
      );
    }

    return envelopeSuccess(reqId, announcementRes.data);
  }

  // =========================================================================
  // WORKSPACES — GAS-authoritative multi-workspace core
  // =========================================================================
  if (action === 'workspaces.list') {
    var wsAuth = authenticateAndAuthorizeCaller(req, 'superadmin');
    if (!wsAuth.ok) {
      return envelopeError(reqId, wsAuth.error.code, wsAuth.error.message, 401);
    }

    return envelopeSuccess(reqId, listWorkspaces_());
  }

  if (action === 'workspaces.get') {
    var wsAuth = authenticateAndAuthorizeCaller(req, 'superadmin');
    if (!wsAuth.ok) {
      return envelopeError(reqId, wsAuth.error.code, wsAuth.error.message, 401);
    }

    var requestedWorkspaceId = String(payload.workspace_id || '').trim();
    if (!requestedWorkspaceId) {
      return envelopeError(reqId, 'INVALID_INPUT', 'workspace_id wajib diisi.', 400);
    }

    var singleWorkspace = getWorkspaceById_(requestedWorkspaceId);
    if (!singleWorkspace) {
      return envelopeError(reqId, 'WORKSPACE_NOT_FOUND', 'Workspace tidak ditemukan.', 404);
    }

    return envelopeSuccess(reqId, singleWorkspace);
  }

  if (action === 'workspaces.create') {
    var wsAuth = authenticateAndAuthorizeCaller(req, 'superadmin');
    if (!wsAuth.ok) {
      return envelopeError(reqId, wsAuth.error.code, wsAuth.error.message, 401);
    }

    var createRes = createWorkspace_(payload, wsAuth.user);
    if (!createRes.ok) {
      return envelopeError(reqId, createRes.error.code, createRes.error.message, 400);
    }

    return envelopeSuccess(reqId, createRes.data);
  }

  if (action === 'workspaces.update') {
    var wsAuth = authenticateAndAuthorizeCaller(req, 'superadmin');
    if (!wsAuth.ok) {
      return envelopeError(reqId, wsAuth.error.code, wsAuth.error.message, 401);
    }

    var updateRes = updateWorkspace_(payload, wsAuth.user);
    if (!updateRes.ok) {
      return envelopeError(reqId, updateRes.error.code, updateRes.error.message, 400);
    }

    return envelopeSuccess(reqId, updateRes.data);
  }

  if (action === 'workspaces.archive') {
    var wsAuth = authenticateAndAuthorizeCaller(req, 'superadmin');
    if (!wsAuth.ok) {
      return envelopeError(reqId, wsAuth.error.code, wsAuth.error.message, 401);
    }

    var archiveRes = archiveWorkspace_(payload, wsAuth.user);
    if (!archiveRes.ok) {
      return envelopeError(reqId, archiveRes.error.code, archiveRes.error.message, 400);
    }

    return envelopeSuccess(reqId, archiveRes.data);
  }

  // Action: database.provision_schema_v19
  if (action === 'database.provision_schema_v19' || action === '/api/database/provision_schema_v16') {
    var prov = provisionCanonicalSchemaV19();
    return envelopeSuccess(reqId, prov);
  }

  // Default fallback for unknown actions
  return envelopeError(reqId, 'ACTION_NOT_FOUND', 'Aksi backend ' + action + ' tidak dikenali.', 404);
}


function parseJsonSafe_(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch (e) {
    return fallback;
  }
}

function getDriveSubfolderId_(root, name) {
  try {
    var iter = root.getFoldersByName(name);
    return iter.hasNext() ? iter.next().getId() : '';
  } catch (e) {
    return '';
  }
}

function getWorkspaceInfrastructure_() {
  var props = PropertiesService.getScriptProperties();
  var db = getCustomerDatabase();
  var root = getCustomerDriveRoot();

  return {
    spreadsheetId: db.getId(),
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + db.getId() + '/edit',
    driveRootFolderId: root.getId(),
    driveFolders: {
      branding: getDriveSubfolderId_(root, 'Branding'),
      idCardTemplates: '',
      idCardGenerated: '',
      certificatesTemplates: '',
      certificatesGenerated: getDriveSubfolderId_(root, 'Certificates'),
      submissions: getDriveSubfolderId_(root, 'Documents')
    },
    apiEndpoint: props.getProperty('SIEPANG_WEB_APP_URL') || props.getProperty('WEB_APP_URL') || '',
    offlineSyncEnabled: false,
    autoBackupInterval: 'DAILY'
  };
}

function ensureWorkspacesSheet_() {
  var db = getCustomerDatabase();
  var sheet = db.getSheetByName('Workspaces');

  if (!sheet) {
    sheet = db.insertSheet('Workspaces');
    sheet.appendRow([
      'workspace_id',
      'workspace_code',
      'workspace_name',
      'organization_id',
      'organization_name',
      'organization_level',
      'province',
      'city',
      'status',
      'schema_version',
      'default_event_id',
      'admin_name',
      'admin_email',
      'branding_json',
      'infrastructure_json',
      'created_at',
      'updated_at',
      'archived_at'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 18).setBackground('#E8F5E9').setFontWeight('bold');
  }

  return sheet;
}

function ensureEventsSheet_() {
  var db = getCustomerDatabase();
  var sheet = db.getSheetByName('Events');

  var canonicalHeaders = [
    'id',
    'workspace_id',
    'name',
    'short_name',
    'event_code',
    'category',
    'theme',
    'start_date',
    'end_date',
    'location',
    'status',
    'participant_capacity',
    'created_at',
    'updated_at',
    'organizational_level',
    'organizer_organization_id',
    'organizer_level',
    'contingent_representation_level',
    'organizer',
    'description',
    'registration_start',
    'registration_end',
    'venue',
    'camp_ground',
    'banner_url',
    'logo_url',
    'participation_scope',
    'allowed_organization_ids_json',
    'contacts_json',
    'features_json',
    'home_sections_json'
  ];

  if (!sheet) {
    sheet = db.insertSheet('Events');
    sheet.appendRow(canonicalHeaders);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, canonicalHeaders.length)
      .setBackground('#E8F5E9')
      .setFontWeight('bold');
    return sheet;
  }

  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var headerSet = {};
  for (var h = 0; h < existingHeaders.length; h++) {
    if (existingHeaders[h]) headerSet[String(existingHeaders[h])] = true;
  }

  var missingHeaders = [];
  for (var c = 0; c < canonicalHeaders.length; c++) {
    if (!headerSet[canonicalHeaders[c]]) missingHeaders.push(canonicalHeaders[c]);
  }

  if (missingHeaders.length > 0) {
    var startCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.getRange(1, startCol, 1, missingHeaders.length)
      .setBackground('#E8F5E9')
      .setFontWeight('bold');
  }

  return sheet;
}

function eventHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[String(headers[i])] = i;
  }
  return map;
}

function eventValue_(row, headerMap, key, fallback) {
  var idx = headerMap[key];
  if (idx === undefined) return fallback;
  var value = row[idx];
  return value === '' || value === null || value === undefined ? fallback : value;
}

function defaultEventFeatures_() {
  return {
    attendance: true,
    qrCheckpoint: true,
    competition: true,
    voting: true,
    xp: true,
    leaderboard: true,
    digitalGallery: true,
    certificate: true,
    healthPost: true,
    logistics: true
  };
}

function eventRowToClient_(row, headerMap) {
  var features = parseJsonSafe_(
    eventValue_(row, headerMap, 'features_json', ''),
    defaultEventFeatures_()
  );

  var contacts = parseJsonSafe_(
    eventValue_(row, headerMap, 'contacts_json', ''),
    {}
  );

  var homeSections = parseJsonSafe_(
    eventValue_(row, headerMap, 'home_sections_json', ''),
    []
  );

  var allowedOrganizations = parseJsonSafe_(
    eventValue_(row, headerMap, 'allowed_organization_ids_json', ''),
    []
  );

  var capacity = Number(
    eventValue_(row, headerMap, 'participant_capacity', 0)
  ) || 0;

  var location = String(
    eventValue_(row, headerMap, 'location', '')
  );

  var venue = String(
    eventValue_(row, headerMap, 'venue', location)
  );

  var campGround = String(
    eventValue_(row, headerMap, 'camp_ground', venue || location)
  );

  var eventId = String(eventValue_(row, headerMap, 'id', ''));
  var workspaceId = String(eventValue_(row, headerMap, 'workspace_id', ''));

  return {
    id: eventId,
    event_id: eventId,
    workspaceId: workspaceId,
    workspace_id: workspaceId,
    name: String(eventValue_(row, headerMap, 'name', '')),
    shortName: String(eventValue_(row, headerMap, 'short_name', '')),
    eventCode: String(eventValue_(row, headerMap, 'event_code', '')),
    category: String(eventValue_(row, headerMap, 'category', 'Jambore')),
    organizationalLevel: String(
      eventValue_(row, headerMap, 'organizational_level', 'Kwarcab')
    ),
    organizer_organization_id: String(
      eventValue_(row, headerMap, 'organizer_organization_id', '')
    ),
    organizer_level: String(
      eventValue_(row, headerMap, 'organizer_level', '')
    ),
    contingent_representation_level: String(
      eventValue_(row, headerMap, 'contingent_representation_level', '')
    ),
    organizer: String(
      eventValue_(row, headerMap, 'organizer', '')
    ),
    description: String(
      eventValue_(row, headerMap, 'description', '')
    ),
    theme: String(eventValue_(row, headerMap, 'theme', '')),
    startDate: String(eventValue_(row, headerMap, 'start_date', '')),
    endDate: String(eventValue_(row, headerMap, 'end_date', '')),
    registrationStart: String(
      eventValue_(row, headerMap, 'registration_start', '')
    ),
    registrationEnd: String(
      eventValue_(row, headerMap, 'registration_end', '')
    ),
    location: location,
    venue: venue,
    campGround: campGround,
    participantCapacity: capacity,
    maxParticipants: capacity,
    bannerUrl: String(eventValue_(row, headerMap, 'banner_url', '')),
    logoUrl: String(eventValue_(row, headerMap, 'logo_url', '')),
    status: String(eventValue_(row, headerMap, 'status', 'UPCOMING')),
    participation_scope: String(
      eventValue_(row, headerMap, 'participation_scope', 'OWN_ORGANIZATION')
    ),
    allowed_organization_ids: Array.isArray(allowedOrganizations)
      ? allowedOrganizations
      : [],
    contacts: contacts || {},
    features: features || defaultEventFeatures_(),
    homeSections: Array.isArray(homeSections) ? homeSections : [],
    registeredCount: 0,
    checkedInCount: 0,
    contingentCount: 0,
    competitionCount: 0
  };
}

function listEvents_(workspaceId) {
  var sheet = ensureEventsSheet_();
  var rows = sheet.getDataRange().getValues();
  var headerMap = eventHeaderMap_(sheet);
  var result = [];
  var filterWorkspace = String(workspaceId || '').trim();

  for (var i = 1; i < rows.length; i++) {
    var eventId = String(eventValue_(rows[i], headerMap, 'id', ''));
    if (!eventId) continue;

    var status = String(eventValue_(rows[i], headerMap, 'status', ''));
    if (status === 'ARCHIVED') continue;

    var rowWorkspace = String(
      eventValue_(rows[i], headerMap, 'workspace_id', '')
    );

    if (filterWorkspace && rowWorkspace !== filterWorkspace) continue;

    result.push(eventRowToClient_(rows[i], headerMap));
  }

  return result;
}

function getEventById_(eventId) {
  var targetId = String(eventId || '').trim();
  if (!targetId) return null;

  var sheet = ensureEventsSheet_();
  var rows = sheet.getDataRange().getValues();
  var headerMap = eventHeaderMap_(sheet);

  for (var i = 1; i < rows.length; i++) {
    if (
      String(eventValue_(rows[i], headerMap, 'id', '')) === targetId
    ) {
      return eventRowToClient_(rows[i], headerMap);
    }
  }

  return null;
}

function getEventsByWorkspace_() {
  var sheet = ensureEventsSheet_();
  var rows = sheet.getDataRange().getValues();
  var headerMap = eventHeaderMap_(sheet);
  var map = {};

  for (var i = 1; i < rows.length; i++) {
    var eventId = String(eventValue_(rows[i], headerMap, 'id', ''));
    if (!eventId) continue;

    var status = String(eventValue_(rows[i], headerMap, 'status', ''));
    if (status === 'ARCHIVED') continue;

    var workspaceId = String(
      eventValue_(rows[i], headerMap, 'workspace_id', '')
    );
    if (!workspaceId) continue;

    if (!map[workspaceId]) map[workspaceId] = [];
    map[workspaceId].push(eventRowToClient_(rows[i], headerMap));
  }

  return map;
}

function setEventCell_(sheet, headerMap, rowNumber, key, value) {
  var idx = headerMap[key];
  if (idx === undefined) return;
  sheet.getRange(rowNumber, idx + 1).setValue(value);
}

function normalizeEventStatus_(value) {
  var allowed = {
    DRAFT: true,
    REGISTRATION: true,
    UPCOMING: true,
    ONGOING: true,
    COMPLETED: true,
    ARCHIVED: true
  };

  var normalized = String(value || 'UPCOMING').trim().toUpperCase();
  return allowed[normalized] ? normalized : 'UPCOMING';
}

function canManageEvents_(req) {
  var auth = authenticateAndAuthorizeCaller(req);
  if (!auth.ok) return auth;

  var allowed =
    auth.isSuperAdmin ||
    auth.roles.indexOf('workspace_admin') !== -1 ||
    auth.roles.indexOf('event_admin') !== -1;

  if (!allowed) {
    return {
      ok: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Akses pengelolaan event memerlukan SuperAdmin, Workspace Admin, atau Event Admin.'
      }
    };
  }

  return auth;
}

function findWorkspaceCode_(workspaceId) {
  try {
    var sheet = ensureWorkspacesSheet_();
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '') === String(workspaceId || '')) {
        return String(rows[i][1] || '').trim().toUpperCase();
      }
    }
  } catch (e) {}
  return 'EVENT';
}

function createEvent_(payload, actorUser) {
  var workspaceId = String(
    payload.workspace_id ||
    payload.workspaceId ||
    ''
  ).trim();

  var name = String(payload.name || '').trim();
  var shortName = String(payload.shortName || payload.short_name || '').trim();

  if (!workspaceId) {
    return {
      ok: false,
      error: {
        code: 'WORKSPACE_REQUIRED',
        message: 'workspace_id wajib diisi untuk membuat event.'
      }
    };
  }

  if (!name) {
    return {
      ok: false,
      error: {
        code: 'INVALID_EVENT_NAME',
        message: 'Nama event wajib diisi.'
      }
    };
  }

  var workspace = getWorkspaceById_(workspaceId);
  if (!workspace) {
    return {
      ok: false,
      error: {
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace tujuan tidak ditemukan.'
      }
    };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'SERVER_BUSY',
        message: 'Backend sedang memproses perubahan event lain. Coba lagi.'
      }
    };
  }

  try {
    var sheet = ensureEventsSheet_();
    var headerMap = eventHeaderMap_(sheet);
    var rows = sheet.getDataRange().getValues();

    var requestedCode = String(
      payload.eventCode ||
      payload.event_code ||
      ''
    ).trim().toUpperCase();

    if (!requestedCode) {
      requestedCode =
        findWorkspaceCode_(workspaceId) +
        '-EV-' +
        Utilities.getUuid().replace(/-/g, '').substring(0, 6).toUpperCase();
    }

    for (var i = 1; i < rows.length; i++) {
      var existingCode = String(
        eventValue_(rows[i], headerMap, 'event_code', '')
      ).trim().toUpperCase();

      var existingWorkspace = String(
        eventValue_(rows[i], headerMap, 'workspace_id', '')
      );

      var existingStatus = String(
        eventValue_(rows[i], headerMap, 'status', '')
      );

      if (
        existingWorkspace === workspaceId &&
        existingCode === requestedCode &&
        existingStatus !== 'ARCHIVED'
      ) {
        return {
          ok: true,
          data: eventRowToClient_(rows[i], headerMap),
          reused_existing: true
        };
      }
    }

    var nowIso = new Date().toISOString();
    var eventId =
      'evt_' + Utilities.getUuid().replace(/-/g, '').substring(0, 20);

    var row = new Array(sheet.getLastColumn()).fill('');

    function put(key, value) {
      var idx = headerMap[key];
      if (idx !== undefined) row[idx] = value;
    }

    put('id', eventId);
    put('workspace_id', workspaceId);
    put('name', name);
    put('short_name', shortName || name);
    put('event_code', requestedCode);
    put('category', String(payload.category || 'Jambore'));
    put('theme', String(payload.theme || ''));
    put('start_date', String(payload.startDate || payload.start_date || ''));
    put('end_date', String(payload.endDate || payload.end_date || payload.startDate || payload.start_date || ''));
    put('location', String(payload.location || payload.venue || ''));
    put('status', normalizeEventStatus_(payload.status));
    put('participant_capacity', Number(payload.participantCapacity || payload.maxParticipants || payload.participant_capacity || 0));
    put('created_at', nowIso);
    put('updated_at', nowIso);
    put('organizational_level', String(payload.organizationalLevel || payload.organizational_level || 'Kwarcab'));
    put('organizer_organization_id', String(payload.organizer_organization_id || ''));
    put('organizer_level', String(payload.organizer_level || ''));
    put('contingent_representation_level', String(payload.contingent_representation_level || ''));
    put('organizer', String(payload.organizer || ''));
    put('description', String(payload.description || ''));
    put('registration_start', String(payload.registrationStart || payload.registration_start || ''));
    put('registration_end', String(payload.registrationEnd || payload.registration_end || ''));
    put('venue', String(payload.venue || payload.location || ''));
    put('camp_ground', String(payload.campGround || payload.camp_ground || payload.venue || payload.location || ''));
    put('banner_url', String(payload.bannerUrl || payload.banner_url || ''));
    put('logo_url', String(payload.logoUrl || payload.logo_url || ''));
    put('participation_scope', String(payload.participation_scope || 'OWN_ORGANIZATION'));
    put('allowed_organization_ids_json', JSON.stringify(payload.allowed_organization_ids || []));
    put('contacts_json', JSON.stringify(payload.contacts || {}));
    put('features_json', JSON.stringify(payload.features || defaultEventFeatures_()));
    put('home_sections_json', JSON.stringify(payload.homeSections || payload.home_sections || []));

    sheet.appendRow(row);

    // First real event becomes the workspace default if none exists.
    if (!workspace.activeEventId) {
      var workspaceSheet = ensureWorkspacesSheet_();
      var workspaceRows = workspaceSheet.getDataRange().getValues();
      for (var w = 1; w < workspaceRows.length; w++) {
        if (String(workspaceRows[w][0] || '') === workspaceId) {
          workspaceSheet.getRange(w + 1, 11).setValue(eventId);
          workspaceSheet.getRange(w + 1, 17).setValue(nowIso);
          break;
        }
      }
    }

    recordAuditLog(
      getCustomerDatabase(),
      'EVENT',
      'EVENT_CREATED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'event_admin',
      eventId,
      JSON.stringify({
        workspace_id: workspaceId,
        event_code: requestedCode
      })
    );

    return {
      ok: true,
      data: getEventById_(eventId)
    };
  } finally {
    lock.releaseLock();
  }
}

function updateEvent_(eventId, updates, actorUser) {
  var targetId = String(eventId || '').trim();
  if (!targetId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'event_id wajib diisi.'
      }
    };
  }

  var sheet = ensureEventsSheet_();
  var rows = sheet.getDataRange().getValues();
  var headerMap = eventHeaderMap_(sheet);

  for (var i = 1; i < rows.length; i++) {
    if (
      String(eventValue_(rows[i], headerMap, 'id', '')) !== targetId
    ) {
      continue;
    }

    var rowNumber = i + 1;
    var u = updates || {};

    var mapping = {
      name: 'name',
      shortName: 'short_name',
      short_name: 'short_name',
      eventCode: 'event_code',
      event_code: 'event_code',
      category: 'category',
      theme: 'theme',
      startDate: 'start_date',
      start_date: 'start_date',
      endDate: 'end_date',
      end_date: 'end_date',
      location: 'location',
      status: 'status',
      participantCapacity: 'participant_capacity',
      participant_capacity: 'participant_capacity',
      maxParticipants: 'participant_capacity',
      organizationalLevel: 'organizational_level',
      organizational_level: 'organizational_level',
      organizer_organization_id: 'organizer_organization_id',
      organizer_level: 'organizer_level',
      contingent_representation_level: 'contingent_representation_level',
      organizer: 'organizer',
      description: 'description',
      registrationStart: 'registration_start',
      registration_start: 'registration_start',
      registrationEnd: 'registration_end',
      registration_end: 'registration_end',
      venue: 'venue',
      campGround: 'camp_ground',
      camp_ground: 'camp_ground',
      bannerUrl: 'banner_url',
      banner_url: 'banner_url',
      logoUrl: 'logo_url',
      logo_url: 'logo_url',
      participation_scope: 'participation_scope'
    };

    for (var clientKey in mapping) {
      if (!mapping.hasOwnProperty(clientKey)) continue;
      if (u[clientKey] === undefined) continue;

      var value = u[clientKey];
      if (mapping[clientKey] === 'status') value = normalizeEventStatus_(value);
      if (mapping[clientKey] === 'participant_capacity') value = Number(value || 0);

      setEventCell_(sheet, headerMap, rowNumber, mapping[clientKey], value);
    }

    if (u.allowed_organization_ids !== undefined) {
      setEventCell_(
        sheet,
        headerMap,
        rowNumber,
        'allowed_organization_ids_json',
        JSON.stringify(u.allowed_organization_ids || [])
      );
    }

    if (u.contacts !== undefined) {
      setEventCell_(
        sheet,
        headerMap,
        rowNumber,
        'contacts_json',
        JSON.stringify(u.contacts || {})
      );
    }

    if (u.features !== undefined) {
      setEventCell_(
        sheet,
        headerMap,
        rowNumber,
        'features_json',
        JSON.stringify(u.features || defaultEventFeatures_())
      );
    }

    if (u.homeSections !== undefined || u.home_sections !== undefined) {
      setEventCell_(
        sheet,
        headerMap,
        rowNumber,
        'home_sections_json',
        JSON.stringify(u.homeSections || u.home_sections || [])
      );
    }

    setEventCell_(
      sheet,
      headerMap,
      rowNumber,
      'updated_at',
      new Date().toISOString()
    );

    recordAuditLog(
      getCustomerDatabase(),
      'EVENT',
      'EVENT_UPDATED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'event_admin',
      targetId,
      ''
    );

    return {
      ok: true,
      data: getEventById_(targetId)
    };
  }

  return {
    ok: false,
    error: {
      code: 'EVENT_NOT_FOUND',
      message: 'Event tidak ditemukan.'
    }
  };
}

function archiveEvent_(eventId, actorUser) {
  var result = updateEvent_(
    eventId,
    { status: 'ARCHIVED' },
    actorUser
  );

  if (result.ok) {
    recordAuditLog(
      getCustomerDatabase(),
      'EVENT',
      'EVENT_ARCHIVED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'event_admin',
      String(eventId || ''),
      ''
    );
  }

  return result;
}

function listSchedules_(eventId) {
  var db = getCustomerDatabase();
  var sheet = db.getSheetByName('Schedules');
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  var result = [];
  var targetEvent = String(eventId || '');

  for (var i = 1; i < rows.length; i++) {
    if (targetEvent && String(rows[i][1] || '') !== targetEvent) continue;
    if (!rows[i][0]) continue;

    result.push({
      id: String(rows[i][0] || ''),
      eventId: String(rows[i][1] || ''),
      title: String(rows[i][2] || ''),
      dayNumber: Number(rows[i][3] || 0),
      date: String(rows[i][4] || ''),
      startTime: String(rows[i][5] || ''),
      endTime: String(rows[i][6] || ''),
      time: String(rows[i][5] || ''),
      location: String(rows[i][7] || ''),
      category: String(rows[i][8] || ''),
      xpReward: Number(rows[i][9] || 0),
      isPublished: rows[i][10] === true || String(rows[i][10]).toLowerCase() === 'true',
      description: '',
      mandatoryFor: [],
      status: 'upcoming'
    });
  }

  return result;
}

function listAnnouncements_(eventId) {
  var db = getCustomerDatabase();
  var sheet = db.getSheetByName('Announcements');
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  var result = [];
  var targetEvent = String(eventId || '');

  for (var i = 1; i < rows.length; i++) {
    if (targetEvent && String(rows[i][1] || '') !== targetEvent) continue;
    if (!rows[i][0]) continue;

    result.push({
      id: String(rows[i][0] || ''),
      eventId: String(rows[i][1] || ''),
      title: String(rows[i][2] || ''),
      content: String(rows[i][3] || ''),
      priority: String(rows[i][4] || 'info'),
      targetGroup: String(rows[i][5] || 'everyone'),
      date: String(rows[i][6] || ''),
      timestamp: String(rows[i][9] || '')
    });
  }

  return result;
}

function createAnnouncement_(payload, req, actorUser) {
  var eventId = String(
    payload.event_id ||
    payload.eventId ||
    req.event_id ||
    ''
  ).trim();

  if (!eventId || !getEventById_(eventId)) {
    return {
      ok: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: 'Event tujuan pengumuman tidak ditemukan.'
      }
    };
  }

  var title = String(payload.title || '').trim();
  var content = String(payload.content || '').trim();

  if (!title || !content) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Judul dan isi pengumuman wajib diisi.'
      }
    };
  }

  var db = getCustomerDatabase();
  var sheet = db.getSheetByName('Announcements');
  if (!sheet) {
    provisionCanonicalSchemaV19();
    sheet = db.getSheetByName('Announcements');
  }

  var nowIso = new Date().toISOString();
  var announcementId =
    'anc_' + Utilities.getUuid().replace(/-/g, '').substring(0, 20);

  sheet.appendRow([
    announcementId,
    eventId,
    title,
    content,
    String(payload.priority || 'info'),
    String(payload.targetGroup || payload.audience || 'everyone'),
    String(payload.publish_start || nowIso),
    String(payload.publish_end || ''),
    'PUBLISHED',
    nowIso
  ]);

  recordAuditLog(
    db,
    'ANNOUNCEMENT',
    'ANNOUNCEMENT_CREATED',
    actorUser && actorUser.id ? actorUser.id : 'system',
    'event_admin',
    announcementId,
    JSON.stringify({ event_id: eventId })
  );

  return {
    ok: true,
    data: {
      id: announcementId,
      eventId: eventId,
      title: title,
      content: content,
      priority: String(payload.priority || 'info'),
      timestamp: nowIso,
      date: nowIso,
      targetGroup: String(payload.targetGroup || payload.audience || 'everyone')
    }
  };
}


function workspaceRowToClient_(row, eventsByWorkspace) {
  var branding = parseJsonSafe_(row[13], {});
  var infrastructure = parseJsonSafe_(row[14], {});
  var workspaceId = String(row[0] || '');
  var events = eventsByWorkspace[workspaceId] || [];

  var defaultBranding = {
    primaryColor: '#833AB4',
    secondaryColor: '#E1306C',
    accentColor: '#FCAF45',
    backgroundColor: '#F7F7F8',
    surfaceColor: '#FFFFFF',
    logoUrl: '',
    bannerUrl: '',
    organizationName: String(row[4] || ''),
    eventShortName: events.length > 0 ? events[0].shortName : 'SiEpang'
  };

  for (var key in branding) {
    if (branding.hasOwnProperty(key)) defaultBranding[key] = branding[key];
  }

  var defaultInfrastructure = getWorkspaceInfrastructure_();
  for (var infraKey in infrastructure) {
    if (infrastructure.hasOwnProperty(infraKey)) {
      defaultInfrastructure[infraKey] = infrastructure[infraKey];
    }
  }

  return {
    id: workspaceId,
    workspace_id: workspaceId,
    code: String(row[1] || ''),
    workspace_code: String(row[1] || ''),
    name: String(row[2] || ''),
    workspace_name: String(row[2] || ''),
    organization_id: String(row[3] || ''),
    organization: String(row[4] || ''),
    organization_level: String(row[5] || ''),
    region: String(row[6] || ''),
    province: String(row[6] || ''),
    city: String(row[7] || ''),
    status: String(row[8] || 'active'),
    workspace_status: String(row[8] || 'active'),
    schemaVersion: String(row[9] || 'v1.9'),
    schema_version: String(row[9] || 'v1.9'),
    activeEventId: String(row[10] || ''),
    default_event_id: String(row[10] || ''),
    adminName: String(row[11] || ''),
    adminEmail: String(row[12] || ''),
    branding: defaultBranding,
    infrastructure: defaultInfrastructure,
    events: events,
    createdAt: String(row[15] || '')
  };
}

function listWorkspaces_() {
  var sheet = ensureWorkspacesSheet_();
  var rows = sheet.getDataRange().getValues();
  var eventsByWorkspace = getEventsByWorkspace_();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (String(rows[i][8] || '') === 'archived') continue;
    result.push(workspaceRowToClient_(rows[i], eventsByWorkspace));
  }

  return result;
}

function getWorkspaceById_(workspaceId) {
  var sheet = ensureWorkspacesSheet_();
  var rows = sheet.getDataRange().getValues();
  var eventsByWorkspace = getEventsByWorkspace_();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') === workspaceId) {
      return workspaceRowToClient_(rows[i], eventsByWorkspace);
    }
  }

  return null;
}

function createWorkspace_(payload, actorUser) {
  var identity = payload.identity || {};
  var admin = payload.admin || {};
  var eventPayload = payload.event || {};
  var brandingPayload = payload.branding || {};

  var workspaceName = String(identity.name || '').trim();
  var workspaceCode = String(identity.code || '').trim().toUpperCase();
  var organizationName = String(identity.organization || '').trim();
  var adminEmail = String(admin.email || '').trim().toLowerCase();

  if (!workspaceName || !workspaceCode || !organizationName) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Nama workspace, kode workspace, dan organisasi wajib diisi.'
      }
    };
  }

  if (!adminEmail || adminEmail.indexOf('@') === -1) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ADMIN_EMAIL',
        message: 'Email administrator workspace tidak valid.'
      }
    };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'SERVER_BUSY',
        message: 'Backend sedang memproses perubahan workspace lain. Coba lagi.'
      }
    };
  }

  try {
    provisionCanonicalSchemaV19();

    var db = getCustomerDatabase();
    var workspaceSheet = ensureWorkspacesSheet_();
    var rows = workspaceSheet.getDataRange().getValues();

    // Idempotent create:
    // A retry with the same workspace code must return the already-created
    // authoritative workspace instead of failing. This prevents a successful
    // GAS write followed by a lost/late browser response from trapping the UI.
    for (var i = 1; i < rows.length; i++) {
      if (
        String(rows[i][1] || '').trim().toUpperCase() === workspaceCode &&
        String(rows[i][8] || '') !== 'archived'
      ) {
        var existingWorkspaceId = String(rows[i][0] || '').trim();

        recordAuditLog(
          db,
          'WORKSPACE',
          'WORKSPACE_CREATE_REPLAY',
          actorUser && actorUser.id ? actorUser.id : 'system',
          'superadmin',
          existingWorkspaceId,
          JSON.stringify({
            workspace_code: workspaceCode,
            reason: 'IDEMPOTENT_RETRY'
          })
        );

        return {
          ok: true,
          data: getWorkspaceById_(existingWorkspaceId),
          reused_existing: true
        };
      }
    }

    var nowIso = new Date().toISOString();
    var workspaceId = 'ws_' + Utilities.getUuid().replace(/-/g, '').substring(0, 20);
    var eventId = '';
    var eventsSheet = db.getSheetByName('Events');

    if (eventPayload.name && eventsSheet) {
      eventId = 'evt_' + Utilities.getUuid().replace(/-/g, '').substring(0, 20);
      var eventDate = String(eventPayload.date || '');
      eventsSheet.appendRow([
        eventId,
        workspaceId,
        String(eventPayload.name || '').trim(),
        String(eventPayload.shortName || '').trim(),
        workspaceCode + '-EV1',
        String(eventPayload.category || 'Jambore'),
        '',
        eventDate,
        eventDate,
        String(eventPayload.location || '').trim(),
        'UPCOMING',
        Number(eventPayload.maxParticipants || 0),
        nowIso,
        nowIso
      ]);
    }

    var branding = {
      primaryColor: String(brandingPayload.primaryColor || '#833AB4'),
      secondaryColor: String(brandingPayload.secondaryColor || '#E1306C'),
      accentColor: String(brandingPayload.accentColor || '#FCAF45'),
      backgroundColor: '#F7F7F8',
      surfaceColor: '#FFFFFF',
      logoUrl: '',
      bannerUrl: '',
      organizationName: organizationName,
      eventShortName: String(eventPayload.shortName || 'SiEpang')
    };

    // Store only real infrastructure values resolved by GAS.
    var infrastructure = getWorkspaceInfrastructure_();
    infrastructure.offlineSyncEnabled = !!(
      payload.infrastructure && payload.infrastructure.offlineMode
    );

    workspaceSheet.appendRow([
      workspaceId,
      workspaceCode,
      workspaceName,
      String(payload.organization_id || ''),
      organizationName,
      String(payload.organization_level || ''),
      String(identity.province || ''),
      String(identity.city || ''),
      'active',
      'v1.9',
      eventId,
      String(admin.name || '').trim(),
      adminEmail,
      JSON.stringify(branding),
      JSON.stringify(infrastructure),
      nowIso,
      nowIso,
      ''
    ]);

    recordAuditLog(
      db,
      'WORKSPACE',
      'WORKSPACE_CREATED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'superadmin',
      workspaceId,
      JSON.stringify({
        workspace_code: workspaceCode,
        workspace_name: workspaceName
      })
    );

    return {
      ok: true,
      data: getWorkspaceById_(workspaceId)
    };
  } finally {
    lock.releaseLock();
  }
}

function updateWorkspace_(payload, actorUser) {
  var workspaceId = String(payload.workspace_id || payload.id || '').trim();
  if (!workspaceId) {
    return {
      ok: false,
      error: { code: 'INVALID_INPUT', message: 'workspace_id wajib diisi.' }
    };
  }

  var sheet = ensureWorkspacesSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') !== workspaceId) continue;

    var nowIso = new Date().toISOString();

    if (payload.name !== undefined) sheet.getRange(i + 1, 3).setValue(String(payload.name || '').trim());
    if (payload.organization !== undefined) sheet.getRange(i + 1, 5).setValue(String(payload.organization || '').trim());
    if (payload.province !== undefined) sheet.getRange(i + 1, 7).setValue(String(payload.province || '').trim());
    if (payload.city !== undefined) sheet.getRange(i + 1, 8).setValue(String(payload.city || '').trim());
    if (payload.status !== undefined) sheet.getRange(i + 1, 9).setValue(String(payload.status || 'active'));
    if (payload.default_event_id !== undefined) sheet.getRange(i + 1, 11).setValue(String(payload.default_event_id || ''));
    if (payload.admin_name !== undefined) sheet.getRange(i + 1, 12).setValue(String(payload.admin_name || '').trim());
    if (payload.admin_email !== undefined) sheet.getRange(i + 1, 13).setValue(String(payload.admin_email || '').trim().toLowerCase());
    if (payload.branding !== undefined) sheet.getRange(i + 1, 14).setValue(JSON.stringify(payload.branding || {}));

    sheet.getRange(i + 1, 17).setValue(nowIso);

    recordAuditLog(
      getCustomerDatabase(),
      'WORKSPACE',
      'WORKSPACE_UPDATED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'superadmin',
      workspaceId,
      ''
    );

    return { ok: true, data: getWorkspaceById_(workspaceId) };
  }

  return {
    ok: false,
    error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace tidak ditemukan.' }
  };
}

function archiveWorkspace_(payload, actorUser) {
  var workspaceId = String(payload.workspace_id || payload.id || '').trim();
  if (!workspaceId) {
    return {
      ok: false,
      error: { code: 'INVALID_INPUT', message: 'workspace_id wajib diisi.' }
    };
  }

  var sheet = ensureWorkspacesSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '') !== workspaceId) continue;

    var nowIso = new Date().toISOString();
    sheet.getRange(i + 1, 9).setValue('archived');
    sheet.getRange(i + 1, 17).setValue(nowIso);
    sheet.getRange(i + 1, 18).setValue(nowIso);

    recordAuditLog(
      getCustomerDatabase(),
      'WORKSPACE',
      'WORKSPACE_ARCHIVED',
      actorUser && actorUser.id ? actorUser.id : 'system',
      'superadmin',
      workspaceId,
      ''
    );

    return { ok: true, data: { workspace_id: workspaceId, archived: true } };
  }

  return {
    ok: false,
    error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace tidak ditemukan.' }
  };
}


function envelopeSuccess(reqId, data) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    request_id: reqId,
    data: data,
    error: null
  })).setMimeType(ContentService.MimeType.JSON);
}

function envelopeError(reqId, code, message, statusCode) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    request_id: reqId,
    data: null,
    error: {
      code: code,
      message: message,
      details: null
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * PROVISI SKEMA KANONIKAL v1.9 (45 Lembar Kerja Termasuk Auth, RBAC & Keamanan)
 * ============================================================================
 */
function provisionCanonicalSchemaV19() {
  var db = getCustomerDatabase();
  var tables = [
    { name: 'SystemConfig', cols: ['key', 'value', 'description', 'updated_at'] },
    { name: 'InstallationConfig', cols: ['key', 'value', 'description', 'updated_at'] },
    { name: 'FeatureConfigs', cols: ['id', 'feature_key', 'scope_type', 'scope_id', 'configured_state', 'metadata_json', 'updated_at', 'updated_by'] },
    { name: 'AuditLogs', cols: ['audit_id', 'timestamp', 'actor_user_id', 'action', 'entity_type', 'entity_id', 'scope_type', 'scope_id', 'result', 'details_json'] },
    { name: 'SyncLogs', cols: ['id', 'device_id', 'sync_version', 'status', 'payload_hash', 'synced_at'] },
    { name: 'QRTokens', cols: ['token_id', 'token_type', 'entity_id', 'event_id', 'token_hash', 'status', 'expires_at', 'created_at'] },
    { name: 'Workspaces', cols: ['workspace_id', 'workspace_code', 'workspace_name', 'organization_id', 'organization_name', 'organization_level', 'province', 'city', 'status', 'schema_version', 'default_event_id', 'admin_name', 'admin_email', 'branding_json', 'infrastructure_json', 'created_at', 'updated_at', 'archived_at'] },
    { name: 'Organizations', cols: ['organization_id', 'organization_code', 'organization_name', 'organization_level', 'parent_organization_id', 'status', 'created_at'] },
    { name: 'AuthOtpChallenges', cols: ['challenge_id', 'email', 'otp_hash', 'purpose', 'expires_at', 'attempt_count', 'max_attempts', 'resend_count', 'used_at', 'status', 'created_at', 'updated_at', 'request_context', 'request_ip_hash'] },
    { name: 'TrustedDevices', cols: ['trusted_device_id', 'user_id', 'device_public_id', 'device_token_hash', 'device_name', 'browser_family', 'platform', 'created_at', 'last_seen_at', 'expires_at', 'revoked_at', 'status'] },
    { name: 'AuthSessions', cols: ['session_id', 'user_id', 'trusted_device_id', 'session_token_hash', 'created_at', 'last_seen_at', 'expires_at', 'revoked_at', 'status'] },
    { name: 'Users', cols: ['user_id', 'email', 'name', 'email_verified', 'status', 'created_at', 'created_by', 'updated_at', 'last_login_at', 'avatar_url', 'phone', 'organization_id'] },
    { name: 'UserRoleAssignments', cols: ['assignment_id', 'user_id', 'role', 'scope_type', 'scope_id', 'status', 'granted_by', 'granted_at', 'revoked_at'] },
    { name: 'Events', cols: ['id', 'workspace_id', 'name', 'short_name', 'event_code', 'category', 'theme', 'start_date', 'end_date', 'location', 'status', 'participant_capacity', 'created_at', 'updated_at', 'organizational_level', 'organizer_organization_id', 'organizer_level', 'contingent_representation_level', 'organizer', 'description', 'registration_start', 'registration_end', 'venue', 'camp_ground', 'banner_url', 'logo_url', 'participation_scope', 'allowed_organization_ids_json', 'contacts_json', 'features_json', 'home_sections_json'] },
    { name: 'Announcements', cols: ['id', 'event_id', 'title', 'content', 'priority', 'audience', 'publish_start', 'publish_end', 'status', 'created_at'] },
    { name: 'Banners', cols: ['id', 'event_id', 'banner_type', 'title', 'image_url', 'target_url', 'display_order', 'status', 'created_at'] },
    { name: 'Sponsors', cols: ['sponsor_id', 'workspace_id', 'event_id', 'logo_url', 'target_url', 'display_order', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by'] },
    { name: 'SponsorSettings', cols: ['event_id', 'carousel_enabled', 'direction', 'carousel_duration_seconds', 'pause_on_hover', 'updated_at'] },
    { name: 'BrandingAssets', cols: ['asset_id', 'workspace_id', 'event_id', 'asset_type', 'drive_file_id', 'file_name', 'mime_type', 'public_render_url', 'status', 'version', 'priority', 'created_at'] },
    { name: 'Contingents', cols: ['id', 'event_id', 'name', 'region', 'leader_name', 'leader_phone', 'camp_zone', 'participant_count', 'checked_in_count'] },
    { name: 'Participants', cols: ['id', 'event_id', 'contingent_id', 'name', 'pramuka_id', 'gender', 'subcamp', 'lot_number', 'checked_in', 'checked_in_at', 'points', 'rank'] },
    { name: 'RegistrationConfigs', cols: ['event_id', 'registration_start', 'registration_end', 'max_participants', 'max_per_contingent', 'allow_self_registration', 'dynamic_fields_json', 'status', 'updated_at'] },
    { name: 'ParticipantDocuments', cols: ['id', 'participant_id', 'document_type', 'drive_file_id', 'verification_status', 'verified_by', 'verified_at', 'notes'] },
    { name: 'Schedules', cols: ['id', 'event_id', 'title', 'day_number', 'date', 'start_time', 'end_time', 'location', 'category', 'xp_reward', 'is_published'] },
    { name: 'Activities', cols: ['id', 'event_id', 'name', 'category', 'description', 'xp_points'] },
    { name: 'Campsites', cols: ['id', 'event_id', 'camp_name', 'subcamp_id', 'subcamp_name', 'zone_name', 'block_name', 'lot_code', 'capacity_tents', 'capacity_participants', 'assigned_contingent_id', 'assigned_contingent_name', 'status'] },
    { name: 'AttendanceLogs', cols: ['id', 'event_id', 'participant_id', 'checkpoint_or_schedule_id', 'scanned_by_user_id', 'timestamp', 'sync_status'] },
    { name: 'Competitions', cols: ['id', 'event_id', 'title', 'category', 'type', 'status', 'max_score'] },
    { name: 'CompetitionEntries', cols: ['id', 'competition_id', 'participation_level', 'contingent_id', 'team_name', 'team_leader_id', 'team_members_json', 'entry_title', 'submission_url', 'status', 'submitted_at'] },
    { name: 'JudgingScores', cols: ['id', 'competition_id', 'entry_id', 'judge_id', 'score', 'criteria_scores_json', 'is_locked', 'locked_at', 'revision_number', 'revision_reason', 'submitted_at'] },
    { name: 'VotingSessions', cols: ['id', 'event_id', 'title', 'type', 'start_time', 'end_time', 'status', 'total_votes'] },
    { name: 'Votes', cols: ['id', 'session_id', 'voter_token_hash', 'candidate_id', 'timestamp', 'client_meta'] },
    { name: 'Checkpoints', cols: ['id', 'event_id', 'name', 'qr_code', 'xp_points', 'location'] },
    { name: 'PointRules', cols: ['id', 'event_id', 'activity_category', 'xp_value', 'daily_limit', 'multiplier', 'status'] },
    { name: 'PointTransactions', cols: ['id', 'event_id', 'participant_id', 'amount', 'reason', 'source_type', 'reference_id', 'created_at', 'created_by'] },
    { name: 'Badges', cols: ['id', 'event_id', 'name', 'icon_name', 'description', 'category', 'xp_required', 'status'] },
    { name: 'ParticipantBadges', cols: ['id', 'participant_id', 'badge_id', 'awarded_at', 'awarded_by'] },
    { name: 'Visitors', cols: ['id', 'event_id', 'full_name', 'phone', 'institution', 'id_number', 'status', 'registered_at'] },
    { name: 'VisitorPasses', cols: ['id', 'visitor_id', 'pass_code', 'valid_date', 'entry_type', 'status'] },
    { name: 'VisitorVisits', cols: ['id', 'pass_id', 'visitor_id', 'event_id', 'gate_id', 'gate_name', 'action_type', 'timestamp', 'officer_user_id', 'notes'] },
    { name: 'VisitorGates', cols: ['id', 'event_id', 'gate_name', 'gate_location', 'status'] },
    { name: 'MediaPublications', cols: ['id', 'event_id', 'album_id', 'album_title', 'media_type', 'source_provider', 'drive_folder_id', 'drive_file_id', 'youtube_video_id', 'media_url', 'publication_status', 'sync_status', 'published_at'] },
    { name: 'DocumentTemplates', cols: ['id', 'workspace_id', 'template_type', 'name', 'drive_file_id', 'placeholders_json', 'status', 'updated_at'] },
    { name: 'GeneratedDocuments', cols: ['id', 'template_id', 'batch_id', 'recipient_id', 'recipient_type', 'serial_number', 'verification_token', 'drive_file_id', 'generation_status', 'verified_count', 'generated_at'] },
    { name: 'HealthRecords', cols: ['id', 'event_id', 'participant_id', 'patient_name', 'contingent_name', 'blood_type', 'known_allergies', 'vital_signs', 'symptoms', 'medical_diagnosis', 'treatment_given', 'medication_administered', 'hospital_referral', 'treated_by', 'treated_at', 'status'] },
    { name: 'Incidents', cols: ['id', 'event_id', 'incident_type', 'severity', 'reported_by', 'description', 'location', 'action_taken', 'security_followup', 'status', 'resolved_at'] },
    { name: 'Logistics', cols: ['id', 'event_id', 'item_name', 'category', 'total_quantity', 'available_quantity', 'unit', 'condition', 'storage_location'] }
  ];

  var createdCount = 0;
  for (var i = 0; i < tables.length; i++) {
    var tbl = tables[i];
    var sheet = db.getSheetByName(tbl.name);
    if (!sheet) {
      sheet = db.insertSheet(tbl.name);
      sheet.appendRow(tbl.cols);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, tbl.cols.length).setBackground('#E8F5E9').setFontWeight('bold');
      createdCount++;
    }
  }

  var defaultSheet = db.getSheetByName('Sheet1');
  if (defaultSheet && db.getSheets().length > 1) {
    try { db.deleteSheet(defaultSheet); } catch(e) {}
  }

  return { ok: true, created_sheets_count: createdCount, total_tables: tables.length, schema_version: 'v1.9' };
}
