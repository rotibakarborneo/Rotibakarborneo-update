import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber } from '../../services/api';
import { PayrollItem, BonusItem } from '../../types';
import { Users2, Award, Printer, X, FileText, Calendar, Clock } from 'lucide-react';

export const PayrollManagementView: React.FC = () => {
  const { selectedCabangId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [activeMonth, setActiveMonth] = useState<string>('ALL');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [bonusData, setBonusData] = useState<BonusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);
  const [activeTab, setActiveTab] = useState<'payroll' | 'bonus'>('payroll');

  const loadPayroll = async (month?: string) => {
    setLoading(true);
    try {
      const res = await apiService.getPayroll(month || undefined);
      setAvailableMonths(res.availableMonths || []);
      setActiveMonth(res.activeMonth || 'ALL');
      if (!selectedMonth && res.activeMonth) {
        setSelectedMonth(res.activeMonth);
      }
      setPayrollData(res.payroll || []);
      setBonusData(res.bonus || []);
    } catch (err) {
      console.warn('Failed loading payroll data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll(selectedMonth || undefined);
  }, [selectedMonth]);

  const filteredPayroll = useMemo(() => {
    return payrollData.filter(
      (p) => selectedCabangId === 'ALL' || p.id_cabang === selectedCabangId
    );
  }, [payrollData, selectedCabangId]);

  const filteredBonus = useMemo(() => {
    return bonusData.filter(
      (b) => selectedCabangId === 'ALL' || b.id_cabang === selectedCabangId
    );
  }, [bonusData, selectedCabangId]);

  const totalGajiBersih = filteredPayroll.reduce((a, b) => a + b.gaji_bersih, 0);
  const totalJamKeseluruhan = filteredPayroll.reduce((a, b) => a + b.total_jam_kerja, 0);
  const totalBonusNominal = filteredBonus.reduce((a, b) => a + b.bonus_nominal, 0);

  const formatMonthLabel = (ym: string) => {
    if (!ym || ym === 'ALL') return 'Semua Periode (Akumulasi)';
    const [y, m] = ym.split('-').map(Number);
    if (!y || !m) return ym;
    const d = new Date(Date.UTC(y, m - 1, 1));
    return d.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & Tab Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl ios-glass text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Periode:</span>
            <select
              value={selectedMonth || activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0b1020] text-white">
                Semua Periode (Akumulasi)
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#0b1020] text-white">
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-slate-400">
            Aturan denda: toleransi 10 mnt, potongan Rp 750 / 15 mnt
          </span>
        </div>

        <div className="flex p-1 bg-slate-900/60 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gaji Pokok & Jam Kerja
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'bonus'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bonus Target Roti
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ios-glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">
              Total Gaji Bersih ({activeMonth === 'ALL' ? 'Total' : activeMonth})
            </span>
            <strong className="text-2xl font-black text-white font-mono tabular-nums block mt-1">
              {formatRupiah(totalGajiBersih)}
            </strong>
            <span className="text-[11px] text-slate-400">
              {filteredPayroll.length} Karyawan Terdaftar
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        <div className="ios-glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">
              Akumulasi Jam Kerja
            </span>
            <strong className="text-2xl font-black text-emerald-400 font-mono tabular-nums block mt-1">
              {totalJamKeseluruhan.toFixed(1)} Jam
            </strong>
            <span className="text-[11px] text-slate-400">
              Dihitung dari absen masuk–pulang WIB
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="ios-glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">
              Total Bonus Target Roti
            </span>
            <strong className="text-2xl font-black text-amber-400 font-mono tabular-nums block mt-1">
              {formatRupiah(totalBonusNominal)}
            </strong>
            <span className="text-[11px] text-slate-400">
              Insentif Rp 1.000 / kelebihan roti terjual
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ios-glass rounded-2xl p-10 text-center text-xs text-slate-400">
          Menghitung payroll dari data shift & kasbon...
        </div>
      ) : activeTab === 'payroll' ? (
        /* Payroll Table */
        <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                  <th className="py-3 px-3">Karyawan</th>
                  <th className="py-3 px-3">Cabang</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3">Jam Kerja</th>
                  <th className="py-3 px-3">Telat</th>
                  <th className="py-3 px-3">Gaji Kotor</th>
                  <th className="py-3 px-3">Potongan</th>
                  <th className="py-3 px-3">Gaji Bersih</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayroll.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Tidak ada data payroll karyawan pada cabang ini.
                    </td>
                  </tr>
                ) : (
                  filteredPayroll.map((item) => (
                    <tr key={item.id_karyawan} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3">
                        <strong className="text-white block">{item.nama}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.id_karyawan} • {formatRupiah(item.tarif_per_jam)}/jam
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">{item.nama_cabang}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white tabular-nums">
                        {item.jumlah_hari_masuk} Hari
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300 tabular-nums">
                        {item.total_jam_kerja.toFixed(1)} Jam
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums">
                        {item.total_menit_terlambat > 0 ? (
                          <div>
                            <span className="text-amber-300 block">
                              {item.total_menit_terlambat} mnt
                            </span>
                            <span className="text-[10px] text-rose-400">
                              -{formatRupiah(item.potongan_telat)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-xs">0 mnt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300 tabular-nums">
                        {formatRupiah(item.gaji_kotor)}
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums">
                        <div className="text-rose-400">-{formatRupiah(item.total_potongan)}</div>
                        {item.potongan_kasbon > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            Kasbon: {formatRupiah(item.potongan_kasbon)}
                          </span>
                        )}
                        {item.kasbon_menunggu > 0 && (
                          <span className="text-[10px] text-amber-400 block">
                            Pending: {formatRupiah(item.kasbon_menunggu)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-sky-400 text-sm tabular-nums">
                        {formatRupiah(item.gaji_bersih)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedSlip(item)}
                          className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-white/10 cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Slip Gaji
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Bonus Table */
        <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                  <th className="py-3 px-3">Karyawan</th>
                  <th className="py-3 px-3">Cabang Outlet</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3">Target Roti</th>
                  <th className="py-3 px-3">Realisasi Terjual</th>
                  <th className="py-3 px-3">Kelebihan Target</th>
                  <th className="py-3 px-3">Bonus Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBonus.map((item) => (
                  <tr key={item.id_karyawan} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-3 font-bold text-white">{item.nama_karyawan}</td>
                    <td className="py-3.5 px-3 text-slate-300">{item.nama_cabang}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300 tabular-nums">
                      {item.total_hari} Hari
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-400 tabular-nums">
                      {formatNumber(item.target_roti)} Roti
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-white tabular-nums">
                      {item.roti_terjual} Roti
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-sky-400 tabular-nums">
                      +{formatNumber(item.kelebihan_roti)} Roti
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-amber-400 text-sm tabular-nums">
                      {formatRupiah(item.bonus_nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip Gaji Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-black text-white">Slip Gaji Resmi Karyawan</h3>
              <button
                onClick={() => setSelectedSlip(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white text-black rounded-xl font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-zinc-400 pb-2">
                <strong className="block text-sm">ROTI BAKAR BORNEO</strong>
                <span className="text-[10px] text-zinc-600">SLIP GAJI KARYAWAN</span>
                <p className="text-[9px] text-zinc-500 mt-0.5">
                  Periode: {formatMonthLabel(activeMonth)} • WIB
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Nama Staf:</span>
                  <span className="font-bold">
                    {selectedSlip.nama} ({selectedSlip.id_karyawan})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Cabang Penempatan:</span>
                  <span>{selectedSlip.nama_cabang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Hari Masuk Kerja:</span>
                  <span>{selectedSlip.jumlah_hari_masuk} Hari</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Total Jam Kerja:</span>
                  <span>{selectedSlip.total_jam_kerja} Jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tarif / Jam:</span>
                  <span>{formatRupiah(selectedSlip.tarif_per_jam)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Keterlambatan:</span>
                  <span>{selectedSlip.total_menit_terlambat} Menit</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Gaji Kotor:</span>
                  <span>{formatRupiah(selectedSlip.gaji_kotor)}</span>
                </div>
                <div className="flex justify-between text-rose-600 text-[10px]">
                  <span>Potongan Telat:</span>
                  <span>-{formatRupiah(selectedSlip.potongan_telat)}</span>
                </div>
                <div className="flex justify-between text-rose-600 text-[10px]">
                  <span>Potongan Kasbon:</span>
                  <span>-{formatRupiah(selectedSlip.potongan_kasbon)}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-zinc-300">
                  <span>TOTAL GAJI BERSIH:</span>
                  <span className="text-blue-800">{formatRupiah(selectedSlip.gaji_bersih)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Slip Gaji
              </button>
              <button
                onClick={() => setSelectedSlip(null)}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
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
