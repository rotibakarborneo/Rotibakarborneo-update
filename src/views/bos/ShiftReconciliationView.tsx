import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah } from '../../services/api';
import { LaporanShift } from '../../types';
import {
  Search,
  Eye,
  Printer,
  X,
  Package,
  Coins,
  Calendar,
  Clock
} from 'lucide-react';

export const ShiftReconciliationView: React.FC = () => {
  const { selectedCabangId } = useAuth();
  const [reports, setReports] = useState<LaporanShift[]>([]);
  const [selectedReport, setSelectedReport] = useState<LaporanShift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLaporanShift();
      setReports(data || []);
    } catch (err) {
      console.warn('Failed loading shift reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.tanggal_operasional && /^\d{4}-\d{2}/.test(r.tanggal_operasional)) {
        set.add(r.tanggal_operasional.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) => {
      const matchBranch = selectedCabangId === 'ALL' || r.id_cabang === selectedCabangId;
      const matchMonth = selectedMonth === 'ALL' || r.tanggal_operasional?.startsWith(selectedMonth);
      const matchQuery =
        !q ||
        r.nama_karyawan?.toLowerCase().includes(q) ||
        r.nama_cabang?.toLowerCase().includes(q) ||
        r.laporan_id?.toLowerCase().includes(q) ||
        r.tanggal_operasional?.includes(q);
      return matchBranch && matchMonth && matchQuery;
    });
  }, [reports, selectedCabangId, selectedMonth, searchQuery]);

  const summary = useMemo(() => {
    return {
      totalSetor: filteredReports.reduce((a, b) => a + (Number(b.setor_uang) || 0), 0),
      totalBiaya: filteredReports.reduce((a, b) => a + (Number(b.pengeluaran) || 0), 0),
      selisihCount: filteredReports.filter((r) => Number(r.selisih_stok) !== 0).length
    };
  }, [filteredReports]);

  const formatWibTimestamp = (raw?: string) => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) + ' WIB'
      );
    }
    return raw.includes('WIB') ? raw : `${raw} WIB`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="ios-glass-card rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Laporan</span>
          <strong className="text-xl font-black text-white font-mono tabular-nums block mt-0.5">
            {filteredReports.length} Shift
          </strong>
        </div>
        <div className="ios-glass-card rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Setoran Disetor</span>
          <strong className="text-xl font-black text-sky-400 font-mono tabular-nums block mt-0.5">
            {formatRupiah(summary.totalSetor)}
          </strong>
        </div>
        <div className="ios-glass-card rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Biaya Gerai</span>
          <strong className="text-xl font-black text-rose-400 font-mono tabular-nums block mt-0.5">
            {formatRupiah(summary.totalBiaya)}
          </strong>
        </div>
        <div className="ios-glass-card rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Selisih Stok != 0</span>
          <strong className="text-xl font-black text-amber-400 font-mono tabular-nums block mt-0.5">
            {summary.selisihCount} Laporan
          </strong>
        </div>
      </div>

      {/* Search & Month Filter Toolbar */}
      <div className="ios-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari karyawan, cabang, tanggal (YYYY-MM-DD)..."
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Bulan ({reports.length} Laporan)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Bulan {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Tanggal & Jam (WIB)</th>
                <th className="py-3 px-3">Cabang</th>
                <th className="py-3 px-3">Karyawan</th>
                <th className="py-3 px-3">Awal / Sisa</th>
                <th className="py-3 px-3">Terjual (POS/Luar)</th>
                <th className="py-3 px-3">Setoran Uang</th>
                <th className="py-3 px-3">Biaya Gerai</th>
                <th className="py-3 px-3">Selisih</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Memuat rekonsiliasi shift dari Google Sheet...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Belum ada laporan shift untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const hasSelisih = Number(report.selisih_stok) !== 0;

                  return (
                    <tr key={report.laporan_id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3 font-mono text-xs">
                        <strong className="text-white block">{report.tanggal_operasional}</strong>
                        <span className="text-[10px] text-slate-400">
                          {report.jam_mulai || '--:--'} – {report.jam_selesai || '--:--'} WIB
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-200 font-medium">
                        {report.nama_cabang || report.id_cabang}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {report.nama_karyawan}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300 tabular-nums">
                        {report.roti_awal} / {report.roti_sisa}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-sky-300 tabular-nums">
                        {report.penjualan_offline_roti}
                        {Number(report.penjualan_luar_kasir_roti) > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            +{report.penjualan_luar_kasir_roti} luar
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-400 tabular-nums">
                        {formatRupiah(report.setor_uang)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-rose-400 tabular-nums">
                        {formatRupiah(report.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            hasSelisih
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {hasSelisih
                            ? `${report.selisih_stok > 0 ? '+' : ''}${report.selisih_stok}`
                            : '0 (Cocok)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-white/10 cursor-pointer inline-flex items-center gap-1.5 transition"
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
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400">
                  {selectedReport.laporan_id} • Shift {selectedReport.shift_id}
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
                <span className="text-slate-400 block">Karyawan Bertugas:</span>
                <strong className="text-white text-sm mt-0.5 block">
                  {selectedReport.nama_karyawan}
                </strong>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {selectedReport.jam_mulai || '--:--'} – {selectedReport.jam_selesai || '--:--'} WIB
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-slate-400 block">Tanggal Operasional:</span>
                <strong className="text-sky-400 text-sm font-mono mt-0.5 block">
                  {selectedReport.tanggal_operasional}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Input: {formatWibTimestamp(selectedReport.dibuat_pada)}
                </span>
              </div>
            </div>

            {/* Physical bread stock */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2 text-xs">
              <h4 className="font-bold text-sky-300 uppercase text-[11px] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sky-400" />
                Rekonsiliasi Fisik Roti
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Sisa Kemarin:</span>
                  <span className="font-mono text-white">{selectedReport.roti_sisa_kemarin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Roti Diantar:</span>
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
                  <span>Rusak / Bonus:</span>
                  <span className="font-mono text-slate-300">{selectedReport.roti_rusak_bonus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir POS:</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {selectedReport.penjualan_offline_roti}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Luar Kasir:</span>
                  <span className="font-mono text-amber-300">
                    {selectedReport.penjualan_luar_kasir_roti}
                  </span>
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
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]"
                    >
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
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
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
