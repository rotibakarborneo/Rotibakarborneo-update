import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class BosPayrollTab extends StatefulWidget {
  const BosPayrollTab({super.key});

  @override
  State<BosPayrollTab> createState() => _BosPayrollTabState();
}

class _BosPayrollTabState extends State<BosPayrollTab> {
  String _start = BorneoTheme.wibDaysAgoIso(30);
  String _end = BorneoTheme.wibTodayIso();
  int _subTab = 0; // 0 = Payroll, 1 = Bonus
  List<PayrollItem> _payroll = [];
  List<BonusItem> _bonus = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        AppsScriptApiService.getPayroll(_start, _end),
        AppsScriptApiService.getBonus(_start, _end),
      ]);
      if (!mounted) return;
      setState(() {
        _payroll = results[0] as List<PayrollItem>;
        _bonus = results[1] as List<BonusItem>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024, 1, 1),
      lastDate: now.add(const Duration(days: 1)),
      initialDateRange: DateTimeRange(
        start:
            DateTime.tryParse(_start) ?? now.subtract(const Duration(days: 30)),
        end: DateTime.tryParse(_end) ?? now,
      ),
    );
    if (picked == null) return;
    String fmt(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    setState(() {
      _start = fmt(picked.start);
      _end = fmt(picked.end);
    });
    _loadData();
  }

  Future<void> _openDetail(PayrollItem item) async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            color: const Color(0xE60B1120),
            padding: const EdgeInsets.all(18),
            child: FutureBuilder<List<PayrollDailyItem>>(
              future: AppsScriptApiService.getPayrollDetail(
                  item.idKaryawan, _start, _end),
              builder: (ctx, snap) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Detail Harian: ${item.nama}',
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Periode $_start s/d $_end',
                      style: const TextStyle(
                          fontSize: 12, color: BorneoTheme.textMuted),
                    ),
                    const SizedBox(height: 12),
                    if (snap.connectionState == ConnectionState.waiting)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: CupertinoActivityIndicator()),
                      )
                    else if (!snap.hasData || snap.data!.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: Text('Tidak ada rincian harian.')),
                      )
                    else
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 360),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: snap.data!.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 12, color: BorneoTheme.border),
                          itemBuilder: (_, idx) {
                            final d = snap.data![idx];
                            return Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(d.tanggal,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    Text(
                                      '${d.jamMasuk} - ${d.jamPulang} (${d.totalJam.toStringAsFixed(1)} jam)',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: BorneoTheme.textMuted),
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
                                          color: BorneoTheme.success),
                                    ),
                                    if (d.menitTerlambat > 0)
                                      Text(
                                        'Telat ${d.menitTerlambat} mnt',
                                        style: const TextStyle(
                                            fontSize: 11,
                                            color: BorneoTheme.danger),
                                      ),
                                  ],
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalBersih = _payroll.fold(0.0, (s, e) => s + e.gajiBersih);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  color: BorneoTheme.fieldBg,
                  borderRadius: BorderRadius.circular(14),
                  onPressed: _pickDateRange,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(CupertinoIcons.calendar,
                          size: 16, color: BorneoTheme.primary),
                      const SizedBox(width: 8),
                      Text('$_start  s/d  $_end',
                          style: const TextStyle(
                              fontSize: 13.5, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              IosSlidingSegment<int>(
                groupValue: _subTab,
                labels: const {
                  0: 'Payroll Gaji',
                  1: 'Target Bonus Roti',
                },
                onChanged: (v) => setState(() => _subTab = v),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadData,
            child: _loading
                ? const Center(child: CupertinoActivityIndicator(radius: 15))
                : _subTab == 0
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          GlassCard(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Gaji Bersih Periode',
                                    style: TextStyle(
                                        color: BorneoTheme.textMuted)),
                                Text(
                                  BorneoTheme.rupiah(totalBersih),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: BorneoTheme.accent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          ..._payroll.map((p) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(22),
                                  onTap: () => _openDetail(p),
                                  child: GlassCard(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              '${p.nama} (${p.idKaryawan})',
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15),
                                            ),
                                            Text(
                                              BorneoTheme.rupiah(p.gajiBersih),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                                color: BorneoTheme.success,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          '${p.jumlahHariMasuk} hari • ${p.totalJamKerja.toStringAsFixed(1)} jam • Telat ${p.totalMenitTerlambat} mnt',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: BorneoTheme.textMuted),
                                        ),
                                        if (p.totalPotongan > 0)
                                          Text(
                                            'Kotor: ${BorneoTheme.rupiah(p.gajiKotor)} • Potongan Bon/Telat: ${BorneoTheme.rupiah(p.totalPotongan)}',
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color: BorneoTheme.danger),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              )),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _bonus.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, idx) {
                          final b = _bonus[idx];
                          final hitTarget = b.kelebihanRoti > 0;
                          return GlassCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${b.namaKaryawan} (${b.idCabang})',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                    IosPill(
                                      text: hitTarget
                                          ? '+${b.kelebihanRoti} roti'
                                          : 'Belum target',
                                      color: hitTarget
                                          ? BorneoTheme.success
                                          : BorneoTheme.textMuted,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Terjual: ${b.rotiTerjual} roti • Target: ${b.targetRoti} roti (${b.totalHari} hari)',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: BorneoTheme.textMuted),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ),
      ],
    );
  }
}
