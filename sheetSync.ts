import fs from 'fs';
import path from 'path';

export const GOOGLE_SHEET_ID = '1ZenY0Q79stx5y8vcNQVICysSWtUZcSmerd65lRMX-F4';

export const SHEET_GIDS = {
  cabang: '1961829523',
  operasionalCabang: '1633529649',
  karyawan: '68604973',
  menuKasir: '786688828',
  shifts: '1642699453',
  laporanShift: '1987802812',
  transaksiKasir: '1875885618',
  bon: '1390752290',
  keuangan: '1281762666',
  requestBahan: '54594306'
};

/**
 * RFC-4180 compliant CSV parser that safely handles quoted newlines and escaped quotes.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (insideQuotes && next === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((ch === '\n' || ch === '\r') && !insideQuotes) {
      if (ch === '\r' && next === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += ch;
    }
  }

  // Final cell/row
  currentRow.push(currentVal.trim());
  if (currentRow.some((cell) => cell !== '')) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const vals = rows[r];
    if (!vals[0] || vals[0] === '') continue; // skip empty leading ID rows
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    records.push(obj);
  }

  return records;
}

export function parseIndonesianNumber(val: string | number | undefined, defaultVal = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Normalize dates like '04/08/2026' (DD/MM/YYYY) or '2026-08-04' -> 'YYYY-MM-DD'
 */
export function normalizeIsoDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

/**
 * Normalize time strings like '14:50:00' or '2:00' -> '14:50' or '02:00'
 */
export function normalizeHHMM(timeStr: string | undefined): string {
  if (!timeStr) return '';
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return timeStr.trim();
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

/**
 * Get current date in WIB (UTC+7)
 */
export function getTodayWib(): string {
  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString().slice(0, 10);
}

/**
 * Calculate shift hours between HH:MM start and HH:MM end (handles overnight shifts crossing midnight)
 */
export function calculateShiftHours(jamMulai: string, jamSelesai?: string): number {
  const m1 = normalizeHHMM(jamMulai).match(/^(\d{2}):(\d{2})$/);
  if (!m1) return 0;
  const startMin = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);

  if (!jamSelesai) return 0;
  const m2 = normalizeHHMM(jamSelesai).match(/^(\d{2}):(\d{2})$/);
  if (!m2) return 0;
  let endMin = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);

  if (endMin < startMin) {
    endMin += 24 * 60; // crossed midnight
  }
  const diffMin = endMin - startMin;
  return Number((diffMin / 60).toFixed(2));
}

/**
 * Calculate late minutes compared to branch opening time + tolerance
 */
export function calculateLateMinutes(
  jamMulai: string,
  jamBukaStandard: string,
  toleransiMenit: number
): number {
  const mStart = normalizeHHMM(jamMulai).match(/^(\d{2}):(\d{2})$/);
  const mOpen = normalizeHHMM(jamBukaStandard).match(/^(\d{2}):(\d{2})$/);
  if (!mStart || !mOpen) return 0;

  const startMin = parseInt(mStart[1], 10) * 60 + parseInt(mStart[2], 10);
  const openMin = parseInt(mOpen[1], 10) * 60 + parseInt(mOpen[2], 10);

  const excess = startMin - (openMin + toleransiMenit);
  return excess > 0 ? excess : 0;
}

