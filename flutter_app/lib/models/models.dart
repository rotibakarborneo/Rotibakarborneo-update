double _toDouble(dynamic v, [double fallback = 0.0]) {
  if (v == null) return fallback;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString().replaceAll(',', '.')) ?? fallback;
}

int _toInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? fallback;
}

class KaryawanData {
  final String idKaryawan;
  final String nama;
  final String role; // 'ADMIN' (Bos) or 'KARYAWAN'
  final String idCabang;
  final String? fotoProfilUrl;

  KaryawanData({
    required this.idKaryawan,
    required this.nama,
    required this.role,
    required this.idCabang,
    this.fotoProfilUrl,
  });

  bool get isBos =>
      role.toUpperCase() == 'ADMIN' || role.toUpperCase() == 'BOS';

  factory KaryawanData.fromJson(Map<String, dynamic> json) => KaryawanData(
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        nama: (json['nama'] ?? '').toString(),
        role: (json['role'] ?? 'KARYAWAN').toString(),
        idCabang: (json['id_cabang'] ?? '').toString(),
        fotoProfilUrl: json['foto_profil_url']?.toString(),
      );
}

class CabangLokasi {
  final String idCabang;
  final String namaCabang;
  final double latitude;
  final double longitude;
  final double radiusMeter;

  CabangLokasi({
    required this.idCabang,
    required this.namaCabang,
    required this.latitude,
    required this.longitude,
    required this.radiusMeter,
  });
}

class CabangMaster {
  final String idCabang;
  final String namaCabang;

  CabangMaster({required this.idCabang, required this.namaCabang});

