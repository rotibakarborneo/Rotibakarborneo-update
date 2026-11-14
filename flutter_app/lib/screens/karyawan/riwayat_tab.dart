import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class RiwayatTab extends StatefulWidget {
  final KaryawanData user;
  const RiwayatTab({super.key, required this.user});

  @override
  State<RiwayatTab> createState() => _RiwayatTabState();
}

class _RiwayatTabState extends State<RiwayatTab> {
  List<PayrollDailyItem> _daily = [];
  List<RiwayatPresensiItem> _presensi = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final start = BorneoTheme.wibDaysAgoIso(14);
    final end = BorneoTheme.wibTodayIso();
    try {
      final results = await Future.wait([
        AppsScriptApiService.getPayrollDetail(
            widget.user.idKaryawan, start, end),
        AppsScriptApiService.getRiwayatPresensi(start, end),
      ]);
      if (!mounted) return;
      final allPresensi = results[1] as List<RiwayatPresensiItem>;
      setState(() {
        _daily = results[0] as List<PayrollDailyItem>;
        _presensi = allPresensi
            .where((p) => p.idKaryawan == widget.user.idKaryawan)
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalEstimasi = _daily.fold(0.0, (s, e) => s + e.gajiHarian);
    final totalJam = _daily.fold(0.0, (s, e) => s + e.totalJam);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GlassCard(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Rekap 14 Hari Terakhir',
                            style: TextStyle(
                                color: BorneoTheme.textMuted, fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            BorneoTheme.rupiah(totalEstimasi),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: BorneoTheme.accent,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${_daily.length} hari hadir',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${totalJam.toStringAsFixed(1)} jam kerja',
                            style: const TextStyle(
                                fontSize: 12, color: BorneoTheme.primary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Rincian Harian & Upah',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                if (_daily.isEmpty && _presensi.isEmpty)
                  const GlassCard(
                    child: Center(
                        child: Text('Belum ada data presensi 14 hari terakhir.')),
                  )
                else ...[
                  ..._daily.map((d) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GlassCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    d.tanggal,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Masuk ${d.jamMasuk} • Pulang ${d.jamPulang}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.textMuted),
                                  ),
                                  if (d.menitTerlambat > 0)
                                    Text(
                                      'Terlambat ${d.menitTerlambat} mnt',
                                      style: const TextStyle(
                                          fontSize: 11,
                                          color: BorneoTheme.danger),
                                    ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    BorneoTheme.rupiah(d.gajiHarian),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: BorneoTheme.success,
                                    ),
                                  ),
                                  Text(
                                    '${d.totalJam.toStringAsFixed(1)} jam',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.textMuted),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      )),
                  if (_daily.isEmpty)
                    ..._presensi.map((p) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: GlassCard(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(p.tanggal,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                Text(
                                    '${p.jamMasuk ?? '-'} - ${p.jamPulang ?? '-'} (${p.statusPresensi})'),
                              ],
                            ),
                          ),
                        )),
                ],
              ],
            ),
    );
  }
}