export async function fetchFromGoogleSheets(): Promise<any | null> {
  try {
    const rawData: Record<string, Record<string, string>[]> = {};

    await Promise.all(
      Object.entries(SHEET_GIDS).map(async ([key, gid]) => {
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${gid}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} on ${key}`);
        const text = await res.text();
        rawData[key] = parseCSV(text);
      })
    );

    // OperasionalCabang lookup
    const opMap: Record<string, any> = {};
    (rawData.operasionalCabang || []).forEach((op) => {
      opMap[op.id_cabang] = {
        jam_buka: normalizeHHMM(op.jam_buka) || '15:00',
        jam_tutup: normalizeHHMM(op.jam_tutup) || '02:00',
        toleransi_terlambat_menit: parseInt(op.toleransi_terlambat_menit, 10) || 10,
        potongan_per_15_menit: parseInt(op.potongan_per_15_menit, 10) || 750
      };
    });

    // 1. Cabang
    const cabang = (rawData.cabang || []).map((c) => {
      const op = opMap[c.id_cabang] || {
        jam_buka: '15:00',
        jam_tutup: '02:00',
        toleransi_terlambat_menit: 10,
        potongan_per_15_menit: 750
      };
      return {
        id_cabang: c.id_cabang,
        nama_cabang: c.nama_cabang,
        latitude: parseIndonesianNumber(c.latitude, -7.8),
        longitude: parseIndonesianNumber(c.longitude, 110.3),
        radius_meter: parseInt(c.radius_meter, 10) || 100,
        aktif: c.aktif === 'TRUE',
        dibuat_pada: c.dibuat_pada || '03/08/2026',
        alamat:
          c.nama_cabang === 'Krapyak'
            ? 'Jl. Krapyak Kulon, Panggungharjo, Sewon, Bantul, D.I. Yogyakarta'
            : c.nama_cabang === 'Kadipiro'
            ? 'Jl. Wates Km. 3, Kadipiro, Kasihan, Bantul, D.I. Yogyakarta'
            : c.nama_cabang === 'Jakal'
            ? 'Jl. Kaliurang Km 5.6, Manggung, Caturtunggal, Depok, Sleman, D.I. Yogyakarta'
            : c.nama_cabang === 'Timoho'
            ? 'Jl. Timoho No. 42, Muja Muju, Umbulharjo, Kota Yogyakarta'
            : c.nama_cabang === 'Malioboro'
            ? 'Kawasan Wisata Malioboro, Sosromenduran, Gedong Tengen, Kota Yogyakarta'
            : c.nama_cabang === 'Nologaten'
            ? 'Jl. Nologaten, Caturtunggal, Depok, Sleman, D.I. Yogyakarta'
            : `Cabang ${c.nama_cabang}, D.I. Yogyakarta`,
        jam_operasional: `${op.jam_buka} - ${op.jam_tutup} WIB`,
        jam_buka: op.jam_buka,
        jam_tutup: op.jam_tutup,
        toleransi_terlambat_menit: op.toleransi_terlambat_menit,
        potongan_per_15_menit: op.potongan_per_15_menit,
        telepon: '0812-5501-8891'
      };
    });

    // 2. Karyawan (strictly 2 roles: BOS and KARYAWAN)
    const karyawan = (rawData.karyawan || []).map((k) => ({
      id_karyawan: k.id_karyawan,
      nama: k.nama,
      username: k.username,
      password_hash: k.password_hash,
      role: k.role === 'ADMIN' || k.role === 'BOS' ? 'BOS' : 'KARYAWAN',
      id_cabang: k.id_cabang,
      aktif: k.aktif === 'TRUE',
      dibuat_pada: k.dibuat_pada,
      tarif_per_jam: parseInt(k.tarif_per_jam, 10) || 6820,
      potongan_telat_per_menit: parseInt(k.potongan_telat_per_menit, 10) || 0,
      foto_profil_url: k.foto_profil_url || ''
    }));

    const empMap = Object.fromEntries(karyawan.map((k) => [k.id_karyawan, k.nama]));
    const cabMap = Object.fromEntries(cabang.map((c) => [c.id_cabang, c.nama_cabang]));

    // 3. MenuKasir
    const menuKasir = (rawData.menuKasir || []).map((m, idx) => ({
      menu_id: m.menu_id,
      nama_menu: m.nama_menu,
      porsi: m.porsi.toUpperCase(),
      harga: parseIndonesianNumber(m.harga, 10000),
      satuan_roti: parseIndonesianNumber(m.satuan_roti, m.porsi.toUpperCase() === 'SEPARUH' ? 0.5 : 1.0),
      cara_masak: 'BAKAR',
      aktif: m.aktif === 'TRUE',
      urutan: parseInt(m.urutan, 10) || idx + 1,
      diperbarui_pada: m.diperbarui_pada
    }));

    // Find latest operational date in shifts to distinguish truly active today's open shifts
    const allShiftDates = (rawData.shifts || [])
      .map((s) => normalizeIsoDate(s.tanggal_operasional))
      .filter(Boolean)
      .sort();
    const latestShiftDate = allShiftDates[allShiftDates.length - 1] || getTodayWib();

    // 4. Shifts (newest first)
    const shifts = (rawData.shifts || [])
      .map((s) => {
        const isoDate = normalizeIsoDate(s.tanggal_operasional);
        // Only shifts on the latest operational date (within 24h) can genuinely still be BUKA;
        // abandoned shifts from October that lacked clock-out are treated as closed in historical summaries
        const isCurrentOpen = s.status === 'BUKA' && isoDate >= latestShiftDate;
        return {
          shift_id: s.shift_id,
          id_cabang: s.id_cabang,
          nama_cabang: cabMap[s.id_cabang] || s.id_cabang,
          id_karyawan: s.id_karyawan,
          nama_karyawan: empMap[s.id_karyawan] || s.id_karyawan,
          tanggal_operasional: isoDate,
          jam_mulai: normalizeHHMM(s.jam_mulai),
          jam_selesai: normalizeHHMM(s.jam_selesai),
          status: isCurrentOpen ? 'BUKA' : 'TUTUP_SELESAI',
          raw_status: s.status,
          lat_masuk: parseIndonesianNumber(s.lat_masuk),
          lng_masuk: parseIndonesianNumber(s.lng_masuk),
          lat_pulang: parseIndonesianNumber(s.lat_pulang),
          lng_pulang: parseIndonesianNumber(s.lng_pulang),
          foto_masuk_url: s.foto_masuk_url,
          foto_pulang_url: s.foto_pulang_url,
          dibuat_pada: s.dibuat_pada,
          diperbarui_pada: s.diperbarui_pada
        };
      })
      .reverse();

    // Map shift jam_selesai for LaporanShift if LaporanShift lacks jam_selesai
    const shiftById = Object.fromEntries(shifts.map((s) => [s.shift_id, s]));

    // 5. LaporanShift (newest first, normalized ISO YYYY-MM-DD, parsed bahan_habis)
    const laporanShift = (rawData.laporanShift || [])
      .map((l) => {
        let bahanHabis = [];
        try {
          bahanHabis = l.bahan_habis_json ? JSON.parse(l.bahan_habis_json) : [];
        } catch {
          bahanHabis = [];
        }
        const linkedShift = shiftById[l.shift_id];
        return {
          laporan_id: l.laporan_id,
          shift_id: l.shift_id,
          id_cabang: l.id_cabang,
          nama_cabang: cabMap[l.id_cabang] || l.id_cabang,
          id_karyawan: l.id_karyawan,
          nama_karyawan: empMap[l.id_karyawan] || l.id_karyawan,
          tanggal_operasional: normalizeIsoDate(l.tanggal_operasional),
          jam_mulai: normalizeHHMM(l.jam_mulai) || linkedShift?.jam_mulai || '',
          jam_selesai: normalizeHHMM(l.jam_selesai) || linkedShift?.jam_selesai || '',
          roti_awal: parseIndonesianNumber(l.roti_awal),
          roti_sisa: parseIndonesianNumber(l.roti_sisa),
          bahan_habis: Array.isArray(bahanHabis) ? bahanHabis : [],
          bahan_habis_json: l.bahan_habis_json || '[]',
          pengeluaran: parseIndonesianNumber(l.pengeluaran),
          setor_uang: parseIndonesianNumber(l.setor_uang),
          sisa_modal: parseIndonesianNumber(l.sisa_modal),
          catatan: l.catatan,
          dibuat_pada: l.dibuat_pada,
          roti_sisa_kemarin: parseIndonesianNumber(l.roti_sisa_kemarin),
          roti_diantar: parseIndonesianNumber(l.roti_diantar),
          roti_rusak_bonus: parseIndonesianNumber(l.roti_rusak_bonus),
          penjualan_offline_roti: parseIndonesianNumber(l.penjualan_offline_roti),
          penjualan_luar_kasir_roti: parseIndonesianNumber(l.penjualan_luar_kasir_roti),
          selisih_stok: parseIndonesianNumber(l.selisih_stok)
        };
      })
      .reverse();

    // 6. TransaksiKasir (newest first)
    const transaksiKasir = (rawData.transaksiKasir || [])
      .map((t) => {
        let items = [];
        try {
          items = JSON.parse(t.items_json);
        } catch {
          items = [];
        }
        return {
          transaksi_id: t.transaksi_id,
          id_cabang: t.id_cabang,
          nama_cabang: cabMap[t.id_cabang] || t.id_cabang,
          id_karyawan: t.id_karyawan,
          nama_karyawan: empMap[t.id_karyawan] || t.id_karyawan,
          tanggal_operasional: normalizeIsoDate(t.tanggal_operasional),
          items_json: t.items_json,
          items,
          metode_bayar: t.metode_bayar,
          total_bayar: parseIndonesianNumber(t.total_bayar),
          total_roti: parseIndonesianNumber(t.total_roti),
          dibuat_pada: t.dibuat_pada
        };
      })
      .reverse();

    // 7. Bon (newest first)
    const bon = (rawData.bon || [])
      .map((b) => ({
        bon_id: b.bon_id,
        id_karyawan: b.id_karyawan,
        nama_karyawan: empMap[b.id_karyawan] || b.id_karyawan,
        id_cabang: b.id_cabang,
        nama_cabang: cabMap[b.id_cabang] || b.id_cabang,
        nominal: parseIndonesianNumber(b.nominal),
        catatan: b.catatan,
        status: b.status,
        dibuat_pada: b.dibuat_pada,
        diverifikasi_pada: b.diverifikasi_pada || null,
        catatan_admin: b.catatan_admin || '',
        dibayar: parseIndonesianNumber(b.dibayar),
        sisa_bon: parseIndonesianNumber(b.sisa_bon)
      }))
      .reverse();

    // 8. RequestBahan (newest first)
    const requestBahan = (rawData.requestBahan || [])
      .map((r) => {
        let reqItems = [];
        try {
          reqItems = r.request_json ? JSON.parse(r.request_json) : [];
        } catch {
          reqItems = [];
        }
        return {
          request_id: r.request_id,
          id_cabang: r.id_cabang,
          nama_cabang: cabMap[r.id_cabang] || r.id_cabang,
          id_karyawan: r.id_karyawan,
          nama_karyawan: empMap[r.id_karyawan] || r.id_karyawan,
          tanggal_operasional: normalizeIsoDate(r.tanggal_operasional),
          roti_sisa: parseIndonesianNumber(r.roti_sisa),
          request_bahan: Array.isArray(reqItems) ? reqItems : [],
          request_json: r.request_json,
          catatan: r.catatan,
          status: r.status,
          dibuat_pada: r.dibuat_pada
        };
      })
      .reverse();

    // 9. Keuangan (authentic sheet entries + optional derived shift ledger)
    const keuangan = (rawData.keuangan || []).map((k) => ({
      keuangan_id: k.keuangan_id,
      tanggal_operasional: normalizeIsoDate(k.tanggal_operasional),
      id_cabang: k.id_cabang,
      nama_cabang: cabMap[k.id_cabang] || k.id_cabang,
      jenis: k.jenis,
      kategori: k.kategori,
      nominal: parseIndonesianNumber(k.nominal),
      catatan: k.catatan,
      dibuat_oleh: k.dibuat_oleh,
      dibuat_pada: k.dibuat_pada
    }));

    return {
      cabang,
      operasionalCabang: opMap,
      karyawan,
      menuKasir,
      shifts,
      laporanShift,
      transaksiKasir,
      bon,
      requestBahan,
      keuangan,
      lastSyncedAt: new Date().toISOString(),
      latestDate: latestShiftDate
    };
  } catch (err) {
    console.warn('[SheetSync] Failed fetching live Google Sheets CSV, using local cache:', err);
    return null;
  }
}

export function saveDbCache(dbPath: string, data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SheetSync] Failed saving cache:', err);
  }
}
