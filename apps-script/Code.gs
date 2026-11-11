/** Endpoint Web App. Deploy: Execute as Me, Who has access: Anyone. */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    assertApiKey_(p.api_key);
    switch (p.action) {
      case 'list_cabang': return json_({ success: true, data: getSheet_('Cabang').getDataRange().getDisplayValues() });
      case 'master_cabang': return json_({ success: true, data: masterCabang_() });
      case 'dashboard_cabang': return json_({ success: true, data: dashboardCabang_() });
      case 'performa_karyawan': return json_({ success: true, data: performaKaryawan_(p.id_karyawan) });
      case 'payroll': return json_({ success: true, data: payroll_(p.tanggal_mulai, p.tanggal_selesai) });
      case 'payroll_detail': return json_({ success: true, data: payrollDetail_(p.id_karyawan, p.tanggal_mulai, p.tanggal_selesai) });
      case 'riwayat_presensi': return json_({ success: true, data: riwayat_(p.tanggal_mulai, p.tanggal_selesai) });
      case 'laporan_shift': return json_({ success: true, data: laporanCabang_(p.id_cabang) });
      case 'laporan_context': return json_({ success: true, data: laporanContext_(p.id_karyawan, p.id_cabang) });
      case 'bon_saya': return json_({ success: true, data: bonSaya_(p.id_karyawan, p.id_cabang) });
      case 'bon_admin': return json_({ success: true, data: bonAdmin_() });
      case 'transaksi_kasir_admin': return json_({ success: true, data: transaksiKasirAdmin_(p.tanggal_operasional) });
      case 'riwayat_laporan_shift': return json_({ success: true, data: riwayatLaporanShift_(p.tanggal_mulai, p.tanggal_selesai, p.id_cabang) });
      case 'bonus': return json_({ success: true, data: bonus_(p.tanggal_mulai, p.tanggal_selesai) });
      case 'keuangan': return json_({ success: true, data: keuangan_(p.tanggal_mulai, p.tanggal_selesai, p.id_cabang) });
      case 'dashboard_analytics': return json_({ success: true, data: dashboardAnalytics_(p.tanggal_mulai, p.tanggal_selesai) });
      default: return json_({ success: false, message: 'Action GET tidak dikenal.' });
    }
  } catch (err) {
    return json_({ success: false, message: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    assertApiKey_(body.api_key);
    switch (body.action) {
      case 'login': return json_(login_(body));
      case 'upload_foto_profil': return json_(uploadFotoProfil_(body));
      case 'absen_masuk': return json_(absenMasuk_(body));
      case 'absen_pulang': return json_(absenPulang_(body));
      case 'simpan_laporan_shift': return json_(simpanLaporanShift_(body));
      case 'simpan_transaksi_kasir': return json_(simpanTransaksiKasir_(body));
      case 'ajukan_bon': return json_(ajukanBon_(body));
      case 'verifikasi_bon': return json_(verifikasiBon_(body));
      case 'simpan_keuangan': return json_(simpanKeuangan_(body));
      case 'tambah_karyawan': return json_(tambahKaryawanApi_(body));
      case 'tambah_cabang': return json_(tambahCabangApi_(body));
      case 'daftar_token_perangkat': return json_(daftarTokenPerangkat_(body));
      default: return json_({ success: false, message: 'Action POST tidak dikenal.' });
    }
  } catch (err) {
    return json_({ success: false, message: String(err.message || err) });
  }
}

function login_(body) {
  const user = String(body.username || '').trim();
  const password = String(body.password || '');
  const daftarKaryawan = readTable_('Karyawan');
  let karyawan = null;
  for (let i = 0; i < daftarKaryawan.length; i++) {
    const calon = daftarKaryawan[i];
    if (text_(calon.username) === user && bool_(calon.aktif)) {
      karyawan = calon;
      break;
    }
  }
  if (!karyawan || text_(karyawan.password_hash) !== hashPassword_(password)) {
    return { success: false, message: 'Username atau kata sandi salah.' };
  }
  return { success: true, message: 'Login berhasil.', data: pick_(karyawan, ['id_karyawan', 'nama', 'role', 'id_cabang', 'foto_profil_url']) };
}

function uploadFotoProfil_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  if (!body.foto_base64) throw new Error('Foto profil wajib diisi.');
  const url = savePhoto_(body.foto_base64, 'profil_' + text_(user.id_karyawan));
  const table = readTableWithRows_('Karyawan');
  const row = table.rows.find(k => normalized_(k.id_karyawan) === normalized_(user.id_karyawan));
  const col = table.headers.indexOf('foto_profil_url') + 1;
  if (col < 1) throw new Error('Kolom foto_profil_url belum ada. Jalankan setupDatabase().');
  table.sheet.getRange(row._row, col).setValue(url);
  return { success: true, message: 'Foto profil berhasil diperbarui.', data: { foto_profil_url: url } };
}

function absenMasuk_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const cabang = validCabang_(body.id_cabang);
  validateLocation_(body, cabang);
  const shifts = readTable_('Shift');
  const cabangSudahBuka = shifts.some(s => normalized_(s.id_cabang) === normalized_(cabang.id_cabang) && normalized_(s.status) === 'BUKA');
  if (shifts.some(s => text_(s.id_karyawan) === text_(user.id_karyawan) && text_(s.status) === 'BUKA')) {
    return { success: false, message: 'Anda masih memiliki shift yang belum ditutup.' };
  }
  const now = new Date();
  // Shift malam tetap memakai tanggal operasional sebelumnya sampai pukul 04:59.
  if (sebelumJamTutup_(now, cabang.id_cabang)) {
    return { success: false, message: 'Shift berikutnya baru dapat dimulai setelah jam tutup cabang.' };
  }
  appendObject_('Shift', {
    shift_id: Utilities.getUuid(), id_cabang: cabang.id_cabang, id_karyawan: user.id_karyawan,
    tanggal_operasional: operationalDate_(now, cabang.id_cabang), jam_mulai: time_(now), jam_selesai: '', status: 'BUKA',
    lat_masuk: Number(body.lat), lng_masuk: Number(body.lng), lat_pulang: '', lng_pulang: '',
    foto_masuk_url: savePhoto_(body.foto_base64, 'masuk'), foto_pulang_url: '', dibuat_pada: now, diperbarui_pada: now
  });
  if (!cabangSudahBuka) kirimNotifikasiRole_(['ADMIN', 'KARYAWAN'], cabang.id_cabang, 'Outlet dibuka', cabang.nama_cabang + ' telah dibuka oleh ' + user.nama + '.', { tipe: 'OUTLET_BUKA', id_cabang: text_(cabang.id_cabang) });
  return { success: true, message: 'Absen masuk berhasil dicatat.' };
}

