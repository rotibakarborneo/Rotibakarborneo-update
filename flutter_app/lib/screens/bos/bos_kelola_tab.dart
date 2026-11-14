import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class BosKelolaTab extends StatefulWidget {
  final KaryawanData user;
  const BosKelolaTab({super.key, required this.user});

  @override
  State<BosKelolaTab> createState() => _BosKelolaTabState();
}

class _BosKelolaTabState extends State<BosKelolaTab> {
  List<BonItem> _bons = [];
  List<CabangMaster> _cabangs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final res = await Future.wait([
        AppsScriptApiService.getBonAdmin(),
        AppsScriptApiService.getMasterCabang(),
      ]);
      if (!mounted) return;
      setState(() {
        _bons = res[0] as List<BonItem>;
        _cabangs = res[1] as List<CabangMaster>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifikasiBonDialog(BonItem bon) async {
    String status = bon.status.toUpperCase() == 'PENDING'
        ? 'DISETUJUI'
        : bon.status.toUpperCase();
    final dibayarCtrl =
        TextEditingController(text: bon.dibayar.toStringAsFixed(0));
    final catatanCtrl = TextEditingController();
    bool saving = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          backgroundColor: BorneoTheme.surface,
          title: Text('Verifikasi Bon: ${bon.namaKaryawan}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pengajuan: ${BorneoTheme.rupiah(bon.nominal)}'),
              if (bon.catatan.isNotEmpty)
                Text('Catatan: ${bon.catatan}',
                    style: const TextStyle(
                        fontSize: 12, color: BorneoTheme.textMuted)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: status,
                dropdownColor: BorneoTheme.surface,
                decoration: const InputDecoration(
                  labelText: 'Status Baru',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(
                      value: 'DISETUJUI', child: Text('DISETUJUI')),
                  DropdownMenuItem(value: 'LUNAS', child: Text('LUNAS')),
                  DropdownMenuItem(value: 'DITOLAK', child: Text('DITOLAK')),
                ],
                onChanged: (v) => setDlg(() => status = v ?? 'DISETUJUI'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: dibayarCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Sudah Dicicil / Dibayar (Rp)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: catatanCtrl,
                decoration: const InputDecoration(
                  labelText: 'Catatan Bos (Opsional)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
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
                      setDlg(() => saving = true);
                      try {
                        final msg = await AppsScriptApiService.verifikasiBon(
                          idAdmin: widget.user.idKaryawan,
                          idCabangAdmin: widget.user.idCabang,
                          bonId: bon.bonId,
                          status: status,
                          dibayar:
                              double.tryParse(dibayarCtrl.text.trim()) ?? 0,
                          catatanAdmin: catatanCtrl.text.trim(),
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: BorneoTheme.success,
                          ),
                        );
                        _loadData();
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

  Future<void> _tambahCabangDialog() async {
    final idCtrl = TextEditingController();
    final namaCtrl = TextEditingController();
    final latCtrl = TextEditingController();
    final lngCtrl = TextEditingController();
    final radCtrl = TextEditingController(text: '100');
    bool saving = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          backgroundColor: BorneoTheme.surface,
          title: const Text('Tambah Cabang Baru'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: idCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ID Cabang (mis. CBG07)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: namaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nama Gerai',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: latCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true, signed: true),
                  decoration: const InputDecoration(
                    labelText: 'Latitude',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: lngCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true, signed: true),
                  decoration: const InputDecoration(
                    labelText: 'Longitude',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: radCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Radius GPS (meter)',
                    border: OutlineInputBorder(),
                  ),
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
                      setDlg(() => saving = true);
                      try {
                        final msg = await AppsScriptApiService.tambahCabang(
                          idAdmin: widget.user.idKaryawan,
                          idCabangAdmin: widget.user.idCabang,
                          idCabang: idCtrl.text.trim(),
                          namaCabang: namaCtrl.text.trim(),
                          latitude: double.tryParse(latCtrl.text.trim()) ?? 0,
                          longitude: double.tryParse(lngCtrl.text.trim()) ?? 0,
                          radiusMeter:
                              double.tryParse(radCtrl.text.trim()) ?? 100,
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: BorneoTheme.success,
                          ),
                        );
                        _loadData();
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

  Future<void> _tambahKaryawanDialog() async {
    final idCtrl = TextEditingController();
    final namaCtrl = TextEditingController();
    final userCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    final tarifCtrl = TextEditingController(text: '10000');
    String idCabang =
        _cabangs.isNotEmpty ? _cabangs.first.idCabang : widget.user.idCabang;
    bool saving = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          backgroundColor: BorneoTheme.surface,
          title: const Text('Tambah Karyawan Baru'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: idCtrl,
                  decoration: const InputDecoration(
                    labelText: 'ID Karyawan (mis. KAR010)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: namaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nama Lengkap',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: userCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Username Login',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Password Login',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                if (_cabangs.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: idCabang,
                    dropdownColor: BorneoTheme.surface,
                    decoration: const InputDecoration(
                      labelText: 'Penempatan Cabang',
                      border: OutlineInputBorder(),
                    ),
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
                  controller: tarifCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Tarif per Jam (Rp)',
                    border: OutlineInputBorder(),
                  ),
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
                      setDlg(() => saving = true);
                      try {
                        final msg = await AppsScriptApiService.tambahKaryawan(
                          idAdmin: widget.user.idKaryawan,
                          idCabangAdmin: widget.user.idCabang,
                          idKaryawan: idCtrl.text.trim(),
                          nama: namaCtrl.text.trim(),
                          username: userCtrl.text.trim(),
                          password: passCtrl.text.trim(),
                          idCabang: idCabang,
                          tarifPerJam:
                              double.tryParse(tarifCtrl.text.trim()) ?? 10000,
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: BorneoTheme.success,
                          ),
                        );
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
    return RefreshIndicator(
      onRefresh: _loadData,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _tambahCabangDialog,
                        icon: const Icon(Icons.store_mall_directory_rounded),
                        label: const Text('+ Cabang'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _tambahKaryawanDialog,
                        style: FilledButton.styleFrom(
                          backgroundColor: BorneoTheme.accent,
                          foregroundColor: Colors.black,
                        ),
                        icon: const Icon(Icons.person_add_alt_1_rounded),
                        label: const Text('+ Karyawan'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'Daftar Pengajuan Kasbon Karyawan',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                if (_bons.isEmpty)
                  const GlassCard(
                    child: Center(child: Text('Belum ada data kasbon.')),
                  )
                else
                  ..._bons.map((bon) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () => _verifikasiBonDialog(bon),
                          child: GlassCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${bon.namaKaryawan} (${bon.namaCabang})',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      bon.status,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                        color: bon.status == 'PENDING'
                                            ? BorneoTheme.accent
                                            : bon.status == 'LUNAS'
                                                ? BorneoTheme.success
                                                : BorneoTheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Pinjaman: ${BorneoTheme.rupiah(bon.nominal)}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      'Sisa: ${BorneoTheme.rupiah(bon.sisaBon)}',
                                      style: const TextStyle(
                                          color: BorneoTheme.danger,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                                if (bon.catatan.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(bon.catatan,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: BorneoTheme.textMuted)),
                                ],
                                const SizedBox(height: 4),
                                const Text(
                                  'Ketuk untuk verifikasi / update cicilan',
                                  style: TextStyle(
                                      fontSize: 11, color: BorneoTheme.primary),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )),
              ],
            ),
    );
  }
}
