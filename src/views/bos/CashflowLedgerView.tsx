import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, getTodayDateStr } from '../../services/api';
import { KeuanganItem } from '../../types';
import {
  Wallet2,
  TrendingUp,
  TrendingDown,
  Plus,
  Coins,
  Check,
  X,
  Filter
} from 'lucide-react';

export const CashflowLedgerView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const today = getTodayDateStr();

  const [entries, setEntries] = useState<KeuanganItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form state
  const [jenis, setJenis] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PENGELUARAN');
  const [cabangId, setCabangId] = useState<string>('CBG01');
  const [kategori, setKategori] = useState<string>('Kulakan Bahan Baku');
  const [nominal, setNominal] = useState<number>(100000);
  const [catatan, setCatatan] = useState<string>('');

  const loadData = async () => {
    try {
      const data = await apiService.getKeuangan();
      setEntries(data);
    } catch (err) {
      console.warn('Failed loading keuangan', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchBranch = selectedCabangId === 'ALL' || e.id_cabang === selectedCabangId;
      const matchType = filterType === 'ALL' || e.jenis === filterType;
      return matchBranch && matchType;
    });
  }, [entries, selectedCabangId, filterType]);

  const totalPemasukan = filteredEntries
    .filter((e) => e.jenis === 'PEMASUKAN')
    .reduce((a, b) => a + b.nominal, 0);

  const totalPengeluaran = filteredEntries
    .filter((e) => e.jenis === 'PENGELUARAN')
    .reduce((a, b) => a + b.nominal, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return;

    const cabang = allCabang.find((c) => c.id_cabang === cabangId);

    try {
      await apiService.tambahKeuangan({
        tanggal_operasional: today,
        id_cabang: cabangId,
        nama_cabang: cabang ? cabang.nama_cabang : 'Pusat',
        jenis,
        kategori,
        nominal,
        catatan
      });
      setModalOpen(false);
      setCatatan('');
      setNominal(100000);
      loadData();
    } catch (err) {
      console.warn('Failed adding keuangan', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-300 font-semibold">
          Catatan Arus Kas
        </span>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 cursor-pointer self-start md:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Catat Transaksi Kas Baru
        </button>
      </div>

      {/* KPI Cards (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ios-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Pemasukan Kas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-emerald-400 block font-mono">
            {formatRupiah(totalPemasukan)}
          </strong>
          <span className="text-[11px] text-slate-400 mt-1 block">Setoran kasir shift & pendapatan lain</span>
        </div>

        <div className="ios-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Pengeluaran Kas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-rose-400 block font-mono">
            {formatRupiah(totalPengeluaran)}
          </strong>
          <span className="text-[11px] text-slate-400 mt-1 block">Belanja bahan & biaya operasional</span>
        </div>

        <div className="ios-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Saldo Kas Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Wallet2 className="w-4 h-4" />
            </div>
          </div>
          <strong
            className={`text-2xl font-black block font-mono ${
              saldoBersih >= 0 ? 'text-indigo-300' : 'text-rose-400'
            }`}
          >
            {formatRupiah(saldoBersih)}
          </strong>
          <span className="text-[11px] text-slate-400 mt-1 block">Net balance arus kas terfilter</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ios-glass rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">Buku Kas & Riwayat Mutasi</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Mutasi</option>
              <option value="PEMASUKAN">Pemasukan (+)</option>
              <option value="PENGELUARAN">Pengeluaran (-)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Cabang Outlet</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Keterangan / Catatan</th>
                <th className="py-3 px-3">Tipe Input</th>
                <th className="py-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map((e) => (
                <tr key={e.keuangan_id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-3 font-mono text-white text-xs">{e.tanggal_operasional}</td>
                  <td className="py-3.5 px-3 text-slate-300">{e.nama_cabang}</td>
                  <td className="py-3.5 px-3 font-semibold text-white">{e.kategori}</td>
                  <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate">{e.catatan || '—'}</td>
                  <td className="py-3.5 px-3">
                    {e.otomatis ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        Shift Otomatis
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/10">
                        Manual Bos
                      </span>
                    )}
                  </td>
                  <td
                    className={`py-3.5 px-3 text-right font-mono font-bold ${
                      e.jenis === 'PEMASUKAN' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {e.jenis === 'PEMASUKAN' ? '+' : '-'}
                    {formatRupiah(e.nominal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-black text-white">Catat Arus Kas Baru</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJenis('PEMASUKAN')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                      jenis === 'PEMASUKAN'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/60 border-white/10 text-slate-400'
                    }`}
                  >
                    + Pemasukan Dana
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenis('PENGELUARAN')}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                      jenis === 'PENGELUARAN'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900/60 border-white/10 text-slate-400'
                    }`}
                  >
                    - Pengeluaran Dana
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cabang Terkait</label>
                <select
                  value={cabangId}
                  onChange={(e) => setCabangId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {allCabang.map((c) => (
                    <option key={c.id_cabang} value={c.id_cabang} className="bg-[#121722]">
                      {c.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Kategori Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Kulakan Selai Grosir, Gas LPG 3kg, Listrik, Kebersihan..."
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={nominal}
                  onChange={(e) => setNominal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan nomor nota / faktur supplier..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer transition mt-2"
              >
                <Check className="w-4 h-4" /> Simpan Ke Buku Kas
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