function absenPulang_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const cabang = validCabang_(body.id_cabang);
  validateLocation_(body, cabang);
  const table = readTableWithRows_('Shift');
  const shift = table.rows.filter(s => text_(s.id_karyawan) === text_(user.id_karyawan) && text_(s.status) === 'BUKA').pop();
  if (!shift) return { success: false, message: 'Tidak ditemukan shift aktif untuk absen pulang.' };
  const now = new Date();
  const values = [time_(now), 'TUTUP_SELESAI', Number(body.lat), Number(body.lng), savePhoto_(body.foto_base64, 'pulang'), now];
  const cols = ['jam_selesai', 'status', 'lat_pulang', 'lng_pulang', 'foto_pulang_url', 'diperbarui_pada'];
  cols.forEach((name, i) => table.sheet.getRange(shift._row, table.headers.indexOf(name) + 1).setValue(values[i]));
  const masihBuka = readTable_('Shift').some(s => normalized_(s.id_cabang) === normalized_(cabang.id_cabang) && normalized_(s.status) === 'BUKA');
  if (!masihBuka) kirimNotifikasiRole_(['ADMIN', 'KARYAWAN'], cabang.id_cabang, 'Outlet ditutup', cabang.nama_cabang + ' telah menutup shift.', { tipe: 'OUTLET_TUTUP', id_cabang: text_(cabang.id_cabang) });
  return { success: true, message: 'Absen pulang berhasil. Silakan isi laporan shift.' };
}

function simpanLaporanShift_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const shift = readTable_('Shift').filter(s =>
    text_(s.id_karyawan) === text_(user.id_karyawan) && text_(s.id_cabang) === text_(user.id_cabang) &&
    ['BUKA', 'TUTUP_SELESAI'].indexOf(normalized_(s.status)) >= 0
  ).pop();
  if (!shift) return { success: false, message: 'Mulai shift terlebih dahulu sebelum mengirim laporan.' };
  const rotiSisaKemarin = sisaRotiTerakhir_(user.id_cabang, shift.tanggal_operasional);
  const rotiDiantar = int_(body.roti_diantar);
  const rotiAwal = rotiSisaKemarin + rotiDiantar;
  const rotiSisa = int_(body.roti_sisa);
  const rotiRusakBonus = int_(body.roti_rusak_bonus);
  if (rotiAwal < 0 || rotiSisa < 0 || rotiSisa > rotiAwal) throw new Error('Data roti tidak valid.');
  const penjualanOffline = totalRotiKasir_(user.id_cabang, shift.tanggal_operasional);
  const terpakaiFisik = Math.max(0, rotiAwal - rotiSisa);
  const luarKasir = Math.max(0, terpakaiFisik - penjualanOffline - rotiRusakBonus);
  const selisih = round_(terpakaiFisik - penjualanOffline - rotiRusakBonus - luarKasir);
  const existing = readTableWithRows_('LaporanShift').rows.find(r => text_(r.shift_id) === text_(shift.shift_id));
  const reportData = {
    laporan_id: existing ? existing.laporan_id : Utilities.getUuid(), shift_id: shift.shift_id, id_cabang: user.id_cabang, id_karyawan: user.id_karyawan,
    tanggal_operasional: shift.tanggal_operasional, jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai,
    roti_awal: rotiAwal, roti_sisa: rotiSisa, bahan_habis_json: '[]',
    roti_sisa_kemarin: rotiSisaKemarin, roti_diantar: rotiDiantar, roti_rusak_bonus: rotiRusakBonus,
    penjualan_offline_roti: penjualanOffline, penjualan_luar_kasir_roti: luarKasir, selisih_stok: selisih,
    pengeluaran: money_(body.pengeluaran), setor_uang: money_(body.setor_uang), sisa_modal: money_(body.sisa_modal),
    catatan: String(body.catatan || '').trim(), dibuat_pada: existing ? existing.dibuat_pada : new Date()
  };
  if (existing) {
    const table = readTableWithRows_('LaporanShift');
    table.headers.forEach((header, index) => { if (reportData[header] !== undefined) table.sheet.getRange(existing._row, index + 1).setValue(reportData[header]); });
    return { success: true, message: 'Laporan shift berhasil diperbarui.' };
  }
  appendObject_('LaporanShift', {
    laporan_id: reportData.laporan_id, shift_id: reportData.shift_id, id_cabang: reportData.id_cabang, id_karyawan: reportData.id_karyawan,
    tanggal_operasional: reportData.tanggal_operasional, jam_mulai: reportData.jam_mulai, jam_selesai: reportData.jam_selesai,
    roti_awal: reportData.roti_awal, roti_sisa: reportData.roti_sisa, bahan_habis_json: reportData.bahan_habis_json,
    pengeluaran: reportData.pengeluaran, setor_uang: reportData.setor_uang, sisa_modal: reportData.sisa_modal,
    catatan: reportData.catatan, dibuat_pada: reportData.dibuat_pada,
    roti_sisa_kemarin: reportData.roti_sisa_kemarin, roti_diantar: reportData.roti_diantar, roti_rusak_bonus: reportData.roti_rusak_bonus,
    penjualan_offline_roti: reportData.penjualan_offline_roti, penjualan_luar_kasir_roti: reportData.penjualan_luar_kasir_roti, selisih_stok: reportData.selisih_stok
  });
  return { success: true, message: 'Laporan shift berhasil dikirim.' };
}

/** Konteks stok untuk layar laporan; angka sisa kemarin tidak dapat diedit karyawan. */
function laporanContext_(idKaryawan, idCabang) {
  const user = validKaryawan_(idKaryawan, idCabang);
  assertRole_(user, ['KARYAWAN']);
  const shift = readTable_('Shift').filter(s => normalized_(s.id_karyawan) === normalized_(user.id_karyawan) && normalized_(s.status) === 'BUKA').pop();
  const date = shift ? shift.tanggal_operasional : operationalDate_(new Date(), user.id_cabang);
  return { roti_sisa_kemarin: sisaRotiTerakhir_(user.id_cabang, date), penjualan_offline_roti: totalRotiKasir_(user.id_cabang, date) };
}

function sisaRotiTerakhir_(idCabang, sebelumTanggal) {
  const candidates = readTable_('LaporanShift').filter(r => normalized_(r.id_cabang) === normalized_(idCabang) && (!sebelumTanggal || dateKey_(r.tanggal_operasional) < dateKey_(sebelumTanggal)));
  candidates.sort((a, b) => dateKey_(a.tanggal_operasional).localeCompare(dateKey_(b.tanggal_operasional)) || text_(a.dibuat_pada).localeCompare(text_(b.dibuat_pada)));
  return candidates.length ? int_(candidates[candidates.length - 1].roti_sisa) : 0;
}

function totalRotiKasir_(idCabang, tanggal) {
  return round_(readTable_('TransaksiKasir').filter(r => normalized_(r.id_cabang) === normalized_(idCabang) && dateKey_(r.tanggal_operasional) === dateKey_(tanggal)).reduce((sum, r) => sum + Number(r.total_roti || 0), 0));
}

function simpanTransaksiKasir_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const items = Array.isArray(body.items) ? body.items.filter(item => item && text_(item.nama).trim() && Number(item.qty) > 0) : [];
  if (!items.length) throw new Error('Keranjang kasir masih kosong.');
  const metode = normalized_(body.metode_bayar);
  if (['CASH', 'QRIS'].indexOf(metode) < 0) throw new Error('Metode pembayaran harus CASH atau QRIS.');
  const total = items.reduce((sum, item) => sum + money_(item.harga) * Number(item.qty), 0);
  const totalRoti = items.reduce((sum, item) => sum + Number(item.satuan_roti || 0) * Number(item.qty), 0);
  const now = new Date();
  appendObject_('TransaksiKasir', {
    transaksi_id: text_(body.transaksi_id) || Utilities.getUuid(), id_cabang: user.id_cabang, id_karyawan: user.id_karyawan,
    tanggal_operasional: operationalDate_(now, user.id_cabang), items_json: JSON.stringify(items), metode_bayar: metode,
    total_bayar: total, total_roti: totalRoti, dibuat_pada: now
  });
  return { success: true, message: 'Transaksi kasir berhasil dicatat.', data: { total_bayar: total, total_roti: totalRoti } };
}

