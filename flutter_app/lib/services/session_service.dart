import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class SessionService {
  static const _keyId = 'id_karyawan';
  static const _keyNama = 'nama';
  static const _keyRole = 'role';
  static const _keyCabang = 'id_cabang';
  static const _keyFoto = 'foto_profil_url';
  static const _keyKasirQueue = 'antrian_kasir_lokal';

  static Future<void> saveLogin(KaryawanData user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyId, user.idKaryawan);
    await prefs.setString(_keyNama, user.nama);
    await prefs.setString(_keyRole, user.role);
    await prefs.setString(_keyCabang, user.idCabang);
    if (user.fotoProfilUrl != null) {
      await prefs.setString(_keyFoto, user.fotoProfilUrl!);
    }
  }

  static Future<KaryawanData?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_keyId);
    if (id == null || id.isEmpty) return null;
    return KaryawanData(
      idKaryawan: id,
      nama: prefs.getString(_keyNama) ?? '',
      role: prefs.getString(_keyRole) ?? 'KARYAWAN',
      idCabang: prefs.getString(_keyCabang) ?? '',
      fotoProfilUrl: prefs.getString(_keyFoto),
    );
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyId);
    await prefs.remove(_keyNama);
    await prefs.remove(_keyRole);
    await prefs.remove(_keyCabang);
    await prefs.remove(_keyFoto);
  }

  static Future<List<Map<String, dynamic>>> getKasirQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyKasirQueue);
    if (raw == null || raw.isEmpty) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  static Future<void> saveKasirQueue(List<Map<String, dynamic>> queue) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyKasirQueue, jsonEncode(queue));
  }
}
