import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import {
  fetchFromGoogleSheets,
  saveDbCache,
  getTodayWib,
  calculateShiftHours,
  calculateLateMinutes,
  normalizeHHMM
} from './sheetSync.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initialize Google Gemini Client on server-side
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// -------------------------------------------------------------
// Database & Read-Only Google Sheets Sync for Roti Bakar Borneo
// -------------------------------------------------------------
const DB_FILE = path.join(__dirname, '.app_data.json');

interface AppData {
  cabang: any[];
  operasionalCabang?: Record<string, any>;
  karyawan: any[];
  shifts: any[];
  laporanShift: any[];
  transaksiKasir: any[];
  bon: any[];
  requestBahan: any[];
  keuangan: any[];
  menuKasir: any[];
  lastSyncedAt?: string;
  latestDate?: string;
}

const defaultData: AppData = {
  cabang: [
    {
      id_cabang: 'CBG01',
      nama_cabang: 'Krapyak',
      latitude: -7.825871319,
      longitude: 110.3607621,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Krapyak Kulon, Panggungharjo, Sewon, Bantul, D.I. Yogyakarta',
      jam_operasional: '15:00 - 02:00 WIB',
      telepon: '0812-5501-8891'
    },
    {
      id_cabang: 'CBG02',
      nama_cabang: 'Kadipiro',
      latitude: -7.800932655,
      longitude: 110.3448945,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Wates KM 3, Kadipiro, Ngestiharjo, Kasihan, Bantul, D.I. Yogyakarta',
      jam_operasional: '15:00 - 02:00 WIB',
      telepon: '0812-5501-8892'
    },
    {
      id_cabang: 'CBG03',
      nama_cabang: 'Jakal',
      latitude: -7.756924692,
      longitude: 110.3821627,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Kaliurang (Jakal) KM 5.5, Caturtunggal, Depok, Sleman, D.I. Yogyakarta',
      jam_operasional: '15:00 - 01:00 WIB',
      telepon: '0812-5501-8893'
    },
    {
      id_cabang: 'CBG04',
      nama_cabang: 'Timoho',
      latitude: -7.790331045,
      longitude: 110.3935796,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Timoho No. 88, Muja Muju, Umbulharjo, Kota Yogyakarta',
      jam_operasional: '12:00 - 23:00 WIB',
      telepon: '0812-5501-8894'
    },
    {
      id_cabang: 'CBG05',
      nama_cabang: 'Malioboro',
      latitude: -7.79346483,
      longitude: 110.363828,
      radius_meter: 100,
      aktif: true,
      alamat: 'Kawasan Malioboro / Sosrowijayan, Sosromenduran, Gedong Tengen, Kota Yogyakarta',
      jam_operasional: '14:00 - 03:00 WIB',
      telepon: '0812-5501-8895'
    },
    {
      id_cabang: 'CBG06',
      nama_cabang: 'Nologaten',
      latitude: -7.782766354,
      longitude: 110.3995415,
      radius_meter: 100,
      aktif: true,
      alamat: 'Jl. Nologaten, Caturtunggal, Kec. Depok, Kabupaten Sleman, D.I. Yogyakarta',
      jam_operasional: '18:00 - 05:00 WIB',
      telepon: '0812-5501-8896'
    }
  ],
  karyawan: [
    {
      id_karyawan: 'ADM001',
      nama: 'Faqih',
      username: 'admin',
      role: 'BOS',
      id_cabang: 'CBG01',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: 'https://drive.google.com/uc?export=view&id=1K4oTmrjGpwl_CfpqWHsYZZGcing4SBBW',
      telepon: '0812-5000-0001',
      dibuat_pada: '04/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR001',
      nama: 'Haris',
      username: 'haris',
      role: 'KARYAWAN',
      id_cabang: 'CBG01',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: '',
      telepon: '0852-4411-9001',
      dibuat_pada: '05/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR002',
      nama: 'Deni',
      username: 'deni',
      role: 'KARYAWAN',
      id_cabang: 'CBG02',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: 'https://drive.google.com/uc?export=view&id=1860RB2Pa0xogCmq03JtEd1H9oAg2FBiU',
      telepon: '0852-4411-9002',
      dibuat_pada: '06/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR003',
      nama: 'Amin',
      username: 'amin',
      role: 'KARYAWAN',
      id_cabang: 'CBG03',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: '',
      telepon: '0852-4411-9003',
      dibuat_pada: '07/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR004',
      nama: 'Arya',
      username: 'arya',
      role: 'KARYAWAN',
      id_cabang: 'CBG04',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: '',
      telepon: '0852-4411-9004',
      dibuat_pada: '08/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR005',
      nama: 'Fadil',
      username: 'fadil',
      role: 'KARYAWAN',
      id_cabang: 'CBG05',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: '',
      telepon: '0852-4411-9005',
      dibuat_pada: '09/08/2026 2:25:05'
    },
    {
      id_karyawan: 'KAR006',
      nama: 'Dito',
      username: 'dito',
      role: 'KARYAWAN',
      id_cabang: 'CBG06',
      tarif_per_jam: 6820,
      aktif: true,
      foto_profil_url: '',
      telepon: '0852-4411-9006',
      dibuat_pada: '09/08/2026 2:25:05'
    }
  ],
  menuKasir: [
    {
      menu_id: 'MN001',
      nama_menu: 'Coklat Keju Campur',
      porsi: 'UTUH',
      harga: 19000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 1
    },
    {
      menu_id: 'MN002',
      nama_menu: 'Coklat Keju Campur',
      porsi: 'SEPARUH',
      harga: 10000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 2
    },
    {
      menu_id: 'MN003',
      nama_menu: 'Chococruncy Keju',
      porsi: 'UTUH',
      harga: 22000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 3
    },
    {
      menu_id: 'MN004',
      nama_menu: 'Chococruncy Keju',
      porsi: 'SEPARUH',
      harga: 12000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 4
    },
    {
      menu_id: 'MN005',
      nama_menu: 'Mentega Susu',
      porsi: 'UTUH',
      harga: 14000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 5
    },
    {
      menu_id: 'MN006',
      nama_menu: 'Mentega Susu',
      porsi: 'SEPARUH',
      harga: 8000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 6
    },
    {
      menu_id: 'MN007',
      nama_menu: 'Keju Spesial',
      porsi: 'UTUH',
      harga: 17000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 7
    },
    {
      menu_id: 'MN008',
      nama_menu: 'Keju Spesial',
      porsi: 'SEPARUH',
      harga: 9000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 8
    },
    {
      menu_id: 'MN009',
      nama_menu: 'Coklat Klasik',
      porsi: 'UTUH',
      harga: 15000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 9
    },
    {
      menu_id: 'MN010',
      nama_menu: 'Coklat Klasik',
      porsi: 'SEPARUH',
      harga: 8000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 10
    },
    {
      menu_id: 'MN011',
      nama_menu: 'Tiramisu Keju',
      porsi: 'UTUH',
      harga: 20000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 11
    },
    {
      menu_id: 'MN012',
      nama_menu: 'Tiramisu Keju',
      porsi: 'SEPARUH',
      harga: 11000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 12
    },
    {
      menu_id: 'MN013',
      nama_menu: 'Nanas Manis',
      porsi: 'UTUH',
      harga: 14000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 13
    },
    {
      menu_id: 'MN014',
      nama_menu: 'Nanas Manis',
      porsi: 'SEPARUH',
      harga: 8000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 14
    },
    {
      menu_id: 'MN015',
      nama_menu: 'Matcha Greentea',
      porsi: 'UTUH',
      harga: 19000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 15
    },
    {
      menu_id: 'MN016',
      nama_menu: 'Matcha Greentea',
      porsi: 'SEPARUH',
      harga: 10000,
      satuan_roti: 0.5,
      cara_masak: 'BAKAR',
      aktif: true,
      urutan: 16
    }
  ],
  shifts: [
    {
      shift_id: 'SH-LIVE-01',
      id_cabang: 'CBG01',
      id_karyawan: 'KAR001',
      nama_karyawan: 'Haris',
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
      nama_cabang: 'Outlet Krapyak',
      id_karyawan: 'KAR001',
      nama_karyawan: 'Haris',
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
      nama_cabang: 'Outlet Kadipiro',
      id_karyawan: 'KAR002',
      nama_karyawan: 'Deni',
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
      dibuat_pada: '18:30 WIB'
    },
    {
      transaksi_id: 'TRX-202',
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Krapyak',
      id_karyawan: 'ADM001',
      nama_karyawan: 'Faqih',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      items: [
        { nama: 'Chococruncy Keju Campur', harga: 25000, qty: 1, satuan_roti: 1, porsi: 'UTUH', cara_masak: 'BAKAR' }
      ],
      metode_bayar: 'CASH',
      total_bayar: 25000,
      total_roti: 1,
      uang_diterima: 50000,
      uang_kembali: 25000,
      dibuat_pada: '19:15 WIB'
    },
    {
      transaksi_id: 'TRX-203',
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Kadipiro',
      id_karyawan: 'KAR002',
      nama_karyawan: 'Deni',
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
      dibuat_pada: '19:40 WIB'
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
      nama_cabang: 'Outlet Krapyak',
      id_karyawan: 'KAR001',
      nama_karyawan: 'Haris',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      roti_sisa: 12,
      request_bahan: [
        { nama: 'Selai Coklat Goldenfil', jumlah: '2 ember' },
        { nama: 'Keju Cheddar Prochiz', jumlah: '4 blok' },
        { nama: 'Mika Box Roti', jumlah: '2 pak' }
      ],
      catatan: 'Stok keju menipis cepat malam ini',
      status: 'DISETUJUI',
      dibuat_pada: '20:00 WIB'
    },
    {
      request_id: 'REQ-402',
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Kadipiro',
      id_karyawan: 'KAR002',
      nama_karyawan: 'Deni',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      roti_sisa: 8,
      request_bahan: [
        { nama: 'Gas LPG 3kg', jumlah: '1 tabung' },
        { nama: 'Margarin BlueBand', jumlah: '3 kg' }
      ],
      catatan: 'Gas cadangan kosong, minta kirim sore',
      status: 'MENUNGGU',
      dibuat_pada: '20:45 WIB'
    }
  ],
  keuangan: [
    {
      keuangan_id: 'KEU-501',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      id_cabang: 'CBG01',
      nama_cabang: 'Outlet Krapyak',
      jenis: 'PEMASUKAN',
      kategori: 'Setoran Shift Kemarin',
      nominal: 1450000,
      catatan: 'Setoran fisik shift Haris',
      otomatis: true,
      dibuat_pada: '08:30 WIB'
    },
    {
      keuangan_id: 'KEU-502',
      tanggal_operasional: new Date().toISOString().slice(0, 10),
      id_cabang: 'CBG02',
      nama_cabang: 'Outlet Kadipiro',
      jenis: 'PEMASUKAN',
      kategori: 'Setoran Shift Kemarin',
      nominal: 1180000,
      catatan: 'Setoran fisik shift Deni',
      otomatis: true,
      dibuat_pada: '08:35 WIB'
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
      dibuat_pada: '10:15 WIB'
    }
  ]
};

