import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, formatRupiah } from '../../services/api';
import { User, Role } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  X,
  Phone,
  Building,
  DollarSign,
  UserCheck,
  Edit3,
  Trash2,
  Power,
  AlertCircle,
  Check,
  Lock
} from 'lucide-react';

export const MasterKaryawanView: React.FC = () => {
  const { allCabang, selectedCabangId } = useAuth();
  const [karyawanList, setKaryawanList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedKaryawan, setSelectedKaryawan] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nama: string;
    username: string;
    role: Role;
    id_cabang: string;
    tarif_per_jam: number;
    telepon: string;
    aktif: boolean;
  }>({
    nama: '',
    username: '',
    role: 'KARYAWAN',
    id_cabang: allCabang[0]?.id_cabang || 'CBG01',
    tarif_per_jam: 18000,
    telepon: '',
    aktif: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getKaryawanList();
      setKaryawanList(data);
    } catch (err) {
      console.error('Failed to load karyawan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedKaryawan(null);
    setFormData({
      nama: '',
      username: '',
      role: 'KARYAWAN',
      id_cabang: allCabang[0]?.id_cabang || 'CBG01',
      tarif_per_jam: 18000,
      telepon: '',
      aktif: true
    });
    setModalMode('create');
  };

  const handleOpenEdit = (user: User) => {
    setSelectedKaryawan(user);
    setFormData({
      nama: user.nama,
      username: user.username,
      role: user.role,
      id_cabang: user.id_cabang || allCabang[0]?.id_cabang || 'CBG01',
      tarif_per_jam: user.tarif_per_jam || 0,
      telepon: user.telepon || '',
      aktif: user.aktif !== false
    });
    setModalMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.username.trim()) {
      alert('Nama dan username wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        await apiService.addKaryawan({
          nama: formData.nama.trim(),
          username: formData.username.trim().toLowerCase(),
          role: formData.role,
          id_cabang: formData.id_cabang,
          tarif_per_jam: Number(formData.tarif_per_jam) || 0,
          telepon: formData.telepon.trim(),
          aktif: formData.aktif
        });
        showToast(`Akun ${formData.nama} (${formData.role}) berhasil ditambahkan.`);
      } else if (modalMode === 'edit' && selectedKaryawan) {
        await apiService.updateKaryawan(selectedKaryawan.id_karyawan, {
          nama: formData.nama.trim(),
          username: formData.username.trim().toLowerCase(),
          role: formData.role,
          id_cabang: formData.id_cabang,
          tarif_per_jam: Number(formData.tarif_per_jam) || 0,
          telepon: formData.telepon.trim(),
          aktif: formData.aktif
        });
        showToast(`Data personel ${formData.nama} berhasil diperbarui.`);
      }

      setModalMode(null);
      setSelectedKaryawan(null);
      await loadData();
    } catch (err) {
      alert('Gagal menyimpan personel. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAktif = async (user: User) => {
    if (user.id_karyawan === 'BOS001') {
      showToast('Akun Super Bos Utama harus selalu aktif.');
      return;
    }
    try {
      const nextStatus = !user.aktif;
      await apiService.updateKaryawan(user.id_karyawan, { aktif: nextStatus });
      await loadData();
      showToast(`Status ${user.nama} diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`);
    } catch (err) {
      console.warn('Failed toggling status', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    if (deleteCandidate.id_karyawan === 'BOS001') {
      alert('Akun Super Bos Utama tidak dapat dihapus.');
      setDeleteCandidate(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.deleteKaryawan(deleteCandidate.id_karyawan);
      showToast(`Personel "${deleteCandidate.nama}" telah dihapus.`);
      setDeleteCandidate(null);
      await loadData();
    } catch (err) {
      alert('Gagal menghapus personel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered employees
  const filteredList = karyawanList.filter((k) => {
    const matchesCabang =
      selectedCabangId === 'ALL' || k.id_cabang === selectedCabangId;
    const matchesRole = roleFilter === 'ALL' || k.role === roleFilter;
    const matchesSearch =
      k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.id_karyawan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCabang && matchesRole && matchesSearch;
  });

  const totalBos = karyawanList.filter((k) => k.role === 'BOS').length;
  const totalKaryawan = karyawanList.filter((k) => k.role === 'KARYAWAN').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-300 font-semibold">
          Daftar Karyawan
        </span>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ios-glass p-5 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Personel</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-white tabular-nums">{karyawanList.length}</p>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Terdaftar di sistem database</p>
        </div>

        <div className="ios-glass p-5 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role BOS (HQ)</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-indigo-300 tabular-nums">{totalBos}</p>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Akses penuh dashboard web</p>
        </div>

        <div className="ios-glass p-5 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role KARYAWAN</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-sky-300 tabular-nums">{totalKaryawan}</p>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Staf gerai pengguna Flutter app</p>
        </div>

        <div className="ios-glass p-5 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Upah Lapangan</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-slate-100 tabular-nums">
              {formatRupiah(18000)}
            </p>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tarif dasar per jam kerja</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Role Segmented Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs self-start sm:self-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({karyawanList.length})
          </button>
          <button
            onClick={() => setRoleFilter('BOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              roleFilter === 'BOS'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            BOS ({totalBos})
          </button>
          <button
            onClick={() => setRoleFilter('KARYAWAN')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              roleFilter === 'KARYAWAN'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Karyawan ({totalKaryawan})
          </button>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="ios-glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Nama & ID</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Penempatan Cabang</th>
                <th className="py-3 px-4">Tarif Jam</th>
                <th className="py-3 px-4">Kontak Telepon</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Memuat data personel...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada personel yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((k) => {
                  const branchObj = allCabang.find((c) => c.id_cabang === k.id_cabang);
                  const isBos = k.role === 'BOS';
                  const isAktif = k.aktif !== false;
                  const isSuperBos = k.id_karyawan === 'BOS001';

                  return (
                    <tr
                      key={k.id_karyawan}
                      className={`hover:bg-white/[0.03] transition ${
                        !isAktif ? 'opacity-50 saturate-50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isBos
                                ? 'bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-slate-800 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {k.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{k.nama}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>ID: {k.id_karyawan}</span>
                              <span>•</span>
                              <span>@{k.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isBos ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-black text-[10px] tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            BOS / OWNER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-[10px] tracking-wider">
                            <Briefcase className="w-3 h-3 text-sky-400" />
                            KARYAWAN GERAI
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">
                            {branchObj?.nama_cabang || k.id_cabang}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 tabular-nums">
                        {isBos ? (
                          <span className="text-slate-400 text-[11px] italic">Owner / Eksekutif</span>
                        ) : (
                          <span className="font-semibold text-slate-200">
                            {formatRupiah(k.tarif_per_jam || 18000)} / jam
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{k.telepon || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleAktif(k)}
                          title={isSuperBos ? 'Akun Super Bos Utama' : isAktif ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                            isSuperBos
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 cursor-default'
                              : isAktif
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 cursor-pointer'
                              : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 cursor-pointer'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(k)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-white/10 transition cursor-pointer"
                            title="Edit Data Personel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {isSuperBos ? (
                            <span
                              className="p-1.5 rounded-lg bg-white/2 text-slate-600 border border-white/5 cursor-not-allowed"
                              title="Akun utama tidak dapat dihapus"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteCandidate(k)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition cursor-pointer"
                              title="Hapus Personel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Personel */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="ios-glass-card rounded-3xl w-full max-w-lg p-6 border border-white/20 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {modalMode === 'create' ? 'Tambah Personel Baru' : `Edit: ${selectedKaryawan?.nama}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pilih salah satu dari 2 peran resmi</p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dimas Setiawan"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Username Login
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: dimas"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Peran / Role Selection: Exactly 2 Roles */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Peran Akun (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, role: 'KARYAWAN' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.role === 'KARYAWAN'
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-4 h-4 text-sky-400" />
                      {formData.role === 'KARYAWAN' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">KARYAWAN</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Operasional gerai via Flutter App (POS & Absen)
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, role: 'BOS' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.role === 'BOS'
                        ? 'bg-indigo-500/20 border-indigo-400 text-white'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      {formData.role === 'BOS' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">BOS / OWNER</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Akses penuh web executive dashboard HQ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Penempatan Cabang
                  </label>
                  <select
                    value={formData.id_cabang}
                    onChange={(e) => setFormData({ ...formData, id_cabang: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {allCabang.map((c) => (
                      <option key={c.id_cabang} value={c.id_cabang} className="bg-slate-900">
                        {c.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tarif Upah Per Jam (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.tarif_per_jam}
                    onChange={(e) =>
                      setFormData({ ...formData, tarif_per_jam: Number(e.target.value) })
                    }
                    disabled={formData.role === 'BOS'}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500 ${
                      formData.role === 'BOS' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  {formData.role === 'BOS' && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Role BOS tidak dihitung upah per jam
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Status Akun</label>
                <select
                  value={formData.aktif ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.value === 'true' })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Personel' : 'Perbarui Personel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="ios-glass-card border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">Hapus Personel?</h4>
                <p className="text-[11px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus <strong>{deleteCandidate.nama}</strong> ({deleteCandidate.id_karyawan}) dengan username @{deleteCandidate.username}?
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
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Personel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
