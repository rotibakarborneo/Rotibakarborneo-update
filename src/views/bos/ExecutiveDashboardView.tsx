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

export const ExecutiveDashboardView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [laporan, setLaporan] = useState<LaporanShift[]>([]);
  const [transaksi, setTransaksi] = useState<TransaksiKasir[]>([]);
  const [liveOutlets, setLiveOutlets] = useState<CabangDashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    branchName: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // Date range filter
  const today = getTodayDateStr();
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lData, tData, oData] = await Promise.all([
          apiService.getLaporanShift(),
          apiService.getTransaksiKasir(),
          apiService.getLiveOutlets()
        ]);
        const lList = lData || [];
        const tList = tData || [];
        setLaporan(lList);
        setTransaksi(tList);
        setLiveOutlets(oData || []);

        // Anchor date window to newest synced operational date so chart/KPIs never start empty
        const allDates = [
          ...lList.map((l) => l.tanggal_operasional),
          ...tList.map((t) => t.tanggal_operasional)
        ].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
        if (allDates.length > 0) {
          const newest = allDates.sort().reverse()[0];
          const [y, m, day] = newest.split('-').map(Number);
          const endObj = new Date(Date.UTC(y, m - 1, day));
          const startObj = new Date(endObj.getTime() - 14 * 24 * 60 * 60 * 1000);
          setEndDate(newest);
          setStartDate(startObj.toISOString().slice(0, 10));
        }
      } catch (err) {
        console.warn('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtered reports by date and selected branch
  const filteredLaporan = useMemo(() => {
    return laporan.filter((l) => {
      const matchBranch = selectedCabangId === 'ALL' || l.id_cabang === selectedCabangId;
      const matchDate = l.tanggal_operasional >= startDate && l.tanggal_operasional <= endDate;
      return matchBranch && matchDate;
    });
  }, [laporan, selectedCabangId, startDate, endDate]);

  // Filtered transactions by date and selected branch
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

  // SVG Chart data generator
  const chartInfo = useMemo(() => {
    const rawDates = Array.from(new Set(filteredLaporan.map((l) => l.tanggal_operasional))).sort();
    const dates = rawDates.length > 0 ? rawDates : [today];

    const palette = [
      { stroke: '#6366f1', fillStart: 'rgba(99, 102, 241, 0.35)', fillEnd: 'rgba(99, 102, 241, 0.0)' },
      { stroke: '#38bdf8', fillStart: 'rgba(56, 189, 248, 0.35)', fillEnd: 'rgba(56, 189, 248, 0.0)' },
      { stroke: '#a855f7', fillStart: 'rgba(168, 85, 247, 0.35)', fillEnd: 'rgba(168, 85, 247, 0.0)' },
      { stroke: '#f59e0b', fillStart: 'rgba(245, 158, 11, 0.35)', fillEnd: 'rgba(245, 158, 11, 0.0)' }
    ];

    const displayBranches =
      selectedCabangId === 'ALL'
        ? allCabang
        : allCabang.filter((c) => c.id_cabang === selectedCabangId);

    // Collect all data values
    const branchSeries = displayBranches.map((branch, bIdx) => {
      const colors = palette[bIdx % palette.length];
      const points = dates.map((d) => {
        const matches = filteredLaporan.filter(
          (l) => l.tanggal_operasional === d && l.id_cabang === branch.id_cabang
        );
        const val = matches.reduce((acc, cur) => acc + (cur.roti_awal - cur.roti_sisa), 0);
        return { date: d, value: val || 0 };
      });
      return {
        id: branch.id_cabang,
        name: branch.nama_cabang,
        colors,
        points
      };
    });

    // Find max value for Y scale
    let maxVal = 10;
    branchSeries.forEach((s) => {
      s.points.forEach((p) => {
        if (p.value > maxVal) maxVal = p.value;
      });
    });
    maxVal = Math.ceil(maxVal * 1.15); // Add headroom

    return {
      dates,
      maxVal,
      branchSeries
    };
  }, [filteredLaporan, allCabang, selectedCabangId, today]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  return (
    <div className="space-y-6">
      {/* Date Filter & Quick Indicators */}
      <div className="ios-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">Rentang Periode:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <span className="text-slate-500">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300">
            Total Shift: <strong className="text-white font-mono">{filteredLaporan.length}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Gerai Buka Sekarang:{' '}
            <strong className="font-mono">{liveOutlets.filter((o) => o.status === 'BUKA').length}</strong>
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
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
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatNumber(totals.roti)}
            </span>
            <span className="text-xs text-slate-400 font-medium">Potong Roti</span>
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
          <p className="text-[11px] text-slate-400 mt-2">Nilai transaksi struk kasir digital</p>
        </div>

        {/* Card 4: Laba Bersih Operasional */}
        <div className="ios-glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Laba Operasional
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                totals.labaOperasional >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatRupiah(totals.labaOperasional)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Setoran shift dikurangi biaya operasional</p>
        </div>
      </div>

      {/* Sales Trend Chart (Pure High-Performance React SVG - Zero Canvas Lifecycle Issues) */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Grafik Penjualan Roti Harian
            </h2>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {chartInfo.branchSeries.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: s.colors.stroke }}
                />
                <span className="font-medium text-[11px]">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Canvas Area */}
        <div className="w-full relative overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-64 sm:h-72 select-none"
          >
            <defs>
              {chartInfo.branchSeries.map((s) => (
                <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.colors.fillStart} />
                  <stop offset="100%" stopColor={s.colors.fillEnd} />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padTop + plotHeight * (1 - pct);
              const val = Math.round(chartInfo.maxVal * pct);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Dates on X Axis */}
            {chartInfo.dates.map((dateStr, idx) => {
              const x =
                padLeft +
                (chartInfo.dates.length > 1
                  ? (idx / (chartInfo.dates.length - 1)) * plotWidth
                  : plotWidth / 2);
              const shortDate = dateStr.slice(5); // MM-DD
              return (
                <text
                  key={idx}
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {shortDate}
                </text>
              );
            })}

            {/* Render Series Paths and Areas */}
            {chartInfo.branchSeries.map((s) => {
              const coords = s.points.map((p, pIdx) => {
                const x =
                  padLeft +
                  (s.points.length > 1
                    ? (pIdx / (s.points.length - 1)) * plotWidth
                    : plotWidth / 2);
                const yPct = chartInfo.maxVal > 0 ? p.value / chartInfo.maxVal : 0;
                const y = padTop + plotHeight * (1 - yPct);
                return { x, y, ...p };
              });

              if (coords.length === 0) return null;

              // Build smooth path
              let linePath = `M ${coords[0].x} ${coords[0].y}`;
              for (let i = 1; i < coords.length; i++) {
                const prev = coords[i - 1];
                const curr = coords[i];
                const cx1 = prev.x + (curr.x - prev.x) / 2;
                const cx2 = cx1;
                linePath += ` C ${cx1} ${prev.y}, ${cx2} ${curr.y}, ${curr.x} ${curr.y}`;
              }

              const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${
                padTop + plotHeight
              } L ${coords[0].x} ${padTop + plotHeight} Z`;

              return (
                <g key={s.id}>
                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill={`url(#grad-${s.id})`} />

                  {/* Line Stroke */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={s.colors.stroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {coords.map((pt, ptIdx) => (
                    <circle
                      key={ptIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={s.colors.stroke}
                      stroke="#0c111c"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          date: pt.date,
                          branchName: s.name,
                          value: pt.value,
                          x: pt.x,
                          y: pt.y
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-white text-xs shadow-2xl z-20"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100 - 8}%`
              }}
            >
              <p className="text-[10px] text-slate-400 font-mono">{hoveredPoint.date}</p>
              <p className="font-bold text-sky-300">{hoveredPoint.branchName}</p>
              <p className="font-extrabold text-white text-xs font-mono">{hoveredPoint.value} Roti Terjual</p>
            </div>
          )}
        </div>
      </div>

      {/* Outlet Performance Summary Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Performa Cabang Periode Ini</h2>
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
                  const cTrx = filteredTransaksi.filter((t) => t.id_cabang === cabang.id_cabang);

                  const roti = cLaporan.reduce((a, b) => a + (b.roti_awal - b.roti_sisa), 0) ||
                    cTrx.reduce((a, b) => a + b.total_roti, 0);
                  const setor = cLaporan.reduce((a, b) => a + b.setor_uang, 0);
                  const keluar = cLaporan.reduce((a, b) => a + b.pengeluaran, 0);
                  const omzet = cTrx.reduce((a, b) => a + b.total_bayar, 0);
                  const laba = setor - keluar;

                  return (
                    <tr key={cabang.id_cabang} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <div>
                            <strong className="text-white block">{cabang.nama_cabang}</strong>
                            <span className="text-[11px] text-slate-400 font-mono">{cabang.id_cabang}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        {formatNumber(roti)} Roti
                      </td>
                      <td className="py-3.5 px-3 font-mono text-sky-300">
                        {formatRupiah(setor)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-rose-300">
                        {formatRupiah(keluar)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-amber-300">
                        {formatRupiah(omzet)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className={laba >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatRupiah(laba)}
                        </span>
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
