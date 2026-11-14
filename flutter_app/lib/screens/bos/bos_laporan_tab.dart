import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class BosLaporanTab extends StatefulWidget {
  final KaryawanData user;
  const BosLaporanTab({super.key, required this.user});

  @override
  State<BosLaporanTab> createState() => _BosLaporanTabState();
}

class _BosLaporanTabState extends State<BosLaporanTab> {
  int _subTab = 0; // 0 = Laporan Shift, 1 = Kasir POS, 2 = Keuangan
  final String _start = BorneoTheme.wibDaysAgoIso(14);
  final String _end = BorneoTheme.wibTodayIso();

  List<RiwayatLaporanItem> _laporan = [];
  List<TransaksiKasirAdminItem> _kasir = [];
  KeuanganData _keuangan = KeuanganData();
  List<CabangMaster> _cabangs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final res = await Future.wait([
        AppsScriptApiService.getRiwayatLaporanShift(_start, _end),
        AppsScriptApiService.getTransaksiKasirAdmin(),
        AppsScriptApiService.getKeuangan(_start, _end),
        AppsScriptApiService.getMasterCabang(),
      ]);
      if (!mounted) return;
      setState(() {
        _laporan = res[0] as List<RiwayatLaporanItem>;
        _kasir = res[1] as List<TransaksiKasirAdminItem>;
        _keuangan = res[2] as KeuanganData;
        _cabangs = res[3] as List<CabangMaster>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _tambahKeuanganDialog() async {
    String jenis = 'PENGELUARAN';
    String idCabang =
        _cabangs.isNotEmpty ? _cabangs.first.idCabang : widget.user.idCabang;
    final katCtrl = TextEditingController(text: 'Belanja Bahan');
    final nomCtrl = TextEditingController();
    final catCtrl = TextEditingController();
    bool saving = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          backgroundColor: BorneoTheme.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: const Text('Catat Pemasukan / Pengeluaran'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: jenis,
                  dropdownColor: BorneoTheme.surface,
                  decoration: const InputDecoration(labelText: 'Jenis'),
                  items: const [
                    DropdownMenuItem(
                        value: 'PEMASUKAN', child: Text('Pemasukan')),
                    DropdownMenuItem(
                        value: 'PENGELUARAN', child: Text('Pengeluaran')),
                  ],
                  onChanged: (v) => setDlg(() => jenis = v ?? 'PENGELUARAN'),
                ),
                const SizedBox(height: 10),
                if (_cabangs.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: idCabang,
                    dropdownColor: BorneoTheme.surface,
                    decoration: const InputDecoration(labelText: 'Cabang'),
                    items: _cabangs
                        .map((c) => DropdownMenuItem(
                              value: c.idCabang,
                              child: Text(c.namaCabang),
                            ))
                        .toList(),
                    onChanged: (v) =>
                        setDlg(() => idCabang = v ?? _cabangs.first.idCabang),
                  ),
                const SizedBox(height: 10),
                TextField(
                  controller: katCtrl,
                  decoration: const InputDecoration(labelText: 'Kategori'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: nomCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Nominal (Rp)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: catCtrl,
                  decoration: const InputDecoration(labelText: 'Catatan'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: saving ? null : () => Navigator.pop(ctx),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: saving
                  ? null
                  : () async {
                      final nom = double.tryParse(nomCtrl.text.trim()) ?? 0;
                      if (nom <= 0) return;
                      setDlg(() => saving = true);
                      try {
                        final msg = await AppsScriptApiService.simpanKeuangan(
                          idAdmin: widget.user.idKaryawan,
                          idCabangAdmin: widget.user.idCabang,
                          tanggalOperasional: BorneoTheme.wibTodayIso(),
                          idCabang: idCabang,
                          jenis: jenis,
                          kategori: katCtrl.text.trim(),
                          nominal: nom,
                          catatan: catCtrl.text.trim(),
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: BorneoTheme.success,
                          ),
                        );
                        _loadAll();
                      } catch (e) {
                        setDlg(() => saving = false);
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                                e.toString().replaceFirst('Exception: ', '')),
                            backgroundColor: BorneoTheme.danger,
                          ),
                        );
                      }
                    },
              child: Text(saving ? 'Menyimpan...' : 'Simpan'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: _subTab == 2
          ? FloatingActionButton.extended(
              onPressed: _tambahKeuanganDialog,
              backgroundColor: BorneoTheme.primary,
              icon: const Icon(CupertinoIcons.add),
              label: const Text('Catat Kas'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: IosSlidingSegment<int>(
              groupValue: _subTab,
              labels: const {
                0: 'Shift',
                1: 'Kasir POS',
                2: 'Keuangan',
              },
              onChanged: (v) => setState(() => _subTab = v),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadAll,
              child: _loading
                  ? const Center(child: CupertinoActivityIndicator(radius: 15))
                  : _subTab == 0
                      ? _buildLaporanShift()
                      : _subTab == 1
                          ? _buildKasirList()
                          : _buildKeuangan(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLaporanShift() {
    if (_laporan.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 100),
        Center(child: Text('Belum ada laporan shift dalam 14 hari terakhir.'))
      ]);
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _laporan.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, idx) {
        final l = _laporan[idx];
        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${l.namaCabang} • ${l.tanggalOperasional}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    BorneoTheme.rupiah(l.setorUang),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: BorneoTheme.success),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Kasir: ${l.namaKaryawan} • Terjual: ${l.rotiTerjual} roti (POS: ${l.penjualanOfflineRoti.toStringAsFixed(1)}, Sisa: ${l.rotiSisa})',
                style:
                    const TextStyle(fontSize: 12, color: BorneoTheme.textMuted),
              ),
              if (l.pengeluaran > 0)
                Text(
                  'Pengeluaran: ${BorneoTheme.rupiah(l.pengeluaran)}',
                  style:
                      const TextStyle(fontSize: 12, color: BorneoTheme.accent),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildKasirList() {
    if (_kasir.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 100),
        Center(child: Text('Belum ada transaksi kasir tercatat.'))
      ]);
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _kasir.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, idx) {
        final t = _kasir[idx];
        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${t.namaCabang} • ${t.metodeBayar}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    BorneoTheme.rupiah(t.totalBayar),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: BorneoTheme.accent),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${t.namaKaryawan} • ${t.totalRoti.toStringAsFixed(1)} roti • ${t.dibuatPada}',
                style:
                    const TextStyle(fontSize: 12, color: BorneoTheme.textMuted),
              ),
              if (t.items.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  t.items
                      .map((i) => '${i.qty}x ${i.nama} (${i.porsi})')
                      .join(', '),
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildKeuangan() {
    final saldo = _keuangan.totalPemasukan - _keuangan.totalPengeluaran;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
      children: [
        GlassCard(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pemasukan',
                        style: TextStyle(
                            fontSize: 11, color: BorneoTheme.textMuted)),
                    Text(
                      BorneoTheme.rupiah(_keuangan.totalPemasukan),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: BorneoTheme.success),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pengeluaran',
                        style: TextStyle(
                            fontSize: 11, color: BorneoTheme.textMuted)),
                    Text(
                      BorneoTheme.rupiah(_keuangan.totalPengeluaran),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: BorneoTheme.danger),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Net Kas',
                        style: TextStyle(
                            fontSize: 11, color: BorneoTheme.textMuted)),
                    Text(
                      BorneoTheme.rupiah(saldo),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: BorneoTheme.primary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ..._keuangan.transaksi.map((k) {
          final isIn = k.jenis.toUpperCase() == 'PEMASUKAN';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GlassCard(
              padding: const EdgeInsets.all(14),
              radius: 18,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${k.kategori} • ${k.namaCabang}',
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        Text(
                          '${k.tanggalOperasional}${k.catatan.isNotEmpty ? ' • ${k.catatan}' : ''}',
                          style: const TextStyle(
                              fontSize: 12, color: BorneoTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${isIn ? '+' : '-'}${BorneoTheme.rupiah(k.nominal)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isIn ? BorneoTheme.success : BorneoTheme.danger,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
