import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber } from '../../services/api';
import { LaporanShift } from '../../types';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  Package,
  Coins,
  ArrowRight
} from 'lucide-react';

export const ShiftReconciliationView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [reports, setReports] = useState<LaporanShift[]>([]);
  const [selectedReport, setSelectedReport] = useState<LaporanShift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLaporanShift();
      setReports(data);
    } catch (err) {
      console.warn('Failed loading shift reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(
      (r) => selectedCabangId === 'ALL' || r.id_cabang === selectedCabangId
    );
  }, [reports, selectedCabangId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="ios-glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            AUDIT & REKONSILIASI TUTUP SHIFT
          </span>
          <h2 className="text-xl font-black text-white">Laporan Shift & Audit Stok Roti</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Pemeriksaan selisih roti fisik vs tercatat di kasir, setoran amplop uang tunai, dan modal laci.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {filteredReports.length} Laporan Tersimpan
          </span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Tanggal Operasional</th>
                <th className="py-3 px-3">Cabang Outlet</th>
                <th className="py-3 px-3">Karyawan Bertugas</th>
                <th className="py-3 px-3">Roti Awal</th>
                <th className="py-3 px-3">Roti Sisa</th>
                <th className="py-3 px-3">Terjual Fisik</th>
                <th className="py-3 px-3">Setoran Uang</th>
                <th className="py-3 px-3">Biaya Gerai</th>
                <th className="py-3 px-3">Selisih Stok</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    Belum ada laporan shift yang disubmit untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const rotiTerpakai = report.roti_awal - report.roti_sisa;
                  const hasSelisih = report.selisih_stok !== 0;

                  return (
                    <tr key={report.laporan_id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-xs">
                        {report.tanggal_operasional}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {report.nama_cabang || report.id_cabang}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {report.nama_karyawan}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{report.roti_awal}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{report.roti_sisa}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-300">
                        {rotiTerpakai} Roti
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-400">
                        {formatRupiah(report.setor_uang)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-rose-400">
                        {formatRupiah(report.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            hasSelisih
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {hasSelisih ? `${report.selisih_stok > 0 ? '+' : ''}${report.selisih_stok} Roti` : 'COCOK (0)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-white/10 cursor-pointer inline-flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Rekonsiliasi Shift */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400">
                  {selectedReport.laporan_id}
                </span>
                <h3 className="text-base font-black text-white">{selectedReport.nama_cabang}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info header */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-slate-400 block">Karyawan Penanggung Jawab:</span>
                <strong className="text-white text-sm mt-0.5 block">{selectedReport.nama_karyawan}</strong>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-slate-400 block">Tanggal Operasional:</span>
                <strong className="text-sky-400 text-sm font-mono mt-0.5 block">
                  {selectedReport.tanggal_operasional}
                </strong>
              </div>
            </div>

            {/* Physical bread stock */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2 text-xs">
              <h4 className="font-bold text-indigo-300 uppercase text-[11px] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                Rekonsiliasi Fisik Roti
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Roti Sisa Kemarin:</span>
                  <span className="font-mono text-white">{selectedReport.roti_sisa_kemarin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Roti Baru Diantar:</span>
                  <span className="font-mono text-white">{selectedReport.roti_diantar}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/5">
                  <span>Total Roti Awal:</span>
                  <span className="font-mono">{selectedReport.roti_awal} Roti</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/5">
                  <span>Roti Sisa Fisik:</span>
                  <span className="font-mono">{selectedReport.roti_sisa} Roti</span>
                </div>
                <div className="flex justify-between">
                  <span>Roti Rusak / Bonus:</span>
                  <span className="font-mono text-slate-400">{selectedReport.roti_rusak_bonus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Kasir POS:</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedReport.penjualan_offline_roti}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="font-bold text-white">Status Selisih Stok:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    selectedReport.selisih_stok === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {selectedReport.selisih_stok === 0
                    ? '0 (Sesuai)'
                    : `${selectedReport.selisih_stok > 0 ? '+' : ''}${selectedReport.selisih_stok} Roti`}
                </span>
              </div>
            </div>

            {/* Cash audit */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5 text-xs">
              <h4 className="font-bold text-sky-300 uppercase text-[11px] flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-sky-400" />
                Keuangan & Setoran Tunai
              </h4>
              <div className="flex justify-between text-slate-300">
                <span>Uang Setoran Disetor:</span>
                <span className="font-mono font-bold text-sky-300 text-sm">
                  {formatRupiah(selectedReport.setor_uang)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Pengeluaran Operasional Shift:</span>
                <span className="font-mono font-bold text-rose-300">
                  {formatRupiah(selectedReport.pengeluaran)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sisa Modal Laci Kasir:</span>
                <span className="font-mono text-white">
                  {formatRupiah(selectedReport.sisa_modal)}
                </span>
              </div>
            </div>

            {/* Depleted items */}
            {selectedReport.bahan_habis && selectedReport.bahan_habis.length > 0 && (
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
                <span className="text-[11px] font-bold text-amber-300 block mb-1.5">
                  Bahan Baku Yang Habis:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.bahan_habis.map((bh, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                      {bh.nama} ({bh.jumlah})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Staff notes */}
            {selectedReport.catatan && (
              <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-xs text-slate-300 italic">
                "{selectedReport.catatan}"
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Audit Laporan
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
