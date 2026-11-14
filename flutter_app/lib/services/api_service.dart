import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/models.dart';

class AppsScriptApiService {
  static const Duration _timeout = Duration(seconds: 60);

  static Future<Map<String, dynamic>> _get(Map<String, String> params) async {
    final query = {
      'api_key': AppConfig.apiKey,
      ...params,
    };
    final uri = Uri.parse(AppConfig.baseUrl).replace(queryParameters: query);
    final res = await http.get(uri).timeout(_timeout);
    if (res.statusCode < 200 || res.statusCode >= 400) {
      throw Exception('HTTP ${res.statusCode}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Google Apps Script Web App (/exec) membalas POST dengan HTTP 302 redirect ke
  /// script.googleusercontent.com yang berisi payload JSON hasil eksekusi doPost.
  static Future<Map<String, dynamic>> _post(Map<String, dynamic> body) async {
    final client = http.Client();
    try {
      final payload = {'api_key': AppConfig.apiKey, ...body};
      final req = http.Request('POST', Uri.parse(AppConfig.baseUrl))
        ..followRedirects = false
        ..headers['Content-Type'] = 'application/json'
        ..body = jsonEncode(payload);

      final streamed = await client.send(req).timeout(_timeout);
      final res = await http.Response.fromStream(streamed);

      if (res.statusCode == 301 ||
          res.statusCode == 302 ||
          res.statusCode == 303 ||
          res.statusCode == 307 ||
          res.statusCode == 308) {
        final location = res.headers['location'];
        if (location != null && location.isNotEmpty) {
          final follow = await client.get(Uri.parse(location)).timeout(_timeout);
          return jsonDecode(follow.body) as Map<String, dynamic>;
        }
      }

      return jsonDecode(res.body) as Map<String, dynamic>;
    } finally {
      client.close();
    }
  }

  static Future<KaryawanData> login(String username, String password) async {
    final res = await _post({
      'action': 'login',
      'username': username.trim(),
      'password': password.trim(),
    });
    if (res['success'] != true || res['data'] == null) {
      throw Exception(res['message'] ?? 'Username atau kata sandi salah.');
    }
    return KaryawanData.fromJson(res['data'] as Map<String, dynamic>);
  }

  static Future<List<CabangLokasi>> getListCabang() async {
    final res = await _get({'action': 'list_cabang'});
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal mengambil daftar cabang.');
    }
    final rows = res['data'] as List<dynamic>? ?? [];
    final list = <CabangLokasi>[];
    for (int i = 1; i < rows.length; i++) {
      final r = rows[i] as List<dynamic>;
      if (r.length < 5) continue;
      final lat =
          double.tryParse(r[2].toString().trim().replaceAll(',', '.')) ?? 0;
      final lng =
          double.tryParse(r[3].toString().trim().replaceAll(',', '.')) ?? 0;
      final radius =
          double.tryParse(r[4].toString().trim().replaceAll(',', '.')) ?? 100;
      list.add(CabangLokasi(
        idCabang: r[0].toString().trim(),
        namaCabang: r[1].toString().trim(),
        latitude: lat,
        longitude: lng,
        radiusMeter: radius,
      ));
    }
    return list;
  }

  static Future<List<CabangMaster>> getMasterCabang() async {
    final res = await _get({'action': 'master_cabang'});
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => CabangMaster.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<CabangDashboard>> getDashboardCabang() async {
    final res = await _get({
      'action': 'dashboard_cabang',
      '_': DateTime.now().millisecondsSinceEpoch.toString(),
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal memuat dashboard cabang.');
    }
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => CabangDashboard.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<PerformaKaryawan> getPerformaKaryawan(String idKaryawan) async {
    final res = await _get({
      'action': 'performa_karyawan',
      'id_karyawan': idKaryawan,
    });
    if (res['success'] != true || res['data'] == null) {
      return PerformaKaryawan();
    }
    return PerformaKaryawan.fromJson(res['data'] as Map<String, dynamic>);
  }

  static Future<String> absen({
    required String action, // 'absen_masuk' | 'absen_pulang'
    required String idKaryawan,
    required String idCabang,
    required double lat,
    required double lng,
    required String fotoBase64,
  }) async {
    final res = await _post({
      'action': action,
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
      'lat': lat,
      'lng': lng,
      'foto_base64': fotoBase64,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Absen gagal diproses.');
    }
    return (res['message'] ?? 'Absen berhasil dicatat.').toString();
  }

  static Future<LaporanContextData> getLaporanContext(
      String idKaryawan, String idCabang) async {
    final res = await _get({
      'action': 'laporan_context',
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
    });
    if (res['success'] != true || res['data'] == null) {
      return LaporanContextData();
    }
    return LaporanContextData.fromJson(res['data'] as Map<String, dynamic>);
  }

  static Future<String> simpanLaporanShift({
    required String idKaryawan,
    required String idCabang,
    required int rotiDiantar,
    required int rotiSisa,
    required int rotiRusakBonus,
    required double pengeluaran,
    required double setorUang,
    required double sisaModal,
    String? catatan,
  }) async {
    final res = await _post({
      'action': 'simpan_laporan_shift',
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
      'roti_diantar': rotiDiantar,
      'roti_sisa': rotiSisa,
      'roti_rusak_bonus': rotiRusakBonus,
      'pengeluaran': pengeluaran,
      'setor_uang': setorUang,
      'sisa_modal': sisaModal,
      if (catatan != null && catatan.isNotEmpty) 'catatan': catatan,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal mengirim laporan shift.');
    }
    return (res['message'] ?? 'Laporan shift tersimpan.').toString();
  }

  static Future<bool> simpanTransaksiKasir(Map<String, dynamic> payload) async {
    final res = await _post({
      'action': 'simpan_transaksi_kasir',
      ...payload,
    });
    return res['success'] == true;
  }

  static Future<String> ajukanBon({
    required String idKaryawan,
    required String idCabang,
    required double nominal,
    required String catatan,
  }) async {
    final res = await _post({
      'action': 'ajukan_bon',
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
      'nominal': nominal,
      'catatan': catatan,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal mengajukan bon.');
    }
    return (res['message'] ?? 'Pengajuan bon terkirim.').toString();
  }

  static Future<List<BonItem>> getBonSaya(
      String idKaryawan, String idCabang) async {
    final res = await _get({
      'action': 'bon_saya',
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => BonItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<BonItem>> getBonAdmin() async {
    final res = await _get({'action': 'bon_admin'});
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => BonItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<String> verifikasiBon({
    required String idAdmin,
    required String idCabangAdmin,
    required String bonId,
    required String status,
    required double dibayar,
    String catatanAdmin = '',
  }) async {
    final res = await _post({
      'action': 'verifikasi_bon',
      'id_admin': idAdmin,
      'id_cabang_admin': idCabangAdmin,
      'bon_id': bonId,
      'status': status,
      'dibayar': dibayar,
      'catatan_admin': catatanAdmin,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal memverifikasi bon.');
    }
    return (res['message'] ?? 'Bon berhasil diperbarui.').toString();
  }

  static Future<List<PayrollItem>> getPayroll(String start, String end) async {
    final res = await _get({
      'action': 'payroll',
      'tanggal_mulai': start,
      'tanggal_selesai': end,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => PayrollItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<PayrollDailyItem>> getPayrollDetail(
      String idKaryawan, String start, String end) async {
    final res = await _get({
      'action': 'payroll_detail',
      'id_karyawan': idKaryawan,
      'tanggal_mulai': start,
      'tanggal_selesai': end,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => PayrollDailyItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<BonusItem>> getBonus(String start, String end) async {
    final res = await _get({
      'action': 'bonus',
      'tanggal_mulai': start,
      'tanggal_selesai': end,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => BonusItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<RiwayatPresensiItem>> getRiwayatPresensi(
      String start, String end) async {
    final res = await _get({
      'action': 'riwayat_presensi',
      'tanggal_mulai': start,
      'tanggal_selesai': end,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => RiwayatPresensiItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<RiwayatLaporanItem>> getRiwayatLaporanShift(
      String start, String end,
      {String idCabang = ''}) async {
    final res = await _get({
      'action': 'riwayat_laporan_shift',
      'tanggal_mulai': start,
      'tanggal_selesai': end,
      if (idCabang.isNotEmpty) 'id_cabang': idCabang,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map((e) => RiwayatLaporanItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<TransaksiKasirAdminItem>> getTransaksiKasirAdmin(
      {String tanggalOperasional = ''}) async {
    final res = await _get({
      'action': 'transaksi_kasir_admin',
      if (tanggalOperasional.isNotEmpty)
        'tanggal_operasional': tanggalOperasional,
    });
    if (res['success'] != true) return [];
    return (res['data'] as List<dynamic>? ?? [])
        .map(
            (e) => TransaksiKasirAdminItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<KeuanganData> getKeuangan(String start, String end,
      {String idCabang = ''}) async {
    final res = await _get({
      'action': 'keuangan',
      'tanggal_mulai': start,
      'tanggal_selesai': end,
      if (idCabang.isNotEmpty) 'id_cabang': idCabang,
    });
    if (res['success'] != true || res['data'] == null) return KeuanganData();
    return KeuanganData.fromJson(res['data'] as Map<String, dynamic>);
  }

  static Future<String> simpanKeuangan({
    required String idAdmin,
    required String idCabangAdmin,
    required String tanggalOperasional,
    required String idCabang,
    required String jenis,
    required String kategori,
    required double nominal,
    String catatan = '',
  }) async {
    final res = await _post({
      'action': 'simpan_keuangan',
      'id_admin': idAdmin,
      'id_cabang_admin': idCabangAdmin,
      'tanggal_operasional': tanggalOperasional,
      'id_cabang': idCabang,
      'jenis': jenis,
      'kategori': kategori,
      'nominal': nominal,
      'catatan': catatan,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal menyimpan keuangan.');
    }
    return (res['message'] ?? 'Catatan keuangan tersimpan.').toString();
  }

  static Future<String> tambahCabang({
    required String idAdmin,
    required String idCabangAdmin,
    required String idCabang,
    required String namaCabang,
    required double latitude,
    required double longitude,
    required double radiusMeter,
  }) async {
    final res = await _post({
      'action': 'tambah_cabang',
      'id_admin': idAdmin,
      'id_cabang_admin': idCabangAdmin,
      'id_cabang': idCabang,
      'nama_cabang': namaCabang,
      'latitude': latitude,
      'longitude': longitude,
      'radius_meter': radiusMeter,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal menambahkan cabang.');
    }
    return (res['message'] ?? 'Cabang berhasil ditambahkan.').toString();
  }

  static Future<String> tambahKaryawan({
    required String idAdmin,
    required String idCabangAdmin,
    required String idKaryawan,
    required String nama,
    required String username,
    required String password,
    required String idCabang,
    required double tarifPerJam,
  }) async {
    final res = await _post({
      'action': 'tambah_karyawan',
      'id_admin': idAdmin,
      'id_cabang_admin': idCabangAdmin,
      'id_karyawan': idKaryawan,
      'nama': nama,
      'username': username,
      'password': password,
      'role': 'KARYAWAN',
      'id_cabang': idCabang,
      'tarif_per_jam': tarifPerJam,
    });
    if (res['success'] != true) {
      throw Exception(res['message'] ?? 'Gagal menambahkan karyawan.');
    }
    return (res['message'] ?? 'Karyawan berhasil ditambahkan.').toString();
  }
}
