/**
 * SETUP DATABASE Roti Bakar Borneo.
 *
 * 1. Salin file ini dan Code.gs ke SATU project Apps Script.
 * 2. Jalankan konfigurasiResourceSaya(), lalu setupDatabase().
 * 3. Jalankan pasangTriggerPassword() satu kali.
 * 4. Saat menambah user langsung di sheet Karyawan, ketik kata sandi biasa
 *    di kolom "password". Script otomatis mengisi "password_hash" dan
 *    langsung menghapus kata sandi biasa tersebut.
 */

const APP = {
  PROP_SHEET_ID: 'ROTI_BAKAR_SHEET_ID',
  PROP_API_KEY: 'ROTI_BAKAR_API_KEY',
  PROP_PASSWORD_SALT: 'ROTI_BAKAR_PASSWORD_SALT',
  PROP_PHOTO_FOLDER_ID: 'ROTI_BAKAR_PHOTO_FOLDER_ID',
  TIMEZONE: 'Asia/Jakarta',
  // Shift malam tetap milik hari sebelumnya hingga 04:59; shift baru dapat mulai pukul 05:00.
  SHIFT_CUTOFF_HOUR: 5
};

const TABLES = {
  // Kolom password hanya sebagai input sementara; trigger akan langsung mengosongkannya.
  // potongan_telat_per_menit dipertahankan hanya agar data lama tetap terbaca; gaji baru tidak memakainya.
  Karyawan: ['id_karyawan', 'nama', 'username', 'password_hash', 'role', 'id_cabang', 'aktif', 'dibuat_pada', 'password', 'tarif_per_jam', 'potongan_telat_per_menit', 'foto_profil_url'],
  Cabang: ['id_cabang', 'nama_cabang', 'latitude', 'longitude', 'radius_meter', 'aktif', 'dibuat_pada'],
  Shift: ['shift_id', 'id_cabang', 'id_karyawan', 'tanggal_operasional', 'jam_mulai', 'jam_selesai', 'status', 'lat_masuk', 'lng_masuk', 'lat_pulang', 'lng_pulang', 'foto_masuk_url', 'foto_pulang_url', 'dibuat_pada', 'diperbarui_pada'],
  LaporanShift: ['laporan_id', 'shift_id', 'id_cabang', 'id_karyawan', 'tanggal_operasional', 'jam_mulai', 'jam_selesai', 'roti_awal', 'roti_sisa', 'bahan_habis_json', 'pengeluaran', 'setor_uang', 'sisa_modal', 'catatan', 'dibuat_pada', 'roti_sisa_kemarin', 'roti_diantar', 'roti_rusak_bonus', 'penjualan_offline_roti', 'penjualan_luar_kasir_roti', 'selisih_stok'],
  OperasionalCabang: ['id_operasional', 'id_cabang', 'jam_buka', 'jam_tutup', 'toleransi_terlambat_menit', 'potongan_per_15_menit', 'aktif', 'diperbarui_pada'],
  RequestBahan: ['request_id', 'id_cabang', 'id_karyawan', 'tanggal_operasional', 'roti_sisa', 'request_json', 'catatan', 'status', 'dibuat_pada'],
  DeviceToken: ['token_id', 'id_karyawan', 'role', 'id_cabang', 'fcm_token', 'aktif', 'diperbarui_pada'],
  TransaksiKasir: ['transaksi_id', 'id_cabang', 'id_karyawan', 'tanggal_operasional', 'items_json', 'metode_bayar', 'total_bayar', 'total_roti', 'dibuat_pada'],
  Bon: ['bon_id', 'id_karyawan', 'id_cabang', 'nominal', 'catatan', 'status', 'dibuat_pada', 'diverifikasi_pada', 'catatan_admin', 'dibayar', 'sisa_bon'],
  // Master harga disiapkan sekarang. APK kasir tetap memakai katalog lokal sampai migrasi katalog dinyalakan.
  MenuKasir: ['menu_id', 'nama_menu', 'porsi', 'harga', 'satuan_roti', 'aktif', 'urutan', 'diperbarui_pada'],
  // Catatan manual Boss. id_cabang kosong berarti transaksi Pusat dan hanya masuk total Semua Outlet.
  Keuangan: ['keuangan_id', 'tanggal_operasional', 'id_cabang', 'jenis', 'kategori', 'nominal', 'catatan', 'dibuat_oleh', 'dibuat_pada']
};

