import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah, formatNumber } from '../../services/api';
import { CabangDashboard } from '../../types';
import { Radio, Clock, Phone, MapPin, ShoppingBag, Coins, Users, RefreshCw } from 'lucide-react';

export const LiveOutletsView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [liveOutlets, setLiveOutlets] = useState<CabangDashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLiveOutlets();
      setLiveOutlets(data);
    } catch (err) {
      console.warn('Failed loading live outlets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayedOutlets = liveOutlets.filter(
    (o) => selectedCabangId === 'ALL' || o.id_cabang === selectedCabangId
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="ios-glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            STATUS OPERASIONAL REAL-TIME
          </span>
          <h2 className="text-xl font-black text-white">Monitoring Outlet Gerai Live</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Informasi status buka gerai, presensi selfie staf bertugas, dan estimasi upah shift saat ini.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-bold text-slate-200 border border-white/10 cursor-pointer self-start sm:self-auto transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          Perbarui Live
        </button>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedOutlets.map((outlet) => {
          const isBuka = outlet.status === 'BUKA';
          const cabangInfo = allCabang.find((c) => c.id_cabang === outlet.id_cabang);

          return (
            <div
              key={outlet.id_cabang}
              className={`ios-glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                isBuka ? 'ring-1 ring-indigo-500/30' : 'opacity-85'
              }`}
            >
              <div>
                {/* Header status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {outlet.id_cabang}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{outlet.nama_cabang}</h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                      isBuka
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-white/10'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBuka ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                      }`}
                    />
                    {isBuka ? 'GERAI BUKA' : 'TUTUP'}
                  </span>
                </div>

                {/* Operating details */}
                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cabangInfo?.alamat || 'Banjarmasin'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Jam Buka Pertama: <strong className="text-white">{outlet.jam_buka_pertama ? `${outlet.jam_buka_pertama} WITA` : '—'}</strong></span>
                  </div>
                  {cabangInfo?.telepon && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${cabangInfo.telepon}`} className="text-indigo-400 hover:underline">
                        {cabangInfo.telepon}
                      </a>
                    </div>
                  )}
                </div>

                {/* KPI stats */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Roti Terjual Hari Ini</span>
                    <strong className="text-white font-mono text-sm block mt-0.5">
                      {formatNumber(outlet.roti_terjual_hari_ini)} Roti
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Omzet POS Hari Ini</span>
                    <strong className="text-amber-400 font-mono text-sm block mt-0.5">
                      {formatRupiah((outlet as any).omzet_kasir_hari_ini || 0)}
                    </strong>
                  </div>
                </div>

                {/* Staff on duty */}
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[11px] font-bold text-slate-300 block mb-2 flex items-center justify-between">
                    <span>STAF BERTUGAS ({outlet.karyawan_absen.length}):</span>
                    {isBuka && <span className="text-[10px] text-emerald-400 font-normal">Shift Berjalan</span>}
                  </span>

                  {outlet.karyawan_absen.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 italic bg-white/2 rounded-xl border border-white/5">
                      Belum ada karyawan yang absen masuk.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {outlet.karyawan_absen.map((k, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5"
                        >
                          <div className="flex items-center gap-2.5">
                            {k.foto_url ? (
                              <img
                                src={k.foto_url}
                                alt="Selfie"
                                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30 shadow"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                                {k.nama_karyawan.charAt(0)}
                              </div>
                            )}
                            <div>
                              <strong className="text-xs text-white block">{k.nama_karyawan}</strong>
                              <span className="text-[10px] text-slate-400">Masuk {k.jam_masuk} WITA</span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {k.status_masuk || 'Hadir'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated labor cost */}
              {isBuka && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimasi Upah Shift Hari Ini:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {formatRupiah(outlet.estimasi_gaji_hari_ini || 5.5 * 18000)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