function ajukanBon_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const nominal = money_(body.nominal);
  if (nominal <= 0) throw new Error('Nominal bon harus lebih dari Rp0.');
  appendObject_('Bon', { bon_id: Utilities.getUuid(), id_karyawan: user.id_karyawan, id_cabang: user.id_cabang, nominal: nominal, catatan: text_(body.catatan).trim(), status: 'MENUNGGU', dibuat_pada: new Date(), diverifikasi_pada: '', catatan_admin: '', dibayar: 0, sisa_bon: nominal });
  kirimNotifikasiRole_(['ADMIN'], null, 'Pengajuan bon baru', user.nama + ' mengajukan bon Rp' + nominal + '.', { tipe: 'REQUEST_BAHAN' });
  return { success: true, message: 'Bon berhasil diajukan dan menunggu verifikasi admin.' };
}

function bonSaya_(idKaryawan, idCabang) {
  const user = validKaryawan_(idKaryawan, idCabang); assertRole_(user, ['KARYAWAN']);
  return readTable_('Bon').filter(row => normalized_(row.id_karyawan) === normalized_(user.id_karyawan)).map(row => pick_(row, ['bon_id','nominal','catatan','status','dibuat_pada','dibayar','sisa_bon']));
}

function bonAdmin_() {
  const people = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const branches = indexBy_(readTable_('Cabang'), 'id_cabang');
  // Bon yang telah lunas adalah arsip: tidak perlu lagi memenuhi daftar kerja admin.
  return readTable_('Bon').filter(row => normalized_(row.status) !== 'LUNAS').slice().reverse().map(row => ({
    bon_id: text_(row.bon_id), id_karyawan: text_(row.id_karyawan),
    nama_karyawan: people[text_(row.id_karyawan)] ? text_(people[text_(row.id_karyawan)].nama) : text_(row.id_karyawan),
    id_cabang: text_(row.id_cabang),
    nama_cabang: branches[text_(row.id_cabang)] ? text_(branches[text_(row.id_cabang)].nama_cabang) : text_(row.id_cabang),
    nominal: money_(row.nominal), catatan: text_(row.catatan), status: text_(row.status), dibuat_pada: text_(row.dibuat_pada),
    dibayar: money_(row.dibayar), sisa_bon: money_(row.sisa_bon)
  }));
}

function transaksiKasirAdmin_(tanggal) {
  const people = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const cabang = indexBy_(readTable_('Cabang'), 'id_cabang');
  const date = dateKey_(tanggal);
  return readTable_('TransaksiKasir').filter(row => !date || dateKey_(row.tanggal_operasional) === date).slice(-300).reverse().map(row => ({
    transaksi_id: text_(row.transaksi_id), nama_karyawan: people[text_(row.id_karyawan)] ? text_(people[text_(row.id_karyawan)].nama) : text_(row.id_karyawan),
    nama_cabang: cabang[text_(row.id_cabang)] ? text_(cabang[text_(row.id_cabang)].nama_cabang) : text_(row.id_cabang),
    metode_bayar: text_(row.metode_bayar), total_bayar: money_(row.total_bayar), total_roti: Number(row.total_roti || 0),
    dibuat_pada: text_(row.dibuat_pada), items: safeJson_(row.items_json, [])
  }));
}

function riwayatLaporanShift_(start, end, cabangId) {
  const people = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const branches = indexBy_(readTable_('Cabang'), 'id_cabang');
  return readTable_('LaporanShift').filter(row =>
    inRange_(dateKey_(row.tanggal_operasional), start, end) &&
    (!cabangId || normalized_(row.id_cabang) === normalized_(cabangId))
  ).sort((a, b) => dateKey_(b.tanggal_operasional).localeCompare(dateKey_(a.tanggal_operasional))).map(row => ({
    laporan_id: text_(row.laporan_id), tanggal_operasional: dateKey_(row.tanggal_operasional),
    id_cabang: text_(row.id_cabang), nama_cabang: branches[text_(row.id_cabang)] ? text_(branches[text_(row.id_cabang)].nama_cabang) : text_(row.id_cabang),
    id_karyawan: text_(row.id_karyawan), nama_karyawan: people[text_(row.id_karyawan)] ? text_(people[text_(row.id_karyawan)].nama) : text_(row.id_karyawan),
    roti_sisa_kemarin: int_(row.roti_sisa_kemarin), roti_diantar: int_(row.roti_diantar), roti_awal: int_(row.roti_awal), roti_sisa: int_(row.roti_sisa), roti_rusak_bonus: int_(row.roti_rusak_bonus),
    penjualan_offline_roti: Number(row.penjualan_offline_roti || 0), penjualan_luar_kasir_roti: Number(row.penjualan_luar_kasir_roti || 0),
    roti_terjual: Math.max(0, int_(row.roti_awal) - int_(row.roti_sisa) - int_(row.roti_rusak_bonus)),
    pengeluaran: money_(row.pengeluaran), setor_uang: money_(row.setor_uang), catatan: text_(row.catatan)
  }));
}

function bonus_(start, end) {
  // Bonus selalu dibaca dari satu periode 30 hari kalender, bukan seluruh riwayat kerja.
  const periodEnd = dateKey_(end) || operationalDate_(new Date());
  const periodStart = dateKey_(start) || Utilities.formatDate(new Date(new Date(periodEnd + 'T12:00:00+07:00').getTime() - 29 * 86400000), APP.TIMEZONE, 'yyyy-MM-dd');
  const people = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const shifts = indexBy_(readTable_('Shift'), 'shift_id');
  const grouped = {};
  // Satu karyawan hanya dihitung satu kali per tanggal operasional. Ini melindungi
  // bonus bila ada laporan lama yang pernah tersimpan ulang pada hari yang sama.
  const uniqueDailyReports = {};
  readTable_('LaporanShift').filter(r => inRange_(dateKey_(r.tanggal_operasional), periodStart, periodEnd)).forEach(report => {
    uniqueDailyReports[text_(report.id_karyawan) + '|' + dateKey_(report.tanggal_operasional)] = report;
  });
  Object.keys(uniqueDailyReports).forEach(key => {
    const report = uniqueDailyReports[key];
    const id = text_(report.id_karyawan); const shift = shifts[text_(report.shift_id)] || {};
    if (!grouped[id]) grouped[id] = { roti: 0, target: 0, jam: 0, hari: 0 };
    const hours = shiftHours_(shift);
    const target = hours >= 11 ? 75 : (hours > 0 ? 60 : 0);
    grouped[id].roti += Math.max(0, int_(report.roti_awal) - int_(report.roti_sisa) - int_(report.roti_rusak_bonus));
    grouped[id].target += target; grouped[id].jam += hours; grouped[id].hari++;
  });
  return Object.keys(grouped).map(id => ({
    id_karyawan: id, nama_karyawan: people[id] ? text_(people[id].nama) : id,
    id_cabang: people[id] ? text_(people[id].id_cabang) : '', total_hari: grouped[id].hari,
    total_jam: round_(grouped[id].jam), roti_terjual: grouped[id].roti, target_roti: grouped[id].target,
    kelebihan_roti: Math.max(0, grouped[id].roti - grouped[id].target)
  })).sort((a, b) => b.roti_terjual - a.roti_terjual);
}

