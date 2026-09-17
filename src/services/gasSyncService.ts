import { Participant, Leader, Visitor, ScheduleItem, DocumentationItem, PushNotification, VerificationLog, GASConfig } from '../types';

export const LOCAL_STORAGE_KEYS = {
  PARTICIPANTS: 'jambore_participants_v1',
  LEADERS: 'jambore_leaders_v1',
  SCHEDULES: 'jambore_schedules_v1',
  DOCS: 'jambore_docs_v1',
  BANNERS: 'jambore_banners_v1',
  NOTIFS: 'jambore_notifs_v1',
  LOGS: 'jambore_verification_logs_v1',
  VISITORS: 'jambore_visitors_v1',
  SPONSORS: 'jambore_sponsors_v1',
  HOME_CONTENT: 'jambore_home_content_v1',
  CURRENT_USER: 'jambore_current_user_v1',
  AUTH_ACCOUNTS: 'jambore_accounts_v1',
  WELCOME_SEEN: 'jambore_welcome_seen_v1',
  GAS_CONFIG: 'jambore_gas_config_v1',
  ACTIVITY_POSTS: 'jambore_activity_posts_v1',
};

export const DEFAULT_GAS_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (GAS) - BACKEND JAMBORE PENGGALANG PRAMUKA DIGITAL
 * =========================================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru (beri nama "Database Jambore Penggalang Pramuka").
 * 2. Buat Sheet/Tab berikut (Huruf besar/kecil sesuai):
 *    - Peserta (Header: ID_Registrasi | Nama_Lengkap | Panggilan | Pangkalan | Kwarcab | Regu | Gender | Gol_Darah | Kontak_Darurat | Status_CheckIn | Waktu_CheckIn | Tenda | Total_Poin | Pos_Selesai)
 *    - Pembina (Header: ID_Registrasi | Nama_Lengkap | Pangkalan | Kwarcab | No_HP | Email | Regu_Binaan | Jabatan | Status_CheckIn | Waktu_CheckIn)
 *    - Pengunjung (Header: ID_Tiket | Nama_Lengkap | No_HP | Instansi_Asal | Kategori | Keperluan | Tanggal_Kunjungan | Status_Masuk | Waktu_Masuk)
 *    - Pos_Kegiatan (Header: ID_Pos | Kode_Pos | Nama_Pos | Kategori | Poin | Lokasi | PIC | Selesai_Count)
 *    - Presensi_Log (Header: Timestamp | ID_Reg | Nama | Tipe | Organisasi | Status | Scanner_Device | Catatan)
 *    - Poin_Log (Header: Timestamp | ID_Peserta | Nama_Peserta | Kode_Pos | Nama_Pos | Poin_Didapat | Total_Poin_Baru)
 * 3. Klik menu: Ekstensi > Apps Script.
 * 4. Hapus semua kode yang ada, lalu Paste seluruh kode ini.
 * 5. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 7. Klik Terapkan, beri izin akun Google Anda, lalu SALIN URL APLIKASI WEB (akhiran /exec).
 * 8. Tempelkan URL tersebut ke dalam menu "Integrasi GAS" di aplikasi ini!
 * =========================================================================
 */

