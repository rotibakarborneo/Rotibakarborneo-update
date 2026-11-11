import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Cabang } from '../../types';
import { Building, MapPin, Plus, Crosshair, Phone, Clock, Check, X } from 'lucide-react';

export const MasterCabangView: React.FC = () => {
  const { allCabang, refreshAll } = useAuth();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form State
  const [namaCabang, setNamaCabang] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [lat, setLat] = useState<number>(-3.3194);
  const [lng, setLng] = useState<number>(114.5908);
  const [radius, setRadius] = useState<number>(120);
  const [jamOperasional, setJamOperasional] = useState<string>('16:30 - 02:00 WITA');
  const [telepon, setTelepon] = useState<string>('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaCabang.trim()) return;

    try {
      await apiService.addCabang({
        nama_cabang: namaCabang.trim(),
        alamat: alamat.trim(),
        latitude: lat,
        longitude: lng,
        radius_meter: radius,
        jam_operasional: jamOperasional,
        telepon: telepon.trim()
      });
      await refreshAll();
      setModalOpen(false);
      setNamaCabang('');
      setAlamat('');
      setTelepon('');
    } catch (err) {
      console.warn('Failed saving cabang', err);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(6)));
          setLng(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        () => {
          alert('GPS perangkat tidak dapat diakses.');
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="ios-glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            PENGATURAN MASTER DATA
          </span>
          <h2 className="text-xl font-black text-white">Kelola Cabang & Titik GPS Gerai</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Pengaturan geofence koordinat GPS, radius presensi, jam operasional, dan data outlet.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 cursor-pointer self-start md:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Cabang Baru
        </button>
      </div>

      {/* Cabang Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allCabang.map((cabang) => (
          <div
            key={cabang.id_cabang}
            className="ios-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {cabang.id_cabang}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1.5">{cabang.nama_cabang}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  AKTIF
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{cabang.alamat || 'Alamat belum diatur'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{cabang.jam_operasional || '16:30 - 02:00 WITA'}</span>
                </div>
                {cabang.telepon && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{cabang.telepon}</span>
                  </div>
                )}
              </div>

              {/* GPS Info Card */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Koordinat Lat/Lng</span>
                  <strong className="text-white font-mono text-[11px] block mt-0.5">
                    {cabang.latitude.toFixed(4)}, {cabang.longitude.toFixed(4)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Radius Geofence</span>
                  <strong className="text-indigo-300 font-mono text-[11px] block mt-0.5">
                    {cabang.radius_meter} Meter
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Validasi presensi aktif</span>
              <a
                href={`https://www.google.com/maps?q=${cabang.latitude},${cabang.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 font-bold hover:underline"
              >
                Buka di Maps ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-black text-white">Tambah Cabang Gerai Baru</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Cabang</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Outlet Kayu Tangi 2"
                  value={namaCabang}
                  onChange={(e) => setNamaCabang(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Jl. Ahmad Yani Km 6..."
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" /> Ambil Koordinat GPS Perangkat
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Radius Geofence (m)</label>
                  <input
                    type="number"
                    min="30"
                    max="1000"
                    required
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">No. Telepon Gerai</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Jam Operasional</label>
                <input
                  type="text"
                  placeholder="16:30 - 02:00 WITA"
                  value={jamOperasional}
                  onChange={(e) => setJamOperasional(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer transition mt-2"
              >
                <Check className="w-4 h-4" /> Simpan Cabang Baru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