function simpanKeuangan_(body) {
  const admin = validKaryawan_(body.id_admin, body.id_cabang_admin); assertRole_(admin, ['ADMIN']);
  const jenis = normalized_(body.jenis); const kategori = normalized_(body.kategori);
  if (['PEMASUKAN', 'PENGELUARAN'].indexOf(jenis) < 0) throw new Error('Jenis keuangan tidak valid.');
  if (!kategori) throw new Error('Kategori wajib dipilih.');
  const nominal = money_(body.nominal); if (nominal <= 0) throw new Error('Nominal harus lebih dari Rp0.');
  const cabangId = text_(body.id_cabang).trim(); if (cabangId) validCabang_(cabangId);
  const date = dateKey_(body.tanggal_operasional) || operationalDate_(new Date());
  appendObject_('Keuangan', { keuangan_id: Utilities.getUuid(), tanggal_operasional: date, id_cabang: cabangId,
    jenis: jenis, kategori: kategori, nominal: nominal, catatan: text_(body.catatan).trim(), dibuat_oleh: admin.id_karyawan, dibuat_pada: new Date() });
  return { success: true, message: 'Catatan keuangan berhasil disimpan.' };
}

function keuangan_(start, end, cabangId) {
  const branches = indexBy_(readTable_('Cabang'), 'id_cabang'); const dateStart = start || ''; const dateEnd = end || '';
  const matches = row => inRange_(dateKey_(row.tanggal_operasional), dateStart, dateEnd) && (!cabangId || !text_(row.id_cabang) || normalized_(row.id_cabang) === normalized_(cabangId));
  const manual = readTable_('Keuangan').filter(matches).map(row => ({
    keuangan_id: text_(row.keuangan_id), tanggal_operasional: dateKey_(row.tanggal_operasional), id_cabang: text_(row.id_cabang),
    nama_cabang: text_(row.id_cabang) ? (branches[text_(row.id_cabang)] ? text_(branches[text_(row.id_cabang)].nama_cabang) : text_(row.id_cabang)) : 'Pusat',
    jenis: text_(row.jenis), kategori: text_(row.kategori), nominal: money_(row.nominal), catatan: text_(row.catatan), otomatis: false
  }));
  // Uang tunai dihitung dari setor laporan shift. QRIS langsung masuk rekening,
  // sehingga dicatat otomatis dari transaksi kasir QRIS dan tidak perlu input manual.
  const laporan = readTable_('LaporanShift').filter(row => inRange_(dateKey_(row.tanggal_operasional), dateStart, dateEnd) && (!cabangId || normalized_(row.id_cabang) === normalized_(cabangId)));
  const auto = {}; laporan.forEach(row => { const key = dateKey_(row.tanggal_operasional) + '|' + text_(row.id_cabang); auto[key] = (auto[key] || 0) + money_(row.setor_uang); });
  const setorOtomatis = Object.keys(auto).filter(key => auto[key] > 0).map(key => { const p = key.split('|'); return { keuangan_id: 'SETOR-' + key, tanggal_operasional: p[0], id_cabang: p[1], nama_cabang: branches[p[1]] ? text_(branches[p[1]].nama_cabang) : p[1], jenis: 'PEMASUKAN', kategori: 'SETOR_UANG', nominal: auto[key], catatan: 'Otomatis dari laporan shift', otomatis: true }; });
  const qris = {};
  readTable_('TransaksiKasir').filter(row => inRange_(dateKey_(row.tanggal_operasional), dateStart, dateEnd) && normalized_(row.metode_bayar) === 'QRIS' && (!cabangId || normalized_(row.id_cabang) === normalized_(cabangId))).forEach(row => {
    const key = dateKey_(row.tanggal_operasional) + '|' + text_(row.id_cabang);
    qris[key] = (qris[key] || 0) + money_(row.total_bayar);
  });
  const qrisOtomatis = Object.keys(qris).filter(key => qris[key] > 0).map(key => { const p = key.split('|'); return { keuangan_id: 'QRIS-' + key, tanggal_operasional: p[0], id_cabang: p[1], nama_cabang: branches[p[1]] ? text_(branches[p[1]].nama_cabang) : p[1], jenis: 'PEMASUKAN', kategori: 'QRIS', nominal: qris[key], catatan: 'Otomatis dari transaksi kasir QRIS', otomatis: true }; });
  const semua = manual.concat(setorOtomatis, qrisOtomatis).sort((a, b) => b.tanggal_operasional.localeCompare(a.tanggal_operasional));
  return { transaksi: semua, total_pemasukan: round_(semua.filter(x => normalized_(x.jenis) === 'PEMASUKAN').reduce((s, x) => s + x.nominal, 0)), total_pengeluaran: round_(semua.filter(x => normalized_(x.jenis) === 'PENGELUARAN').reduce((s, x) => s + x.nominal, 0)) };
}

function verifikasiBon_(body) {
  const admin = validKaryawan_(body.id_admin, body.id_cabang_admin); assertRole_(admin, ['ADMIN']);
  const table = readTableWithRows_('Bon'); const row = table.rows.find(r => text_(r.bon_id) === text_(body.bon_id));
  if (!row) throw new Error('Data bon tidak ditemukan.');
  const status = normalized_(body.status); if (['DISETUJUI','DITOLAK','LUNAS_SEBAGIAN','LUNAS'].indexOf(status) < 0) throw new Error('Status bon tidak valid.');
  const dibayar = Math.min(money_(row.nominal), money_(body.dibayar));
  const values = { status: status, diverifikasi_pada: new Date(), catatan_admin: text_(body.catatan_admin).trim(), dibayar: dibayar, sisa_bon: Math.max(0, money_(row.nominal) - dibayar) };
  table.headers.forEach((header, index) => { if (values[header] !== undefined) table.sheet.getRange(row._row, index + 1).setValue(values[header]); });
  return { success: true, message: 'Bon berhasil diperbarui.' };
}

