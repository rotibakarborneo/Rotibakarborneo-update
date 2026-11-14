import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Cabang } from '../../types';
import { TimePickerModal } from '../../components/TimePickerModal';
import {
  Building,
  MapPin,
  Plus,
  Phone,
  Clock,
  Check,
  X,
  Edit3,
  Trash2,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Map
} from 'lucide-react';

export const MasterCabangView: React.FC = () => {
  const { allCabang, refreshAll } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCabang, setSelectedCabang] = useState<Cabang | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Cabang | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);
  const [coordsPasteInput, setCoordsPasteInput] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<{
    nama_cabang: string;
    alamat: string;
    latitude: number;
    longitude: number;
    radius_meter: number;
    jam_operasional: string;
    telepon: string;
    aktif: boolean;
  }>({
    nama_cabang: '',
    alamat: '',
    latitude: -7.8258,
    longitude: 110.3607,
    radius_meter: 100,
    jam_operasional: '15:00 - 02:00 WIB',
    telepon: '',
    aktif: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreate = () => {
    setFormData({
      nama_cabang: '',
      alamat: '',
      latitude: -7.8258,
      longitude: 110.3607,
      radius_meter: 100,
      jam_operasional: '15:00 - 02:00 WIB',
      telepon: '',
      aktif: true
    });
    setCoordsPasteInput('');
    setModalMode('create');
  };

  const handleOpenEdit = (cabang: Cabang) => {
    setSelectedCabang(cabang);
    setFormData({
      nama_cabang: cabang.nama_cabang,
      alamat: cabang.alamat || '',
      latitude: cabang.latitude,
      longitude: cabang.longitude,
      radius_meter: cabang.radius_meter,
      jam_operasional: cabang.jam_operasional || '15:00 - 02:00 WIB',
      telepon: cabang.telepon || '',
      aktif: cabang.aktif !== false
    });
    setCoordsPasteInput('');
    setModalMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_cabang.trim()) return;

    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        await apiService.addCabang({
          nama_cabang: formData.nama_cabang.trim(),
          alamat: formData.alamat.trim(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          radius_meter: Number(formData.radius_meter),
          jam_operasional: formData.jam_operasional.trim(),
          telepon: formData.telepon.trim(),
          aktif: formData.aktif
        });
        showToast(`Cabang "${formData.nama_cabang}" berhasil ditambahkan.`);
      } else if (modalMode === 'edit' && selectedCabang) {
        await apiService.updateCabang(selectedCabang.id_cabang, {
          nama_cabang: formData.nama_cabang.trim(),
          alamat: formData.alamat.trim(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          radius_meter: Number(formData.radius_meter),
          jam_operasional: formData.jam_operasional.trim(),
          telepon: formData.telepon.trim(),
          aktif: formData.aktif
        });
        showToast(`Data cabang "${formData.nama_cabang}" berhasil diperbarui.`);
      }

      await refreshAll();
      setModalMode(null);
      setSelectedCabang(null);
    } catch (err) {
      console.warn('Failed saving cabang', err);
      alert('Gagal menyimpan data cabang. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAktif = async (cabang: Cabang) => {
    try {
      const nextStatus = !cabang.aktif;
      await apiService.updateCabang(cabang.id_cabang, { aktif: nextStatus });
      await refreshAll();
      showToast(`Status cabang ${cabang.nama_cabang} diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`);
    } catch (err) {
      console.warn('Failed toggling status', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setIsSubmitting(true);
      await apiService.deleteCabang(deleteCandidate.id_cabang);
      await refreshAll();
      showToast(`Cabang "${deleteCandidate.nama_cabang}" telah dihapus.`);
      setDeleteCandidate(null);
    } catch (err) {
      console.warn('Failed deleting cabang', err);
      alert('Gagal menghapus cabang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to parse pasted coords like "-3.3194, 114.5908" or Google Maps URLs
  const handleParsePasteCoords = (raw: string) => {
    setCoordsPasteInput(raw);
    const match = raw.match(/(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      }
    }
  };

  const borneoPresets = [
    { label: 'Bjm Hasan Basri', lat: -3.3032, lng: 114.5910 },
    { label: 'Bjm KM 5.5', lat: -3.3320, lng: 114.6180 },
    { label: 'Bjbaru Pg. Batur', lat: -3.4410, lng: 114.8380 },
    { label: 'Martapura', lat: -3.4150, lng: 114.8510 }
  ];

  const filteredCabang = allCabang.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nama_cabang.toLowerCase().includes(q) ||
      (c.alamat && c.alamat.toLowerCase().includes(q)) ||
      c.id_cabang.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-200 flex items-center justify-between shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
            <p className="text-xs font-semibold">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/70 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10">
              Total: <strong className="text-white font-mono">{allCabang.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Aktif: <strong className="font-mono">{allCabang.filter((c) => c.aktif !== false).length}</strong>
            </span>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Cabang
          </button>
        </div>
      </div>

      {/* Cabang Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCabang.length === 0 ? (
          <div className="col-span-full ios-glass rounded-2xl p-10 text-center text-slate-400 text-xs">
            Tidak ada cabang ditemukan.
          </div>
        ) : (
          filteredCabang.map((cabang) => {
            const isAktif = cabang.aktif !== false;

            return (
              <div
                key={cabang.id_cabang}
                className={`ios-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  !isAktif ? 'opacity-60 saturate-50' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        {cabang.id_cabang}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1.5">{cabang.nama_cabang}</h3>
                    </div>

                    <button
                      onClick={() => handleToggleAktif(cabang)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer transition ${
                        isAktif
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {isAktif ? 'AKTIF' : 'NONAKTIF'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{cabang.alamat || 'Alamat belum diatur'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{cabang.jam_operasional || '15:00 - 02:00 WIB'}</span>
                    </div>
                    {cabang.telepon && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{cabang.telepon}</span>
                      </div>
                    )}
                  </div>

                  {/* GPS Info Card */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Koordinat Lat/Lng</span>
                      <strong className="text-white font-mono text-[11px] block mt-0.5">
                        {cabang.latitude.toFixed(4)}, {cabang.longitude.toFixed(4)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Radius Geofence</span>
                      <strong className="text-sky-300 font-mono text-[11px] block mt-0.5">
                        {cabang.radius_meter} Meter
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <a
                    href={`https://www.google.com/maps?q=${cabang.latitude},${cabang.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Buka Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cabang)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-white/10 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(cabang)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create / Edit Cabang */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass-card border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {modalMode === 'create' ? 'Tambah Cabang' : 'Edit Cabang'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Cabang</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Krapyak, Kadipiro, Jakal"
                  value={formData.nama_cabang}
                  onChange={(e) => setFormData({ ...formData, nama_cabang: e.target.value })}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Alamat</label>
                <input
                  type="text"
                  placeholder="Cth: Jl. Krapyak Kulon, Bantul, D.I. Yogyakarta"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Titik Koordinat GPS Section - Manual & Search */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    Titik Koordinat Lokasi
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      formData.alamat ? `${formData.alamat} Banjarmasin` : formData.nama_cabang || 'Banjarmasin'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Map className="w-3 h-3" />
                    Buka Google Maps
                  </a>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Pilihan Cepat Wilayah:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {borneoPresets.map((bp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, latitude: bp.lat, longitude: bp.lng })}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-300 hover:text-white border border-white/10 text-[11px] transition cursor-pointer"
                      >
                        {bp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paste Coords Bar */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Tempel Titik Koordinat (Latitude, Longitude):</span>
                  <input
                    type="text"
                    placeholder="Contoh: -3.3194, 114.5908"
                    value={coordsPasteInput}
                    onChange={(e) => handleParsePasteCoords(e.target.value)}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Manual Lat & Lng Input */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Radius Presensi (Meter)</label>
                  <input
                    type="number"
                    min="30"
                    max="1000"
                    required
                    value={formData.radius_meter}
                    onChange={(e) => setFormData({ ...formData, radius_meter: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">No. Telepon</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Jam Operasional with TimePicker Popup Trigger */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Jam Operasional</label>
                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(true)}
                    className="w-full bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between transition cursor-pointer text-left"
                  >
                    <span className="truncate font-mono font-bold text-sky-300">{formData.jam_operasional}</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status Operasional</label>
                  <select
                    value={formData.aktif ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, aktif: e.target.value === 'true' })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Cabang' : 'Perbarui Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Picker Popup Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        value={formData.jam_operasional}
        onSelect={(newTimeStr) => setFormData({ ...formData, jam_operasional: newTimeStr })}
      />

      {/* Modal: Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass-card border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">Hapus Cabang?</h4>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus outlet <strong>{deleteCandidate.nama_cabang}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