function konfigurasiResourceSaya() {
  PropertiesService.getScriptProperties().setProperties({
    ROTI_BAKAR_SHEET_ID: '1ZenY0Q79stx5y8vcNQVICysSWtUZcSmerd65lRMX-F4',
    ROTI_BAKAR_PHOTO_FOLDER_ID: '1FzfOK7KjRNV0Ks-M9l6mcCcVJvC90h7p',
    ROTI_BAKAR_API_KEY: 'roti-bakar-borneo'
  }, false);
}

function setupDatabase() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheet = getOrSaveSpreadsheet_();
  Object.keys(TABLES).forEach(function(name) {
    createOrMigrateTable_(spreadsheet, name, TABLES[name]);
  });

  if (!props.getProperty(APP.PROP_API_KEY)) props.setProperty(APP.PROP_API_KEY, 'roti-bakar-borneo');
  if (!props.getProperty(APP.PROP_PASSWORD_SALT)) props.setProperty(APP.PROP_PASSWORD_SALT, Utilities.getUuid());
  if (!props.getProperty(APP.PROP_PHOTO_FOLDER_ID)) {
    props.setProperty(APP.PROP_PHOTO_FOLDER_ID, DriveApp.createFolder('Roti Bakar Borneo - Foto Presensi').getId());
  }

  seedData_(spreadsheet);
  refreshDropdowns();
  SpreadsheetApp.flush();
  Logger.log('Setup selesai untuk Spreadsheet ID: ' + spreadsheet.getId());
}

/**
 * Pulihkan folder foto bila folder lama terhapus, dipindah ke sampah, atau
 * akun pemilik Apps Script kehilangan akses. Tidak mengubah data Sheet/shift.
 * Jalankan fungsi ini dari editor Apps Script, lalu deploy ulang Web App.
 */
function pulihkanFolderFotoPresensi() {
  const folder = DriveApp.createFolder('Roti Bakar Borneo - Foto Presensi - ' + Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd_HHmmss'));
  PropertiesService.getScriptProperties().setProperty(APP.PROP_PHOTO_FOLDER_ID, folder.getId());
  Logger.log('Folder foto baru berhasil dibuat: ' + folder.getUrl());
  return folder.getUrl();
}

/** Mengembalikan folder yang valid; membuat baru otomatis bila ID lama tidak lagi dapat diakses. */
function folderFotoPresensi_() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty(APP.PROP_PHOTO_FOLDER_ID);
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); }
    catch (err) { Logger.log('Folder foto lama tidak tersedia, membuat folder baru: ' + err); }
  }
  const folder = DriveApp.createFolder('Roti Bakar Borneo - Foto Presensi - Pemulihan');
  props.setProperty(APP.PROP_PHOTO_FOLDER_ID, folder.getId());
  return folder;
}

function getOrSaveSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(APP.PROP_SHEET_ID);
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Jalankan konfigurasiResourceSaya() terlebih dahulu.');
  props.setProperty(APP.PROP_SHEET_ID, active.getId());
  return active;
}

/** Membuat sheet baru atau menambahkan kolom baru tanpa menghapus data lama. */
function createOrMigrateTable_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1C1C1E').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(String);
  const compatible = existing.every(function(header, index) { return headers[index] === header; });
  if (!compatible) throw new Error('Header sheet "' + name + '" berbeda. Jangan lanjutkan sebelum membuat backup dan menyamakan header.');
  if (existing.length < headers.length) {
    const missing = headers.slice(existing.length);
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, existing.length + 1, 1, missing.length).setBackground('#1C1C1E').setFontColor('#FFFFFF').setFontWeight('bold');
  }
}

