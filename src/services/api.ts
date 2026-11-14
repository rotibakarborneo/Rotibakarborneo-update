import {
  User,
  Cabang,
  Shift,
  LaporanShift,
  TransaksiKasir,
  BonItem,
  RequestBahanItem,
  KeuanganItem,
  PayrollItem,
  BonusItem,
  CabangDashboard,
  MenuKasirItem
} from '../types';

// Formatters
export const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export const numberFormat = new Intl.NumberFormat('id-ID');

export function formatRupiah(value: number): string {
  return rupiah.format(value || 0);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value || 0);
}

export function getTodayDateStr(): string {
  // Use WIB (UTC+7)
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

export interface PayrollResponse {
  activeMonth: string;
  availableMonths: string[];
  payroll: PayrollItem[];
  bonus: BonusItem[];
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// REST API Client communicating with Express backend /api/v1/
class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`/api/v1${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`Fallback for endpoint ${endpoint}:`, err);
      throw err;
    }
  }

  // Live Outlets & Shifts
  async getLiveOutlets(): Promise<CabangDashboard[]> {
    return this.fetchApi<CabangDashboard[]>('/shifts/live');
  }

  // Branches CRUD
  async getCabangList(): Promise<Cabang[]> {
    return this.fetchApi<Cabang[]>('/cabang');
  }

  async addCabang(data: Partial<Cabang>): Promise<Cabang> {
    return this.fetchApi<Cabang>('/cabang', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCabang(id: string, data: Partial<Cabang>): Promise<Cabang> {
    return this.fetchApi<Cabang>(`/cabang/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCabang(id: string): Promise<any> {
    return this.fetchApi(`/cabang/${id}`, {
      method: 'DELETE'
    });
  }

  // Employees CRUD (Strictly 2 Roles: BOS and KARYAWAN)
  async getKaryawanList(): Promise<User[]> {
    return this.fetchApi<User[]>('/karyawan');
  }

  async addKaryawan(data: Partial<User>): Promise<User> {
    return this.fetchApi<User>('/karyawan', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateKaryawan(id: string, data: Partial<User>): Promise<User> {
    return this.fetchApi<User>(`/karyawan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteKaryawan(id: string): Promise<any> {
    return this.fetchApi(`/karyawan/${id}`, {
      method: 'DELETE'
    });
  }

  // Kasir POS Transactions
  async getTransaksiKasir(): Promise<TransaksiKasir[]> {
    return this.fetchApi<TransaksiKasir[]>('/kasir/transaksi');
  }

  // Laporan Shift
  async getLaporanShift(): Promise<LaporanShift[]> {
    return this.fetchApi<LaporanShift[]>('/laporan-shift');
  }

  // Kasbon (Bon)
  async getBonList(): Promise<BonItem[]> {
    return this.fetchApi<BonItem[]>('/bon');
  }

  async verifikasiBon(bon_id: string, status: 'DISETUJUI' | 'DITOLAK' | 'LUNAS', catatan_admin?: string): Promise<any> {
    return this.fetchApi('/bon/verifikasi', {
      method: 'POST',
      body: JSON.stringify({ bon_id, status, catatan_admin })
    });
  }

  // Request Bahan
  async getRequestBahan(): Promise<RequestBahanItem[]> {
    return this.fetchApi<RequestBahanItem[]>('/request-bahan');
  }

  async updateRequestBahanStatus(request_id: string, status: string): Promise<any> {
    return this.fetchApi(`/request-bahan/${request_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Keuangan
  async getKeuangan(): Promise<KeuanganItem[]> {
    return this.fetchApi<KeuanganItem[]>('/keuangan');
  }

  async tambahKeuangan(data: Partial<KeuanganItem>): Promise<KeuanganItem> {
    return this.fetchApi<KeuanganItem>('/keuangan', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Master Menu Kasir (Porsi Utuh & Separuh)
  async getMenuList(porsi?: string): Promise<MenuKasirItem[]> {
    const query = porsi ? `?porsi=${porsi}` : '';
    return this.fetchApi<MenuKasirItem[]>(`/menu${query}`);
  }

  async addMenu(data: {
    nama_menu: string;
    porsi?: string;
    harga: number;
    satuan_roti?: number;
    cara_masak?: string;
    aktif?: boolean;
    urutan?: number;
    create_both?: boolean;
    harga_separuh?: number;
  }): Promise<any> {
    return this.fetchApi('/menu', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMenu(id: string, data: Partial<MenuKasirItem>): Promise<MenuKasirItem> {
    return this.fetchApi<MenuKasirItem>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteMenu(id: string): Promise<any> {
    return this.fetchApi(`/menu/${id}`, {
      method: 'DELETE'
    });
  }

  // Payroll & Bonus (Real calculation from DB shifts, lateness rules & bon)
  async getPayroll(month?: string): Promise<PayrollResponse> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.fetchApi<PayrollResponse>(`/payroll${query}`);
  }

  // Trigger read-only Google Sheet sync
  async syncSheets(): Promise<{ success: boolean; lastSyncedAt?: string; latestDate?: string }> {
    const res = await fetch('/api/v1/sync', { method: 'POST' });
    if (!res.ok) throw new Error(`Sync error ${res.status}`);
    return res.json();
  }

  // Gemini Executive AI Assistant (with conversation history)
  async askAiAssistant(
    message: string,
    history: Array<{ sender: 'user' | 'ai'; text: string }> = []
  ): Promise<{ reply: string; model?: string }> {
    return this.fetchApi<{ reply: string; model?: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }
}

export const apiService = new ApiService();
export const appService = apiService as any;

// Storage fallback shim for backward compatibility
export const storage = {
  getUsers: () => [],
  getCabang: () => [],
  getShifts: () => [],
  getLaporan: () => [],
  getTransaksiKasir: () => [],
  getBon: () => [],
  getRequestBahan: () => [],
  getKeuangan: () => []
};

export const CATALOG_MENU = {
  half: [
    { nama: 'Mentega Susu', harga: 6000, icon: '🍞', satuan: 0.5 },
    { nama: 'Coklat', harga: 8000, icon: '🍫', satuan: 0.5 },
    { nama: 'Keju', harga: 10000, icon: '🧀', satuan: 0.5 },
    { nama: 'Chococruncy', harga: 12000, icon: '🍫', satuan: 0.5 }
  ],
  full: [
    { nama: 'Mentega Susu', harga: 10000, icon: '🍞', satuan: 1.0 },
    { nama: 'Coklat Full', harga: 15000, icon: '🍫', satuan: 1.0 },
    { nama: 'Coklat Keju Campur', harga: 19000, icon: '🥪', satuan: 1.0 },
    { nama: 'Chococruncy Keju Campur', harga: 25000, icon: '✨', satuan: 1.0 }
  ]
};

