import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../theme/borneo_theme.dart';

class BonScreen extends StatefulWidget {
  final KaryawanData user;
  const BonScreen({super.key, required this.user});

  @override
  State<BonScreen> createState() => _BonScreenState();
}

class _BonScreenState extends State<BonScreen> {
  List<BonItem> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBon();
  }

  Future<void> _loadBon() async {
    setState(() => _loading = true);
    try {
      final res = await AppsScriptApiService.getBonSaya(
        widget.user.idKaryawan,
        widget.user.idCabang,
      );
      if (!mounted) return;
      setState(() {
        _list = res;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openAjukanDialog() async {
    final nominalCtrl = TextEditingController();
    final catatanCtrl = TextEditingController();
    bool submitting = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          backgroundColor: BorneoTheme.surface,
          title: const Text('Ajukan Kasbon / Pinjaman'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nominalCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Nominal (Rp)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: catatanCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Alasan / Keperluan',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: submitting ? null : () => Navigator.pop(ctx),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: submitting
                  ? null
                  : () async {
                      final nominal =
                          double.tryParse(nominalCtrl.text.trim()) ?? 0;
                      if (nominal <= 0) return;
                      setDlg(() => submitting = true);
                      try {
                        final msg = await AppsScriptApiService.ajukanBon(
                          idKaryawan: widget.user.idKaryawan,
                          idCabang: widget.user.idCabang,
                          nominal: nominal,
                          catatan: catatanCtrl.text.trim(),
                        );
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: BorneoTheme.success,
                          ),
                        );
                        _loadBon();
                      } catch (e) {
                        setDlg(() => submitting = false);
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
              child: Text(submitting ? 'Mengirim...' : 'Ajukan'),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DISETUJUI':
        return BorneoTheme.primary;
      case 'LUNAS':
        return BorneoTheme.success;
      case 'DITOLAK':
        return BorneoTheme.danger;
      default:
        return BorneoTheme.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat & Pengajuan Kasbon')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAjukanDialog,
        backgroundColor: BorneoTheme.accent,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('Ajukan Bon'),
      ),
      body: OrbBackdrop(
        child: RefreshIndicator(
          onRefresh: _loadBon,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _list.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 120),
                        Center(child: Text('Belum ada riwayat kasbon.')),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
                      itemCount: _list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, idx) {
                        final bon = _list[idx];
                        final col = _statusColor(bon.status);
                        return GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    BorneoTheme.rupiah(bon.nominal),
                                    style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: col.withOpacity(0.18),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      bon.status,
                                      style: TextStyle(
                                          color: col,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              if (bon.catatan.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(bon.catatan),
                              ],
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    bon.dibuatPada,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.textMuted),
                                  ),
                                  Text(
                                    'Sisa: ${BorneoTheme.rupiah(bon.sisaBon)}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: BorneoTheme.accent,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ),
    );
  }
}
