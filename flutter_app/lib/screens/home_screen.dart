import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/notification_service.dart';
import '../services/session_service.dart';
import '../theme/borneo_theme.dart';
import 'bos/bos_dashboard_tab.dart';
import 'bos/bos_kelola_tab.dart';
import 'bos/bos_laporan_tab.dart';
import 'bos/bos_payroll_tab.dart';
import 'karyawan/kasir_screen.dart';
import 'karyawan/presensi_tab.dart';
import 'karyawan/riwayat_tab.dart';
import 'login_screen.dart';
import 'profil_tab.dart';

class HomeScreen extends StatefulWidget {
  final KaryawanData user;
  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    NotificationService.instance.startPolling(widget.user);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    NotificationService.instance.stopPolling();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      NotificationService.instance.checkNow(widget.user);
    }
  }

  Future<void> _logout() async {
    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Keluar Akun?'),
        content: Text('Anda akan keluar dari akun ${widget.user.nama}.'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Batal'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Keluar'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    NotificationService.instance.stopPolling();
    await SessionService.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      CupertinoPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Color _catColor(String cat) {
    switch (cat) {
      case 'BUKA':
        return BorneoTheme.success;
      case 'TUTUP':
        return BorneoTheme.danger;
      case 'KASBON':
        return BorneoTheme.accent;
      case 'LAPORAN':
        return BorneoTheme.primary;
      default:
        return BorneoTheme.purple;
    }
  }

  IconData _catIcon(String cat) {
    switch (cat) {
      case 'BUKA':
        return CupertinoIcons.sunrise_fill;
      case 'TUTUP':
        return CupertinoIcons.moon_stars_fill;
      case 'KASBON':
        return CupertinoIcons.creditcard_fill;
      case 'LAPORAN':
        return CupertinoIcons.doc_text_fill;
      default:
        return CupertinoIcons.bell_fill;
    }
  }

  void _openNotifSheet() {
    NotificationService.instance.markAllRead();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.72,
            ),
            decoration: BoxDecoration(
              color: const Color(0xE60B1120),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(color: BorneoTheme.highlightBorder, width: 0.8),
            ),
            child: Column(
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 14, 8),
                  child: Row(
                    children: [
                      const Icon(CupertinoIcons.bell_fill,
                          color: BorneoTheme.accent, size: 20),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Pusat Notifikasi Outlet',
                          style: TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w700),
                        ),
                      ),
                      CupertinoButton(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        onPressed: () {
                          NotificationService.instance.checkNow(widget.user);
                        },
                        child: const Text('Cek Live',
                            style: TextStyle(fontSize: 13)),
                      ),
                      CupertinoButton(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        onPressed: () =>
                            NotificationService.instance.clearLogs(),
                        child: const Text('Bersihkan',
                            style: TextStyle(
                                fontSize: 13, color: BorneoTheme.danger)),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: BorneoTheme.border),
                Expanded(
                  child: ValueListenableBuilder<List<AppNotificationItem>>(
                    valueListenable: NotificationService.instance.logs,
                    builder: (_, items, __) {
                      if (items.isEmpty) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'Belum ada notifikasi baru.\nNotif muncul otomatis saat ada outlet buka, tutup, laporan shift, atau pengajuan kasbon.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: BorneoTheme.textMuted, fontSize: 13),
                            ),
                          ),
                        );
                      }
                      return ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, idx) {
                          final n = items[idx];
                          final col = _catColor(n.category);
                          return GlassCard(
                            padding: const EdgeInsets.all(14),
                            radius: 18,
                            blur: false,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(9),
                                  decoration: BoxDecoration(
                                    color: col.withOpacity(0.16),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(_catIcon(n.category),
                                      color: col, size: 18),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              n.title,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 14),
                                            ),
                                          ),
                                          Text(
                                            n.timeWib,
                                            style: const TextStyle(
                                                fontSize: 11,
                                                color: BorneoTheme.textMuted),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        n.body,
                                        style: const TextStyle(
                                            fontSize: 12.5,
                                            color: BorneoTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isBos = widget.user.isBos;

    final pages = isBos
        ? [
            const BosDashboardTab(),
            const BosPayrollTab(),
            BosLaporanTab(user: widget.user),
            BosKelolaTab(user: widget.user),
          ]
        : [
            PresensiTab(
              user: widget.user,
              onOpenKasir: () => setState(() => _index = 1),
            ),
            KasirScreen(user: widget.user),
            RiwayatTab(user: widget.user),
            ProfilTab(user: widget.user),
          ];

    final titles = isBos
        ? ['Dashboard Gerai', 'Payroll & Bonus', 'Kasir & Laporan', 'Bon & Kelola']
        : ['Presensi & Shift', 'Kasir POS', 'Riwayat & Gaji', 'Profil'];

    final navItems = isBos
        ? const [
            (CupertinoIcons.square_grid_2x2_fill, 'Gerai'),
            (CupertinoIcons.money_dollar_circle_fill, 'Payroll'),
            (CupertinoIcons.doc_chart_fill, 'Laporan'),
            (CupertinoIcons.slider_horizontal_3, 'Kelola'),
          ]
        : const [
            (CupertinoIcons.house_fill, 'Presensi'),
            (CupertinoIcons.bag_fill, 'Kasir'),
            (CupertinoIcons.clock_fill, 'Riwayat'),
            (CupertinoIcons.person_crop_circle_fill, 'Profil'),
          ];

    return Scaffold(
      extendBody: true,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0x99060B16),
                border: Border(
                  bottom: BorderSide(color: BorneoTheme.border, width: 0.7),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              titles[_index],
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              '${widget.user.nama} • ${isBos ? 'BOS / ADMIN' : widget.user.idCabang}',
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: BorneoTheme.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ValueListenableBuilder<List<AppNotificationItem>>(
                        valueListenable: NotificationService.instance.logs,
                        builder: (_, items, __) {
                          final unread = items.where((e) => e.unread).length;
                          return Stack(
                            clipBehavior: Clip.none,
                            children: [
                              CupertinoButton(
                                padding: const EdgeInsets.all(8),
                                onPressed: _openNotifSheet,
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.08),
                                    shape: BoxShape.circle,
                                    border:
                                        Border.all(color: BorneoTheme.border),
                                  ),
                                  child: const Icon(
                                    CupertinoIcons.bell_fill,
                                    size: 18,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              if (unread > 0)
                                Positioned(
                                  right: 6,
                                  top: 6,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: BorneoTheme.danger,
                                      borderRadius: BorderRadius.circular(99),
                                    ),
                                    child: Text(
                                      unread > 9 ? '9+' : '$unread',
                                      style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white),
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                      if (isBos)
                        CupertinoButton(
                          padding: const EdgeInsets.all(6),
                          onPressed: _logout,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.08),
                              shape: BoxShape.circle,
                              border: Border.all(color: BorneoTheme.border),
                            ),
                            child: const Icon(
                              CupertinoIcons.square_arrow_right,
                              size: 18,
                              color: BorneoTheme.danger,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      body: OrbBackdrop(
        child: Stack(
          children: [
            Padding(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 64,
                bottom: 88,
              ),
              child: IndexedStack(
                index: _index,
                children: pages,
              ),
            ),
            // iOS Dynamic Banner alert floating from top
            ValueListenableBuilder<AppNotificationItem?>(
              valueListenable: NotificationService.instance.activeBanner,
              builder: (_, banner, __) {
                if (banner == null) return const SizedBox.shrink();
                final col = _catColor(banner.category);
                return Positioned(
                  top: MediaQuery.of(context).padding.top + 10,
                  left: 14,
                  right: 14,
                  child: GestureDetector(
                    onTap: () {
                      NotificationService.instance.activeBanner.value = null;
                      _openNotifSheet();
                    },
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xE00B1325),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(color: col.withOpacity(0.6)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.45),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: col.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(_catIcon(banner.category),
                                    color: col, size: 18),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      banner.title,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13.5),
                                    ),
                                    Text(
                                      banner.body,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: BorneoTheme.textMuted),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
              child: Container(
                height: 66,
                decoration: BoxDecoration(
                  color: const Color(0xCC0C1425),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                      color: BorneoTheme.highlightBorder, width: 0.8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.45),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: List.generate(navItems.length, (i) {
                    final selected = _index == i;
                    final item = navItems[i];
                    return Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => setState(() => _index = i),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          margin: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 7),
                          decoration: BoxDecoration(
                            color: selected
                                ? BorneoTheme.primary.withOpacity(0.18)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                item.$1,
                                size: 21,
                                color: selected
                                    ? BorneoTheme.primary
                                    : BorneoTheme.textMuted,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.$2,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: selected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: selected
                                      ? BorneoTheme.primary
                                      : BorneoTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