function doGet(e) {
  var action = e.parameter.action || 'getAll';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getAll') {
    var result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      participants: getSheetDataAsObjects(ss.getSheetByName('Peserta')),
      leaders: getSheetDataAsObjects(ss.getSheetByName('Pembina')),
      visitors: getSheetDataAsObjects(ss.getSheetByName('Pengunjung')),
      activityPosts: getSheetDataAsObjects(ss.getSheetByName('Pos_Kegiatan')),
      schedules: getSheetDataAsObjects(ss.getSheetByName('Jadwal')),
      logs: getSheetDataAsObjects(ss.getSheetByName('Presensi_Log'))
    };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'GAS Jambore Penggalang Active' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'checkIn';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'registerVisitor') {
      var visitorSheet = ss.getSheetByName('Pengunjung');
      if (!visitorSheet) {
        visitorSheet = ss.insertSheet('Pengunjung');
        visitorSheet.appendRow(['ID_Tiket', 'Nama_Lengkap', 'No_HP', 'Instansi_Asal', 'Kategori', 'Keperluan', 'Tanggal_Kunjungan', 'Status_Masuk', 'Waktu_Masuk']);
      }
      visitorSheet.appendRow([
        data.ticketNumber || '',
        data.fullName || '',
        data.phoneNumber || '',
        data.institution || '',
        data.category || 'Tamu / Umum',
        data.purpose || '',
        data.visitDate || '',
        data.checkInStatus || false,
        data.checkInTime || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Pengunjung berhasil didaftarkan ke Google Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'checkIn') {
      var logSheet = ss.getSheetByName('Presensi_Log');
      if (!logSheet) {
        logSheet = ss.insertSheet('Presensi_Log');
        logSheet.appendRow(['Timestamp', 'ID_Reg', 'Nama', 'Tipe', 'Organisasi', 'Status', 'Scanner_Device', 'Catatan']);
      }
      
      logSheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        data.regId || '',
        data.name || '',
        data.type || '',
        data.organization || '',
        data.status || 'valid',
        data.scannerDevice || 'App Scanner',
        data.notes || ''
      ]);
      
      // Update check-in status di sheet terkait
      if (data.type === 'Peserta') {
        updateCheckInStatus(ss.getSheetByName('Peserta'), data.regId, 10, 11);
      } else if (data.type === 'Pembina') {
        updateCheckInStatus(ss.getSheetByName('Pembina'), data.regId, 9, 10);
      } else if (data.type === 'Pengunjung') {
        updateCheckInStatus(ss.getSheetByName('Pengunjung'), data.regId, 8, 9);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Presensi berhasil dicatat ke Google Sheets!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'awardPoints') {
      var pointsLogSheet = ss.getSheetByName('Poin_Log');
      if (!pointsLogSheet) {
        pointsLogSheet = ss.insertSheet('Poin_Log');
        pointsLogSheet.appendRow(['Timestamp', 'ID_Peserta', 'Nama_Peserta', 'Kode_Pos', 'Nama_Pos', 'Poin_Didapat', 'Total_Poin_Baru']);
      }
      pointsLogSheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        data.participantId || '',
        data.participantName || '',
        data.postCode || '',
        data.postTitle || '',
        Number(data.points || 0),
        Number(data.totalPoints || 0)
      ]);

      var pesertaSheet = ss.getSheetByName('Peserta');
      if (pesertaSheet) {
        var pData = pesertaSheet.getDataRange().getValues();
        for (var pi = 1; pi < pData.length; pi++) {
          if (pData[pi][0] == data.participantId) {
            var currentPoints = Number(pData[pi][12]) || 0;
            var newPoints = currentPoints + Number(data.points || 0);
            pesertaSheet.getRange(pi + 1, 13).setValue(newPoints);
            var completed = String(pData[pi][13] || '');
            var newCompleted = completed ? completed + ', ' + (data.postCode || data.postTitle) : (data.postCode || data.postTitle);
            pesertaSheet.getRange(pi + 1, 14).setValue(newCompleted);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Poin berhasil dicatat dan diakumulasikan ke Google Sheets!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Aksi tidak dikenali'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateCheckInStatus(sheet, regId, statusCol, timeCol) {
  if (!sheet) return;
  var colStatus = statusCol || 10;
  var colTime = timeCol || 11;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == regId) {
      sheet.getRange(i + 1, colStatus).setValue(true);
      sheet.getRange(i + 1, colTime).setValue(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
      break;
    }
  }
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj);
  }
  return data;
}
`;

export function getStoredGASConfig(): GASConfig {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.GAS_CONFIG);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    gasWebAppUrl: '',
    sheetId: '',
    autoSync: false,
    lastSyncTime: null,
  };
}

export function saveStoredGASConfig(config: GASConfig) {
  localStorage.setItem(LOCAL_STORAGE_KEYS.GAS_CONFIG, JSON.stringify(config));
}

export async function syncWithGAS(gasUrl: string) {
  if (!gasUrl || !gasUrl.trim()) {
    throw new Error('URL Google Apps Script belum diisi');
  }

  const cleanUrl = gasUrl.trim();
  const endpoint = cleanUrl.includes('?') ? `${cleanUrl}&action=getAll` : `${cleanUrl}?action=getAll`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Koneksi ke GAS gagal (Status ${response.status})`);
  }

  const data = await response.json();
  return data;
}

export async function postCheckInToGAS(gasUrl: string, log: VerificationLog) {
  if (!gasUrl || !gasUrl.trim()) {
    return false;
  }

  try {
    const cleanUrl = gasUrl.trim();
    // Use no-cors or standard fetch for GAS Web Apps
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkIn',
        ...log,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Gagal sinkron log presensi ke GAS:', err);
    return false;
  }
}

export async function postVisitorToGAS(gasUrl: string, visitor: Visitor) {
  if (!gasUrl || !gasUrl.trim()) {
    return false;
  }

  try {
    const cleanUrl = gasUrl.trim();
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'registerVisitor',
        ...visitor,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Gagal mendaftarkan pengunjung ke GAS:', err);
    return false;
  }
}

export async function postAwardPointsToGAS(
  gasUrl: string,
  data: {
    participantId: string;
    participantName: string;
    postCode?: string;
    postTitle: string;
    points: number;
    totalPoints: number;
  }
) {
  if (!gasUrl || !gasUrl.trim()) {
    return false;
  }

  try {
    const cleanUrl = gasUrl.trim();
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'awardPoints',
        ...data,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Gagal kirim log perolehan poin ke GAS:', err);
    return false;
  }
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