function seedData_(spreadsheet) {
  const cabang = spreadsheet.getSheetByName('Cabang');
  if (cabang.getLastRow() === 1) cabang.appendRow(['CBG01', 'Outlet Utama', -6.200000, 106.816666, 100, true, new Date()]);

  const karyawan = spreadsheet.getSheetByName('Karyawan');
  if (karyawan.getLastRow() === 1) {
    // Akun awal: admin / password. Ubah sesudah berhasil login.
    appendObjectSetup_('Karyawan', {
      id_karyawan: 'ADM001', nama: 'Administrator', username: 'admin', password_hash: makePasswordHash_('password'),
      role: 'ADMIN', id_cabang: 'CBG01', aktif: true, dibuat_pada: new Date(), password: '',
      tarif_per_jam: 0, potongan_telat_per_menit: 0
    });
  }
  seedMenuKasir_();
}

/** Mengisi master katalog sekali saja. Harga ini belum dipakai APK kasir agar operasional lama tidak berubah. */
function seedMenuKasir_() {
  if (getOrSaveSpreadsheet_().getSheetByName('MenuKasir').getLastRow() > 1) return;
  const half = [['Mentega Susu',6000],['Stroberi',7000],['Blueberry',7000],['Nanas',7000],['Melon',7000],['Coklat',8000],['Durian',8000],['Kacang',9000],['Oreo',9000],['Keju',10000],['Vanilla',10000],['Tiramisu',11000],['Greentea',11000],['Taro',11000],['Chococruncy',12000],['Coklat Keju Mix',11000],['Chococruncy Keju Mix',13000]];
  const full = [['Mentega Saja',8000],['Mentega Susu',10000],['Blueberry Strawberry',12000],['Blueberry Nanas',12000],['Strawberry Nanas',12000],['Melon Strawberry',12000],['Coklat Selai Buah (pilih rasa)',14000],['Coklat Full',15000],['Coklat Kacang Pisah',15000],['Coklat Keju Pisah',17000],['Coklat Keju Campur',19000],['Keju Full',18000],['Keju Greentea',20000],['Kacang Oreo',18000],['Durian Full',16000],['Vanilla Full',16000],['Tiramisu Full',21000],['Greentea Full',21000],['Taro Full',21000],['Chococruncy Full',22000],['Oreo Keju Campur',20000],['Greentea Keju Campur',22000],['Taro Keju Campur',22000],['Chococruncy Keju Campur',25000]];
  let order = 1;
  half.forEach(function(item) { appendObjectSetup_('MenuKasir', { menu_id: 'SP-' + String(order).padStart(3, '0'), nama_menu: item[0], porsi: 'SEPARUH', harga: item[1], satuan_roti: 0.5, aktif: true, urutan: order++, diperbarui_pada: new Date() }); });
  full.forEach(function(item) { appendObjectSetup_('MenuKasir', { menu_id: 'UT-' + String(order).padStart(3, '0'), nama_menu: item[0], porsi: 'UTUH', harga: item[1], satuan_roti: 1, aktif: true, urutan: order++, diperbarui_pada: new Date() }); });
}