function simpanRequestBahan_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  assertRole_(user, ['KARYAWAN']);
  const now = new Date();
  const shift = readTable_('Shift').filter(s => normalized_(s.id_karyawan) === normalized_(user.id_karyawan) && normalized_(s.id_cabang) === normalized_(user.id_cabang) && normalized_(s.status) === 'BUKA').pop();
  if (!shift) return { success: false, message: 'Request bahan dapat dikirim saat shift masih berjalan.' };
  const rotiSisa = int_(body.roti_sisa);
  if (rotiSisa < 0) throw new Error('Sisa roti tidak valid.');
  const items = Array.isArray(body.request_bahan) ? body.request_bahan
    .filter(x => x && String(x.nama || '').trim())
    .map(x => ({ nama: String(x.nama).trim() })) : [];
  if (!items.length) throw new Error('Masukkan minimal satu request bahan.');
  const date = operationalDate_(now, user.id_cabang);
  const existing = readTableWithRows_('RequestBahan').rows.find(r => normalized_(r.id_karyawan) === normalized_(user.id_karyawan) && dateKey_(r.tanggal_operasional) === date);
  if (existing) {
    const table = readTableWithRows_('RequestBahan');
    const values = { roti_sisa: rotiSisa, request_json: JSON.stringify(items), catatan: String(body.catatan || '').trim(), status: 'BARU', dibuat_pada: now };
    table.headers.forEach((header, index) => { if (values[header] !== undefined) table.sheet.getRange(existing._row, index + 1).setValue(values[header]); });
    kirimNotifikasiRole_(['BOS', 'ADMIN', 'ASISTEN_LAPANGAN'], user.id_cabang, 'Request bahan diperbarui', 'Request bahan dari cabang ' + user.id_cabang + ' telah diperbarui.', { tipe: 'REQUEST_BAHAN', id_cabang: text_(user.id_cabang) });
    return { success: true, message: 'Request bahan berhasil diperbarui.' };
  }
  appendObject_('RequestBahan', {
    request_id: Utilities.getUuid(), id_cabang: user.id_cabang, id_karyawan: user.id_karyawan,
    tanggal_operasional: date, roti_sisa: rotiSisa, request_json: JSON.stringify(items),
    catatan: String(body.catatan || '').trim(), status: 'BARU', dibuat_pada: now
  });
  kirimNotifikasiRole_(['BOS', 'ADMIN', 'ASISTEN_LAPANGAN'], user.id_cabang, 'Request bahan baru', 'Ada request bahan dari cabang ' + user.id_cabang + '.', { tipe: 'REQUEST_BAHAN', id_cabang: text_(user.id_cabang) });
  return { success: true, message: 'Request bahan berhasil dikirim.' };
}

/** Jalankan sekali untuk memasang pengingat request sekitar pukul 21.00 setiap hari. */
function pasangTriggerNotifikasi21() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'kirimPengingatRequest21') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('kirimPengingatRequest21').timeBased().everyDays(1).atHour(21).create();
}

function kirimPengingatRequest21() {
  kirimNotifikasiRole_(['KARYAWAN'], null, 'Waktunya request bahan', 'Silakan isi sisa roti dan request bahan untuk shift berikutnya.', { tipe: 'PENGINGAT_REQUEST' });
}

/** Jalankan manual dari Apps Script untuk menguji Firebase dan suara request_bahan.mp3. */
function testNotifikasiFirebase() {
  kirimNotifikasiRole_(['ADMIN', 'KARYAWAN'], null,
    'Tes notifikasi Roti Bakar Borneo', 'Jika suara TTS terdengar, channel request bahan sudah benar.',
    { tipe: 'REQUEST_BAHAN' });
}

function kirimNotifikasiRole_(roles, idCabang, judul, isi, data) {
  const table = readTableWithRows_('DeviceToken');
  const aktifColumn = table.headers.indexOf('aktif') + 1;
  const tokens = table.rows.filter(row => bool_(row.aktif) && roles.indexOf(normalized_(row.role)) >= 0 &&
    (!idCabang || normalized_(row.role) !== 'KARYAWAN' || normalized_(row.id_cabang) === normalized_(idCabang)));
  tokens.forEach(row => {
    try { kirimFcm_(text_(row.fcm_token), judul, isi, data || {}); }
    catch (err) {
      const message = String(err.message || err);
      if (aktifColumn > 0 && /UNREGISTERED|NotRegistered/i.test(message)) {
        table.sheet.getRange(row._row, aktifColumn).setValue(false);
        Logger.log('Token lama dinonaktifkan: ' + text_(row.id_karyawan));
      } else Logger.log('FCM gagal: ' + message);
    }
  });
}

function kirimFcm_(tokenPerangkat, judul, isi, data) {
  if (!tokenPerangkat) return;
  const props = PropertiesService.getScriptProperties();
  const credential = safeJson_(props.getProperty('FIREBASE_SERVICE_ACCOUNT_JSON'), null);
  const projectId = props.getProperty('FIREBASE_PROJECT_ID') || (credential && credential.project_id);
  if (!credential || !credential.private_key || !credential.client_email || !projectId) throw new Error('Firebase service account belum dikonfigurasi di Script Properties.');
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url_({ alg: 'RS256', typ: 'JWT' });
  const claim = base64Url_({ iss: credential.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const unsigned = header + '.' + claim;
  const jwt = unsigned + '.' + Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(unsigned, credential.private_key)).replace(/=+$/, '');
  const auth = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', { method: 'post', payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }, muteHttpExceptions: true });
  const authJson = safeJson_(auth.getContentText(), {});
  if (!authJson.access_token) throw new Error('OAuth Firebase gagal: ' + auth.getContentText());
  // Data-only membuat BorneoMessagingService menangani notifikasi, termasuk MP3
  // khusus. Payload `notification` bawaan Android tidak selalu memainkan suara
  // aplikasi saat proses berada di latar belakang.
  const fcmData = {};
  Object.keys(data || {}).forEach(key => { fcmData[key] = String(data[key] == null ? '' : data[key]); });
  fcmData.judul = String(judul);
  fcmData.isi = String(isi);
  const message = { message: { token: tokenPerangkat, data: fcmData, android: { priority: 'high' } } };
  const result = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(projectId) + '/messages:send', { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + authJson.access_token }, payload: JSON.stringify(message), muteHttpExceptions: true });
  if (result.getResponseCode() >= 300) throw new Error(result.getContentText());
}

function base64Url_(value) { return Utilities.base64EncodeWebSafe(typeof value === 'string' ? value : JSON.stringify(value)).replace(/=+$/, ''); }
function channelNotifikasi_(tipe) {
  const value = text_(tipe).toUpperCase();
  if (value === 'OUTLET_BUKA') return 'outlet_buka_v2';
  if (value === 'OUTLET_TUTUP') return 'outlet_tutup_v2';
  if (value === 'PENGINGAT_REQUEST') return 'pengingat_request_v2';
  return 'request_bahan_v2';
}

function requestBahan_(idCabang, date) {
  const cabang = indexBy_(readTable_('Cabang'), 'id_cabang');
  return readTable_('RequestBahan').filter(r =>
    (!idCabang || normalized_(r.id_cabang) === normalized_(idCabang)) &&
    (!date || dateKey_(r.tanggal_operasional) === date)
  ).map(r => ({
    request_id: text_(r.request_id), id_cabang: text_(r.id_cabang), nama_cabang: text_(cabang[text_(r.id_cabang)] && cabang[text_(r.id_cabang)].nama_cabang) || text_(r.id_cabang), id_karyawan: text_(r.id_karyawan),
    tanggal_operasional: dateKey_(r.tanggal_operasional), roti_sisa: int_(r.roti_sisa),
    request_bahan: safeJson_(r.request_json, []), catatan: text_(r.catatan) || null, status: text_(r.status)
  }));
}

