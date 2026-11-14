import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber } from '../../services/api';
import { TransaksiKasir } from '../../types';
import {
  Receipt,
  Search,
  Banknote,
  QrCode,
  Flame,
  Wind,
  Printer,
  X,
  CreditCard,
  ShoppingBag
} from 'lucide-react';

export const POSTransactionsView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [transactions, setTransactions] = useState<TransaksiKasir[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<TransaksiKasir | null>(null);

  const loadData = async () => {
    try {
      const data = await apiService.getTransaksiKasir();
      setTransactions(data);
    } catch (err) {
      console.warn('Failed loading POS transactions', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchBranch = selectedCabangId === 'ALL' || t.id_cabang === selectedCabangId;
      const matchMethod = filterMethod === 'ALL' || t.metode_bayar === filterMethod;
      const matchSearch =
        search.trim() === '' ||
        t.transaksi_id.toLowerCase().includes(search.toLowerCase()) ||
        t.nama_karyawan.toLowerCase().includes(search.toLowerCase()) ||
        t.items.some((it) => it.nama.toLowerCase().includes(search.toLowerCase()));

      return matchBranch && matchMethod && matchSearch;
    });
  }, [transactions, selectedCabangId, filterMethod, search]);

  const totalOmzet = filtered.reduce((a, b) => a + b.total_bayar, 0);
  const totalRoti = filtered.reduce((a, b) => a + b.total_roti, 0);

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-300 font-semibold">
          Daftar Struk Transaksi ({filtered.length})
        </span>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-slate-400 block text-[10px]">Total Omzet Terfilter:</span>
            <strong className="text-amber-400 font-mono text-sm">{formatRupiah(totalOmzet)}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-slate-400 block text-[10px]">Roti Terjual:</span>
            <strong className="text-sky-400 font-mono text-sm">{formatNumber(totalRoti)} Roti</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ios-glass rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID transaksi, nama staf, menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">Metode Bayar:</span>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="CASH">Tunai / Cash</option>
            <option value="QRIS">QRIS Dinamis</option>
          </select>
        </div>
      </div>

      {/* Transactions Feed List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="ios-glass rounded-2xl p-12 text-center text-slate-500 text-xs">
            Tidak ada transaksi kasir yang cocok dengan filter.
          </div>
        ) : (
          filtered.map((trx) => (
            <div
              key={trx.transaksi_id}
              className="ios-glass-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {trx.transaksi_id}
                  </span>
                  <span className="text-xs font-bold text-white">{trx.nama_cabang}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400">Kasir: {trx.nama_karyawan}</span>
                </div>

                {/* Items breakdown pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {trx.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-1.5 text-slate-200"
                    >
                      <span className="font-semibold text-white">{it.qty}x</span>
                      <span>{it.nama}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          it.cara_masak === 'BAKAR'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-sky-500/15 text-sky-300'
                        }`}
                      >
                        {it.cara_masak}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-amber-400 font-mono block">
                    {formatRupiah(trx.total_bayar)}
                  </span>
                  <span className="text-[10px] text-slate-400">{trx.dibuat_pada}</span>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                    trx.metode_bayar === 'QRIS'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {trx.metode_bayar === 'QRIS' ? (
                    <QrCode className="w-3.5 h-3.5" />
                  ) : (
                    <Banknote className="w-3.5 h-3.5" />
                  )}
                  {trx.metode_bayar}
                </span>

                <button
                  onClick={() => setSelectedReceipt(trx)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                >
                  Struk
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thermal Struk Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            {/* White Thermal Receipt simulation */}
            <div className="bg-white text-black p-5 rounded-xl font-mono text-[11px] shadow space-y-3">
              <div className="text-center border-b border-dashed border-zinc-400 pb-3">
                <h4 className="font-black text-sm tracking-wide">ROTI BAKAR BORNEO</h4>
                <p className="text-[10px] text-zinc-700">{selectedReceipt.nama_cabang}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">{selectedReceipt.dibuat_pada}</p>
                <p className="text-[9px] text-zinc-500">ID: {selectedReceipt.transaksi_id} • Kasir: {selectedReceipt.nama_karyawan}</p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-zinc-400 pb-3">
                {selectedReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <div className="font-semibold">{it.nama}</div>
                      <div className="text-[9px] text-zinc-500">
                        {it.qty}x @{formatRupiah(it.harga)} ({it.cara_masak} • {it.porsi})
                      </div>
                    </div>
                    <span className="font-bold">{formatRupiah(it.harga * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span>TOTAL TAGIHAN:</span>
                  <span>{formatRupiah(selectedReceipt.total_bayar)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Metode Pembayaran:</span>
                  <span>{selectedReceipt.metode_bayar}</span>
                </div>
                {selectedReceipt.metode_bayar === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Uang Diterima:</span>
                      <span>{formatRupiah(selectedReceipt.uang_diterima || selectedReceipt.total_bayar)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(selectedReceipt.uang_kembali || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center border-t border-dashed border-zinc-400 pt-3 text-[9px] text-zinc-500">
                Terima kasih telah berbelanja!<br />
                Roti Bakar Borneo - Nikmat & Hangat
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
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
