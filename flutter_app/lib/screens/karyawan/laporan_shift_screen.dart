import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../theme/borneo_theme.dart';

class LaporanShiftScreen extends StatefulWidget {
  final KaryawanData user;
  const LaporanShiftScreen({super.key, required this.user});

  @override
  State<LaporanShiftScreen> createState() => _LaporanShiftScreenState();
}

class _LaporanShiftScreenState extends State<LaporanShiftScreen> {
  LaporanContextData _ctxData = LaporanContextData();
  bool _loading = true;
  bool _submitting = false;

  final _diantarCtrl = TextEditingController(text: '0');
  final _sisaCtrl = TextEditingController(text: '0');
  final _rusakCtrl = TextEditingController(text: '0');
  final _pengeluaranCtrl = TextEditingController(text: '0');
  final _setorCtrl = TextEditingController(text: '0');
  final _sisaModalCtrl = TextEditingController(text: '0');
  final _catatanCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadContext();
  }

  @override
  void dispose() {
    _diantarCtrl.dispose();
    _sisaCtrl.dispose();
    _rusakCtrl.dispose();
    _pengeluaranCtrl.dispose();
    _setorCtrl.dispose();
    _sisaModalCtrl.dispose();
    _catatanCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadContext() async {
    setState(() => _loading = true);
    try {
      final data = await AppsScriptApiService.getLaporanContext(
        widget.user.idKaryawan,
        widget.user.idCabang,
      );
      if (!mounted) return;
      setState(() {
        _ctxData = data;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _diantar => int.tryParse(_diantarCtrl.text.trim()) ?? 0;
  int get _sisa => int.tryParse(_sisaCtrl.text.trim()) ?? 0;
  int get _rusak => int.tryParse(_rusakCtrl.text.trim()) ?? 0;
  int get _rotiAwal => _ctxData.rotiSisaKemarin + _diantar;
  int get _totalTerjual => (_rotiAwal - _sisa - _rusak).clamp(0, 99999);

  Future<void> _submit() async {
    if (_sisa + _rusak > _rotiAwal) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Roti sisa + rusak (${_sisa + _rusak}) melebihi stok awal ($_rotiAwal).'),
          backgroundColor: BorneoTheme.danger,
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final msg = await AppsScriptApiService.simpanLaporanShift(
        idKaryawan: widget.user.idKaryawan,
        idCabang: widget.user.idCabang,
        rotiDiantar: _diantar,
        rotiSisa: _sisa,
        rotiRusakBonus: _rusak,
        pengeluaran: double.tryParse(_pengeluaranCtrl.text.trim()) ?? 0,
        setorUang: double.tryParse(_setorCtrl.text.trim()) ?? 0,
        sisaModal: double.tryParse(_sisaModalCtrl.text.trim()) ?? 0,
        catatan: _catatanCtrl.text.trim(),
      );
      final setor = double.tryParse(_setorCtrl.text.trim()) ?? 0;
      await NotificationService.instance.pushAlert(
        title: 'Laporan Shift Terkirim (${widget.user.idCabang})',
        body:
            'Terjual $_totalTerjual roti • Setor ${BorneoTheme.rupiah(setor)} • Sisa $_sisa roti.',
        category: 'LAPORAN',
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: BorneoTheme.success,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: BorneoTheme.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _numField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Laporan Akhir Shift')),
      body: OrbBackdrop(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Ringkasan Stok Otomatis',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        _rowInfo('Sisa Kemarin',
                            '${_ctxData.rotiSisaKemarin} roti'),
                        _rowInfo('Tercatat di Kasir POS',
                            '${_ctxData.penjualanOfflineRoti.toStringAsFixed(1)} roti'),
                        _rowInfo('Stok Awal Shift', '$_rotiAwal roti'),
                        _rowInfo('Estimasi Total Terjual', '$_totalTerjual roti',
                            highlight: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Input Stok & Setoran',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 14),
                        _numField('Roti Diantar Hari Ini', _diantarCtrl),
                        _numField('Roti Sisa Akhir Shift', _sisaCtrl),
                        _numField('Roti Rusak / Bonus', _rusakCtrl),
                        _numField('Pengeluaran Operasional (Rp)',
                            _pengeluaranCtrl),
                        _numField('Setor Uang (Rp)', _setorCtrl),
                        _numField('Sisa Modal Laci (Rp)', _sisaModalCtrl),
                        TextField(
                          controller: _catatanCtrl,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'Catatan Tambahan (Opsional)',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _submitting ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: BorneoTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      icon: const Icon(Icons.send_rounded),
                      label: Text(_submitting
                          ? 'Mengirim Laporan...'
                          : 'Kirim Laporan Shift'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _rowInfo(String label, String val, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: BorneoTheme.textMuted)),
          Text(
            val,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: highlight ? BorneoTheme.accent : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