/** Data ringkas untuk dashboard web bos. Tidak memuat data sensitif karyawan. */
function dashboardAnalytics_(start, end) {
  const today = operationalDate_(new Date());
  const defaultStart = Utilities.formatDate(new Date(new Date().getTime() - 29 * 86400000), APP.TIMEZONE, 'yyyy-MM-dd');
  const rangeStart = start || defaultStart;
  const rangeEnd = end || today;
  const cabang = readTable_('Cabang').filter(c => bool_(c.aktif));
  const cabangById = indexBy_(cabang, 'id_cabang');
  const daily = {};
  const totals = {};
  cabang.forEach(c => { totals[text_(c.id_cabang)] = { roti: 0, setor: 0, pengeluaran: 0, laporan: 0, transaksi: 0, omzet_kasir: 0 }; });
  readTable_('LaporanShift').filter(r => inRange_(dateKey_(r.tanggal_operasional), rangeStart, rangeEnd)).forEach(r => {
    const branchId = text_(r.id_cabang);
    if (!cabangById[branchId]) return;
    const date = dateKey_(r.tanggal_operasional);
    const key = date + '|' + branchId;
    if (!daily[key]) daily[key] = { tanggal: date, id_cabang: branchId, roti_terjual: 0 };
    const roti = Math.max(0, int_(r.roti_awal) - int_(r.roti_sisa));
    daily[key].roti_terjual += roti;
    totals[branchId].roti += roti;
    totals[branchId].setor += money_(r.setor_uang);
    totals[branchId].pengeluaran += money_(r.pengeluaran);
    totals[branchId].laporan++;
  });
  readTable_('TransaksiKasir').filter(r => inRange_(dateKey_(r.tanggal_operasional), rangeStart, rangeEnd)).forEach(r => {
    const id = text_(r.id_cabang); if (totals[id]) { totals[id].transaksi++; totals[id].omzet_kasir += money_(r.total_bayar); }
  });
  return {
    tanggal_mulai: rangeStart, tanggal_selesai: rangeEnd,
    cabang: cabang.map(c => ({
      id_cabang: text_(c.id_cabang), nama_cabang: text_(c.nama_cabang),
      roti_terjual: totals[text_(c.id_cabang)].roti, setor_uang: totals[text_(c.id_cabang)].setor,
      pengeluaran: totals[text_(c.id_cabang)].pengeluaran, jumlah_laporan: totals[text_(c.id_cabang)].laporan,
      jumlah_transaksi_kasir: totals[text_(c.id_cabang)].transaksi, omzet_kasir: totals[text_(c.id_cabang)].omzet_kasir
    })),
    penjualan_harian: Object.keys(daily).map(key => daily[key]).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  };
}

function tambahKaryawanApi_(body) {
  const admin = validKaryawan_(body.id_admin, body.id_cabang_admin);
  assertRole_(admin, ['ADMIN']);
  const idBaru = text_(body.id_karyawan).trim() || nextId_('Karyawan', 'id_karyawan', 'KRY');
  tambahKaryawan(idBaru, body.nama, body.username, body.password, 'KARYAWAN', body.id_cabang);
  const table = readTableWithRows_('Karyawan');
  const person = table.rows.find(r => normalized_(r.id_karyawan) === normalized_(idBaru));
  const tarifCol = table.headers.indexOf('tarif_per_jam') + 1;
  if (tarifCol > 0 && person) table.sheet.getRange(person._row, tarifCol).setValue(money_(body.tarif_per_jam));
  return { success: true, message: 'Karyawan berhasil ditambahkan.', data: { id_karyawan: idBaru } };
}

function tambahCabangApi_(body) {
  const admin = validKaryawan_(body.id_admin, body.id_cabang_admin);
  assertRole_(admin, ['ADMIN']);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Server sedang menyimpan data lain. Coba lagi.');
  try {
  const id = text_(body.id_cabang).trim() || nextId_('Cabang', 'id_cabang', 'CBG');
  if (!text_(body.nama_cabang).trim()) throw new Error('Nama cabang wajib diisi.');
  if (readTable_('Cabang').some(c => normalized_(c.id_cabang) === normalized_(id))) throw new Error('ID cabang sudah digunakan.');
  const lat = Number(body.latitude), lng = Number(body.longitude), radius = Number(body.radius_meter || 100);
  if (!isFinite(lat) || !isFinite(lng) || !isFinite(radius) || radius <= 0) throw new Error('Koordinat atau radius cabang tidak valid.');
  appendObject_('Cabang', { id_cabang: id, nama_cabang: text_(body.nama_cabang).trim(), latitude: lat, longitude: lng, radius_meter: radius, aktif: true, dibuat_pada: new Date() });
  refreshDropdowns();
  const saved = readTable_('Cabang').find(c => normalized_(c.id_cabang) === normalized_(id));
  if (!saved) throw new Error('Cabang belum tersimpan. Jangan ulangi sebelum memeriksa Sheet.');
  return { success: true, message: 'Cabang berhasil tersimpan di database.', data: { id_cabang: id } };
  } finally { lock.releaseLock(); }
}

