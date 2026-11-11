import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah } from '../../services/api';
import { BonItem } from '../../types';
import { Coins, CheckCircle2, XCircle, Clock, Check, X, AlertCircle } from 'lucide-react';

export const KasbonApprovalView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [bonList, setBonList] = useState<BonItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBon, setSelectedBon] = useState<BonItem | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState<string>('');

  const loadData = async () => {
    try {
      const data = await apiService.getBonList();
      setBonList(data);
    } catch (err) {
      console.warn('Failed loading bon list', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return bonList.filter((b) => {
      const matchBranch = selectedCabangId === 'ALL' || b.id_cabang === selectedCabangId;
      const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
      return matchBranch && matchStatus;
    });
  }, [bonList, selectedCabangId, filterStatus]);

  const totalSisaKasbon = filtered
    .filter((b) => b.status === 'DISETUJUI')
    .reduce((a, b) => a + b.sisa_bon, 0);

  const pendingCount = bonList.filter((b) => b.status === 'DIAJUKAN').length;

  const handleAction = async (status: 'DISETUJUI' | 'DITOLAK' | 'LUNAS') => {
    if (!selectedBon) return;
    try {
      await apiService.verifikasiBon(selectedBon.bon_id, status, catatanAdmin);
      setSelectedBon(null);
      loadData();
    } catch (err) {
      console.warn('Failed verifikasi bon', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="ios-glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            PERSETUJUAN PINJAMAN KARYAWAN
          </span>
          <h2 className="text-xl font-black text-white">Manajemen Kasbon Karyawan</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Persetujuan permohonan kasbon darurat staf gerai dari mobile app dan pemotongan otomatis pada payroll.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-slate-400 block text-[10px]">Menunggu Verifikasi:</span>
            <strong className="text-indigo-400 font-mono text-sm">{pendingCount} Pengajuan</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-slate-400 block text-[10px]">Total Saldo Kasbon Berjalan:</span>
            <strong className="text-amber-400 font-mono text-sm">{formatRupiah(totalSisaKasbon)}</strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ios-glass rounded-2xl p-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-white text-sm">Daftar Pengajuan Kasbon</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="DIAJUKAN">Menunggu Verifikasi</option>
            <option value="DISETUJUI">Disetujui (Berjalan)</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="LUNAS">Lunas</option>
          </select>
        </div>
      </div>

      {/* Kasbon Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Karyawan</th>
                <th className="py-3 px-3">Cabang Gerai</th>
                <th className="py-3 px-3">Nominal Diajukan</th>
                <th className="py-3 px-3">Keperluan / Alasan</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Tanggal Pengajuan</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Tidak ada data kasbon untuk filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.bon_id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-3">
                      <strong className="text-white block">{b.nama_karyawan}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{b.bon_id}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{b.nama_cabang}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-400 text-sm">
                      {formatRupiah(b.nominal)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate">"{b.catatan}"</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'DISETUJUI'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : b.status === 'DITOLAK'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : b.status === 'LUNAS'
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                            : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-slate-400">{b.dibuat_pada}</td>
                    <td className="py-3.5 px-3 text-right">
                      {b.status === 'DIAJUKAN' ? (
                        <button
                          onClick={() => {
                            setSelectedBon(b);
                            setCatatanAdmin('Disetujui Bos Rahman. Potong payroll.');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow transition"
                        >
                          Verifikasi
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedBon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">Verifikasi Pengajuan Kasbon</h3>
              <button
                onClick={() => setSelectedBon(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Pemohon:</span>
                <strong className="text-white">{selectedBon.nama_karyawan} ({selectedBon.nama_cabang})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nominal Kasbon:</span>
                <strong className="text-amber-400 font-mono text-sm">{formatRupiah(selectedBon.nominal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alasan:</span>
                <span className="text-slate-300 italic">"{selectedBon.catatan}"</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Persetujuan Bos</label>
              <input
                type="text"
                value={catatanAdmin}
                onChange={(e) => setCatatanAdmin(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleAction('DISETUJUI')}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Setujui Kasbon
              </button>
              <button
                onClick={() => handleAction('DITOLAK')}
                className="py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" /> Tolak Kasbon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