function loadData(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!data.menuKasir || data.menuKasir.length === 0) {
        data.menuKasir = defaultData.menuKasir;
      }
      // Sync real employee data if old placeholder existed
      if (data.karyawan && data.karyawan[0] && data.karyawan[0].id_karyawan === 'BOS001') {
        data.karyawan = defaultData.karyawan;
        data.cabang = defaultData.cabang;
      }
      if (data.cabang && data.cabang[0] && (data.cabang[0].nama_cabang.includes('Lambung') || data.cabang[0].nama_cabang === 'Outlet Utama')) {
        data.cabang = defaultData.cabang;
      }
      return data;
    }
  } catch (err) {
    console.warn('Could not read DB file, fallback to defaults');
  }
  return defaultData;
}

let db: AppData = loadData();

function saveData() {
  saveDbCache(DB_FILE, db);
}

async function syncWithGoogleSheets() {
  const fresh = await fetchFromGoogleSheets();
  if (fresh) {
    db = fresh;
    saveData();
    console.log(
      `[SheetSync] Synced live read-only data (${db.shifts.length} shifts, ${db.laporanShift.length} reports, ${db.transaksiKasir.length} trx, latestDate=${db.latestDate})`
    );
    return true;
  }
  return false;
}

// Helper: Compute real payroll & bonus from DB
function computePayrollData(monthFilter?: string) {
  const opMap = db.operasionalCabang || {};
  const cabangMap = Object.fromEntries((db.cabang || []).map((c) => [c.id_cabang, c]));

  // Available months from shifts
  const monthSet = new Set<string>();
  (db.shifts || []).forEach((s) => {
    if (s.tanggal_operasional && /^\d{4}-\d{2}/.test(s.tanggal_operasional)) {
      monthSet.add(s.tanggal_operasional.slice(0, 7));
    }
  });
  const availableMonths = Array.from(monthSet).sort().reverse();
  const activeMonth = monthFilter || availableMonths[0] || 'ALL';

  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const nowHHMM = `${String(nowWib.getUTCHours()).padStart(2, '0')}:${String(nowWib.getUTCMinutes()).padStart(2, '0')}`;

  const staffList = (db.karyawan || []).filter((u) => u.role === 'KARYAWAN');

  const payroll = staffList.map((user) => {
    const empShifts = (db.shifts || []).filter(
      (s) =>
        s.id_karyawan === user.id_karyawan &&
        (activeMonth === 'ALL' || s.tanggal_operasional?.startsWith(activeMonth))
    );

    let totalJam = 0;
    let totalMenitTerlambat = 0;
    let potonganTelat = 0;

    empShifts.forEach((s) => {
      const op = opMap[s.id_cabang] || {
        jam_buka: '15:00',
        toleransi_terlambat_menit: 10,
        potongan_per_15_menit: 750
      };

      let jamKerja = 0;
      if (s.jam_mulai && s.jam_selesai) {
        jamKerja = calculateShiftHours(s.jam_mulai, s.jam_selesai);
      } else if (s.status === 'BUKA' && s.jam_mulai) {
        jamKerja = calculateShiftHours(s.jam_mulai, nowHHMM);
      } else if (s.jam_mulai) {
        // Fallback using linked LaporanShift or standard branch hours
        const linkedLap = (db.laporanShift || []).find((l) => l.shift_id === s.shift_id);
        const endStr = linkedLap?.jam_selesai || op.jam_tutup || '00:00';
        jamKerja = calculateShiftHours(s.jam_mulai, endStr);
      }
      totalJam += jamKerja;

      const lateMin = calculateLateMinutes(
        s.jam_mulai,
        op.jam_buka || '15:00',
        op.toleransi_terlambat_menit ?? 10
      );
      if (lateMin > 0) {
        totalMenitTerlambat += lateMin;
        potonganTelat += Math.ceil(lateMin / 15) * (op.potongan_per_15_menit ?? 750);
      }
    });

    totalJam = Number(totalJam.toFixed(2));
    const tarif = Number(user.tarif_per_jam) || 6820;
    const gajiKotor = Math.round(totalJam * tarif);

    // Authentic unpaid kasbon deduction (DISETUJUI with sisa_bon > 0, or show pending separately)
    const userBons = (db.bon || []).filter((b) => b.id_karyawan === user.id_karyawan);
    const potonganKasbon = userBons
      .filter((b) => b.status === 'DISETUJUI' && Number(b.sisa_bon) > 0)
      .reduce((acc, b) => acc + Number(b.sisa_bon), 0);
    const kasbonMenunggu = userBons
      .filter((b) => b.status === 'MENUNGGU' || b.status === 'DIAJUKAN')
      .reduce((acc, b) => acc + Number(b.nominal), 0);

    const totalPotongan = potonganTelat + potonganKasbon;
    const gajiBersih = Math.max(0, gajiKotor - totalPotongan);
    const cabangInfo = cabangMap[user.id_cabang];

    return {
      id_karyawan: user.id_karyawan,
      nama: user.nama,
      id_cabang: user.id_cabang,
      nama_cabang: cabangInfo?.nama_cabang || user.id_cabang,
      tarif_per_jam: tarif,
      jumlah_hari_masuk: empShifts.length,
      total_jam_kerja: totalJam,
      total_menit_terlambat: totalMenitTerlambat,
      potongan_telat: potonganTelat,
      potongan_kasbon: potonganKasbon,
      kasbon_menunggu: kasbonMenunggu,
      gaji_kotor: gajiKotor,
      total_potongan: totalPotongan,
      gaji_bersih: gajiBersih
    };
  });

  const bonus = staffList.map((user) => {
    const cabangInfo = cabangMap[user.id_cabang];
    const empShifts = (db.shifts || []).filter(
      (s) =>
        s.id_karyawan === user.id_karyawan &&
        (activeMonth === 'ALL' || s.tanggal_operasional?.startsWith(activeMonth))
    );
    const empReports = (db.laporanShift || []).filter(
      (l) =>
        l.id_karyawan === user.id_karyawan &&
        (activeMonth === 'ALL' || l.tanggal_operasional?.startsWith(activeMonth))
    );
    const empTrx = (db.transaksiKasir || []).filter(
      (t) =>
        t.id_karyawan === user.id_karyawan &&
        (activeMonth === 'ALL' || t.tanggal_operasional?.startsWith(activeMonth))
    );

    const rotiFromReports = empReports.reduce((acc, r) => {
      const explicitSold =
        (Number(r.penjualan_offline_roti) || 0) + (Number(r.penjualan_luar_kasir_roti) || 0);
      if (explicitSold > 0) return acc + explicitSold;
      return acc + Math.max(0, (Number(r.roti_awal) || 0) - (Number(r.roti_sisa) || 0));
    }, 0);

    const rotiFromPos = empTrx.reduce((acc, t) => acc + (Number(t.total_roti) || 0), 0);
    const rotiTerjual = Number((rotiFromReports > 0 ? rotiFromReports : rotiFromPos).toFixed(1));
    const targetRoti = Math.max(empShifts.length * 35, 300);
    const kelebihan = Math.max(0, Math.round(rotiTerjual - targetRoti));
    const bonusNominal = kelebihan * 1000;

    const pEntry = payroll.find((p) => p.id_karyawan === user.id_karyawan);

    return {
      id_karyawan: user.id_karyawan,
      nama_karyawan: user.nama,
      id_cabang: user.id_cabang,
      nama_cabang: cabangInfo?.nama_cabang || user.id_cabang,
      total_hari: empShifts.length,
      total_jam: pEntry?.total_jam_kerja || 0,
      roti_terjual: rotiTerjual,
      target_roti: targetRoti,
      kelebihan_roti: kelebihan,
      bonus_nominal: bonusNominal
    };
  });

  return {
    activeMonth,
    availableMonths,
    payroll,
    bonus
  };
}