function masterCabang_() {
  return readTable_('Cabang').filter(c => bool_(c.aktif)).map(c => ({ id_cabang: text_(c.id_cabang), nama_cabang: text_(c.nama_cabang) })).sort((a, b) => a.nama_cabang.localeCompare(b.nama_cabang));
}
function nextId_(sheetName, header, prefix) {
  const max = readTable_(sheetName).reduce((highest, row) => {
    const match = text_(row[header]).toUpperCase().match(/(\d+)$/); return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return prefix + String(max + 1).padStart(3, '0');
}

function daftarTokenPerangkat_(body) {
  const user = validKaryawan_(body.id_karyawan, body.id_cabang);
  const token = text_(body.fcm_token).trim();
  if (!token) throw new Error('Token perangkat wajib diisi.');
  const table = readTableWithRows_('DeviceToken');
  const existing = table.rows.find(r => text_(r.fcm_token) === token);
  const value = { token_id: existing ? existing.token_id : Utilities.getUuid(), id_karyawan: user.id_karyawan, role: user.role, id_cabang: user.id_cabang, fcm_token: token, aktif: true, diperbarui_pada: new Date() };
  if (existing) table.headers.forEach((header, index) => table.sheet.getRange(existing._row, index + 1).setValue(value[header] === undefined ? '' : value[header]));
  else appendObject_('DeviceToken', value);
  return { success: true, message: 'Perangkat notifikasi terdaftar.' };
}

function dashboardCabang_() {
  const now = new Date();
  const karyawan = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const laporanByShift = indexBy_(readTable_('LaporanShift'), 'shift_id');
  return readTable_('Cabang').filter(c => bool_(c.aktif)).map(cabang => {
    const opDate = operationalDate_(now, cabang.id_cabang);
    const cabangShifts = readTable_('Shift').filter(s => normalized_(s.id_cabang) === normalized_(cabang.id_cabang) && dateKey_(s.tanggal_operasional) === opDate);
    const open = cabangShifts.some(s => normalized_(s.status) === 'BUKA');
    const latest = cabangShifts[cabangShifts.length - 1];
    const rotiTerjual = cabangShifts.reduce((total, shift) => {
      const laporan = laporanByShift[text_(shift.shift_id)];
      return total + (laporan ? Math.max(0, int_(laporan.roti_awal) - int_(laporan.roti_sisa)) : 0);
    }, 0);
    return {
      id_cabang: text_(cabang.id_cabang), nama_cabang: text_(cabang.nama_cabang),
      // Shift aktif harus langsung membuat cabang BUKA; tidak menunggu absen pulang.
      status: open ? 'BUKA' : (latest ? 'TUTUP_SELESAI' : 'BELUM_BUKA'),
      jam_buka_pertama: cabangShifts.length ? timeKey_(cabangShifts[0].jam_mulai) : null,
      // Untuk dashboard, shift BUKA dihitung hingga waktu sekarang agar angka live.
      // Ditampilkan pada kartu cabang, bukan lagi total gabungan di header dashboard.
      total_kerja_hari_ini: totalHours_(cabangShifts, now),
      estimasi_gaji_hari_ini: estimatedPay_(cabangShifts, karyawan, now),
      roti_terjual_hari_ini: rotiTerjual,
      karyawan_absen: cabangShifts.map(s => ({
        nama_karyawan: karyawan[text_(s.id_karyawan)] ? text_(karyawan[text_(s.id_karyawan)].nama) : text_(s.id_karyawan),
        jam_masuk: timeKey_(s.jam_mulai), foto_url: text_(s.foto_masuk_url) || null, status_masuk: text_(s.status)
      }))
    };
  });
}

function performaKaryawan_(employeeId) {
  const now = new Date();
  const person = readTable_('Karyawan').find(k => normalized_(k.id_karyawan) === normalized_(employeeId));
  const shift = readTable_('Shift').filter(s => normalized_(s.id_karyawan) === normalized_(employeeId) && dateKey_(s.tanggal_operasional) === operationalDate_(now, person && person.id_cabang)).pop();
  if (!shift) return { total_jam: 0, estimasi_gaji: 0, status: 'BELUM_ABSEN' };
  const hours = shiftHours_(shift, now);
  const estimated = Math.max(0, hours * money_(person && person.tarif_per_jam) - potonganShift_(shift));
  return { total_jam: round_(hours), estimasi_gaji: round_(estimated), status: normalized_(shift.status) };
}

function laporanCabang_(idCabang) {
  if (!idCabang) throw new Error('id_cabang wajib diisi.');
  const shift = readTable_('Shift').filter(s => text_(s.id_cabang) === String(idCabang).trim() && ['BUKA', 'TUTUP_SELESAI'].indexOf(normalized_(s.status)) >= 0).pop();
  if (!shift) return null;
  const report = readTable_('LaporanShift').find(r => text_(r.shift_id) === text_(shift.shift_id));
  if (!report) return null;
  return {
    tanggal_operasional: text_(report.tanggal_operasional), jam_mulai: text_(report.jam_mulai), jam_selesai: text_(report.jam_selesai),
    roti_awal: int_(report.roti_awal), roti_sisa: int_(report.roti_sisa),
    roti_sisa_kemarin: int_(report.roti_sisa_kemarin), roti_diantar: int_(report.roti_diantar), roti_rusak_bonus: int_(report.roti_rusak_bonus),
    penjualan_offline_roti: Number(report.penjualan_offline_roti || 0), penjualan_luar_kasir_roti: Number(report.penjualan_luar_kasir_roti || 0), selisih_stok: Number(report.selisih_stok || 0),
    bahan_habis: safeJson_(report.bahan_habis_json, []), pengeluaran: money_(report.pengeluaran), setor_uang: money_(report.setor_uang),
    sisa_modal: money_(report.sisa_modal), catatan: text_(report.catatan) || null
  };
}

function riwayat_(start, end) {
  return readTable_('Shift').filter(s => inRange_(dateKey_(s.tanggal_operasional), start, end)).map(s => ({
    id_karyawan: text_(s.id_karyawan), tanggal: dateKey_(s.tanggal_operasional), jam_masuk: timeKey_(s.jam_mulai) || null,
    jam_pulang: timeKey_(s.jam_selesai) || null, status_presensi: text_(s.status)
  }));
}

function payroll_(start, end) {
  const people = indexBy_(readTable_('Karyawan'), 'id_karyawan');
  const schedules = scheduleMap_();
  const grouped = {};
  readTable_('Shift').filter(s => normalized_(s.status) === 'TUTUP_SELESAI' && inRange_(dateKey_(s.tanggal_operasional), start, end)).forEach(s => {
    const id = text_(s.id_karyawan);
    if (!grouped[id]) grouped[id] = { hari: 0, jam: 0, terlambat: 0, potongan: 0 };
    grouped[id].hari++;
    grouped[id].jam += shiftHours_(s);
    grouped[id].terlambat += lateMinutes_(s, schedules);
    grouped[id].potongan += potonganShift_(s, schedules);
  });
  return Object.keys(grouped).map(id => ({
    id_karyawan: id, nama: people[id] ? text_(people[id].nama) : id, jumlah_hari_masuk: grouped[id].hari,
    total_jam_kerja: round_(grouped[id].jam), total_menit_terlambat: grouped[id].terlambat,
    gaji_kotor: round_(grouped[id].jam * money_(people[id] && people[id].tarif_per_jam)),
    total_potongan: round_(grouped[id].potongan),
    gaji_bersih: round_(Math.max(0, grouped[id].jam * money_(people[id] && people[id].tarif_per_jam) - grouped[id].potongan))
  }));
}

function payrollDetail_(employeeId, start, end) {
  if (!employeeId) throw new Error('id_karyawan wajib diisi.');
  const person = readTable_('Karyawan').find(k => normalized_(k.id_karyawan) === normalized_(employeeId));
  const schedules = scheduleMap_();
  return readTable_('Shift').filter(s => normalized_(s.id_karyawan) === normalized_(employeeId) && normalized_(s.status) === 'TUTUP_SELESAI' && inRange_(dateKey_(s.tanggal_operasional), start, end)).map(s => {
    const hours = round_(shiftHours_(s));
    const gross = round_(hours * money_(person && person.tarif_per_jam));
    const late = lateMinutes_(s, schedules); const deduction = potonganShift_(s, schedules);
    return { tanggal: dateKey_(s.tanggal_operasional), jam_masuk: timeKey_(s.jam_mulai), jam_pulang: timeKey_(s.jam_selesai), total_jam: hours, menit_terlambat: late, gaji_harian: Math.max(0, gross - deduction) };
  });
}

function validKaryawan_(id, cabangId) {
  const user = readTable_('Karyawan').find(k => text_(k.id_karyawan) === String(id || '').trim() && bool_(k.aktif));
  if (!user || text_(user.id_cabang) !== String(cabangId || '').trim()) throw new Error('Karyawan atau cabang tidak valid.');
  return user;
}

function validCabang_(id) {
  const branch = readTable_('Cabang').find(c => text_(c.id_cabang) === String(id || '').trim() && bool_(c.aktif));
  if (!branch) throw new Error('Cabang tidak aktif atau tidak ditemukan.');
  return branch;
}
function assertRole_(user, allowed) {
  if (allowed.indexOf(normalized_(user.role)) < 0) throw new Error('Role Anda tidak memiliki akses untuk aksi ini.');
}

function validateLocation_(body, cabang) {
  const distance = haversine_(Number(body.lat), Number(body.lng), Number(cabang.latitude), Number(cabang.longitude));
  if (!isFinite(distance) || distance > Number(cabang.radius_meter || 100)) throw new Error('Lokasi berada di luar radius outlet.');
}

function savePhoto_(base64, label) {
  if (!base64) return '';
  const clean = String(base64).replace(/^data:image\/\w+;base64,/, '');
  const file = folderFotoPresensi_().createFile(Utilities.newBlob(Utilities.base64Decode(clean), 'image/jpeg', label + '_' + Date.now() + '.jpg'));
  // Glide di APK tidak memiliki sesi Google. Link-only memungkinkan foto presensi tampil tanpa folder menjadi publik.
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function readTableWithRows_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return { sheet: sheet, headers: headers, rows: values.map((row, i) => objectFromRow_(headers, row, i + 2)) };
}
function readTable_(name) { return readTableWithRows_(name).rows; }
function getSheet_(name) {
  const sheet = getOrSaveSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupDatabase().');
  return sheet;
}
function appendObject_(name, obj) {
  const sheet = getSheet_(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map(h => obj[h] === undefined ? '' : obj[h]));
}
function objectFromRow_(headers, row, rowNumber) { const o = { _row: rowNumber }; headers.forEach((h, i) => o[h] = row[i]); return o; }
function indexBy_(rows, key) { return rows.reduce((out, row) => { out[text_(row[key])] = row; return out; }, {}); }
function pick_(obj, keys) { return keys.reduce((out, k) => { out[k] = text_(obj[k]); return out; }, {}); }
function parseBody_(e) { if (!e || !e.postData || !e.postData.contents) throw new Error('Body JSON wajib diisi.'); return JSON.parse(e.postData.contents); }
function assertApiKey_(key) { if (!key || key !== PropertiesService.getScriptProperties().getProperty(APP.PROP_API_KEY)) throw new Error('API key tidak valid.'); }
function hashPassword_(password) { const salt = PropertiesService.getScriptProperties().getProperty(APP.PROP_PASSWORD_SALT); return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt || '') + ':' + String(password))); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function text_(value) { return value === null || value === undefined ? '' : String(value); }
function normalized_(value) { return text_(value).trim().toUpperCase(); }
function dateKey_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP.TIMEZONE, 'yyyy-MM-dd');
  }
  const raw = text_(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? raw : Utilities.formatDate(parsed, APP.TIMEZONE, 'yyyy-MM-dd');
}
function timeKey_(value) {
  if (value === null || value === undefined || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP.TIMEZONE, 'HH:mm');
  }
  const raw = text_(value).trim();
  // Sheet bisa menyimpan waktu sebagai 04:00, 04:00:00, atau Date.
  // Selalu normalkan agar satu data lama tidak merusak seluruh payroll.
  const clock = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (clock) {
    const hour = Number(clock[1]); const minute = Number(clock[2]);
    return hour >= 0 && hour < 24 && minute >= 0 && minute < 60
      ? String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') : '';
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? raw : Utilities.formatDate(parsed, APP.TIMEZONE, 'HH:mm');
}
function bool_(value) { return value === true || String(value).toLowerCase() === 'true'; }
function int_(value) { const n = parseInt(value, 10); return isNaN(n) ? 0 : n; }
function money_(value) { const n = Number(value); return isFinite(n) && n >= 0 ? n : 0; }
function safeJson_(value, fallback) { try { return JSON.parse(text_(value)); } catch (_) { return fallback; } }
function time_(date) { return Utilities.formatDate(date, APP.TIMEZONE, 'HH:mm'); }
// Reset operasional selalu pukul 05.00, terpisah dari jam tutup jadwal cabang.
function operationalDate_(date, idCabang) { const cutoff = APP.SHIFT_CUTOFF_HOUR * 60; const current = minutesFromTime_(time_(date)); const d = new Date(date.getTime() - (current < cutoff ? 86400000 : 0)); return Utilities.formatDate(d, APP.TIMEZONE, 'yyyy-MM-dd'); }
function inRange_(date, start, end) { return (!start || date >= start) && (!end || date <= end); }
function round_(n) { return isFinite(n) ? Math.round(n * 100) / 100 : 0; }
function shiftHours_(shift, now) {
  if (!timeKey_(shift.jam_mulai)) return 0;
  const end = timeKey_(shift.jam_selesai) || (normalized_(shift.status) === 'BUKA' && now ? time_(now) : '');
  if (!end) return 0;
  const a = timeKey_(shift.jam_mulai).split(':'); const b = end.split(':');
  const startMinutes = Number(a[0]) * 60 + Number(a[1]);
  const endMinutes = Number(b[0]) * 60 + Number(b[1]);
  if (!isFinite(startMinutes) || !isFinite(endMinutes)) return 0;
  let minutes = endMinutes - startMinutes;
  if (minutes < 0) minutes += 1440;
  return minutes / 60;
}
function totalHours_(shifts, now) { return round_(shifts.reduce((sum, shift) => sum + shiftHours_(shift, now), 0)); }
function estimatedPay_(shifts, people, now) {
  return round_(shifts.reduce((total, shift) => {
    const person = people[text_(shift.id_karyawan)] || people[normalized_(shift.id_karyawan)];
    const gross = shiftHours_(shift, now) * money_(person && person.tarif_per_jam);
    return total + Math.max(0, gross - potonganShift_(shift));
  }, 0));
}
function scheduleMap_() {
  const map = {};
  readTable_('OperasionalCabang').forEach(row => { if (bool_(row.aktif)) map[normalized_(row.id_cabang)] = row; });
  return map;
}
function lateMinutes_(shift, schedules) {
  const schedule = schedules ? schedules[normalized_(shift.id_cabang)] : jamOperasionalCabang_(shift.id_cabang);
  if (!schedule || !timeKey_(schedule.jam_buka) || !timeKey_(shift.jam_mulai)) return 0;
  const start = minutesFromTime_(timeKey_(shift.jam_mulai));
  const required = minutesFromTime_(timeKey_(schedule.jam_buka)) + int_(schedule.toleransi_terlambat_menit);
  return Math.max(0, start - required);
}
function jamOperasionalCabang_(idCabang) { return readTable_('OperasionalCabang').find(row => normalized_(row.id_cabang) === normalized_(idCabang) && bool_(row.aktif)) || { jam_buka: '', jam_tutup: '05:00', toleransi_terlambat_menit: 0, potongan_per_15_menit: 0 }; }
function sebelumJamTutup_(date, idCabang) { return minutesFromTime_(time_(date)) < APP.SHIFT_CUTOFF_HOUR * 60; }
function potonganShift_(shift, schedules) {
  const schedule = schedules ? schedules[normalized_(shift.id_cabang)] : jamOperasionalCabang_(shift.id_cabang);
  const minutes = lateMinutes_(shift, schedules);
  const nominal = money_(schedule && schedule.potongan_per_15_menit);
  return minutes > 0 ? Math.ceil(minutes / 15) * nominal : 0;
}
function minutesFromTime_(value) {
  const normalized = timeKey_(value); const p = normalized.split(':');
  const minutes = Number(p[0]) * 60 + Number(p[1]);
  return isFinite(minutes) ? minutes : 0;
}
function dayName_(operationalDate) {
  const index = Number(Utilities.formatDate(new Date(dateKey_(operationalDate) + 'T12:00:00+07:00'), APP.TIMEZONE, 'u'));
  return ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'][index] || '';
}
function haversine_(lat1, lon1, lat2, lon2) { const r = 6371000; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
