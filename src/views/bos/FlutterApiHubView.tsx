import React, { useState } from 'react';
import {
  Smartphone,
  Send,
  Code2,
  CheckCircle2,
  Copy,
  Terminal,
  Globe,
  Layers,
  Shield,
  MapPin,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface EndpointSpec {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  title: string;
  role: 'KARYAWAN' | 'BOS' | 'PUBLIC';
  description: string;
  samplePayload: string;
}

export const FlutterApiHubView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState(0);
  const [payloadInput, setPayloadInput] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);

  const endpoints: EndpointSpec[] = [
    {
      method: 'POST',
      path: '/api/v1/auth/login',
      title: 'Mobile Login Karyawan',
      role: 'PUBLIC',
      description: 'Autentikasi akun staf gerai (Android/iOS) menggunakan username & password.',
      samplePayload: JSON.stringify(
        {
          username: 'budi',
          password: 'password123'
        },
        null,
        2
      )
    },
    {
      method: 'POST',
      path: '/api/v1/mobile/absen-masuk',
      title: 'Absen Masuk (GPS & Selfie)',
      role: 'KARYAWAN',
      description:
        'Validasi geofence GPS gerai (harus <= radius meter cabang) dan upload foto selfie.',
      samplePayload: JSON.stringify(
        {
          id_karyawan: 'K001',
          id_cabang: 'CBG01',
          latitude: -3.3194,
          longitude: 114.5908,
          foto_selfie_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        },
        null,
        2
      )
    },
    {
      method: 'POST',
      path: '/api/v1/kasir/transaksi',
      title: 'Kirim Transaksi Kasir POS',
      role: 'KARYAWAN',
      description: 'Menyimpan penjualan struk kasir per transaksi dengan kalkulasi item & roti.',
      samplePayload: JSON.stringify(
        {
          id_cabang: 'CBG01',
          id_karyawan: 'K001',
          items: [
            {
              nama: 'Coklat Keju Campur',
              harga: 19000,
              qty: 1,
              satuan_roti: 1,
              porsi: 'UTUH',
              cara_masak: 'BAKAR'
            }
          ],
          metode_bayar: 'QRIS',
          total_bayar: 19000,
          total_roti: 1,
          uang_diterima: 19000,
          uang_kembali: 0
        },
        null,
        2
      )
    },
    {
      method: 'POST',
      path: '/api/v1/laporan-shift',
      title: 'Kirim Laporan Tutup Shift',
      role: 'KARYAWAN',
      description:
        'Rekonsiliasi akhir shift: stok roti sisa fisik, setoran uang, modal, dan catatan kompor.',
      samplePayload: JSON.stringify(
        {
          shift_id: 'SH-LIVE-01',
          id_cabang: 'CBG01',
          id_karyawan: 'K001',
          roti_awal: 100,
          roti_sisa: 10,
          roti_sisa_kemarin: 8,
          roti_diantar: 92,
          roti_rusak_bonus: 0,
          penjualan_offline_roti: 90,
          penjualan_luar_kasir_roti: 0,
          bahan_habis: [{ nama: 'Margarin', jumlah: '1 bungkus' }],
          pengeluaran: 25000,
          setor_uang: 1350000,
          sisa_modal: 150000,
          catatan: 'Operasional lancar tanpa kendala alat.'
        },
        null,
        2
      )
    },
    {
      method: 'POST',
      path: '/api/v1/bon/ajukan',
      title: 'Pengajuan Kasbon Karyawan',
      role: 'KARYAWAN',
      description: 'Staf mengajukan pinjaman kasbon yang langsung masuk ke antrean approval BOS.',
      samplePayload: JSON.stringify(
        {
          id_karyawan: 'K001',
          nominal: 150000,
          catatan: 'Keperluan mendesak ganti ban motor operasional'
        },
        null,
        2
      )
    }
  ];

  // Set initial payload when endpoint changes
  React.useEffect(() => {
    setPayloadInput(endpoints[selectedEndpointIdx].samplePayload);
    setApiResponse(null);
  }, [selectedEndpointIdx]);

  const handleExecuteRequest = async () => {
    const ep = endpoints[selectedEndpointIdx];
    setIsCallingApi(true);
    setApiResponse(null);

    try {
      let parsedBody: any = undefined;
      if (ep.method !== 'GET') {
        parsedBody = JSON.parse(payloadInput);
      }

      const res = await fetch(ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: parsedBody ? JSON.stringify(parsedBody) : undefined
      });

      const data = await res.json();
      setApiResponse({
        status: res.status,
        ok: res.ok,
        data
      });
    } catch (err: any) {
      setApiResponse({
        status: 500,
        ok: false,
        error: err.message || 'Gagal mengirim request ke backend'
      });
    } finally {
      setIsCallingApi(false);
    }
  };

  const sampleFlutterDartCode = `// lib/services/borneo_api_client.dart
import 'package:dio/dio.dart';

class BorneoApiClient {
  static const String baseUrl = 'http://localhost:3000/api/v1'; // Atau URL Server Production
  final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json'},
  ));

  // 1. Login Karyawan
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });
    return response.data;
  }

  // 2. Absen Masuk dengan GPS & Foto Kamera (iOS & Android)
  Future<Map<String, dynamic>> absenMasuk({
    required String idKaryawan,
    required String idCabang,
    required double latitude,
    required double longitude,
    required String fotoBase64,
  }) async {
    final response = await dio.post('/mobile/absen-masuk', data: {
      'id_karyawan': idKaryawan,
      'id_cabang': idCabang,
      'latitude': latitude,
      'longitude': longitude,
      'foto_selfie_base64': fotoBase64,
    });
    return response.data;
  }

  // 3. Simpan Transaksi Kasir POS
  Future<Map<String, dynamic>> submitTransaksi(Map<String, dynamic> transaksiData) async {
    final response = await dio.post('/kasir/transaksi', data: transaksiData);
    return response.data;
  }

  // 4. Laporan Tutup Shift & Sisa Roti
  Future<Map<String, dynamic>> submitLaporanShift(Map<String, dynamic> laporanData) async {
    final response = await dio.post('/laporan-shift', data: laporanData);
    return response.data;
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleFlutterDartCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const activeEp = endpoints[selectedEndpointIdx];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="ios-glass-card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black tracking-wider text-sky-400 uppercase">
              FLUTTER CROSS-PLATFORM HUB
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-slate-400">iOS & Android App Integration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            REST API & Kontrak Mobile Staf Karyawan
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Sesuai arsitektur baru, karyawan di lapangan (baik pengguna <strong>iPhone</strong> maupun{' '}
            <strong>Android</strong>) menggunakan aplikasi <strong>Flutter</strong> portabel untuk
            absen GPS selfie, kasir POS, kasbon, dan laporan shift. Backend Node.js ini menyediakan
            seluruh REST endpoint yang siap dikonsumsi.
          </p>
        </div>

        {/* Badges / Tech stack */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>Flutter (iOS / Android)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Node.js / Express Engine</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Endpoints & Interactive Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Daftar Endpoint Mobile (v1)
            </p>
            <span className="text-[11px] font-mono text-indigo-400">
              {endpoints.length} Endpoints
            </span>
          </div>

          <div className="space-y-2">
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpointIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedEndpointIdx(idx)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'ios-glass-active border-indigo-500/40 text-white shadow-lg'
                      : 'ios-glass border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                          ep.method === 'POST'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <p className="font-bold text-xs text-white">{ep.title}</p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {ep.role}
                    </span>
                  </div>

                  <p className="font-mono text-[11px] text-slate-400 truncate mb-1">
                    {ep.path}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{ep.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Interactive Tester */}
        <div className="lg:col-span-7 space-y-4">
          <div className="ios-glass rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Simulator REST API</h3>
                  <p className="text-[11px] text-slate-400">
                    Uji langsung endpoint backend tanpa perlu membuka emulator
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeEp.method}
                </span>
                <span className="text-xs font-mono text-slate-300">{activeEp.path}</span>
              </div>
            </div>

            {/* Request Body Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  Request Payload (JSON Body)
                </label>
                <button
                  onClick={() => setPayloadInput(activeEp.samplePayload)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              <textarea
                value={payloadInput}
                onChange={(e) => setPayloadInput(e.target.value)}
                rows={7}
                className="w-full p-3 font-mono text-[11px] rounded-xl bg-slate-950/80 border border-white/10 text-emerald-300 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y"
              />
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleExecuteRequest}
                disabled={isCallingApi}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isCallingApi ? 'Mengirim Request...' : 'Kirim Request ke Server'}</span>
              </button>
            </div>

            {/* Response Output Box */}
            {apiResponse && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-300">Respons Server (HTTP):</p>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      apiResponse.ok
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    HTTP {apiResponse.status}
                  </span>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(apiResponse.data || apiResponse.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Flutter Client Code Snippet Card */}
          <div className="ios-glass rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white">
                  Contoh Implementasi Flutter Dart (Dio Client)
                </h4>
              </div>

              <button
                onClick={copyToClipboard}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/5"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px]">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[11px]">Salin Kode Dart</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 font-mono text-[10.5px] overflow-x-auto max-h-64 leading-relaxed">
              {sampleFlutterDartCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
