import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../theme/borneo_theme.dart';
import 'api_service.dart';

class AppNotificationItem {
  final String id;
  final String title;
  final String body;
  final String category; // 'BUKA', 'TUTUP', 'KASBON', 'LAPORAN', 'INFO'
  final String timeWib;
  final bool unread;

  AppNotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.category,
    required this.timeWib,
    this.unread = true,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'category': category,
        'time_wib': timeWib,
        'unread': unread,
      };

  factory AppNotificationItem.fromJson(Map<String, dynamic> json) =>
      AppNotificationItem(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        body: (json['body'] ?? '').toString(),
        category: (json['category'] ?? 'INFO').toString(),
        timeWib: (json['time_wib'] ?? '').toString(),
        unread: json['unread'] == true,
      );
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  static const _channelId = 'borneo_outlet_alerts';
  static const _channelName = 'Notifikasi Outlet & Shift';
  static const _keyOutletStatus = 'notif_last_outlet_statuses';
  static const _keyKnownBonIds = 'notif_known_bon_states';
  static const _keyKnownLaporanIds = 'notif_known_laporan_ids';
  static const _keyLogs = 'notif_history_logs';

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  Timer? _timer;
  int _notifCounter = 100;

  final ValueNotifier<List<AppNotificationItem>> logs = ValueNotifier([]);
  final ValueNotifier<AppNotificationItem?> activeBanner = ValueNotifier(null);

  int get unreadCount => logs.value.where((e) => e.unread).length;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidInit,
      iOS: darwinInit,
    );

    await _plugin.initialize(settings);

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.requestNotificationsPermission();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description:
            'Pemberitahuan realtime saat outlet buka, tutup, laporan shift, dan kasbon.',
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
      ),
    );

    await _loadSavedLogs();
  }

  Future<void> _loadSavedLogs() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyLogs);
    if (raw == null || raw.isEmpty) return;
    try {
      final list = (jsonDecode(raw) as List<dynamic>)
          .map((e) => AppNotificationItem.fromJson(e as Map<String, dynamic>))
          .toList();
      logs.value = list;
    } catch (_) {}
  }

  Future<void> _saveLogs(List<AppNotificationItem> items) async {
    final trimmed = items.take(40).toList();
    logs.value = trimmed;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyLogs,
      jsonEncode(trimmed.map((e) => e.toJson()).toList()),
    );
  }

  void startPolling(KaryawanData user) {
    _timer?.cancel();
    checkNow(user, isInitialSeed: false);
    _timer = Timer.periodic(const Duration(seconds: 45), (_) {
      checkNow(user);
    });
  }

  void stopPolling() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> markAllRead() async {
    final updated = logs.value
        .map((e) => AppNotificationItem(
              id: e.id,
              title: e.title,
              body: e.body,
              category: e.category,
              timeWib: e.timeWib,
              unread: false,
            ))
        .toList();
    await _saveLogs(updated);
  }

  Future<void> clearLogs() async {
    await _saveLogs([]);
  }

  Future<void> pushAlert({
    required String title,
    required String body,
    required String category,
    bool showSystemNotif = true,
  }) async {
    final item = AppNotificationItem(
      id: '${DateTime.now().millisecondsSinceEpoch}_${_notifCounter++}',
      title: title,
      body: body,
      category: category,
      timeWib: BorneoTheme.wibClockNow(),
      unread: true,
    );

    await _saveLogs([item, ...logs.value]);
    activeBanner.value = item;
    Future.delayed(const Duration(seconds: 5), () {
      if (activeBanner.value?.id == item.id) {
        activeBanner.value = null;
      }
    });

    if (showSystemNotif && !kIsWeb) {
      try {
        const androidDetails = AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        );
        const darwinDetails = DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        );
        await _plugin.show(
          _notifCounter,
          title,
          body,
          const NotificationDetails(
            android: androidDetails,
            iOS: darwinDetails,
          ),
        );
      } catch (_) {}
    }
  }

  Future<void> checkNow(KaryawanData user, {bool isInitialSeed = false}) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Monitor status buka/tutup semua gerai
      final cabangs = await AppsScriptApiService.getDashboardCabang();
      final prevMapRaw = prefs.getString(_keyOutletStatus);
      final Map<String, String> prevMap = prevMapRaw != null
          ? Map<String, String>.from(jsonDecode(prevMapRaw) as Map)
          : {};
      final bool isFirstOutletCheck = prevMap.isEmpty;

      final Map<String, String> nextMap = {};
      for (final c in cabangs) {
        final curStatus = c.status.toUpperCase();
        nextMap[c.idCabang] = curStatus;
        final prevStatus = prevMap[c.idCabang];

        if (!isFirstOutletCheck && !isInitialSeed && prevStatus != curStatus) {
          if (curStatus == 'BUKA') {
            final staffInfo = c.karyawanAbsen.isNotEmpty
                ? 'Staf: ${c.karyawanAbsen.first.namaKaryawan} (${c.jamBukaPertama ?? c.karyawanAbsen.first.jamMasuk} WIB)'
                : 'Jam buka: ${c.jamBukaPertama ?? BorneoTheme.wibClockNow()}';
            await pushAlert(
              title: 'Outlet Buka: ${c.namaCabang}',
              body: '$staffInfo • Gerai mulai beroperasi.',
              category: 'BUKA',
            );
          } else if (curStatus == 'TUTUP_SELESAI') {
            await pushAlert(
              title: 'Outlet Tutup: ${c.namaCabang}',
              body:
                  'Shift selesai • ${c.rotiTerjualHariIni} roti terjual hari ini.',
              category: 'TUTUP',
            );
          }
        }
      }
      await prefs.setString(_keyOutletStatus, jsonEncode(nextMap));

      // Jika pertama kali app dibuka, simpan ringkasan pembuka tanpa spam notif
      if (isFirstOutletCheck && cabangs.isNotEmpty) {
        final bukaList = cabangs
            .where((c) => c.status.toUpperCase() == 'BUKA')
            .map((c) => c.namaCabang)
            .toList();
        if (bukaList.isNotEmpty && logs.value.isEmpty) {
          await pushAlert(
            title: '${bukaList.length} Outlet Sedang Buka',
            body: 'Aktif saat ini: ${bukaList.join(', ')}',
            category: 'BUKA',
            showSystemNotif: false,
          );
        }
      }

      // 2. Monitor Kasbon & Laporan Shift
      if (user.isBos) {
        final bons = await AppsScriptApiService.getBonAdmin();
        final prevBonsRaw = prefs.getString(_keyKnownBonIds);
        final Map<String, String> prevBons = prevBonsRaw != null
            ? Map<String, String>.from(jsonDecode(prevBonsRaw) as Map)
            : {};
        final bool firstBonCheck = prevBons.isEmpty && prevBonsRaw == null;
        final Map<String, String> nextBons = {};

        for (final b in bons) {
          nextBons[b.bonId] = b.status.toUpperCase();
          if (!firstBonCheck &&
              !prevBons.containsKey(b.bonId) &&
              b.status.toUpperCase() == 'PENDING') {
            await pushAlert(
              title: 'Pengajuan Kasbon Baru',
              body:
                  '${b.namaKaryawan} (${b.namaCabang}) mengajukan ${BorneoTheme.rupiah(b.nominal)}',
              category: 'KASBON',
            );
          }
        }
        await prefs.setString(_keyKnownBonIds, jsonEncode(nextBons));

        final today = BorneoTheme.wibTodayIso();
        final laporans =
            await AppsScriptApiService.getRiwayatLaporanShift(today, today);
        final prevLapRaw = prefs.getString(_keyKnownLaporanIds);
        final Set<String> prevLaps = prevLapRaw != null
            ? Set<String>.from(jsonDecode(prevLapRaw) as List<dynamic>)
            : {};
        final bool firstLapCheck = prevLapRaw == null;
        final Set<String> nextLaps = {};

        for (final l in laporans) {
          nextLaps.add(l.laporanId);
          if (!firstLapCheck && !prevLaps.contains(l.laporanId)) {
            await pushAlert(
              title: 'Laporan Shift Masuk: ${l.namaCabang}',
              body:
                  '${l.namaKaryawan} • Terjual ${l.rotiTerjual} roti • Setor ${BorneoTheme.rupiah(l.setorUang)}',
              category: 'LAPORAN',
            );
          }
        }
        await prefs.setString(_keyKnownLaporanIds, jsonEncode(nextLaps.toList()));
      } else {
        final myBons =
            await AppsScriptApiService.getBonSaya(user.idKaryawan, user.idCabang);
        final prevBonsRaw = prefs.getString(_keyKnownBonIds);
        final Map<String, String> prevBons = prevBonsRaw != null
            ? Map<String, String>.from(jsonDecode(prevBonsRaw) as Map)
            : {};
        final bool firstBonCheck = prevBonsRaw == null;
        final Map<String, String> nextBons = {};

        for (final b in myBons) {
          final st = b.status.toUpperCase();
          nextBons[b.bonId] = st;
          if (!firstBonCheck &&
              prevBons.containsKey(b.bonId) &&
              prevBons[b.bonId] != st) {
            await pushAlert(
              title: 'Status Kasbon: $st',
              body:
                  'Pengajuan ${BorneoTheme.rupiah(b.nominal)} telah diperbarui oleh Bos.',
              category: 'KASBON',
            );
          }
        }
        await prefs.setString(_keyKnownBonIds, jsonEncode(nextBons));
      }
    } catch (_) {
      // Abaikan error polling sementara agar tidak mengganggu UI
    }
  }
}
