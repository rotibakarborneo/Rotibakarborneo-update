import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../config/app_config.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/session_service.dart';
import '../../theme/borneo_theme.dart';

class KasirScreen extends StatefulWidget {
  final KaryawanData user;
  const KasirScreen({super.key, required this.user});

  @override
  State<KasirScreen> createState() => _KasirScreenState();
}

class _KasirScreenState extends State<KasirScreen> {
  String _porsi = 'UTUH';
  String _caraMasak = 'BAKAR';
  String _metodeBayar = 'CASH';
  String _search = '';
  final List<KasirItem> _cart = [];
  List<Map<String, dynamic>> _offlineQueue = [];
  bool _sending = false;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    final q = await SessionService.getKasirQueue();
    if (!mounted) return;
    setState(() => _offlineQueue = q);
  }

  List<Map<String, dynamic>> get _filteredMenu {
    final source =
        _porsi == 'UTUH' ? AppConfig.menuUtuh : AppConfig.menuSeparuh;
    if (_search.trim().isEmpty) return source;
    final q = _search.toLowerCase();
    return source
        .where((m) => (m['nama'] as String).toLowerCase().contains(q))
        .toList();
  }

  void _addToCart(String nama, double harga) {
    final satuan = _porsi == 'UTUH' ? 1.0 : 0.5;
    setState(() {
      final idx = _cart.indexWhere((e) =>
          e.nama == nama && e.porsi == _porsi && e.caraMasak == _caraMasak);
      if (idx >= 0) {
        final cur = _cart[idx];
        _cart[idx] = KasirItem(
          nama: cur.nama,
          harga: cur.harga,
          qty: cur.qty + 1,
          satuanRoti: cur.satuanRoti,
          porsi: cur.porsi,
          caraMasak: cur.caraMasak,
        );
      } else {
        _cart.add(KasirItem(
          nama: nama,
          harga: harga,
          qty: 1,
          satuanRoti: satuan,
          porsi: _porsi,
          caraMasak: _caraMasak,
        ));
      }
    });
  }

  void _changeQty(int idx, int delta) {
    setState(() {
      final cur = _cart[idx];
      final next = cur.qty + delta;
      if (next <= 0) {
        _cart.removeAt(idx);
      } else {
        _cart[idx] = KasirItem(
          nama: cur.nama,
          harga: cur.harga,
          qty: next,
          satuanRoti: cur.satuanRoti,
          porsi: cur.porsi,
          caraMasak: cur.caraMasak,
        );
      }
    });
  }

  double get _totalBayar =>
      _cart.fold(0.0, (sum, item) => sum + (item.harga * item.qty));

  double get _totalRoti =>
      _cart.fold(0.0, (sum, item) => sum + (item.satuanRoti * item.qty));

  Future<void> _showCustomMenuDialog() async {
    final namaCtrl = TextEditingController();
    final hargaCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: BorneoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Text('Menu Custom / Tambahan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: namaCtrl,
              decoration: const InputDecoration(labelText: 'Nama Menu'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: hargaCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Harga (Rp)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Tambah'),
          ),
        ],
      ),
    );
    if (ok == true && namaCtrl.text.trim().isNotEmpty) {
      final harga = double.tryParse(hargaCtrl.text.trim()) ?? 0;
      if (harga > 0) {
        _addToCart(namaCtrl.text.trim(), harga);
      }
    }
  }

  Future<void> _checkout() async {
    if (_cart.isEmpty) return;

    final payload = {
      'transaksi_id': const Uuid().v4(),
      'id_karyawan': widget.user.idKaryawan,
      'id_cabang': widget.user.idCabang,
      'metode_bayar': _metodeBayar,
      'total_bayar': _totalBayar,
      'total_roti': _totalRoti,
      'items': _cart.map((e) => e.toJson()).toList(),
    };

    setState(() => _sending = true);
    try {
      final ok = await AppsScriptApiService.simpanTransaksiKasir(payload);
      if (!mounted) return;
      if (ok) {
        setState(() => _cart.clear());
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Transaksi tersimpan ke Google Sheet!'),
            backgroundColor: BorneoTheme.success,
          ),
        );
      } else {
        await _saveToQueue(payload);
      }
    } catch (_) {
      await _saveToQueue(payload);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _saveToQueue(Map<String, dynamic> payload) async {
    final q = await SessionService.getKasirQueue();
    q.add(payload);
    await SessionService.saveKasirQueue(q);
    if (!mounted) return;
    setState(() {
      _offlineQueue = q;
      _cart.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Koneksi lemah. Transaksi disimpan di antrian offline!'),
        backgroundColor: BorneoTheme.accent,
      ),
    );
  }

  Future<void> _syncQueue() async {
    if (_offlineQueue.isEmpty) return;
    setState(() => _syncing = true);
    final remaining = <Map<String, dynamic>>[];
    int synced = 0;

    for (final tx in _offlineQueue) {
      try {
        final ok = await AppsScriptApiService.simpanTransaksiKasir(tx);
        if (ok) {
          synced++;
        } else {
          remaining.add(tx);
        }
      } catch (_) {
        remaining.add(tx);
      }
    }

    await SessionService.saveKasirQueue(remaining);
    if (!mounted) return;
    setState(() {
      _offlineQueue = remaining;
      _syncing = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
            'Sinkronisasi selesai: $synced terkirim, ${remaining.length} tersisa.'),
      ),
    );
  }

  void _openCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              color: const Color(0xE60B1120),
              padding: EdgeInsets.fromLTRB(
                  18, 14, 18, MediaQuery.of(ctx).viewInsets.bottom + 24),
              child: Column(
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Keranjang (${_cart.length} item)',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IosPill(
                        text: '${_totalRoti.toStringAsFixed(1)} Roti',
                        color: BorneoTheme.accent,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_cart.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: Text('Belum ada pesanan.')),
                    )
                  else
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 280),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _cart.length,
                        itemBuilder: (_, idx) {
                          final item = _cart[idx];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text('${item.nama} (${item.porsi})'),
                            subtitle: Text(
                                '${item.caraMasak} • ${BorneoTheme.rupiah(item.harga)}'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(
                                      CupertinoIcons.minus_circle_fill,
                                      color: BorneoTheme.textMuted),
                                  onPressed: () {
                                    _changeQty(idx, -1);
                                    setSheet(() {});
                                  },
                                ),
                                Text('${item.qty}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                IconButton(
                                  icon: const Icon(
                                      CupertinoIcons.plus_circle_fill,
                                      color: BorneoTheme.primary),
                                  onPressed: () {
                                    _changeQty(idx, 1);
                                    setSheet(() {});
                                  },
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  const Divider(color: BorneoTheme.border),
                  const SizedBox(height: 6),
                  IosSlidingSegment<String>(
                    groupValue: _metodeBayar,
                    labels: const {
                      'CASH': 'CASH / TUNAI',
                      'QRIS': 'QRIS',
                    },
                    onChanged: (v) {
                      setState(() => _metodeBayar = v);
                      setSheet(() {});
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton(
                      color: BorneoTheme.primary,
                      borderRadius: BorderRadius.circular(16),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      onPressed: _sending || _cart.isEmpty
                          ? null
                          : () async {
                              Navigator.pop(ctx);
                              await _checkout();
                            },
                      child: Text(
                        'Bayar ${BorneoTheme.rupiah(_totalBayar)} ($_metodeBayar)',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final menus = _filteredMenu;
    return Column(
      children: [
        if (_offlineQueue.isNotEmpty)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: BorneoTheme.accent.withOpacity(0.18),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: BorneoTheme.accent.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                const Icon(CupertinoIcons.cloud_upload_fill,
                    color: BorneoTheme.accent, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${_offlineQueue.length} transaksi menunggu sinkronisasi',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  onPressed: _syncing ? null : _syncQueue,
                  child: Text(_syncing ? 'Proses...' : 'Kirim Ulang'),
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
          child: Column(
            children: [
              IosSlidingSegment<String>(
                groupValue: _porsi,
                labels: const {
                  'UTUH': 'Roti Utuh (1)',
                  'SEPARUH': 'Separuh (0.5)',
                },
                onChanged: (v) => setState(() => _porsi = v),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: IosSlidingSegment<String>(
                      groupValue: _caraMasak,
                      labels: const {
                        'BAKAR': 'Bakar',
                        'KUKUS': 'Kukus',
                      },
                      onChanged: (v) => setState(() => _caraMasak = v),
                    ),
                  ),
                  const SizedBox(width: 10),
                  CupertinoButton(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    color: BorneoTheme.fieldBg,
                    borderRadius: BorderRadius.circular(12),
                    onPressed: _showCustomMenuDialog,
                    child: const Row(
                      children: [
                        Icon(CupertinoIcons.add, size: 16),
                        SizedBox(width: 4),
                        Text('Custom', style: TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              CupertinoSearchTextField(
                placeholder: 'Cari rasa roti...',
                style: const TextStyle(color: Colors.white),
                backgroundColor: BorneoTheme.fieldBg,
                borderRadius: BorderRadius.circular(14),
                onChanged: (v) => setState(() => _search = v),
              ),
            ],
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.55,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
            ),
            itemCount: menus.length,
            itemBuilder: (_, idx) {
              final item = menus[idx];
              final nama = item['nama'] as String;
              final harga = item['harga'] as double;
              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => _addToCart(nama, harga),
                child: GlassCard(
                  padding: const EdgeInsets.all(12),
                  radius: 18,
                  blur: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        nama,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            BorneoTheme.rupiah(harga),
                            style: const TextStyle(
                              color: BorneoTheme.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          const Icon(CupertinoIcons.plus_circle_fill,
                              color: BorneoTheme.accent, size: 20),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            radius: 20,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${_cart.fold(0, (s, e) => s + e.qty)} item • ${_totalRoti.toStringAsFixed(1)} Roti',
                        style: const TextStyle(
                            fontSize: 11.5, color: BorneoTheme.textMuted),
                      ),
                      Text(
                        BorneoTheme.rupiah(_totalBayar),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: BorneoTheme.accent,
                        ),
                      ),
                    ],
                  ),
                ),
                CupertinoButton(
                  color: BorneoTheme.primary,
                  borderRadius: BorderRadius.circular(14),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  onPressed: _openCartSheet,
                  child: const Row(
                    children: [
                      Icon(CupertinoIcons.bag_fill,
                          size: 16, color: Colors.white),
                      SizedBox(width: 6),
                      Text('Bayar',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: Colors.white)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
