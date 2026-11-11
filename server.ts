import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// -------------------------------------------------------------
// Database & Mock Store with Seed Data for Roti Bakar Borneo
// -------------------------------------------------------------
const DB_FILE = path.join(__dirname, '.app_data.json');

interface AppData {
  cabang: any[];
  karyawan: any[];
  shifts: any[];
  laporanShift: any[];
  transaksiKasir: any[];
  bon: any[];
  requestBahan: any[];
  keuangan: any[];
}

const defaultData: AppData = {
  cabang: [
    {
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      latitude: -3.3194,
      longitude: 114.5908,
      radius_meter: 150,
      aktif: true,
      alamat: 'Jl. Lambung Mangkurat No. 45, Banjarmasin Tengah',
      jam_operasional: '16:00 - 02:00 WITA',
      telepon: '0812-5501-8891'
    },
    {
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Veteran',
      latitude: -3.3245,
      longitude: 114.6012,
      radius_meter: 120,
      aktif: true,
      alamat: 'Jl. Veteran No. 12, Melayu, Banjarmasin Timur',
      jam_operasional: '16:30 - 02:00 WITA',
      telepon: '0812-5501-8892'
    },
    {
      id_cabang: 'CBG03',
      nama_cabang: 'Outlet Kayu Tangi (Hasan Basri)',
      latitude: -3.2985,
      longitude: 114.5872,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Brigjend H. Hasan Basri No. 88, Kayu Tangi',
      jam_operasional: '16:30 - 02:30 WITA',
      telepon: '0812-5501-8893'
    }
  ],
  karyawan: [
    {
      id_karyawan: 'BOS001',
      nama: 'H. Rahman Borneo',
      username: 'bos',
      role: 'BOS',
      id_cabang: 'CBG01',
      tarif_per_jam: 0,
      aktif: true,
      telepon: '0811-500-7890'
    },
    {
      id_karyawan: 'K001',
      nama: 'Budi Santoso',
      username: 'budi',
      role: 'KARYAWAN',
      id_cabang: 'CBG01',
      tarif_per_jam: 18000,
      aktif: true,
      telepon: '0852-4411-9001'
    },
    {
      id_karyawan: 'K002',
      nama: 'Ahmad Fauzi',
      username: 'ahmad',
      role: 'KARYAWAN',
      id_cabang: 'CBG02',
      tarif_per_jam: 18000,
      aktif: true,
      telepon: '0852-4411-9002'
    },
    {
      id_karyawan: 'K003',
      nama: 'Rian Saputra',
      username: 'rian',
      role: 'KARYAWAN',
      id_cabang: 'CBG03',
      tarif_per_jam: 18000,
      aktif: true,
      telepon: '0852-4411-9003'
    }
  ],
  shifts: [
    {
      shift_id: 'SH-LIVE-01',
      id_cabang: 'CBG01',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      jam_mulai: '16:45',
      status: 'BUKA',
      lat_masuk: -3.3194,
      lng_masuk: 114.5908,
      foto_masuk_url: '',
      dibuat_pada: new Date().toISOString()
    },
    {
      shift_id: 'SH-LIVE-02',
      id_cabang: 'CBG02',
      id_karyawan: 'K002',
      nama_karyawan: 'Ahmad Fauzi',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      jam_mulai: '17:00',
      status: 'BUKA',
      lat_masuk: -3.3245,
      lng_masuk: 114.6012,
      foto_masuk_url: '',
      dibuat_pada: new Date().toISOString()
    }
  ],
  laporanShift: [
    {
      laporan_id: 'LAP-101',
      shift_id: 'SH-HIST-01',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      tanggal_operasional: '2026-11-09',
      jam_mulai: '16:45',
      jam_selesai: '01:40',
      roti_awal: 110,
      roti_sisa: 8,
      roti_sisa_kemarin: 10,
      roti_diantar: 100,
      roti_rusak_bonus: 2,
      penjualan_offline_roti: 100,
      penjualan_luar_kasir_roti: 0,
      selisih_stok: 0,
      bahan_habis: [{ nama: 'Margarin BlueBand', jumlah: '1 kg' }],
      pengeluaran: 35000,
      setor_uang: 1450000,
      sisa_modal: 150000,
      catatan: 'Kondisi kompor barat dibersihkan, gerai ramai lancar.',
      dibuat_pada: '2026-11-10T01:45:00Z'
    },
    {
      laporan_id: 'LAP-102',
      shift_id: 'SH-HIST-02',
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Veteran',
      id_karyawan: 'K002',
      nama_karyawan: 'Ahmad Fauzi',
      tanggal_operasional: '2026-11-09',
      jam_mulai: '17:00',
      jam_selesai: '01:50',
      roti_awal: 90,
      roti_sisa: 6,
      roti_sisa_kemarin: 5,
      roti_diantar: 85,
      roti_rusak_bonus: 1,
      penjualan_offline_roti: 83,
      penjualan_luar_kasir_roti: 0,
      selisih_stok: 0,
      bahan_habis: [{ nama: 'Gas LPG 3kg', jumlah: '1 tabung' }],
      pengeluaran: 28000,
      setor_uang: 1180000,
      sisa_modal: 150000,
      catatan: 'Hujan rintik pukul 20:00 namun pesanan via grab/takeaway meningkat.',
      dibuat_pada: '2026-11-10T01:55:00Z'
    }
  ],
  transaksiKasir: [
    {
      transaksi_id: 'TRX-201',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      items: [
        { nama: 'Coklat Keju Campur', harga: 19000, qty: 1, satuan_roti: 1, porsi: 'UTUH', cara_masak: 'BAKAR' },
        { nama: 'Coklat Keju Pisah', harga: 17000, qty: 1, satuan_roti: 1, porsi: 'UTUH', cara_masak: 'BAKAR' }
      ],
      metode_bayar: 'QRIS',
      total_bayar: 36000,
      total_roti: 2,
      uang_diterima: 36000,
      uang_kembali: 0,
      dibuat_pada: '18:30 WITA'
    },
    {
      transaksi_id: 'TRX-202',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      items: [
        { nama: 'Chococruncy Keju Campur', harga: 25000, qty: 1, satuan_roti: 1, porsi: 'UTUH', cara_masak: 'BAKAR' }
      ],
      metode_bayar: 'CASH',
      total_bayar: 25000,
      total_roti: 1,
      uang_diterima: 50000,
      uang_kembali: 25000,
      dibuat_pada: '19:15 WITA'
    },
    {
      transaksi_id: 'TRX-203',
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Veteran',
      id_karyawan: 'K002',
      nama_karyawan: 'Ahmad Fauzi',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      items: [
        { nama: 'Mentega Susu', harga: 10000, qty: 1, satuan_roti: 1, porsi: 'UTUH', cara_masak: 'BAKAR' },
        { nama: 'Keju', harga: 10000, qty: 1, satuan_roti: 0.5, porsi: 'SEPARUH', cara_masak: 'KUKUS' }
      ],
      metode_bayar: 'CASH',
      total_bayar: 20000,
      total_roti: 1.5,
      uang_diterima: 20000,
      uang_kembali: 0,
      dibuat_pada: '19:40 WITA'
    }
  ],
  bon: [
    {
      bon_id: 'BON-301',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      nominal: 200000,
      catatan: 'Keperluan mendesak servis motor rantai putus',
      status: 'DISETUJUI',
      dibuat_pada: '2026-11-08 14:00',
      diverifikasi_pada: '2026-11-08 15:30',
      catatan_admin: 'Disetujui Bos Rahman. Potong payroll akhir bulan.',
      dibayar: 200000,
      sisa_bon: 200000
    },
    {
      bon_id: 'BON-302',
      id_karyawan: 'K003',
      nama_karyawan: 'Rian Saputra',
      id_cabang: 'CBG03',
      nama_cabang: 'Outlet Kayu Tangi',
      nominal: 150000,
      catatan: 'Biaya tebus resep obat keluarga sakit',
      status: 'DIAJUKAN',
      dibuat_pada: '2026-11-10 16:15',
      diverifikasi_pada: null,
      catatan_admin: '',
      dibayar: 0,
      sisa_bon: 150000
    }
  ],
  requestBahan: [
    {
      request_id: 'REQ-401',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      id_karyawan: 'K001',
      nama_karyawan: 'Budi Santoso',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      roti_sisa: 12,
      request_bahan: [
        { nama: 'Selai Coklat Goldenfil', jumlah: '2 ember' },
        { nama: 'Keju Cheddar Prochiz', jumlah: '4 blok' },
        { nama: 'Mika Box Roti', jumlah: '2 pak' }
      ],
      catatan: 'Stok keju menipis cepat malam ini',
      status: 'DISETUJUI',
      dibuat_pada: '20:00 WITA'
    },
    {
      request_id: 'REQ-402',
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Veteran',
      id_karyawan: 'K002',
      nama_karyawan: 'Ahmad Fauzi',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      roti_sisa: 8,
      request_bahan: [
        { nama: 'Gas LPG 3kg', jumlah: '1 tabung' },
        { nama: 'Margarin BlueBand', jumlah: '3 kg' }
      ],
      catatan: 'Gas cadangan kosong, minta kirim sore',
      status: 'MENUNGGU',
      dibuat_pada: '20:45 WITA'
    }
  ],
  keuangan: [
    {
      keuangan_id: 'KEU-501',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Lambung Mangkurat (Pusat)',
      jenis: 'PEMASUKAN',
      kategori: 'Setoran Shift Kemarin',
      nominal: 1450000,
      catatan: 'Setoran fisik shift Budi Santoso',
      otomatis: true,
      dibuat_pada: '08:30 WITA'
    },
    {
      keuangan_id: 'KEU-502',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Veteran',
      jenis: 'PEMASUKAN',
      kategori: 'Setoran Shift Kemarin',
      nominal: 1180000,
      catatan: 'Setoran fisik shift Ahmad Fauzi',
      otomatis: true,
      dibuat_pada: '08:35 WITA'
    },
    {
      keuangan_id: 'KEU-503',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      id_cabang: 'CBG01',
      nama_cabang: 'Pusat / Gudang Utama',
      jenis: 'PENGELUARAN',
      kategori: 'Belanja Grosir Bahan',
      nominal: 850000,
      catatan: 'Kulakan selai, meses, mentega grosir distributor',
      otomatis: false,
      dibuat_pada: '10:15 WITA'
    }
  ]
};