  factory CabangMaster.fromJson(Map<String, dynamic> json) => CabangMaster(
        idCabang: (json['id_cabang'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
      );
}

class KaryawanAbsen {
  final String namaKaryawan;
  final String jamMasuk;
  final String? fotoUrl;
  final String statusMasuk;

  KaryawanAbsen({
    required this.namaKaryawan,
    required this.jamMasuk,
    this.fotoUrl,
    required this.statusMasuk,
  });

  factory KaryawanAbsen.fromJson(Map<String, dynamic> json) => KaryawanAbsen(
        namaKaryawan: (json['nama_karyawan'] ?? '').toString(),
        jamMasuk: (json['jam_masuk'] ?? '').toString(),
        fotoUrl: json['foto_url']?.toString(),
        statusMasuk: (json['status_masuk'] ?? '').toString(),
      );
}

class CabangDashboard {
  final String idCabang;
  final String namaCabang;
  final String status;
  final String? jamBukaPertama;
  final double totalKerjaHariIni;
  final double estimasiGajiHariIni;
  final int rotiTerjualHariIni;
  final List<KaryawanAbsen> karyawanAbsen;

  CabangDashboard({
    required this.idCabang,
    required this.namaCabang,
    required this.status,
    this.jamBukaPertama,
    required this.totalKerjaHariIni,
    required this.estimasiGajiHariIni,
    required this.rotiTerjualHariIni,
    required this.karyawanAbsen,
  });

  factory CabangDashboard.fromJson(Map<String, dynamic> json) =>
      CabangDashboard(
        idCabang: (json['id_cabang'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
        status: (json['status'] ?? 'BELUM_BUKA').toString(),
        jamBukaPertama: json['jam_buka_pertama']?.toString(),
        totalKerjaHariIni: _toDouble(json['total_kerja_hari_ini']),
        estimasiGajiHariIni: _toDouble(json['estimasi_gaji_hari_ini']),
        rotiTerjualHariIni: _toInt(json['roti_terjual_hari_ini']),
        karyawanAbsen: (json['karyawan_absen'] as List<dynamic>? ?? [])
            .map((e) => KaryawanAbsen.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class PerformaKaryawan {
  final double totalJam;
  final double estimasiGaji;
  final String status;

  PerformaKaryawan({
    this.totalJam = 0.0,
    this.estimasiGaji = 0.0,
    this.status = 'BELUM_ABSEN',
  });

  factory PerformaKaryawan.fromJson(Map<String, dynamic> json) =>
      PerformaKaryawan(
        totalJam: _toDouble(json['total_jam']),
        estimasiGaji: _toDouble(json['estimasi_gaji']),
        status: (json['status'] ?? 'BELUM_ABSEN').toString(),
      );
}

class KasirItem {
  final String nama;
  final double harga;
  final int qty;
  final double satuanRoti;
  final String porsi;
  final String caraMasak;

  KasirItem({
    required this.nama,
    required this.harga,
    required this.qty,
    required this.satuanRoti,
    required this.porsi,
    required this.caraMasak,
  });

  Map<String, dynamic> toJson() => {
        'nama': nama,
        'harga': harga,
        'qty': qty,
        'satuan_roti': satuanRoti,
        'porsi': porsi,
        'cara_masak': caraMasak,
      };

  factory KasirItem.fromJson(Map<String, dynamic> json) => KasirItem(
        nama: (json['nama'] ?? '').toString(),
        harga: _toDouble(json['harga']),
        qty: _toInt(json['qty'], 1),
        satuanRoti: _toDouble(json['satuan_roti'], 1.0),
        porsi: (json['porsi'] ?? 'UTUH').toString(),
        caraMasak: (json['cara_masak'] ?? 'BAKAR').toString(),
      );
}

class LaporanContextData {
  final int rotiSisaKemarin;
  final double penjualanOfflineRoti;

  LaporanContextData({
    this.rotiSisaKemarin = 0,
    this.penjualanOfflineRoti = 0.0,
  });

  factory LaporanContextData.fromJson(Map<String, dynamic> json) =>
      LaporanContextData(
        rotiSisaKemarin: _toInt(json['roti_sisa_kemarin']),
        penjualanOfflineRoti: _toDouble(json['penjualan_offline_roti']),
      );
}

class RiwayatLaporanItem {
  final String laporanId;
  final String tanggalOperasional;
  final String idCabang;
  final String namaCabang;
  final String idKaryawan;
  final String namaKaryawan;
  final int rotiSisaKemarin;
  final int rotiDiantar;
  final int rotiAwal;
  final int rotiSisa;
  final int rotiRusakBonus;
  final double penjualanOfflineRoti;
  final double penjualanLuarKasirRoti;
  final int rotiTerjual;
  final double pengeluaran;
  final double setorUang;
  final String catatan;

  RiwayatLaporanItem({
    required this.laporanId,
    required this.tanggalOperasional,
    required this.idCabang,
    required this.namaCabang,
    required this.idKaryawan,
    required this.namaKaryawan,
    required this.rotiSisaKemarin,
    required this.rotiDiantar,
    required this.rotiAwal,
    required this.rotiSisa,
    required this.rotiRusakBonus,
    required this.penjualanOfflineRoti,
    required this.penjualanLuarKasirRoti,
    required this.rotiTerjual,
    required this.pengeluaran,
    required this.setorUang,
    required this.catatan,
  });

  factory RiwayatLaporanItem.fromJson(Map<String, dynamic> json) =>
      RiwayatLaporanItem(
        laporanId: (json['laporan_id'] ?? '').toString(),
        tanggalOperasional: (json['tanggal_operasional'] ?? '').toString(),
        idCabang: (json['id_cabang'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        namaKaryawan: (json['nama_karyawan'] ?? '').toString(),
        rotiSisaKemarin: _toInt(json['roti_sisa_kemarin']),
        rotiDiantar: _toInt(json['roti_diantar']),
        rotiAwal: _toInt(json['roti_awal']),
        rotiSisa: _toInt(json['roti_sisa']),
        rotiRusakBonus: _toInt(json['roti_rusak_bonus']),
        penjualanOfflineRoti: _toDouble(json['penjualan_offline_roti']),
        penjualanLuarKasirRoti: _toDouble(json['penjualan_luar_kasir_roti']),
        rotiTerjual: _toInt(json['roti_terjual']),
        pengeluaran: _toDouble(json['pengeluaran']),
        setorUang: _toDouble(json['setor_uang']),
        catatan: (json['catatan'] ?? '').toString(),
      );
}

class BonItem {
  final String bonId;
  final double nominal;
  final String catatan;
  final String status;
  final String dibuatPada;
  final double dibayar;
  final double sisaBon;
  final String idKaryawan;
  final String namaKaryawan;
  final String idCabang;
  final String namaCabang;

  BonItem({
    required this.bonId,
    required this.nominal,
    required this.catatan,
    required this.status,
    required this.dibuatPada,
    required this.dibayar,
    required this.sisaBon,
    required this.idKaryawan,
    required this.namaKaryawan,
    required this.idCabang,
    required this.namaCabang,
  });

  factory BonItem.fromJson(Map<String, dynamic> json) => BonItem(
        bonId: (json['bon_id'] ?? '').toString(),
        nominal: _toDouble(json['nominal']),
        catatan: (json['catatan'] ?? '').toString(),
        status: (json['status'] ?? '').toString(),
        dibuatPada: (json['dibuat_pada'] ?? '').toString(),
        dibayar: _toDouble(json['dibayar']),
        sisaBon: _toDouble(json['sisa_bon']),
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        namaKaryawan: (json['nama_karyawan'] ?? '').toString(),
        idCabang: (json['id_cabang'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
      );
}

class PayrollItem {
  final String idKaryawan;
  final String nama;
  final int jumlahHariMasuk;
  final double totalJamKerja;
  final int totalMenitTerlambat;
  final double gajiKotor;
  final double totalPotongan;
  final double gajiBersih;

  PayrollItem({
    required this.idKaryawan,
    required this.nama,
    required this.jumlahHariMasuk,
    required this.totalJamKerja,
    required this.totalMenitTerlambat,
    required this.gajiKotor,
    required this.totalPotongan,
    required this.gajiBersih,
  });

  factory PayrollItem.fromJson(Map<String, dynamic> json) => PayrollItem(
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        nama: (json['nama'] ?? '').toString(),
        jumlahHariMasuk: _toInt(json['jumlah_hari_masuk']),
        totalJamKerja: _toDouble(json['total_jam_kerja']),
        totalMenitTerlambat: _toInt(json['total_menit_terlambat']),
        gajiKotor: _toDouble(json['gaji_kotor']),
        totalPotongan: _toDouble(json['total_potongan']),
        gajiBersih: _toDouble(json['gaji_bersih']),
      );
}

class PayrollDailyItem {
  final String tanggal;
  final String jamMasuk;
  final String jamPulang;
  final double totalJam;
  final int menitTerlambat;
  final double gajiHarian;

  PayrollDailyItem({
    required this.tanggal,
    required this.jamMasuk,
    required this.jamPulang,
    required this.totalJam,
    required this.menitTerlambat,
    required this.gajiHarian,
  });

  factory PayrollDailyItem.fromJson(Map<String, dynamic> json) =>
      PayrollDailyItem(
        tanggal: (json['tanggal'] ?? '').toString(),
        jamMasuk: (json['jam_masuk'] ?? '').toString(),
        jamPulang: (json['jam_pulang'] ?? '').toString(),
        totalJam: _toDouble(json['total_jam']),
        menitTerlambat: _toInt(json['menit_terlambat']),
        gajiHarian: _toDouble(json['gaji_harian']),
      );
}

class BonusItem {
  final String idKaryawan;
  final String namaKaryawan;
  final String idCabang;
  final int totalHari;
  final double totalJam;
  final int rotiTerjual;
  final int targetRoti;
  final int kelebihanRoti;

  BonusItem({
    required this.idKaryawan,
    required this.namaKaryawan,
    required this.idCabang,
    required this.totalHari,
    required this.totalJam,
    required this.rotiTerjual,
    required this.targetRoti,
    required this.kelebihanRoti,
  });

  factory BonusItem.fromJson(Map<String, dynamic> json) => BonusItem(
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        namaKaryawan: (json['nama_karyawan'] ?? '').toString(),
        idCabang: (json['id_cabang'] ?? '').toString(),
        totalHari: _toInt(json['total_hari']),
        totalJam: _toDouble(json['total_jam']),
        rotiTerjual: _toInt(json['roti_terjual']),
        targetRoti: _toInt(json['target_roti']),
        kelebihanRoti: _toInt(json['kelebihan_roti']),
      );
}

class KeuanganItem {
  final String keuanganId;
  final String tanggalOperasional;
  final String idCabang;
  final String namaCabang;
  final String jenis;
  final String kategori;
  final double nominal;
  final String catatan;
  final bool otomatis;

  KeuanganItem({
    required this.keuanganId,
    required this.tanggalOperasional,
    required this.idCabang,
    required this.namaCabang,
    required this.jenis,
    required this.kategori,
    required this.nominal,
    required this.catatan,
    required this.otomatis,
  });

  factory KeuanganItem.fromJson(Map<String, dynamic> json) => KeuanganItem(
        keuanganId: (json['keuangan_id'] ?? '').toString(),
        tanggalOperasional: (json['tanggal_operasional'] ?? '').toString(),
        idCabang: (json['id_cabang'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
        jenis: (json['jenis'] ?? '').toString(),
        kategori: (json['kategori'] ?? '').toString(),
        nominal: _toDouble(json['nominal']),
        catatan: (json['catatan'] ?? '').toString(),
        otomatis: json['otomatis'] == true,
      );
}

class KeuanganData {
  final List<KeuanganItem> transaksi;
  final double totalPemasukan;
  final double totalPengeluaran;

  KeuanganData({
    this.transaksi = const [],
    this.totalPemasukan = 0.0,
    this.totalPengeluaran = 0.0,
  });

  factory KeuanganData.fromJson(Map<String, dynamic> json) => KeuanganData(
        transaksi: (json['transaksi'] as List<dynamic>? ?? [])
            .map((e) => KeuanganItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        totalPemasukan: _toDouble(json['total_pemasukan']),
        totalPengeluaran: _toDouble(json['total_pengeluaran']),
      );
}

class TransaksiKasirAdminItem {
  final String transaksiId;
  final String namaKaryawan;
  final String namaCabang;
  final String metodeBayar;
  final double totalBayar;
  final double totalRoti;
  final String dibuatPada;
  final List<KasirItem> items;

  TransaksiKasirAdminItem({
    required this.transaksiId,
    required this.namaKaryawan,
    required this.namaCabang,
    required this.metodeBayar,
    required this.totalBayar,
    required this.totalRoti,
    required this.dibuatPada,
    required this.items,
  });

  factory TransaksiKasirAdminItem.fromJson(Map<String, dynamic> json) =>
      TransaksiKasirAdminItem(
        transaksiId: (json['transaksi_id'] ?? '').toString(),
        namaKaryawan: (json['nama_karyawan'] ?? '').toString(),
        namaCabang: (json['nama_cabang'] ?? '').toString(),
        metodeBayar: (json['metode_bayar'] ?? '').toString(),
        totalBayar: _toDouble(json['total_bayar']),
        totalRoti: _toDouble(json['total_roti']),
        dibuatPada: (json['dibuat_pada'] ?? '').toString(),
        items: (json['items'] as List<dynamic>? ?? [])
            .map((e) => KasirItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class RiwayatPresensiItem {
  final String idKaryawan;
  final String tanggal;
  final String? jamMasuk;
  final String? jamPulang;
  final String statusPresensi;

  RiwayatPresensiItem({
    required this.idKaryawan,
    required this.tanggal,
    this.jamMasuk,
    this.jamPulang,
    required this.statusPresensi,
  });

  factory RiwayatPresensiItem.fromJson(Map<String, dynamic> json) =>
      RiwayatPresensiItem(
        idKaryawan: (json['id_karyawan'] ?? '').toString(),
        tanggal: (json['tanggal'] ?? '').toString(),
        jamMasuk: json['jam_masuk']?.toString(),
        jamPulang: json['jam_pulang']?.toString(),
        statusPresensi: (json['status_presensi'] ?? '').toString(),
      );
}
