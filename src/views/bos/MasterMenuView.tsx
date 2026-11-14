import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Flame,
  Layers,
  Sparkles,
  Tag,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { MenuKasirItem } from '../../types';
import { apiService } from '../../services/api';

export const MasterMenuView: React.FC = () => {
  const [menus, setMenus] = useState<MenuKasirItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterPorsi, setFilterPorsi] = useState<'ALL' | 'UTUH' | 'SEPARUH'>('ALL');
  const [filterMasak, setFilterMasak] = useState<'ALL' | 'BAKAR' | 'KUKUS'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuKasirItem | null>(null);

  // Form states for Single / Dual creation
  const [createBoth, setCreateBoth] = useState<boolean>(true); // Default true for convenience
  const [formData, setFormData] = useState({
    nama_menu: '',
    porsi: 'UTUH' as 'UTUH' | 'SEPARUH',
    harga: 18000,
    harga_separuh: 10000,
    satuan_roti: 1.0,
    cara_masak: 'BAKAR' as 'BAKAR' | 'KUKUS' | 'SEMUA',
    aktif: true
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMenuList();
      setMenus(data);
    } catch (err) {
      console.error('Failed to load menu list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleOpenAdd = () => {
    setFormData({
      nama_menu: '',
      porsi: 'UTUH',
      harga: 18000,
      harga_separuh: 10000,
      satuan_roti: 1.0,
      cara_masak: 'BAKAR',
      aktif: true
    });
    setCreateBoth(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (menu: MenuKasirItem) => {
    setSelectedMenu(menu);
    setFormData({
      nama_menu: menu.nama_menu,
      porsi: menu.porsi,
      harga: menu.harga,
      harga_separuh: 0,
      satuan_roti: menu.satuan_roti,
      cara_masak: (menu.cara_masak as any) || 'BAKAR',
      aktif: menu.aktif
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (menu: MenuKasirItem) => {
    setSelectedMenu(menu);
    setIsDeleteModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_menu.trim()) {
      showToast('error', 'Nama menu wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      if (createBoth) {
        await apiService.addMenu({
          nama_menu: formData.nama_menu.trim(),
          create_both: true,
          harga: Number(formData.harga),
          harga_separuh: Number(formData.harga_separuh),
          cara_masak: formData.cara_masak,
          aktif: formData.aktif
        });
        showToast('success', `Berhasil menambahkan Menu Utuh & Separuh untuk "${formData.nama_menu}".`);
      } else {
        await apiService.addMenu({
          nama_menu: formData.nama_menu.trim(),
          porsi: formData.porsi,
          harga: Number(formData.harga),
          satuan_roti: formData.porsi === 'SEPARUH' ? 0.5 : 1.0,
          cara_masak: formData.cara_masak,
          aktif: formData.aktif
        });
        showToast('success', `Menu "${formData.nama_menu}" (${formData.porsi}) berhasil ditambahkan.`);
      }

      setIsAddModalOpen(false);
      await fetchMenus();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan menu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) return;

    try {
      setSaving(true);
      await apiService.updateMenu(selectedMenu.menu_id, {
        nama_menu: formData.nama_menu.trim(),
        porsi: formData.porsi,
        harga: Number(formData.harga),
        satuan_roti: formData.porsi === 'SEPARUH' ? 0.5 : 1.0,
        cara_masak: formData.cara_masak,
        aktif: formData.aktif
      });

      showToast('success', `Menu "${formData.nama_menu}" berhasil diperbarui.`);
      setIsEditModalOpen(false);
      setSelectedMenu(null);
      await fetchMenus();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memperbarui menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMenu) return;
    try {
      setSaving(true);
      await apiService.deleteMenu(selectedMenu.menu_id);
      showToast('success', `Menu "${selectedMenu.nama_menu}" berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      setSelectedMenu(null);
      await fetchMenus();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus menu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAktif = async (menu: MenuKasirItem) => {
    try {
      await apiService.updateMenu(menu.menu_id, { aktif: !menu.aktif });
      setMenus((prev) =>
        prev.map((m) => (m.menu_id === menu.menu_id ? { ...m, aktif: !m.aktif } : m))
      );
      showToast('success', `Status ${menu.nama_menu} (${menu.porsi}) diubah.`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status');
    }
  };

  // Filtered menu list
  const filteredMenus = menus.filter((m) => {
    const matchesSearch = m.nama_menu.toLowerCase().includes(search.toLowerCase());
    const matchesPorsi = filterPorsi === 'ALL' || m.porsi === filterPorsi;
    const matchesMasak =
      filterMasak === 'ALL' ||
      m.cara_masak === filterMasak ||
      m.cara_masak === 'SEMUA' ||
      !m.cara_masak;
    return matchesSearch && matchesPorsi && matchesMasak;
  });

  const countUtuh = menus.filter((m) => m.porsi === 'UTUH').length;
  const countSeparuh = menus.filter((m) => m.porsi === 'SEPARUH').length;
  const countAktif = menus.filter((m) => m.aktif).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl border animate-slide-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="ios-glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Varian</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{menus.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{countAktif} aktif di kasir</p>
        </div>

        <div className="ios-glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Porsi Utuh (1 Roti)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-300 mt-2">{countUtuh}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Satuan Roti: 1.0</p>
        </div>

        <div className="ios-glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Porsi Separuh (½ Roti)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">{countSeparuh}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Satuan Roti: 0.5</p>
        </div>

        <div className="ios-glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Metode Masak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-white mt-2">Bakar & Kukus</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Kompor & Kukusan Standar</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Add Button */}
      <div className="ios-glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Porsi Selector */}
          <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10">
            <button
              onClick={() => setFilterPorsi('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                filterPorsi === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Porsi
            </button>
            <button
              onClick={() => setFilterPorsi('UTUH')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                filterPorsi === 'UTUH'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Utuh (1 Roti)
            </button>
            <button
              onClick={() => setFilterPorsi('SEPARUH')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                filterPorsi === 'SEPARUH'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Separuh (½)
            </button>
          </div>

          {/* Masak Selector */}
          <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10">
            <button
              onClick={() => setFilterMasak('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                filterMasak === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterMasak('BAKAR')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                filterMasak === 'BAKAR'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bakar
            </button>
            <button
              onClick={() => setFilterMasak('KUKUS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                filterMasak === 'KUKUS'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kukus
            </button>
          </div>

          {/* Add Menu Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Menu Table / List */}
      <div className="ios-glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Menu & Rasa</th>
                <th className="py-3.5 px-4">Porsi</th>
                <th className="py-3.5 px-4">Satuan Roti</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Cara Masak</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-xs">Memuat katalog menu...</p>
                  </td>
                </tr>
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-white">Tidak ada menu ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Coba ubah kata kunci pencarian.' : 'Klik tombol Tambah Menu untuk menambahkan menu baru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu) => {
                  const isUtuh = menu.porsi === 'UTUH';
                  return (
                    <tr
                      key={menu.menu_id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isUtuh
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                            }`}
                          >
                            {isUtuh ? '1' : '½'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">
                              {menu.nama_menu}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {menu.menu_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Porsi Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isUtuh
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isUtuh ? 'Porsi Utuh' : 'Porsi Separuh'}
                        </span>
                      </td>

                      {/* Satuan Roti */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                        {menu.satuan_roti} Roti
                      </td>

                      {/* Harga */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white text-sm">
                          Rp {Number(menu.harga).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Cara Masak */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                            menu.cara_masak === 'KUKUS'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                              : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                          }`}
                        >
                          <Flame className="w-3 h-3" />
                          {menu.cara_masak || 'BAKAR'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleAktif(menu)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                            menu.aktif
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          {menu.aktif ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(menu)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Menu"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(menu)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL: Tambah Menu */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="ios-glass-card rounded-3xl border border-white/20 p-6 max-w-lg w-full shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Tambah Menu Kasir</h3>
                  <p className="text-[11px] text-slate-400">Porsi Utuh (1 Roti) & Separuh (0.5 Roti)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 mt-4">
              {/* Dual Mode Switch (Tambah Sekaligus Utuh & Separuh) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Input Sekaligus (Utuh & Separuh)</p>
                  <p className="text-[10px] text-indigo-300/80">
                    Otomatis membuat 2 entri menu (1 Roti & 0.5 Roti) dalam 1 kali simpan.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createBoth}
                    onChange={(e) => setCreateBoth(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Menu / Rasa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Chococruncy Keju, Mentega Susu"
                  value={formData.nama_menu}
                  onChange={(e) => setFormData({ ...formData, nama_menu: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {createBoth ? (
                /* Both Utuh & Separuh Price Inputs */
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <label className="text-xs font-bold text-blue-300">
                        Harga Porsi Utuh
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        step="500"
                        value={formData.harga}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({
                            ...formData,
                            harga: val,
                            // Auto suggest separuh price (~55-60%)
                            harga_separuh: Math.round((val * 0.55) / 500) * 500
                          });
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Satuan Roti: 1.0</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <label className="text-xs font-bold text-amber-300">
                        Harga Porsi Separuh
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        step="500"
                        value={formData.harga_separuh}
                        onChange={(e) => setFormData({ ...formData, harga_separuh: Number(e.target.value) })}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Satuan Roti: 0.5</span>
                  </div>
                </div>
              ) : (
                /* Single Portion Selector & Price */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Pilihan Porsi <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, porsi: 'UTUH', satuan_roti: 1.0 })
                        }
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          formData.porsi === 'UTUH'
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        Utuh (1)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, porsi: 'SEPARUH', satuan_roti: 0.5 })
                        }
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          formData.porsi === 'SEPARUH'
                            ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        Separuh (½)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Harga Jual (Rp) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        step="500"
                        value={formData.harga}
                        onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cara Masak */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cara Masak
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BAKAR', 'KUKUS', 'SEMUA'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, cara_masak: mode })}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        formData.cara_masak === mode
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Menu */}
      {isEditModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="ios-glass-card rounded-3xl border border-white/20 p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Menu</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedMenu.menu_id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_menu}
                  onChange={(e) => setFormData({ ...formData, nama_menu: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Porsi
                  </label>
                  <select
                    value={formData.porsi}
                    onChange={(e) => {
                      const p = e.target.value as 'UTUH' | 'SEPARUH';
                      setFormData({
                        ...formData,
                        porsi: p,
                        satuan_roti: p === 'SEPARUH' ? 0.5 : 1.0
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#111622] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UTUH">Porsi Utuh (1 Roti)</option>
                    <option value="SEPARUH">Porsi Separuh (½ Roti)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    step="500"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Cara Masak
                  </label>
                  <select
                    value={formData.cara_masak}
                    onChange={(e) => setFormData({ ...formData, cara_masak: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#111622] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BAKAR">Bakar</option>
                    <option value="KUKUS">Kukus</option>
                    <option value="SEMUA">Semua</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Status Kasir
                  </label>
                  <div className="flex items-center gap-2 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aktif}
                        onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs text-slate-300">
                        {formData.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hapus Menu Confirmation */}
      {isDeleteModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="ios-glass-card rounded-3xl border border-rose-500/30 p-6 max-w-sm w-full shadow-2xl relative animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Hapus Menu</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 my-4 p-3 rounded-xl bg-white/5 border border-white/10">
              Apakah Anda yakin ingin menghapus{' '}
              <strong className="text-white font-bold">{selectedMenu.nama_menu}</strong> (
              <span className="text-amber-300">{selectedMenu.porsi}</span>)?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {saving ? 'Menghapus...' : 'Hapus Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
