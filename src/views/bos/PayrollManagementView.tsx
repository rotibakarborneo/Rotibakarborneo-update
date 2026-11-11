import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber } from '../../services/api';
import { User, BonItem, PayrollItem, BonusItem } from '../../types';
import { Users2, Award, Printer, X, FileText, CheckCircle, DollarSign } from 'lucide-react';

export const PayrollManagementView: React.FC = () => {
  const { allUsers, allCabang, selectedCabangId } = useAuth();
  const [bonList, setBonList] = useState<BonItem[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);
  const [activeTab, setActiveTab] = useState<'payroll' | 'bonus'>('payroll');

  useEffect(() => {
    const load = async () => {
      try {
        const bons = await apiService.getBonList();
        setBonList(bons);
      } catch (err) {
        console.warn('Failed loading bon list for payroll', err);
      }
    };
    load();
  }, []);

  // Filter only Karyawan role (since Bos does not receive hourly staff salary)
  const staffKaryawan = useMemo(() => {
    return allUsers.filter(
      (u) => u.role === 'KARYAWAN' && (selectedCabangId === 'ALL' || u.id_cabang === selectedCabangId)
    );
  }, [allUsers, selectedCabangId]);

  // Aggregate Payroll per employee
  const payrollItems = useMemo<PayrollItem[]>(() => {
    return staffKaryawan.map((user) => {
      const cabang = allCabang.find((c) => c.id_cabang === user.id_cabang);
      const hariMasuk = user.id_karyawan === 'K001' ? 14 : user.id_karyawan === 'K002' ? 12 : 10;
      const totalJam = hariMasuk * 7.5;
      const tarif = user.tarif_per_jam || 18000;
      const gajiKotor = totalJam * tarif;

      // Active approved kasbon deduction
      const userBons = bonList.filter(
        (b) => b.id_karyawan === user.id_karyawan && b.status === 'DISETUJUI'
      );
      const potongan = userBons.reduce((a, b) => a + Math.min(b.sisa_bon, 100000), 0);
      const gajiBersih = Math.max(0, gajiKotor - potongan);

      return {
        id_karyawan: user.id_karyawan,
        nama: user.nama,
        nama_cabang: cabang?.nama_cabang || user.id_cabang,
        tarif_per_jam: tarif,
        jumlah_hari_masuk: hariMasuk,
        total_jam_kerja: totalJam,
        total_menit_terlambat: 0,
        gaji_kotor: gajiKotor,
        total_potongan: potongan,
        gaji_bersih: gajiBersih
      };
    });
  }, [staffKaryawan, allCabang, bonList]);

  // Aggregate Bonus per employee
  const bonusItems = useMemo<BonusItem[]>(() => {
    return staffKaryawan.map((user) => {
      const cabang = allCabang.find((c) => c.id_cabang === user.id_cabang);
      const targetRoti = 300;
      const rotiTerjual = user.id_karyawan === 'K001' ? 440 : user.id_karyawan === 'K002' ? 360 : 315;
      const kelebihan = Math.max(0, rotiTerjual - targetRoti);
      const bonusNominal = kelebihan * 1000; // Rp 1.000 per excess bread

      return {
        id_karyawan: user.id_karyawan,
        nama_karyawan: user.nama,
        id_cabang: user.id_cabang,
        nama_cabang: cabang?.nama_cabang || user.id_cabang,
        total_hari: 14,
        total_jam: 105,
        roti_terjual: rotiTerjual,
        target_roti: targetRoti,
        kelebihan_roti: kelebihan,
        bonus_nominal: bonusNominal
      };
    });
  }, [staffKaryawan, allCabang]);

  const totalGajiBersih = payrollItems.reduce((a, b) => a + b.gaji_bersih, 0);
  const totalBonusNominal = bonusItems.reduce((a, b) => a + b.bonus_nominal, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="ios-glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            PENGGAJIAN & INSENTIF STAF
          </span>
          <h2 className="text-xl font-black text-white">Payroll & Bonus Insentif Karyawan</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Perhitungan jam kerja, tarif per jam, potongan kasbon, dan bonus roti target outlet.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-900/60 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gaji Pokok & Jam Kerja
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'bonus'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bonus Target Roti
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ios-glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Gaji Bersih Periode Ini</span>
            <strong className="text-2xl sm:text-3xl font-black text-white font-mono block mt-1">
              {formatRupiah(totalGajiBersih)}
            </strong>
            <span className="text-[11px] text-slate-400">{payrollItems.length} Staf Operasional Gerai</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users2 className="w-6 h-6" />
          </div>
        </div>

        <div className="ios-glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Bonus Target Roti</span>
            <strong className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block mt-1">
              {formatRupiah(totalBonusNominal)}
            </strong>
            <span className="text-[11px] text-slate-400">Insentif Rp 1.000 / kelebihan roti terjual</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {activeTab === 'payroll' ? (
        /* Payroll Table */
        <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                  <th className="py-3 px-3">Karyawan</th>
                  <th className="py-3 px-3">Penempatan Cabang</th>
                  <th className="py-3 px-3">Hari Masuk</th>
                  <th className="py-3 px-3">Total Jam</th>
                  <th className="py-3 px-3">Gaji Kotor</th>
                  <th className="py-3 px-3">Potongan Kasbon</th>
                  <th className="py-3 px-3">Gaji Bersih</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payrollItems.map((item) => (
                  <tr key={item.id_karyawan} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-3">
                      <strong className="text-white block">{item.nama}</strong>
                      <span className="text-[11px] text-slate-400">
                        Tarif: {formatRupiah(item.tarif_per_jam)}/jam
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{item.nama_cabang}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {item.jumlah_hari_masuk} Hari
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{item.total_jam_kerja} Jam</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{formatRupiah(item.gaji_kotor)}</td>
                    <td className="py-3.5 px-3 font-mono text-rose-400">
                      -{formatRupiah(item.total_potongan)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-sky-400 text-sm">
                      {formatRupiah(item.gaji_bersih)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedSlip(item)}
                        className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-white/10 cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Slip Gaji
                      </button>
                    </td>
                  </tr>
                ))}
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
                  <th className="py-3 px-3">Target Roti</th>
                  <th className="py-3 px-3">Realisasi Roti</th>
                  <th className="py-3 px-3">Kelebihan Di Atas Target</th>
                  <th className="py-3 px-3">Bonus Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bonusItems.map((item) => (
                  <tr key={item.id_karyawan} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-3 font-bold text-white">{item.nama_karyawan}</td>
                    <td className="py-3.5 px-3 text-slate-300">{item.nama_cabang}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{item.target_roti} Roti</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-white">{item.roti_terjual} Roti</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-400">
                      +{item.kelebihan_roti} Roti
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-amber-400 text-sm">
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
                <p className="text-[9px] text-zinc-500 mt-0.5">Periode Berjalan • Otentikasi Bos</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Nama Staf:</span>
                  <span className="font-bold">{selectedSlip.nama}</span>
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
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Gaji Kotor:</span>
                  <span>{formatRupiah(selectedSlip.gaji_kotor)}</span>
                </div>
                <div className="flex justify-between text-rose-600 text-[10px]">
                  <span>Potongan Kasbon:</span>
                  <span>-{formatRupiah(selectedSlip.total_potongan)}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-zinc-300">
                  <span>TOTAL GAJI BERSIH:</span>
                  <span className="text-indigo-800">{formatRupiah(selectedSlip.gaji_bersih)}</span>
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
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
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