function refreshDropdowns() {
  const spreadsheet = getOrSaveSpreadsheet_();
  const cabang = spreadsheet.getSheetByName('Cabang');
  const karyawan = spreadsheet.getSheetByName('Karyawan');
  // Daftar eksplisit mencegah ID cabang lama yang sudah terhapus tetap muncul di dropdown.
  const cabangIds = cabang.getRange(2, 1, Math.max(cabang.getLastRow() - 1, 1), 1).getDisplayValues().flat().map(String).map(function(v) { return v.trim(); }).filter(Boolean);
  const cabangRule = SpreadsheetApp.newDataValidation().requireValueInList(cabangIds.length ? cabangIds : ['-'], true).setAllowInvalid(false).setHelpText('Pilih ID cabang.').build();
  const karyawanRule = SpreadsheetApp.newDataValidation().requireValueInRange(karyawan.getRange('A2:A'), true).setAllowInvalid(false).setHelpText('Pilih ID karyawan.').build();
  const roleRule = SpreadsheetApp.newDataValidation().requireValueInList(['ADMIN', 'KARYAWAN'], true).setAllowInvalid(false).build();
  const hariRule = SpreadsheetApp.newDataValidation().requireValueInList(['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'], true).setAllowInvalid(false).build();

  setDropdown_('Karyawan', 'id_cabang', cabangRule);
  setDropdown_('Karyawan', 'role', roleRule);
  setDropdown_('Shift', 'id_cabang', cabangRule);
  setDropdown_('Shift', 'id_karyawan', karyawanRule);
  setDropdown_('LaporanShift', 'id_cabang', cabangRule);
  setDropdown_('LaporanShift', 'id_karyawan', karyawanRule);
  setDropdown_('OperasionalCabang', 'id_cabang', cabangRule);
  setDropdown_('TransaksiKasir', 'id_cabang', cabangRule);
  setDropdown_('TransaksiKasir', 'id_karyawan', karyawanRule);
  setDropdown_('Bon', 'id_cabang', cabangRule);
  setDropdown_('Bon', 'id_karyawan', karyawanRule);
  setCheckbox_('Karyawan', 'aktif');
  setCheckbox_('Cabang', 'aktif');
  setCheckbox_('OperasionalCabang', 'aktif');
}

/**
 * RESET GO-LIVE: buat backup penuh dulu, lalu hapus seluruh data transaksi dan master.
 * Sheet aktif dipertahankan dengan header kosong. Hanya akun admin awal yang dibuat kembali.
 */
function resetDatabaseUntukGoLive() {
  const ui = SpreadsheetApp.getUi();
  const choice = ui.alert(
    'Reset database untuk go-live?',
    'Semua cabang, karyawan, shift, laporan, request, dan token perangkat akan dihapus. Backup otomatis akan dibuat di Google Drive. Lanjutkan?',
    ui.ButtonSet.YES_NO
  );
  if (choice !== ui.Button.YES) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Database sedang digunakan. Coba lagi beberapa saat lagi.');
  try {
    const spreadsheet = getOrSaveSpreadsheet_();
    const backup = spreadsheet.copy('BACKUP sebelum go-live - ' + Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH.mm'));

    // Sheet lama tidak dipakai lagi oleh aplikasi baru.
    ['JamOperasional', 'Pengeluaran'].forEach(function(name) {
      const sheet = spreadsheet.getSheetByName(name);
      if (sheet) spreadsheet.deleteSheet(sheet);
    });

    Object.keys(TABLES).forEach(function(name) {
      resetTableUntukGoLive_(spreadsheet, name, TABLES[name]);
    });

    // Akun masuk awal agar admin dapat mengisi master data baru dari APK/Sheet.
    appendObjectSetup_('Karyawan', {
      id_karyawan: 'ADM001', nama: 'Administrator', username: 'admin', password_hash: makePasswordHash_('password'),
      role: 'ADMIN', id_cabang: 'CBG01', aktif: true, dibuat_pada: new Date(), password: '',
      tarif_per_jam: 0, potongan_telat_per_menit: 0, foto_profil_url: ''
    });
    refreshDropdowns();
    SpreadsheetApp.flush();
    ui.alert('Reset selesai. Backup dibuat: ' + backup.getUrl() + '\n\nLogin awal: admin / password. Segera ganti password setelah data master selesai diisi.');
  } finally {
    lock.releaseLock();
  }
}

/** Dipakai hanya oleh reset go-live: struktur lama boleh ditimpa karena backup sudah dibuat. */
function resetTableUntukGoLive_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1C1C1E').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);
}

function setDropdown_(sheetName, header, rule) {
  const sheet = getOrSaveSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const column = headers.indexOf(header) + 1;
  if (column < 1) throw new Error('Kolom ' + header + ' tidak ditemukan pada ' + sheetName);
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function setCheckbox_(sheetName, header) {
  const sheet = getOrSaveSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const column = headers.indexOf(header) + 1;
  if (column < 1) throw new Error('Kolom ' + header + ' tidak ditemukan pada ' + sheetName);
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).insertCheckboxes();
}