function loadData(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not read DB file, fallback to defaults');
  }
  return defaultData;
}

let db: AppData = loadData();

function saveData() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save DB file', err);
  }
}

// -------------------------------------------------------------
// REST API Endpoints (Ready for Web Portal & Mobile Flutter App)
// -------------------------------------------------------------

// 1. Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'Roti Bakar Borneo Management & Flutter Mobile API Hub',
    timestamp: new Date().toISOString(),
    roles: ['BOS', 'KARYAWAN']
  });
});

// 2. Authentication (Single login for Bos & Karyawan)
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.karyawan.find(
    (k) => k.username.toLowerCase() === String(username || '').toLowerCase().trim()
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Username tidak ditemukan.' });
  }

  // Simulated authentication check
  res.json({
    success: true,
    message: 'Login berhasil.',
    user: {
      id_karyawan: user.id_karyawan,
      nama: user.nama,
      username: user.username,
      role: user.role, // 'BOS' or 'KARYAWAN'
      id_cabang: user.id_cabang,
      telepon: user.telepon
    },
    token: `bearer_${user.id_karyawan}_${Date.now()}`
  });
});

// 3. Cabang Endpoints
app.get('/api/v1/cabang', (_req, res) => {
  res.json({ success: true, data: db.cabang });
});

app.post('/api/v1/cabang', (req, res) => {
  const { nama_cabang, latitude, longitude, radius_meter, alamat, jam_operasional, telepon } = req.body;
  const newCabang = {
    id_cabang: `CBG0${db.cabang.length + 1}`,
    nama_cabang: nama_cabang || 'Cabang Baru',
    latitude: Number(latitude) || -3.3194,
    longitude: Number(longitude) || 114.5908,
    radius_meter: Number(radius_meter) || 100,
    aktif: true,
    alamat: alamat || '',
    jam_operasional: jam_operasional || '16:30 - 02:00 WITA',
    telepon: telepon || ''
  };
  db.cabang.push(newCabang);
  saveData();
  res.status(201).json({ success: true, data: newCabang });
});