// -------------------------------------------------------------
// REST API Endpoints (Ready for Web Portal & Mobile Flutter App)
// -------------------------------------------------------------

// 1. Health check & Manual Read-Only Sync
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'Roti Bakar Borneo Management & Flutter Mobile API Hub',
    timestamp: new Date().toISOString(),
    lastSyncedAt: db.lastSyncedAt || null,
    latestDate: db.latestDate || getTodayWib(),
    roles: ['BOS', 'KARYAWAN']
  });
});

app.post('/api/v1/sync', async (_req, res) => {
  const ok = await syncWithGoogleSheets();
  res.json({
    success: ok,
    lastSyncedAt: db.lastSyncedAt || null,
    latestDate: db.latestDate || getTodayWib()
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
    latitude: Number(latitude) || -7.8258,
    longitude: Number(longitude) || 110.3607,
    radius_meter: Number(radius_meter) || 100,
    aktif: true,
    alamat: alamat || '',
    jam_operasional: jam_operasional || '15:00 - 02:00 WIB',
    telepon: telepon || ''
  };
  db.cabang.push(newCabang);
  saveData();
  res.status(201).json({ success: true, data: newCabang });
});

app.put('/api/v1/cabang/:id', (req, res) => {
  const { id } = req.params;
  const index = db.cabang.findIndex((c) => c.id_cabang === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Cabang tidak ditemukan' });
  }

  const existing = db.cabang[index];
  const updated = {
    ...existing,
    ...req.body,
    latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : existing.latitude,
    longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : existing.longitude,
    radius_meter: req.body.radius_meter !== undefined ? Number(req.body.radius_meter) : existing.radius_meter,
    aktif: req.body.aktif !== undefined ? Boolean(req.body.aktif) : existing.aktif
  };

  db.cabang[index] = updated;
  saveData();
  res.json({ success: true, data: updated });
});

app.delete('/api/v1/cabang/:id', (req, res) => {
  const { id } = req.params;
  const index = db.cabang.findIndex((c) => c.id_cabang === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Cabang tidak ditemukan' });
  }

  const deleted = db.cabang.splice(index, 1)[0];
  saveData();
  res.json({ success: true, message: `Cabang ${deleted.nama_cabang} berhasil dihapus`, data: deleted });
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

app.put('/api/v1/karyawan/:id', (req, res) => {
  const { id } = req.params;
  const index = db.karyawan.findIndex((k) => k.id_karyawan === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
  }

  const existing = db.karyawan[index];
  const updated = {
    ...existing,
    ...req.body,
    role: req.body.role === 'BOS' ? 'BOS' : 'KARYAWAN',
    tarif_per_jam: req.body.tarif_per_jam !== undefined ? Number(req.body.tarif_per_jam) : existing.tarif_per_jam,
    aktif: req.body.aktif !== undefined ? Boolean(req.body.aktif) : existing.aktif
  };

  db.karyawan[index] = updated;
  saveData();
  res.json({ success: true, data: updated });
});

app.delete('/api/v1/karyawan/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'BOS001') {
    return res.status(400).json({ success: false, message: 'Akun Super Bos Utama tidak dapat dihapus.' });
  }

  const index = db.karyawan.findIndex((k) => k.id_karyawan === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
  }

  const deleted = db.karyawan.splice(index, 1)[0];
  saveData();
  res.json({ success: true, message: `Karyawan ${deleted.nama} berhasil dihapus`, data: deleted });
});

// 5. Shift & Presensi Live Monitoring
app.get('/api/v1/shifts/live', (_req, res) => {
  const today = db.latestDate || getTodayWib();
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const nowHHMM = `${String(nowWib.getUTCHours()).padStart(2, '0')}:${String(nowWib.getUTCMinutes()).padStart(2, '0')}`;

  const data = (db.cabang || []).map((c) => {
    const active = (db.shifts || []).filter(
      (s) => s.id_cabang === c.id_cabang && s.status === 'BUKA' && s.tanggal_operasional === today
    );
    const isBuka = active.length > 0;

    // Transactions strictly for today's operational date
    const cTrx = (db.transaksiKasir || []).filter(
      (t) => t.id_cabang === c.id_cabang && t.tanggal_operasional === today
    );
    const rotiTerjual = cTrx.reduce((a, b) => a + (Number(b.total_roti) || 0), 0);
    const omzetKasir = cTrx.reduce((a, b) => a + (Number(b.total_bayar) || 0), 0);

    let totalJamLive = 0;
    let totalEstimasiGaji = 0;
    const op = (db.operasionalCabang || {})[c.id_cabang] || {
      jam_buka: '15:00',
      toleransi_terlambat_menit: 10
    };

    const staffList = active.map((s) => {
      const kInfo = (db.karyawan || []).find((k) => k.id_karyawan === s.id_karyawan);
      const tarif = Number(kInfo?.tarif_per_jam) || 6820;
      const jamKerja = s.jam_mulai ? calculateShiftHours(s.jam_mulai, nowHHMM) : 0;
      totalJamLive += jamKerja;
      totalEstimasiGaji += Math.round(jamKerja * tarif);

      const lateMin = calculateLateMinutes(
        s.jam_mulai,
        op.jam_buka || '15:00',
        op.toleransi_terlambat_menit ?? 10
      );

      return {
        nama_karyawan: s.nama_karyawan || kInfo?.nama || s.id_karyawan,
        jam_masuk: s.jam_mulai || op.jam_buka || '15:00',
        foto_url: s.foto_masuk_url || kInfo?.foto_profil_url || null,
        status_masuk: lateMin > 0 ? `TERLAMBAT (${lateMin} mnt)` : 'TEPAT_WAKTU'
      };
    });

    const jamBukaPertama = isBuka ? active[0].jam_mulai || op.jam_buka || '15:00' : null;

    return {
      id_cabang: c.id_cabang,
      nama_cabang: c.nama_cabang,
      status: isBuka ? 'BUKA' : 'TUTUP',
      jam_buka: jamBukaPertama,
      jam_buka_pertama: jamBukaPertama,
      karyawan_absen: staffList,
      karyawan_bertugas: staffList,
      total_kerja_hari_ini: Number(totalJamLive.toFixed(1)),
      estimasi_gaji_hari_ini: totalEstimasiGaji,
      roti_terjual_hari_ini: Number(rotiTerjual.toFixed(1)),
      omzet_kasir_hari_ini: omzetKasir,
      estimasi_upah: totalEstimasiGaji
    };
  });
  res.json({ success: true, data });
});

// 5b. Payroll & Bonus Endpoint (Calculated 100% from DB Shifts, LaporanShift, Bon)
app.get('/api/v1/payroll', (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  const result = computePayrollData(month);
  res.json({ success: true, data: result });
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
    dibuat_pada: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
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
    dibuat_pada: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
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

// 13. Menu Kasir Endpoints (Input Menu Porsi Utuh & Separuh)
app.get('/api/v1/menu', (req, res) => {
  const { porsi } = req.query;
  let items = db.menuKasir || [];
  if (porsi && typeof porsi === 'string') {
    items = items.filter((m) => m.porsi.toUpperCase() === porsi.toUpperCase());
  }
  res.json({ success: true, data: items });
});

app.post('/api/v1/menu', (req, res) => {
  const { nama_menu, porsi, harga, satuan_roti, cara_masak, aktif, urutan, create_both, harga_separuh } = req.body;
  if (!nama_menu) {
    return res.status(400).json({ success: false, message: 'Nama menu wajib diisi.' });
  }

  const list = db.menuKasir || [];

  if (create_both) {
    // Automatically create both Porsi Utuh (1 roti) and Porsi Separuh (0.5 roti)
    const utuhItem = {
      menu_id: `MN${Date.now().toString().slice(-4)}A`,
      nama_menu: nama_menu.trim(),
      porsi: 'UTUH',
      harga: Number(harga) || 0,
      satuan_roti: 1.0,
      cara_masak: cara_masak || 'BAKAR',
      aktif: aktif !== false,
      urutan: list.length + 1,
      diperbarui_pada: new Date().toISOString()
    };
    const separuhItem = {
      menu_id: `MN${Date.now().toString().slice(-4)}B`,
      nama_menu: nama_menu.trim(),
      porsi: 'SEPARUH',
      harga: Number(harga_separuh) || Math.round((Number(harga) || 0) * 0.55),
      satuan_roti: 0.5,
      cara_masak: cara_masak || 'BAKAR',
      aktif: aktif !== false,
      urutan: list.length + 2,
      diperbarui_pada: new Date().toISOString()
    };
    list.push(utuhItem, separuhItem);
    db.menuKasir = list;
    saveData();
    return res.status(201).json({ success: true, data: [utuhItem, separuhItem] });
  }

  const porsiVal = (porsi || 'UTUH').toUpperCase() === 'SEPARUH' ? 'SEPARUH' : 'UTUH';
  const defaultSatuan = porsiVal === 'SEPARUH' ? 0.5 : 1.0;

  const newItem = {
    menu_id: `MN${Date.now().toString().slice(-4)}`,
    nama_menu: nama_menu.trim(),
    porsi: porsiVal,
    harga: Number(harga) || 0,
    satuan_roti: satuan_roti !== undefined ? Number(satuan_roti) : defaultSatuan,
    cara_masak: cara_masak || 'BAKAR',
    aktif: aktif !== false,
    urutan: Number(urutan) || list.length + 1,
    diperbarui_pada: new Date().toISOString()
  };

  list.push(newItem);
  db.menuKasir = list;
  saveData();
  res.status(201).json({ success: true, data: newItem });
});

app.put('/api/v1/menu/:id', (req, res) => {
  const { id } = req.params;
  const list = db.menuKasir || [];
  const idx = list.findIndex((m) => m.menu_id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
  }

  const existing = list[idx];
  const updatedPorsi = req.body.porsi !== undefined ? req.body.porsi.toUpperCase() : existing.porsi;
  const updatedSatuan = req.body.satuan_roti !== undefined
    ? Number(req.body.satuan_roti)
    : (updatedPorsi === 'SEPARUH' ? 0.5 : 1.0);

  const updated = {
    ...existing,
    ...req.body,
    porsi: updatedPorsi,
    satuan_roti: updatedSatuan,
    harga: req.body.harga !== undefined ? Number(req.body.harga) : existing.harga,
    aktif: req.body.aktif !== undefined ? Boolean(req.body.aktif) : existing.aktif,
    diperbarui_pada: new Date().toISOString()
  };

  list[idx] = updated;
  db.menuKasir = list;
  saveData();
  res.json({ success: true, data: updated });
});

app.delete('/api/v1/menu/:id', (req, res) => {
  const { id } = req.params;
  const list = db.menuKasir || [];
  const idx = list.findIndex((m) => m.menu_id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
  }

  const deleted = list.splice(idx, 1)[0];
  db.menuKasir = list;
  saveData();
  res.json({ success: true, message: `Menu ${deleted.nama_menu} (${deleted.porsi}) berhasil dihapus`, data: deleted });
});

// 14. Executive AI Chatbot Endpoint (Gemini + Conversational Grounded Analyst)
app.post('/api/v1/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan pertanyaan wajib diisi.' });
  }

  try {
    const today = db.latestDate || getTodayWib();
    const activeShifts = (db.shifts || []).filter((s) => s.status === 'BUKA' && s.tanggal_operasional === today);
    const totalTrx = (db.transaksiKasir || []).length;
    const totalOmzetAllTime = (db.transaksiKasir || []).reduce((sum, t) => sum + (Number(t.total_bayar) || 0), 0);
    const totalRotiTerjualAllTime = (db.transaksiKasir || []).reduce((sum, t) => sum + (Number(t.total_roti) || 0), 0);

    const todayTrx = (db.transaksiKasir || []).filter((t) => t.tanggal_operasional === today);
    const todayOmzet = todayTrx.reduce((sum, t) => sum + (Number(t.total_bayar) || 0), 0);
    const todayRoti = todayTrx.reduce((sum, t) => sum + (Number(t.total_roti) || 0), 0);

    const pendingBons = (db.bon || []).filter((b) => b.status === 'MENUNGGU' || b.status === 'DIAJUKAN');
    const approvedBons = (db.bon || []).filter((b) => b.status === 'DISETUJUI');
    const lunasBons = (db.bon || []).filter((b) => b.status === 'LUNAS');
    const totalPendingBonNominal = pendingBons.reduce((sum, b) => sum + (Number(b.nominal) || 0), 0);

    const branchStats = (db.cabang || []).map((c) => {
      const bTrx = (db.transaksiKasir || []).filter((t) => t.id_cabang === c.id_cabang);
      const bOmzet = bTrx.reduce((sum, t) => sum + (Number(t.total_bayar) || 0), 0);
      const bRoti = bTrx.reduce((sum, t) => sum + (Number(t.total_roti) || 0), 0);
      const bTodayTrx = bTrx.filter((t) => t.tanggal_operasional === today);
      const bTodayOmzet = bTodayTrx.reduce((sum, t) => sum + (Number(t.total_bayar) || 0), 0);
      const bTodayRoti = bTodayTrx.reduce((sum, t) => sum + (Number(t.total_roti) || 0), 0);
      const bReports = (db.laporanShift || []).filter((l) => l.id_cabang === c.id_cabang);
      const bTotalSetor = bReports.reduce((sum, l) => sum + (Number(l.setor_uang) || 0), 0);
      const bTotalPengeluaran = bReports.reduce((sum, l) => sum + (Number(l.pengeluaran) || 0), 0);
      const activeShift = activeShifts.find((s) => s.id_cabang === c.id_cabang);

      return {
        id_cabang: c.id_cabang,
        nama: c.nama_cabang,
        status: activeShift ? 'BUKA' : 'TUTUP',
        active_staff: activeShift ? activeShift.nama_karyawan : null,
        active_start: activeShift ? activeShift.jam_mulai : null,
        jam_operasional: c.jam_operasional,
        total_transaksi: bTrx.length,
        total_omzet: bOmzet,
        total_roti: Number(bRoti.toFixed(1)),
        today_transaksi: bTodayTrx.length,
        today_omzet: bTodayOmzet,
        today_roti: Number(bTodayRoti.toFixed(1)),
        total_laporan: bReports.length,
        total_setor: bTotalSetor,
        total_pengeluaran: bTotalPengeluaran,
        last_report: bReports[0] || null
      };
    });

    const payrollData = computePayrollData(today.slice(0, 7));
    const payrollAllTime = computePayrollData('ALL');

    const recentReports = (db.laporanShift || []).slice(0, 12);
    const qrisTrx = (db.transaksiKasir || []).filter((t) => t.metode_bayar === 'QRIS');
    const cashTrx = (db.transaksiKasir || []).filter((t) => t.metode_bayar === 'CASH');

    // Full grounded data snapshot for Gemini
    const contextSummary = `
DATA DATABASE OPERASIONAL ASLI ROTI BAKAR BORNEO (LIVE SYNC GOOGLE SHEET):
- Tanggal Operasional Terbaru: ${today} (WIB)
- Status 6 Gerai Yogyakarta Hari Ini (${today}):
${branchStats.map((b) => `  * ${b.nama} (${b.id_cabang}): Status ${b.status}${b.active_staff ? ` [Staf: ${b.active_staff}, Masuk: ${b.active_start} WIB]` : ''}, Jam Operasional: ${b.jam_operasional}, Hari Ini: ${b.today_transaksi} trx / Rp ${b.today_omzet.toLocaleString('id-ID')} (${b.today_roti} roti), Total Akumulasi POS: ${b.total_transaksi} trx / Rp ${b.total_omzet.toLocaleString('id-ID')} (${b.total_roti} roti), Total Setoran Shift: Rp ${b.total_setor.toLocaleString('id-ID')}, Pengeluaran Shift: Rp ${b.total_pengeluaran.toLocaleString('id-ID')}`).join('\n')}
- Penjualan Hari Ini (${today}): ${todayTrx.length} transaksi, Omzet Rp ${todayOmzet.toLocaleString('id-ID')}, ${todayRoti} roti terjual.
- Penjualan Sepanjang Masa: ${totalTrx} transaksi (CASH: ${cashTrx.length} trx / Rp ${cashTrx.reduce((a, b) => a + b.total_bayar, 0).toLocaleString('id-ID')}, QRIS: ${qrisTrx.length} trx / Rp ${qrisTrx.reduce((a, b) => a + b.total_bayar, 0).toLocaleString('id-ID')}), Total Omzet Rp ${totalOmzetAllTime.toLocaleString('id-ID')}, Total Roti ${totalRotiTerjualAllTime}.
- Payroll Bulan ${payrollData.activeMonth} (Tarif Rp 6.820/jam, toleransi telat 10 menit, potongan Rp 750/15 mnt):
${payrollData.payroll.map((p) => `  * ${p.nama} (${p.nama_cabang}): ${p.jumlah_hari_masuk} shift, ${p.total_jam_kerja} jam kerja, telat ${p.total_menit_terlambat} mnt (denda Rp ${p.potongan_telat.toLocaleString('id-ID')}), Gaji Kotor Rp ${p.gaji_kotor.toLocaleString('id-ID')}, Potongan Kasbon Rp ${p.potongan_kasbon.toLocaleString('id-ID')}, Gaji Bersih Rp ${p.gaji_bersih.toLocaleString('id-ID')}`).join('\n')}
- Laporan Shift Terbaru (12 entri terakhir):
${recentReports.map((r) => `  * ${r.tanggal_operasional} | ${r.nama_cabang} (${r.nama_karyawan}): Awal ${r.roti_awal}, Sisa ${r.roti_sisa}, Terjual POS ${r.penjualan_offline_roti} + Luar Kasir ${r.penjualan_luar_kasir_roti}, Rusak/Bonus ${r.roti_rusak_bonus}, Setor Rp ${r.setor_uang.toLocaleString('id-ID')}, Pengeluaran Rp ${r.pengeluaran.toLocaleString('id-ID')}, Sisa Modal Rp ${r.sisa_modal.toLocaleString('id-ID')}, Selisih ${r.selisih_stok}`).join('\n')}
- Data Kasbon (12 pengajuan total):
  * MENUNGGU (${pendingBons.length}): ${pendingBons.map((b) => `${b.nama_karyawan} (${b.nama_cabang}) Rp ${b.nominal.toLocaleString('id-ID')} "${b.catatan}" [${b.dibuat_pada}]`).join('; ')}
  * DISETUJUI (${approvedBons.length}): ${approvedBons.map((b) => `${b.nama_karyawan} Rp ${b.nominal.toLocaleString('id-ID')}`).join('; ')}
  * LUNAS (${lunasBons.length} pengajuan).
- Menu Kasir (${db.menuKasir?.length || 41} varian Utuh & Separuh): ${(db.menuKasir || []).map((m) => `${m.nama_menu} [${m.porsi}: Rp ${Number(m.harga).toLocaleString('id-ID')}]`).join(', ')}
`;

    const systemInstruction = `Anda adalah asisten AI pribadi untuk Owner / Bos Roti Bakar Borneo (Faqih).
Gaya bicara Anda harus persis seperti Gemini: natural, luwes, komunikatif, jelas, tidak kaku seperti template laporan robot, dan langsung menyajikan data apa adanya sesuai fakta database.
Aturan penting:
1. Jawab apa adanya sesuai fakta di database. Jangan mengarang angka, jangan menyembunyikan angka kecil (misal jika di sheet ada angka setor 50 atau pengeluaran 23, sampaikan apa adanya).
2. Sesuaikan jawaban dengan pertanyaan Bos (kalau Bos tanya satu cabang saja, fokus jawab cabang itu; kalau tanya karyawan tertentu, jawab karyawan itu; kalau tanya perbandingan atau sapaan santai, jawab natural dan ringkas).
3. Gunakan format Markdown yang bersih dan mudah dibaca (paragraf singkat, poin rapi jika perlu, atau kalimat langsung). Hindari menumpuk bullet bertingkat yang membingungkan.
4. Gunakan satuan Rupiah (Rp) dan waktu WIB.`;

    let aiReply = '';
    let usedModel = 'gemini-4-hydrogen';

    const hasValidKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'undefined' &&
      process.env.GEMINI_API_KEY.trim().length > 15
    );

    if (hasValidKey) {
      try {
        const chatContents: any[] = [];
        if (Array.isArray(history)) {
          history.slice(-6).forEach((h: any) => {
            if (h && h.text) {
              chatContents.push({
                role: h.sender === 'user' ? 'user' : 'model',
                parts: [{ text: String(h.text) }]
              });
            }
          });
        }
        chatContents.push({
          role: 'user',
          parts: [{ text: `${contextSummary}\n\nPertanyaan Bos:\n${message}` }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: chatContents,
          config: {
            systemInstruction
          }
        });
        aiReply = response.text || '';
      } catch {
        usedModel = 'gemini-grounded';
      }
    } else {
      usedModel = 'gemini-grounded';
    }

    // Natural Conversational Grounded Analyst (when API key unavailable in sandbox)
    if (!aiReply) {
      const q = message.toLowerCase().trim();
      const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

      // Detect mentioned branch
      const mentionedBranch = branchStats.find((b) => q.includes(b.nama.toLowerCase()));
      // Detect mentioned employee
      const mentionedEmp = payrollData.payroll.find((p) => q.includes(p.nama.toLowerCase()));
      const mentionedEmpAll = mentionedEmp
        ? payrollAllTime.payroll.find((p) => p.id_karyawan === mentionedEmp.id_karyawan)
        : null;

      // Conversational greeting
      if (/^(halo|hai|hi|pagi|siang|sore|malam|assalamualaikum|tes|test|p)\b/.test(q) && q.length < 28) {
        const openTxt =
          activeShifts.length > 0
            ? activeShifts.map((s) => `${s.nama_cabang} (dijaga ${s.nama_karyawan} sejak ${s.jam_mulai} WIB)`).join(', ')
            : 'belum ada gerai yang buka';
        aiReply = `Halo Bos! Saat ini tercatat tanggal operasional **${today}** dengan ${activeShifts.length} gerai yang sedang buka, yaitu ${openTxt}. Omzet POS hari ini sudah masuk ${fmtRp(todayOmzet)} dari ${todayTrx.length} transaksi, dan masih ada ${pendingBons.length} pengajuan kasbon yang menunggu persetujuan. Mau cek cabang, laporan shift, atau payroll mana dulu?`;
      }
      // Specific employee question
      else if (mentionedEmp) {
        const empReports = (db.laporanShift || []).filter((l) => l.id_karyawan === mentionedEmp.id_karyawan);
        const lastRep = empReports[0];
        const empBons = (db.bon || []).filter((b) => b.id_karyawan === mentionedEmp.id_karyawan);
        const empActiveShift = activeShifts.find((s) => s.id_karyawan === mentionedEmp.id_karyawan);
        const empBonus = payrollData.bonus.find((b) => b.id_karyawan === mentionedEmp.id_karyawan);

        if (q.includes('kasbon') || q.includes('bon')) {
          if (empBons.length === 0) {
            aiReply = `Untuk **${mentionedEmp.nama}** (${mentionedEmp.nama_cabang}), tidak ada catatan pengajuan kasbon di database sama sekali.`;
          } else {
            aiReply =
              `Berikut catatan kasbon **${mentionedEmp.nama}** (${mentionedEmp.nama_cabang}) di database:\n\n` +
              empBons
                .map(
                  (b) =>
                    `- **${fmtRp(b.nominal)}** (${b.status}) — "${b.catatan}" pada ${b.dibuat_pada}${b.sisa_bon > 0 ? ` (sisa: ${fmtRp(b.sisa_bon)})` : ''}`
                )
                .join('\n');
          }
        } else if (q.includes('gaji') || q.includes('payroll') || q.includes('upah') || q.includes('jam') || q.includes('telat')) {
          aiReply =
            `Berdasarkan rekap presensi **${mentionedEmp.nama}** di cabang **${mentionedEmp.nama_cabang}** untuk bulan **${payrollData.activeMonth}**:\n\n` +
            `- **Kehadiran & Jam Kerja:** ${mentionedEmp.jumlah_hari_masuk} hari masuk dengan total **${mentionedEmp.total_jam_kerja} jam kerja**.\n` +
            `- **Keterlambatan:** Total ${mentionedEmp.total_menit_terlambat} menit (potongan telat ${fmtRp(mentionedEmp.potongan_telat)}).\n` +
            `- **Gaji Kotor:** ${fmtRp(mentionedEmp.gaji_kotor)} (tarif ${fmtRp(mentionedEmp.tarif_per_jam)}/jam).\n` +
            `- **Potongan Kasbon Berjalan:** ${fmtRp(mentionedEmp.potongan_kasbon)}${mentionedEmp.kasbon_menunggu > 0 ? ` (ada ${fmtRp(mentionedEmp.kasbon_menunggu)} masih status MENUNGGU)` : ''}.\n` +
            `- **Total Gaji Bersih Bulan Ini:** **${fmtRp(mentionedEmp.gaji_bersih)}**.\n\n` +
            (mentionedEmpAll
              ? `Sepanjang seluruh riwayat di database, ${mentionedEmp.nama} sudah bekerja ${mentionedEmpAll.jumlah_hari_masuk} shift (${mentionedEmpAll.total_jam_kerja} jam) dan menjual ${empBonus?.roti_terjual || 0} roti bulan ini.`
              : '');
        } else {
          aiReply =
            `Ini kondisi **${mentionedEmp.nama}** (${mentionedEmp.nama_cabang}) sesuai data terakhir di database:\n\n` +
            `- **Status Shift:** ${empActiveShift ? `Sedang BUKA sejak ${empActiveShift.jam_mulai} WIB (${today})` : 'Sedang tidak dalam shift buka'}.\n` +
            `- **Rekap Bulan ${payrollData.activeMonth}:** ${mentionedEmp.jumlah_hari_masuk} shift (${mentionedEmp.total_jam_kerja} jam), estimasi gaji bersih **${fmtRp(mentionedEmp.gaji_bersih)}**.\n` +
            (lastRep
              ? `- **Laporan Shift Terakhir (${lastRep.tanggal_operasional}):** Roti awal ${lastRep.roti_awal}, sisa ${lastRep.roti_sisa}, setor uang ${fmtRp(lastRep.setor_uang)}, pengeluaran ${fmtRp(lastRep.pengeluaran)}, selisih stok ${lastRep.selisih_stok}.`
              : `- Belum ada riwayat laporan shift yang tersimpan.`);
        }
      }
      // Specific branch question
      else if (mentionedBranch) {
        const bReports = (db.laporanShift || []).filter((l) => l.id_cabang === mentionedBranch.id_cabang).slice(0, 5);
        const bTrxToday = todayTrx.filter((t) => t.id_cabang === mentionedBranch.id_cabang);

        aiReply =
          `Berikut data apa adanya untuk cabang **${mentionedBranch.nama} (${mentionedBranch.id_cabang})**:\n\n` +
          `- **Status Saat Ini:** ${mentionedBranch.status === 'BUKA' ? `Sedang **BUKA** (staf: ${mentionedBranch.active_staff}, masuk ${mentionedBranch.active_start} WIB)` : '**TUTUP**'} (jam operasional standar ${mentionedBranch.jam_operasional}).\n` +
          `- **Hari Ini (${today}):** ${bTrxToday.length} transaksi POS dengan omzet **${fmtRp(mentionedBranch.today_omzet)}** (${mentionedBranch.today_roti} roti).\n` +
          `- **Total Sepanjang Data:** ${mentionedBranch.total_transaksi} transaksi POS senilai **${fmtRp(mentionedBranch.total_omzet)}** (${mentionedBranch.total_roti} roti), dengan akumulasi setoran shift ${fmtRp(mentionedBranch.total_setor)} dan pengeluaran ${fmtRp(mentionedBranch.total_pengeluaran)}.\n\n` +
          (bReports.length > 0
            ? `**Laporan Shift Terbaru (${mentionedBranch.nama}):**\n` +
              bReports
                .map(
                  (r) =>
                    `- **${r.tanggal_operasional}** (${r.nama_karyawan}): Roti awal ${r.roti_awal}, sisa ${r.roti_sisa}, setor ${fmtRp(r.setor_uang)}, pengeluaran ${fmtRp(r.pengeluaran)}, sisa modal ${fmtRp(r.sisa_modal)}, selisih ${r.selisih_stok}.`
                )
                .join('\n')
            : `Belum ada laporan shift untuk cabang ${mentionedBranch.nama}.`);
      }
      // Kasbon / Bon queries
      else if (q.includes('kasbon') || q.includes('bon') || q.includes('pinjam') || q.includes('hutang')) {
        const approvedListStr = approvedBons
          .map((b) => `${b.nama_karyawan} ${fmtRp(b.nominal)}`)
          .join(', ');
        aiReply =
          `Di database saat ini ada **${pendingBons.length} pengajuan kasbon yang berstatus MENUNGGU** dengan total **${fmtRp(totalPendingBonNominal)}**:\n\n` +
          (pendingBons.length > 0
            ? pendingBons
                .map((b) => `- **${b.nama_karyawan}** (${b.nama_cabang}): **${fmtRp(b.nominal)}** untuk "${b.catatan}" (${b.dibuat_pada})`)
                .join('\n')
            : '- Tidak ada kasbon menunggu saat ini.') +
          `\n\nSelain itu, ada ${approvedBons.length} kasbon yang sudah berstatus DISETUJUI${approvedListStr ? ` (${approvedListStr})` : ''} dan ${lunasBons.length} pengajuan lainnya sudah LUNAS.`;
      }
      // Payroll / Gaji / Karyawan queries
      else if (q.includes('gaji') || q.includes('payroll') || q.includes('upah') || q.includes('karyawan') || q.includes('staf') || q.includes('telat')) {
        const totalGajiBulanIni = payrollData.payroll.reduce((s, p) => s + p.gaji_bersih, 0);
        aiReply =
          `Rekap **Payroll & Kehadiran Bulan ${payrollData.activeMonth}** sesuai data shift dan aturan cabang (Rp 6.820/jam, toleransi telat 10 menit, denda Rp 750/15 menit) totalnya **${fmtRp(totalGajiBulanIni)}**:\n\n` +
          payrollData.payroll
            .map(
              (p) =>
                `- **${p.nama}** (${p.nama_cabang}): ${p.jumlah_hari_masuk} hari / ${p.total_jam_kerja} jam — Kotor ${fmtRp(p.gaji_kotor)}, Telat ${p.total_menit_terlambat} mnt (-${fmtRp(p.potongan_telat)}), **Bersih ${fmtRp(p.gaji_bersih)}**`
            )
            .join('\n') +
          `\n\nUntuk presensi live hari ini (${today}), saat ini hanya **${activeShifts.map((s) => `${s.nama_karyawan} di ${s.nama_cabang}`).join(', ') || 'belum ada'}** yang sedang aktif bertugas.`;
      }
      // Shift reports / stock / setoran queries
      else if (q.includes('laporan') || q.includes('rekonsiliasi') || q.includes('setor') || q.includes('stok') || q.includes('sisa') || q.includes('selisih') || q.includes('modal')) {
        const selisihNonZero = (db.laporanShift || []).filter((l) => Number(l.selisih_stok) !== 0);
        aiReply =
          `Dari total **${db.laporanShift.length} laporan shift** yang tercatat di database, ada **${selisihNonZero.length} laporan** yang tercatat memiliki selisih stok tidak nol.\n\n` +
          `Berikut **5 laporan shift paling baru**:\n` +
          recentReports
            .slice(0, 5)
            .map(
              (r) =>
                `- **${r.tanggal_operasional} · ${r.nama_cabang}** (${r.nama_karyawan}): Awal ${r.roti_awal} roti, Sisa ${r.roti_sisa} roti, Setor ${fmtRp(r.setor_uang)}, Pengeluaran ${fmtRp(r.pengeluaran)}, Sisa Modal ${fmtRp(r.sisa_modal)}, Selisih ${r.selisih_stok}`
            )
            .join('\n');
      }
      // Sales / Omzet / POS queries
      else if (q.includes('omzet') || q.includes('penjualan') || q.includes('laris') || q.includes('transaksi') || q.includes('kasir') || q.includes('qris') || q.includes('cash') || q.includes('uang')) {
        const sorted = [...branchStats].sort((a, b) => b.total_omzet - a.total_omzet);
        const qrisTotal = qrisTrx.reduce((a, b) => a + b.total_bayar, 0);
        const cashTotal = cashTrx.reduce((a, b) => a + b.total_bayar, 0);
        aiReply =
          `Pada operasional hari ini (**${today}**), tercatat **${todayTrx.length} transaksi** dengan total omzet **${fmtRp(todayOmzet)}** (${todayRoti} roti), seluruhnya berasal dari gerai **Kadipiro**.\n\n` +
          `Kalau dilihat secara keseluruhan dari **${totalTrx} transaksi POS** di database, total omzet mencapai **${fmtRp(totalOmzetAllTime)}** (${totalRotiTerjualAllTime} roti), terbagi menjadi Tunai/Cash **${fmtRp(cashTotal)}** (${cashTrx.length} trx) dan QRIS **${fmtRp(qrisTotal)}** (${qrisTrx.length} trx).\n\n` +
          `Peringkat omzet POS per cabang:\n` +
          sorted.map((b, i) => `${i + 1}. **${b.nama}**: ${fmtRp(b.total_omzet)} (${b.total_roti} roti)`).join('\n');
      }
      // Menu queries
      else if (q.includes('menu') || q.includes('harga') || q.includes('porsi') || q.includes('utuh') || q.includes('separuh')) {
        const utuh = (db.menuKasir || []).filter((m) => m.porsi === 'UTUH');
        const separuh = (db.menuKasir || []).filter((m) => m.porsi === 'SEPARUH');
        const matchedMenus = (db.menuKasir || []).filter((m) => q.includes(m.nama_menu.toLowerCase()));
        if (matchedMenus.length > 0) {
          aiReply =
            `Berikut harga menu yang Anda maksud sesuai database:\n\n` +
            matchedMenus.map((m) => `- **${m.nama_menu}** (${m.porsi}): **${fmtRp(m.harga)}** (${m.satuan_roti} roti)`).join('\n');
        } else {
          aiReply =
            `Di master menu kasir ada **${db.menuKasir.length} varian aktif**, terdiri dari **${utuh.length} menu porsi Utuh** (mulai ${fmtRp(Math.min(...utuh.map((m) => m.harga)))} sampai ${fmtRp(Math.max(...utuh.map((m) => m.harga)))}) dan **${separuh.length} menu porsi Separuh** (mulai ${fmtRp(Math.min(...separuh.map((m) => m.harga)))} sampai ${fmtRp(Math.max(...separuh.map((m) => m.harga)))}). Mau cek harga rasa tertentu, Bos?`;
        }
      }
      // Open / Close / General outlet status
      else if (q.includes('buka') || q.includes('tutup') || q.includes('outlet') || q.includes('cabang') || q.includes('gerai') || q.includes('monitoring')) {
        const openBranches = branchStats.filter((b) => b.status === 'BUKA');
        const closedBranches = branchStats.filter((b) => b.status === 'TUTUP');
        aiReply =
          `Sesuai data shift tanggal **${today}**, saat ini hanya ada **${openBranches.length} gerai yang berstatus BUKA**:\n\n` +
          openBranches
            .map(
              (b) =>
                `- **${b.nama} (${b.id_cabang})** dijaga oleh **${b.active_staff}** sejak pukul **${b.active_start} WIB**, dengan penjualan hari ini **${fmtRp(b.today_omzet)}** (${b.today_transaksi} transaksi, ${b.today_roti} roti).`
            )
            .join('\n') +
          `\n\nSementara **${closedBranches.length} gerai lainnya** (${closedBranches.map((b) => b.nama).join(', ')}) sedang **TUTUP** dan tidak ada transaksi hari ini.`;
      }
      // General catch-all summary
      else {
        const openTxt =
          activeShifts.length > 0
            ? `${activeShifts.length} gerai (${activeShifts.map((s) => `${s.nama_cabang} oleh ${s.nama_karyawan}`).join(', ')})`
            : '0 gerai';
        aiReply =
          `Berikut kondisi terkini Roti Bakar Borneo per **${today}** langsung dari database:\n\n` +
          `- **Gerai Buka:** ${openTxt}; 5 gerai lainnya tutup.\n` +
          `- **Omzet Hari Ini:** ${fmtRp(todayOmzet)} dari ${todayTrx.length} transaksi (${todayRoti} roti).\n` +
          `- **Akumulasi Total POS:** ${fmtRp(totalOmzetAllTime)} dari ${totalTrx} transaksi (${totalRotiTerjualAllTime} roti).\n` +
          `- **Kasbon Menunggu:** ${pendingBons.length} pengajuan senilai total ${fmtRp(totalPendingBonNominal)}.\n` +
          `- **Payroll Bulan ${payrollData.activeMonth}:** Total gaji bersih ${fmtRp(payrollData.payroll.reduce((s, p) => s + p.gaji_bersih, 0))} untuk ${payrollData.payroll.length} karyawan.\n\n` +
          `Bos bisa tanya detail spesifik tentang nama cabang, nama karyawan, laporan shift, atau menu tertentu.`;
      }
    }

    return res.json({
      success: true,
      data: {
        reply: aiReply,
        model: usedModel
      }
    });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal memproses pesan AI.'
    });
  }
});

// -------------------------------------------------------------
// Vite Frontend Middleware / Static Server
// -------------------------------------------------------------
async function startServer() {
  // Initial live read-only sync from Google Sheets
  await syncWithGoogleSheets();

  // Periodic read-only sync every 60 seconds so live Google Sheet updates stay fresh
  setInterval(() => {
    syncWithGoogleSheets().catch(() => {});
  }, 60000);

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