/** Pasang trigger installable agar proses hash mempunyai izin Script Properties. */
function pasangTriggerPassword() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onEditKaryawan') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onEditKaryawan').forSpreadsheet(getOrSaveSpreadsheet_()).onEdit().create();
}

/** Jangan jalankan manual; dipanggil otomatis ketika sel password diubah. */
function onEditKaryawan(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  // Saat ID cabang ditambah/diubah langsung di Sheet, segarkan seluruh dropdown cabang.
  if (sheet.getName() === 'Cabang' && e.range.getRow() > 1 && e.range.getColumn() <= 1 && e.range.getLastColumn() >= 1) {
    refreshDropdowns();
    return;
  }
  if (sheet.getName() !== 'Karyawan' || e.range.getRow() === 1) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const passwordColumn = headers.indexOf('password') + 1;
  const hashColumn = headers.indexOf('password_hash') + 1;
  if (passwordColumn < 1 || hashColumn < 1) return;
  if (e.range.getColumn() > passwordColumn || e.range.getLastColumn() < passwordColumn) return;

  const passwordCell = sheet.getRange(e.range.getRow(), passwordColumn);
  const password = String(passwordCell.getValue() || '');
  if (!password) return;
  if (password.length < 8) {
    passwordCell.setNote('Password minimal 8 karakter.');
    return;
  }
  sheet.getRange(e.range.getRow(), hashColumn).setValue(makePasswordHash_(password));
  passwordCell.clearContent();
  passwordCell.setNote('Password berhasil di-hash dan dihapus dari sheet.');
}

/** Tambah karyawan tanpa menyimpan password asli ke Google Sheet. */
function tambahKaryawan(idKaryawan, nama, username, password, role, idCabang) {
  if (!idKaryawan || !nama || !username || !password || !role || !idCabang) throw new Error('Semua data wajib diisi.');
  if (String(password).length < 8) throw new Error('Password minimal 8 karakter.');
  const roleNormal = String(role).toUpperCase().trim();
  if (['ADMIN', 'KARYAWAN'].indexOf(roleNormal) < 0) throw new Error('Role harus ADMIN atau KARYAWAN.');
  const rows = getOrSaveSpreadsheet_().getSheetByName('Karyawan').getDataRange().getValues();
  if (rows.slice(1).some(function(row) { return String(row[0]).trim() === String(idKaryawan).trim() || String(row[2]).trim() === String(username).trim(); })) throw new Error('ID karyawan atau username sudah digunakan.');
  appendObjectSetup_('Karyawan', {
    id_karyawan: idKaryawan, nama: nama, username: username, password_hash: makePasswordHash_(password),
    role: roleNormal, id_cabang: idCabang, aktif: true, dibuat_pada: new Date(), password: '',
    tarif_per_jam: 0, potongan_telat_per_menit: 0
  });
  refreshDropdowns();
}

function resetPassword(username, passwordBaru) {
  if (!username || String(passwordBaru).length < 8) throw new Error('Password baru minimal 8 karakter.');
  const sheet = getOrSaveSpreadsheet_().getSheetByName('Karyawan');
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  const rowIndex = values.findIndex(function(row) { return String(row[headers.indexOf('username')]).trim() === String(username).trim(); });
  if (rowIndex < 0) throw new Error('Username tidak ditemukan.');
  sheet.getRange(rowIndex + 2, headers.indexOf('password_hash') + 1).setValue(makePasswordHash_(passwordBaru));
  sheet.getRange(rowIndex + 2, headers.indexOf('password') + 1).clearContent();
}

function appendObjectSetup_(sheetName, object) {
  const sheet = getOrSaveSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map(function(header) { return object[header] === undefined ? '' : object[header]; }));
}

/** Algoritmanya harus sama dengan hashPassword_ di Code.gs. */
function makePasswordHash_(password) {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty(APP.PROP_PASSWORD_SALT);
  if (!salt) {
    salt = Utilities.getUuid();
    props.setProperty(APP.PROP_PASSWORD_SALT, salt);
  }
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + String(password)));
}
