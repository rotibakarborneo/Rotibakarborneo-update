import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../theme/borneo_theme.dart';

class AbsenScreen extends StatefulWidget {
  final KaryawanData user;
  const AbsenScreen({super.key, required this.user});

  @override
  State<AbsenScreen> createState() => _AbsenScreenState();
}

class _AbsenScreenState extends State<AbsenScreen> {
  final ImagePicker _picker = ImagePicker();
  List<CabangLokasi> _cabangList = [];
  CabangLokasi? _selectedCabang;
  Position? _position;
  double? _jarakMeter;
  Uint8List? _fotoBytes;
  String? _fotoBase64;
  bool _loadingLokasi = true;
  bool _submitting = false;
  String? _lokasiError;

  @override
  void initState() {
    super.initState();
    _initLokasiDanCabang();
  }

  Future<void> _initLokasiDanCabang() async {
    setState(() {
      _loadingLokasi = true;
      _lokasiError = null;
    });
    try {
      final cabangs = await AppsScriptApiService.getListCabang();
      CabangLokasi? def;
      for (final c in cabangs) {
        if (c.idCabang == widget.user.idCabang) {
          def = c;
          break;
        }
      }
      def ??= cabangs.isNotEmpty ? cabangs.first : null;

      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('GPS / Layanan Lokasi tidak aktif. Aktifkan GPS dulu.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception(
            'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan.');
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );

      double? jarak;
      if (def != null) {
        jarak = Geolocator.distanceBetween(
          pos.latitude,
          pos.longitude,
          def.latitude,
          def.longitude,
        );
      }

      if (!mounted) return;
      setState(() {
        _cabangList = cabangs;
        _selectedCabang = def;
        _position = pos;
        _jarakMeter = jarak;
        _loadingLokasi = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _lokasiError = e.toString().replaceFirst('Exception: ', '');
        _loadingLokasi = false;
      });
    }
  }

  void _hitungJarak(CabangLokasi? cabang) {
    setState(() {
      _selectedCabang = cabang;
      if (cabang != null && _position != null) {
        _jarakMeter = Geolocator.distanceBetween(
          _position!.latitude,
          _position!.longitude,
          cabang.latitude,
          cabang.longitude,
        );
      } else {
        _jarakMeter = null;
      }
    });
  }

  Future<void> _ambilFoto() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        maxWidth: 800,
        imageQuality: 55,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      final b64 = base64Encode(bytes);
      if (!mounted) return;
      setState(() {
        _fotoBytes = bytes;
        _fotoBase64 = b64;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal membuka kamera: $e')),
      );
    }
  }

  Future<void> _kirimAbsen(String action) async {
    if (_selectedCabang == null || _position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lokasi GPS & cabang belum siap.')),
      );
      return;
    }
    if (_fotoBase64 == null || _fotoBase64!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ambil foto selfie terlebih dahulu.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final msg = await AppsScriptApiService.absen(
        action: action,
        idKaryawan: widget.user.idKaryawan,
        idCabang: _selectedCabang!.idCabang,
        lat: _position!.latitude,
        lng: _position!.longitude,
        fotoBase64: _fotoBase64!,
      );
      final isMasuk = action == 'absen_masuk';
      await NotificationService.instance.pushAlert(
        title: isMasuk
            ? 'Outlet Buka: ${_selectedCabang!.namaCabang}'
            : 'Outlet Tutup: ${_selectedCabang!.namaCabang}',
        body: '${widget.user.nama} berhasil ${isMasuk ? 'Absen Masuk' : 'Absen Pulang'} (${BorneoTheme.wibClockNow()}).',
        category: isMasuk ? 'BUKA' : 'TUTUP',
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

  @override
  Widget build(BuildContext context) {
    final dalamRadius = _selectedCabang != null &&
        _jarakMeter != null &&
        _jarakMeter! <= _selectedCabang!.radiusMeter;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Presensi GPS & Selfie'),
        actions: [
          CupertinoButton(
            onPressed: _loadingLokasi ? null : _initLokasiDanCabang,
            child: const Icon(CupertinoIcons.refresh, color: BorneoTheme.primary),
          ),
        ],
      ),
      body: OrbBackdrop(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lokasi Outlet & Geofence',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  if (_cabangList.isNotEmpty)
                    DropdownButtonFormField<CabangLokasi>(
                      value: _selectedCabang,
                      dropdownColor: BorneoTheme.surface,
                      decoration:
                          const InputDecoration(labelText: 'Pilih Gerai / Cabang'),
                      items: _cabangList
                          .map((c) => DropdownMenuItem(
                                value: c,
                                child: Text('${c.namaCabang} (${c.idCabang})'),
                              ))
                          .toList(),
                      onChanged: _hitungJarak,
                    ),
                  const SizedBox(height: 12),
                  if (_loadingLokasi)
                    const Row(
                      children: [
                        CupertinoActivityIndicator(),
                        SizedBox(width: 12),
                        Text('Mengunci titik koordinat GPS...'),
                      ],
                    )
                  else if (_lokasiError != null)
                    Text(
                      _lokasiError!,
                      style: const TextStyle(color: BorneoTheme.danger),
                    )
                  else if (_position != null && _selectedCabang != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Koordinat Anda: ${_position!.latitude.toStringAsFixed(5)}, ${_position!.longitude.toStringAsFixed(5)}',
                          style: const TextStyle(
                              fontSize: 12, color: BorneoTheme.textMuted),
                        ),
                        const SizedBox(height: 8),
                        IosPill(
                          text:
                              'Jarak: ${_jarakMeter?.toStringAsFixed(1) ?? '-'} m (Batas ${_selectedCabang!.radiusMeter.toStringAsFixed(0)} m)',
                          color: dalamRadius
                              ? BorneoTheme.success
                              : BorneoTheme.accent,
                          icon: dalamRadius
                              ? CupertinoIcons.checkmark_seal_fill
                              : CupertinoIcons.exclamationmark_triangle_fill,
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Foto Selfie Kehadiran',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: _ambilFoto,
                    child: Container(
                      height: 240,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: BorneoTheme.fieldBg,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: BorneoTheme.border),
                      ),
                      child: _fotoBytes != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: Image.memory(
                                _fotoBytes!,
                                fit: BoxFit.cover,
                              ),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(CupertinoIcons.camera_fill,
                                    size: 46, color: BorneoTheme.primary),
                                SizedBox(height: 8),
                                Text('Ketuk untuk ambil foto selfie'),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButton(
                      color: BorneoTheme.fieldBg,
                      borderRadius: BorderRadius.circular(14),
                      onPressed: _ambilFoto,
                      child: Text(
                        _fotoBytes == null
                            ? 'Buka Kamera Depan'
                            : 'Ambil Ulang Foto',
                        style: const TextStyle(color: BorneoTheme.primary),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: CupertinoButton(
                    color: BorneoTheme.success,
                    borderRadius: BorderRadius.circular(16),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    onPressed:
                        _submitting ? null : () => _kirimAbsen('absen_masuk'),
                    child: Text(
                      _submitting ? 'Memproses...' : 'Absen Masuk',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, color: Colors.black),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CupertinoButton(
                    color: BorneoTheme.accent,
                    borderRadius: BorderRadius.circular(16),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    onPressed:
                        _submitting ? null : () => _kirimAbsen('absen_pulang'),
                    child: Text(
                      _submitting ? 'Memproses...' : 'Absen Pulang',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, color: Colors.black),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
