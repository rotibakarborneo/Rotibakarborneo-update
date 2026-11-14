export type Role = 'BOS' | 'KARYAWAN';

export interface User {
  id_karyawan: string;
  nama: string;
  username: string;
  role: Role; // Exactly 2 roles: 'BOS' or 'KARYAWAN'
  id_cabang: string;
  foto_profil_url?: string;
  tarif_per_jam?: number;
  aktif?: boolean;
  telepon?: string;
}

export interface Cabang {
  id_cabang: string;
  nama_cabang: string;
  latitude: number;
  longitude: number;
  radius_meter: number;
  aktif: boolean;
  alamat?: string;
  jam_operasional?: string;
  telepon?: string;
}

export interface KaryawanAbsen {
  nama_karyawan: string;
  jam_masuk: string;
  foto_url?: string;
  status_masuk: 'TEPAT_WAKTU' | 'TERLAMBAT' | string;
}

export interface CabangDashboard {
  id_cabang: string;
  nama_cabang: string;
  status: 'BUKA' | 'TUTUP';
  jam_buka_pertama: string | null;
  total_kerja_hari_ini: number;
  estimasi_gaji_hari_ini: number;
  roti_terjual_hari_ini: number;
  karyawan_absen: KaryawanAbsen[];
}

export interface Shift {
  shift_id: string;
  id_cabang: string;
  id_karyawan: string;
  nama_karyawan?: string;
  tanggal_operasional: string;
  jam_mulai: string;
  jam_selesai?: string;
  status: 'BUKA' | 'TUTUP_SELESAI';
  lat_masuk: number;
  lng_masuk: number;
  lat_pulang?: number;
  lng_pulang?: number;
  foto_masuk_url?: string;
  foto_pulang_url?: string;
  dibuat_pada: string;
  diperbarui_pada?: string;
}

export interface BahanHabis {
  nama: string;
  jumlah: string;
}

export interface LaporanShift {
  laporan_id: string;
  shift_id: string;
  id_cabang: string;
  nama_cabang?: string;
  id_karyawan: string;
  nama_karyawan?: string;
  tanggal_operasional: string;
  jam_mulai?: string;
  jam_selesai?: string;
  roti_awal: number;
  roti_sisa: number;
  roti_sisa_kemarin: number;
  roti_diantar: number;
  roti_rusak_bonus: number;
  penjualan_offline_roti: number;
  penjualan_luar_kasir_roti: number;
  selisih_stok: number;
  bahan_habis: BahanHabis[];
  pengeluaran: number;
  setor_uang: number;
  sisa_modal: number;
  catatan?: string;
  dibuat_pada: string;
}

export interface KasirItem {
  nama: string;
  harga: number;
  qty: number;
  satuan_roti: number;
  porsi: 'UTUH' | 'SEPARUH';
  cara_masak: 'BAKAR' | 'KUKUS';
  catatan?: string;
}

export interface TransaksiKasir {
  transaksi_id: string;
  id_cabang: string;
  nama_cabang: string;
  id_karyawan: string;
  nama_karyawan: string;
  tanggal_operasional: string;
  items: KasirItem[];
  metode_bayar: 'CASH' | 'QRIS' | 'TRANSFER';
  total_bayar: number;
  total_roti: number;
  uang_diterima?: number;
  uang_kembali?: number;
  dibuat_pada: string;
}

export interface BonItem {
  bon_id: string;
  id_karyawan: string;
  nama_karyawan: string;
  id_cabang: string;
  nama_cabang: string;
  nominal: number;
  catatan: string;
  status: 'MENUNGGU' | 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'LUNAS';
  dibuat_pada: string;
  diverifikasi_pada?: string | null;
  catatan_admin?: string;
  dibayar: number;
  sisa_bon: number;
}

export interface RequestBahanItem {
  request_id: string;
  id_cabang: string;
  nama_cabang: string;
  id_karyawan: string;
  nama_karyawan: string;
  tanggal_operasional: string;
  roti_sisa: number;
  request_bahan: BahanHabis[];
  catatan?: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DIKIRIM' | 'SELESAI';
  dibuat_pada: string;
}

export interface KeuanganItem {
  keuangan_id: string;
  tanggal_operasional: string;
  id_cabang: string;
  nama_cabang: string;
  jenis: 'PEMASUKAN' | 'PENGELUARAN';
  kategori: string;
  nominal: number;
  catatan: string;
  otomatis?: boolean;
  dibuat_oleh?: string;
  dibuat_pada: string;
}

export interface PayrollItem {
  id_karyawan: string;
  nama: string;
  id_cabang?: string;
  nama_cabang: string;
  tarif_per_jam: number;
  jumlah_hari_masuk: number;
  total_jam_kerja: number;
  total_menit_terlambat: number;
  potongan_telat: number;
  potongan_kasbon: number;
  kasbon_menunggu: number;
  gaji_kotor: number;
  total_potongan: number;
  gaji_bersih: number;
}

export interface BonusItem {
  id_karyawan: string;
  nama_karyawan: string;
  id_cabang: string;
  nama_cabang: string;
  total_hari: number;
  total_jam: number;
  roti_terjual: number;
  target_roti: number;
  kelebihan_roti: number;
  bonus_nominal: number;
}

export interface MenuKasirItem {
  menu_id: string;
  nama_menu: string;
  porsi: 'UTUH' | 'SEPARUH';
  harga: number;
  satuan_roti: number; // 1.0 untuk UTUH, 0.5 untuk SEPARUH
  cara_masak?: 'BAKAR' | 'KUKUS' | 'SEMUA';
  aktif: boolean;
  urutan?: number;
  diperbarui_pada?: string;
}

