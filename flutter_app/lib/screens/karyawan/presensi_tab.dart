import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../theme/borneo_theme.dart';
import 'absen_screen.dart';
import 'bon_screen.dart';
import 'laporan_shift_screen.dart';

class PresensiTab extends StatefulWidget {
  final KaryawanData user;
  final VoidCallback onOpenKasir;

  const PresensiTab({
    super.key,
    required this.user,
    required this.onOpenKasir,
  });

  @override
  State<PresensiTab> createState() => _PresensiTabState();
}

class _PresensiTabState extends State<PresensiTab> {
  PerformaKaryawan _performa = PerformaKaryawan();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPerforma();
  }

  Future<void> _loadPerforma() async {
    setState(() => _loading = true);
    try {
      final res =
          await AppsScriptApiService.getPerformaKaryawan(widget.user.idKaryawan);
      if (!mounted) return;
      setState(() {
        _performa = res;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadPerforma,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Halo, ${widget.user.nama}',
                            style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.3),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'ID: ${widget.user.idKaryawan} • Gerai: ${widget.user.idCabang}',
                            style: const TextStyle(
                                fontSize: 12.5, color: BorneoTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                    IosPill(
                      text: _performa.status,
                      color: _performa.status == 'BUKA'
                          ? BorneoTheme.success
                          : BorneoTheme.primary,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_loading)
                  const Center(child: CupertinoActivityIndicator())
                else
                  Row(
                    children: [
                      Expanded(
                        child: _metricBox(
                          'Durasi Shift',
                          '${_performa.totalJam.toStringAsFixed(1)} jam',
                          BorneoTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _metricBox(
                          'Estimasi Upah',
                          BorneoTheme.rupiah(_performa.estimasiGaji),
                          BorneoTheme.accent,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Menu Operasional',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.24,
            children: [
              _menuCard(
                icon: CupertinoIcons.camera_fill,
                color: BorneoTheme.success,
                title: 'Absen GPS & Selfie',
                subtitle: 'Masuk / Pulang outlet',
                onTap: () async {
                  final updated = await Navigator.push<bool>(
                    context,
                    CupertinoPageRoute(
                      builder: (_) => AbsenScreen(user: widget.user),
                    ),
                  );
                  if (updated == true) {
                    await _loadPerforma();
                    NotificationService.instance.checkNow(widget.user);
                  }
                },
              ),
              _menuCard(
                icon: CupertinoIcons.bag_fill,
                color: BorneoTheme.primary,
                title: 'Kasir POS',
                subtitle: 'Input penjualan roti',
                onTap: widget.onOpenKasir,
              ),
              _menuCard(
                icon: CupertinoIcons.doc_checkmark_fill,
                color: BorneoTheme.accent,
                title: 'Laporan Shift',
                subtitle: 'Setoran & sisa roti',
                onTap: () async {
                  await Navigator.push(
                    context,
                    CupertinoPageRoute(
                      builder: (_) => LaporanShiftScreen(user: widget.user),
                    ),
                  );
                  await _loadPerforma();
                  NotificationService.instance.checkNow(widget.user);
                },
              ),
              _menuCard(
                icon: CupertinoIcons.creditcard_fill,
                color: BorneoTheme.purple,
                title: 'Kasbon',
                subtitle: 'Ajukan & cek saldo',
                onTap: () {
                  Navigator.push(
                    context,
                    CupertinoPageRoute(
                      builder: (_) => BonScreen(user: widget.user),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricBox(String label, String value, Color valColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: BorneoTheme.fieldBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: BorneoTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: BorneoTheme.textMuted),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: valColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 14),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                      fontSize: 11.5, color: BorneoTheme.textMuted),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
