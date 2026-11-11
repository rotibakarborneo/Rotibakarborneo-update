import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Clock, RefreshCw, Calendar, Sparkles } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false
}) => {
  const { allCabang, selectedCabangId, setSelectedCabangId } = useAuth();
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) +
          ' • ' +
          now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }) +
          ' WITA'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="ios-glass rounded-2xl px-5 py-3.5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 shadow-lg">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            PORTAL BOS & ADMINISTRASI PUSAT
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[10px] font-semibold text-slate-400">Roti Bakar Borneo</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">{title}</h1>
        <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Branch Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/10 text-xs text-slate-200">
          <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={selectedCabangId}
            onChange={(e) => setSelectedCabangId(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="ALL" className="bg-[#121722] text-white">
              Semua Cabang (Pusat)
            </option>
            {allCabang.map((c) => (
              <option key={c.id_cabang} value={c.id_cabang} className="bg-[#121722] text-white">
                {c.nama_cabang}
              </option>
            ))}
          </select>
        </div>

        {/* Live Date / Time */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-white/10 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{liveTime}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-50"
            title="Muat ulang data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
