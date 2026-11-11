import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber, getTodayDateStr } from '../../services/api';
import { LaporanShift, TransaksiKasir, CabangDashboard } from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Receipt,
  Store,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ExecutiveDashboardView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [laporan, setLaporan] = useState<LaporanShift[]>([]);
  const [transaksi, setTransaksi] = useState<TransaksiKasir[]>([]);
  const [liveOutlets, setLiveOutlets] = useState<CabangDashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Date range filter
  const today = getTodayDateStr();
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lapData, trxData, liveData] = await Promise.all([
          apiService.getLaporanShift(),
          apiService.getTransaksiKasir(),
          apiService.getLiveOutlets()
        ]);
        setLaporan(lapData);
        setTransaksi(trxData);
        setLiveOutlets(liveData);
      } catch (err) {
        console.warn('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtered dataset based on date & selected branch
  const filteredLaporan = useMemo(() => {
    return laporan.filter((l) => {
      const matchBranch = selectedCabangId === 'ALL' || l.id_cabang === selectedCabangId;
      const matchDate = l.tanggal_operasional >= startDate && l.tanggal_operasional <= endDate;
      return matchBranch && matchDate;
    });
  }, [laporan, selectedCabangId, startDate, endDate]);

  const filteredTransaksi = useMemo(() => {
    return transaksi.filter((t) => {
      const matchBranch = selectedCabangId === 'ALL' || t.id_cabang === selectedCabangId;
      const matchDate = t.tanggal_operasional >= startDate && t.tanggal_operasional <= endDate;
      return matchBranch && matchDate;
    });
  }, [transaksi, selectedCabangId, startDate, endDate]);

  // Aggregate Metrics
  const totals = useMemo(() => {
    const roti = filteredLaporan.reduce((a, b) => a + (b.roti_awal - b.roti_sisa), 0) ||
      filteredTransaksi.reduce((a, b) => a + b.total_roti, 0);
    const setor = filteredLaporan.reduce((a, b) => a + b.setor_uang, 0);
    const pengeluaran = filteredLaporan.reduce((a, b) => a + b.pengeluaran, 0);
    const omzet = filteredTransaksi.reduce((a, b) => a + b.total_bayar, 0);

    return {
      roti: Math.round(roti),
      setor,
      pengeluaran,
      omzet,
      labaOperasional: setor - pengeluaran
    };
  }, [filteredLaporan, filteredTransaksi]);

  // Multi-line chart datasets (iOS Sapphire & Royal Violet color palette)
  const chartData = useMemo(() => {
    const dates = Array.from(new Set(filteredLaporan.map((l) => l.tanggal_operasional))).sort();
    if (dates.length === 0) dates.push(today);

    const palette = [
      { border: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)' }, // Indigo
      { border: '#38bdf8', fill: 'rgba(56, 189, 248, 0.15)' }, // Sky
      { border: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)' }, // Purple
      { border: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' }  // Amber
    ];

    const displayBranches =
      selectedCabangId === 'ALL'
        ? allCabang
        : allCabang.filter((c) => c.id_cabang === selectedCabangId);

    const datasets = displayBranches.map((branch, idx) => {
      const color = palette[idx % palette.length];
      const data = dates.map((d) => {
        const matches = filteredLaporan.filter(
          (l) => l.tanggal_operasional === d && l.id_cabang === branch.id_cabang
        );
        return matches.reduce((acc, cur) => acc + (cur.roti_awal - cur.roti_sisa), 0) || 0;
      });

      return {
        label: branch.nama_cabang,
        data,
        borderColor: color.border,
        backgroundColor: color.fill,
        tension: 0.38,
        fill: true,
        pointBackgroundColor: color.border,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    return {
      labels: dates,
      datasets
    };
  }, [filteredLaporan, allCabang, selectedCabangId, today]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#38bdf8',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Quick Indicators */}
      <div className="ios-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">Rentang Periode Evaluasi:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none cursor-pointer"
          />
          <span className="text-slate-500">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status Gerai:</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {liveOutlets.filter((o) => o.status === 'BUKA').length} dari {allCabang.length} Gerai Aktif Buka
          </span>
        </div>
      </div>

      {/* KPI Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Roti Terjual */}
        <div className="ios-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Roti Terjual
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {formatNumber(totals.roti)}
            </span>
            <span className="text-xs font-bold text-indigo-400">Potong</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
            Penjualan fisik & POS kasir
          </p>
        </div>

        {/* Card 2: Setoran Fisik */}
        <div className="ios-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Setoran Uang Fisik
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono tracking-tight">
              {formatRupiah(totals.setor)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Uang setoran disetor karyawan ke Bos</p>
        </div>

        {/* Card 3: Omzet POS */}
        <div className="ios-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Omzet Kasir POS
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
              {formatRupiah(totals.omzet)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {filteredTransaksi.length} transaksi pembayaran tercatat
          </p>
        </div>

        {/* Card 4: Biaya Pengeluaran Gerai */}
        <div className="ios-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pengeluaran Gerai
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono tracking-tight">
              {formatRupiah(totals.pengeluaran)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Biaya gas LPG, es batu, dan operasional</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
              TREN PERFORMA GERAI
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Grafik Penjualan Roti Harian Antar Cabang
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Satuan: Potong Roti Terjual
          </span>
        </div>
        <div className="h-72 sm:h-80 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Outlet Performance Summary Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
              REKAPITULASI CABANG
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">Performa Cabang Pada Periode Ini</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Outlet Gerai</th>
                <th className="py-3 px-3">Roti Terjual</th>
                <th className="py-3 px-3">Setoran Fisik</th>
                <th className="py-3 px-3">Pengeluaran</th>
                <th className="py-3 px-3">Omzet Kasir</th>
                <th className="py-3 px-3">Laba Gerai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allCabang
                .filter((c) => selectedCabangId === 'ALL' || c.id_cabang === selectedCabangId)
                .map((cabang) => {
                  const cLaporan = filteredLaporan.filter((l) => l.id_cabang === cabang.id_cabang);
                  const cTransaksi = filteredTransaksi.filter((t) => t.id_cabang === cabang.id_cabang);

                  const roti = cLaporan.reduce((a, b) => a + (b.roti_awal - b.roti_sisa), 0) ||
                    cTransaksi.reduce((a, b) => a + b.total_roti, 0);
                  const setor = cLaporan.reduce((a, b) => a + b.setor_uang, 0);
                  const pengeluaran = cLaporan.reduce((a, b) => a + b.pengeluaran, 0);
                  const omzet = cTransaksi.reduce((a, b) => a + b.total_bayar, 0);
                  const laba = setor - pengeluaran;

                  return (
                    <tr key={cabang.id_cabang} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <strong className="text-white block">{cabang.nama_cabang}</strong>
                            <span className="text-[11px] text-slate-400 font-mono">{cabang.id_cabang}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-300">
                        {formatNumber(roti)} roti
                      </td>
                      <td className="py-3.5 px-3 font-mono text-sky-300 font-semibold">
                        {formatRupiah(setor)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-rose-300">
                        {formatRupiah(pengeluaran)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-amber-300">
                        {formatRupiah(omzet)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-emerald-400">
                        {formatRupiah(laba)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