// 4. Karyawan Endpoints
app.get('/api/v1/karyawan', (_req, res) => {
  res.json({ success: true, data: db.karyawan });
});

app.post('/api/v1/karyawan', (req, res) => {
  const { nama, username, role, id_cabang, tarif_per_jam, telepon } = req.body;
  const prefix = role === 'BOS' ? 'BOS' : 'K';
  const newKaryawan = {
    id_karyawan: `${prefix}${String(db.karyawan.length + 1).padStart(3, '0')}`,
    nama,
    username: username.toLowerCase(),
    role: role === 'BOS' ? 'BOS' : 'KARYAWAN',
    id_cabang: id_cabang || 'CBG01',
    tarif_per_jam: Number(tarif_per_jam) || 18000,
    aktif: true,
    telepon: telepon || ''
  };
  db.karyawan.push(newKaryawan);
  saveData();
  res.status(201).json({ success: true, data: newKaryawan });
});

// 5. Shift & Presensi Live Monitoring
app.get('/api/v1/shifts/live', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const data = db.cabang.map((c) => {
    const active = db.shifts.filter((s) => s.id_cabang === c.id_cabang && s.status === 'BUKA');
    const isBuka = active.length > 0;
    const cTrx = db.transaksiKasir.filter(
      (t) => t.id_cabang === c.id_cabang && t.tanggal_operasional === today
    );
    const rotiTerjual = cTrx.reduce((a, b) => a + (b.total_roti || 0), 0);
    const omzetKasir = cTrx.reduce((a, b) => a + (b.total_bayar || 0), 0);

    return {
      id_cabang: c.id_cabang,
      nama_cabang: c.nama_cabang,
      status: isBuka ? 'BUKA' : 'TUTUP',
      jam_buka: isBuka ? active[0].jam_mulai : null,
      karyawan_bertugas: active.map((s) => ({
        id_karyawan: s.id_karyawan,
        nama_karyawan: s.nama_karyawan,
        jam_masuk: s.jam_mulai,
        foto_url: s.foto_masuk_url || null
      })),
      roti_terjual_hari_ini: rotiTerjual,
      omzet_kasir_hari_ini: omzetKasir,
      estimasi_upah: isBuka ? 5.5 * 18000 * active.length : 0
    };
  });
  res.json({ success: true, data });
});

