import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class BosDashboardTab extends StatefulWidget {
  const BosDashboardTab({super.key});

  @override
  State<BosDashboardTab> createState() => _BosDashboardTabState();
}

class _BosDashboardTabState extends State<BosDashboardTab> {
  List<CabangDashboard> _cabangs = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await AppsScriptApiService.getDashboardCabang();
      if (!mounted) return;
      setState(() {
        _cabangs = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'BUKA':
        return BorneoTheme.success;
      case 'TUTUP_SELESAI':
        return BorneoTheme.primary;
      default:
        return BorneoTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalBuka =
        _cabangs.where((c) => c.status.toUpperCase() == 'BUKA').length;
    final totalRoti = _cabangs.fold(0, (s, c) => s + c.rotiTerjualHariIni);
    final totalUpah =
        _cabangs.fold(0.0, (s, c) => s + c.estimasiGajiHariIni);

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: _loading
          ? const Center(child: CupertinoActivityIndicator(radius: 15))
          : _error != null
              ? ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    GlassCard(
                      child: Column(
                        children: [
                          Text(_error!,
                              style:
                                  const TextStyle(color: BorneoTheme.danger)),
                          const SizedBox(height: 12),
                          CupertinoButton.filled(
                            onPressed: _loadDashboard,
                            child: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _kpiCard(
                            'Gerai Buka',
                            '$totalBuka / ${_cabangs.length}',
                            BorneoTheme.success,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _kpiCard(
                            'Roti Terjual',
                            '$totalRoti porsi',
                            BorneoTheme.accent,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _kpiCard(
                            'Est. Upah',
                            BorneoTheme.rupiah(totalUpah),
                            BorneoTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Pemantauan Gerai Live',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        IosPill(
                          text: 'Notif Otomatis Aktif',
                          color: BorneoTheme.primary,
                          icon: CupertinoIcons.bell_fill,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ..._cabangs.map((c) {
                      final col = _statusColor(c.status);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${c.namaCabang} (${c.idCabang})',
                                      style: const TextStyle(
                                          fontSize: 15.5,
                                          fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                  IosPill(text: c.status, color: col),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 14,
                                runSpacing: 6,
                                children: [
                                  Text(
                                    'Buka: ${c.jamBukaPertama ?? '-'} WIB',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.textMuted),
                                  ),
                                  Text(
                                    'Roti: ${c.rotiTerjualHariIni}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.accent,
                                        fontWeight: FontWeight.w700),
                                  ),
                                  Text(
                                    'Kerja: ${c.totalKerjaHariIni.toStringAsFixed(1)} jam',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.textMuted),
                                  ),
                                  Text(
                                    'Upah: ${BorneoTheme.rupiah(c.estimasiGajiHariIni)}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.primary),
                                  ),
                                ],
                              ),
                              if (c.karyawanAbsen.isNotEmpty) ...[
                                const Divider(
                                    height: 18, color: BorneoTheme.border),
                                ...c.karyawanAbsen.map((k) => Padding(
                                      padding: const EdgeInsets.only(bottom: 4),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            k.namaKaryawan,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13),
                                          ),
                                          Text(
                                            '${k.jamMasuk} • ${k.statusMasuk}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: k.statusMasuk
                                                      .toUpperCase()
                                                      .contains('TELAT')
                                                  ? BorneoTheme.danger
                                                  : BorneoTheme.success,
                                            ),
                                          ),
                                        ],
                                      ),
                                    )),
                              ],
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
    );
  }

  Widget _kpiCard(String label, String val, Color col) {
    return GlassCard(
      padding: const EdgeInsets.all(12),
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 11, color: BorneoTheme.textMuted)),
          const SizedBox(height: 4),
          Text(
            val,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                fontWeight: FontWeight.bold, fontSize: 14, color: col),
          ),
        ],
      ),
    );
  }
}