// 6. Mobile Endpoint: Absen Masuk (GPS Geofence + Selfie)
app.post('/api/v1/mobile/absen-masuk', (req, res) => {
  const { id_karyawan, id_cabang, lat, lng, foto_base64 } = req.body;
  const user = db.karyawan.find((k) => k.id_karyawan === id_karyawan);
  const cabang = db.cabang.find((c) => c.id_cabang === id_cabang);

  if (!user || !cabang) {
    return res.status(400).json({ success: false, message: 'Data karyawan atau cabang tidak valid.' });
  }

  const existing = db.shifts.find((s) => s.id_karyawan === id_karyawan && s.status === 'BUKA');
  if (existing) {
    return res.status(400).json({ success: false, message: 'Anda masih memiliki shift yang belum ditutup.' });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const newShift = {
    shift_id: `SH-${Date.now().toString().slice(-6)}`,
    id_cabang,
    id_karyawan,
    nama_karyawan: user.nama,
    tanggal_operasional: now.toISOString().slice(0, 10),
    jam_mulai: timeStr,
    status: 'BUKA',
    lat_masuk: Number(lat),
    lng_masuk: Number(lng),
    foto_masuk_url: foto_base64 || '',
    dibuat_pada: now.toISOString()
  };

  db.shifts.unshift(newShift);
  saveData();
  res.status(201).json({ success: true, message: 'Absen masuk berhasil.', data: newShift });
});

// 7. Mobile Endpoint: Absen Pulang
app.post('/api/v1/mobile/absen-pulang', (req, res) => {
  const { shift_id, lat, lng, foto_base64 } = req.body;
  const shiftIdx = db.shifts.findIndex((s) => s.shift_id === shift_id && s.status === 'BUKA');

  if (shiftIdx === -1) {
    return res.status(404).json({ success: false, message: 'Shift aktif tidak ditemukan.' });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  db.shifts[shiftIdx].status = 'TUTUP_SELESAI';
  db.shifts[shiftIdx].jam_selesai = timeStr;
  db.shifts[shiftIdx].lat_pulang = Number(lat);
  db.shifts[shiftIdx].lng_pulang = Number(lng);
  db.shifts[shiftIdx].foto_pulang_url = foto_base64 || '';
  db.shifts[shiftIdx].diperbarui_pada = now.toISOString();

  saveData();
  res.json({ success: true, message: 'Absen pulang berhasil. Silakan isi laporan shift.', data: db.shifts[shiftIdx] });
});

// 8. Kasir POS Transaksi
app.get('/api/v1/kasir/transaksi', (_req, res) => {
  res.json({ success: true, data: db.transaksiKasir });
});

app.post('/api/v1/kasir/transaksi', (req, res) => {
  const { id_cabang, id_karyawan, items, metode_bayar, total_bayar, total_roti, uang_diterima, uang_kembali } = req.body;
  const cabang = db.cabang.find((c) => c.id_cabang === id_cabang);
  const karyawan = db.karyawan.find((k) => k.id_karyawan === id_karyawan);

  const now = new Date();
  const newTrx = {
    transaksi_id: `TRX-${Date.now().toString().slice(-6)}`,
    id_cabang,
    nama_cabang: cabang ? cabang.nama_cabang : id_cabang,
    id_karyawan,
    nama_karyawan: karyawan ? karyawan.nama : id_karyawan,
    tanggal_operasional: now.toISOString().slice(0, 10),
    items: items || [],
    metode_bayar: metode_bayar || 'CASH',
    total_bayar: Number(total_bayar) || 0,
    total_roti: Number(total_roti) || 0,
    uang_diterima: Number(uang_diterima) || total_bayar,
    uang_kembali: Number(uang_kembali) || 0,
    dibuat_pada: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
  };

  db.transaksiKasir.unshift(newTrx);
  saveData();
  res.status(201).json({ success: true, data: newTrx });
});

// 9. Laporan Shift Endpoints
app.get('/api/v1/laporan-shift', (_req, res) => {
  res.json({ success: true, data: db.laporanShift });
});

app.post('/api/v1/laporan-shift', (req, res) => {
  const data = req.body;
  const newLap = {
    laporan_id: `LAP-${Date.now().toString().slice(-6)}`,
    ...data,
    dibuat_pada: new Date().toISOString()
  };

  db.laporanShift.unshift(newLap);

  // Auto record into Keuangan
  if (Number(data.setor_uang) > 0) {
    db.keuangan.unshift({
      keuangan_id: `KEU-${Date.now().toString().slice(-6)}A`,
      tanggal_operasional: data.tanggal_operasional || new Date().toISOString().slice(0, 10),
      id_cabang: data.id_cabang,
      nama_cabang: data.nama_cabang || 'Outlet',
      jenis: 'PEMASUKAN',
      kategori: 'Setoran Shift',
      nominal: Number(data.setor_uang),
      catatan: `Setoran kasir shift ${data.nama_karyawan || ''}`,
      otomatis: true,
      dibuat_pada: 'Tutup Shift'
    });
  }

  if (Number(data.pengeluaran) > 0) {
    db.keuangan.unshift({
      keuangan_id: `KEU-${Date.now().toString().slice(-6)}B`,
      tanggal_operasional: data.tanggal_operasional || new Date().toISOString().slice(0, 10),
      id_cabang: data.id_cabang,
      nama_cabang: data.nama_cabang || 'Outlet',
      jenis: 'PENGELUARAN',
      kategori: 'Biaya Shift Gerai',
      nominal: Number(data.pengeluaran),
      catatan: `Pengeluaran shift: ${data.catatan || 'Operasional gerai'}`,
      otomatis: true,
      dibuat_pada: 'Tutup Shift'
    });
  }

  saveData();
  res.status(201).json({ success: true, data: newLap });
});

// 10. Kasbon (Bon) Endpoints
app.get('/api/v1/bon', (_req, res) => {
  res.json({ success: true, data: db.bon });
});

app.post('/api/v1/bon/ajukan', (req, res) => {
  const { id_karyawan, id_cabang, nominal, catatan } = req.body;
  const karyawan = db.karyawan.find((k) => k.id_karyawan === id_karyawan);
  const cabang = db.cabang.find((c) => c.id_cabang === id_cabang);

  const newBon = {
    bon_id: `BON-${Date.now().toString().slice(-6)}`,
    id_karyawan,
    nama_karyawan: karyawan ? karyawan.nama : id_karyawan,
    id_cabang,
    nama_cabang: cabang ? cabang.nama_cabang : id_cabang,
    nominal: Number(nominal) || 0,
    catatan: catatan || '',
    status: 'DIAJUKAN',
    dibuat_pada: new Date().toISOString().slice(0, 16).replace('T', ' '),
    diverifikasi_pada: null,
    catatan_admin: '',
    dibayar: 0,
    sisa_bon: Number(nominal) || 0
  };

  db.bon.unshift(newBon);
  saveData();
  res.status(201).json({ success: true, data: newBon });
});

app.post('/api/v1/bon/verifikasi', (req, res) => {
  const { bon_id, status, catatan_admin } = req.body;
  const bon = db.bon.find((b) => b.bon_id === bon_id);
  if (!bon) {
    return res.status(404).json({ success: false, message: 'Data bon tidak ditemukan.' });
  }

  bon.status = status; // 'DISETUJUI' | 'DITOLAK' | 'LUNAS'
  bon.diverifikasi_pada = new Date().toISOString().slice(0, 16).replace('T', ' ');
  bon.catatan_admin = catatan_admin || '';
  if (status === 'DISETUJUI') {
    bon.dibayar = bon.nominal;
    bon.sisa_bon = bon.nominal;
  }

  saveData();
  res.json({ success: true, message: `Kasbon berhasil ${status.toLowerCase()}.`, data: bon });
});

// 11. Request Bahan Baku
app.get('/api/v1/request-bahan', (_req, res) => {
  res.json({ success: true, data: db.requestBahan });
});

app.post('/api/v1/request-bahan', (req, res) => {
  const { id_cabang, id_karyawan, roti_sisa, request_bahan, catatan } = req.body;
  const cabang = db.cabang.find((c) => c.id_cabang === id_cabang);
  const karyawan = db.karyawan.find((k) => k.id_karyawan === id_karyawan);

  const newReq = {
    request_id: `REQ-${Date.now().toString().slice(-6)}`,
    id_cabang,
    nama_cabang: cabang ? cabang.nama_cabang : id_cabang,
    id_karyawan,
    nama_karyawan: karyawan ? karyawan.nama : id_karyawan,
    tanggal_operasional: new Date().toISOString().slice(0, 10),
    roti_sisa: Number(roti_sisa) || 0,
    request_bahan: request_bahan || [],
    catatan: catatan || '',
    status: 'MENUNGGU',
    dibuat_pada: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
  };

  db.requestBahan.unshift(newReq);
  saveData();
  res.status(201).json({ success: true, data: newReq });
});

app.patch('/api/v1/request-bahan/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const reqItem = db.requestBahan.find((r) => r.request_id === id);
  if (!reqItem) {
    return res.status(404).json({ success: false, message: 'Permintaan bahan tidak ditemukan.' });
  }

  reqItem.status = status; // 'MENUNGGU' | 'DISETUJUI' | 'DIKIRIM' | 'SELESAI'
  saveData();
  res.json({ success: true, data: reqItem });
});

// 12. Keuangan Endpoints
app.get('/api/v1/keuangan', (_req, res) => {
  res.json({ success: true, data: db.keuangan });
});

app.post('/api/v1/keuangan', (req, res) => {
  const { tanggal_operasional, id_cabang, jenis, kategori, nominal, catatan } = req.body;
  const cabang = db.cabang.find((c) => c.id_cabang === id_cabang);

  const newEntry = {
    keuangan_id: `KEU-${Date.now().toString().slice(-6)}`,
    tanggal_operasional: tanggal_operasional || new Date().toISOString().slice(0, 10),
    id_cabang: id_cabang || 'CBG01',
    nama_cabang: cabang ? cabang.nama_cabang : 'Pusat',
    jenis, // 'PEMASUKAN' | 'PENGELUARAN'
    kategori: kategori || 'Umum',
    nominal: Number(nominal) || 0,
    catatan: catatan || '',
    otomatis: false,
    dibuat_pada: 'Manual Bos'
  };

  db.keuangan.unshift(newEntry);
  saveData();
  res.status(201).json({ success: true, data: newEntry });
});

// -------------------------------------------------------------
// Vite Frontend Middleware / Static Server
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    // In Express 5, app.use without path matches all requests
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Roti Bakar Borneo] Full-Stack Backend & Web Dashboard running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
