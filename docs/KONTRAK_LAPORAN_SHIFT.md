# Kontrak Google Apps Script: laporan shift

## Prinsip shift lintas tengah malam

Jangan gunakan tanggal perangkat sebagai identitas laporan. Saat `absen_masuk`, Apps Script harus membuat `shift_id` dan menyimpan `tanggal_operasional` berdasarkan waktu mulai shift. Saat `absen_pulang`, shift yang sama ditutup meskipun jam pulang telah melewati tengah malam. Endpoint laporan menggunakan shift terbuka/terakhir milik cabang tersebut.

Contoh: masuk **30 Juli 2026 17:00**, pulang **31 Juli 2026 02:00** → satu `shift_id`, `tanggal_operasional: 2026-07-30`.

## Endpoint baru

### Simpan laporan

`POST /exec`, body:

```json
{
  "action": "simpan_laporan_shift",
  "api_key": "...",
  "id_karyawan": "K001",
  "id_cabang": "CBG01",
  "roti_awal": 100,
  "roti_sisa": 12,
  "bahan_habis": [{"nama":"Margarin","jumlah":"1 kg"}],
  "pengeluaran": 25000,
  "setor_uang": 450000,
  "sisa_modal": 100000,
  "catatan": "Kompor 2 agak kecil apinya"
}
```

Validasi server wajib dilakukan: karyawan milik cabang, shift telah ditutup, laporan belum pernah dibuat (atau lakukan update eksplisit), `roti_sisa <= roti_awal`, dan nilai uang tidak negatif. Simpan satu baris pada sheet `LaporanShift` dengan `shift_id` sebagai kunci unik.

### Ambil laporan dashboard bos

`GET /exec?action=laporan_shift&api_key=...&id_cabang=CBG01`

Respons sukses:

```json
{
  "success": true,
  "data": {
    "tanggal_operasional": "2026-07-30",
    "jam_mulai": "17:00",
    "jam_selesai": "02:00",
    "roti_awal": 100,
    "roti_sisa": 12,
    "bahan_habis": [{"nama":"Margarin","jumlah":"1 kg"}],
    "pengeluaran": 25000,
    "setor_uang": 450000,
    "sisa_modal": 100000,
    "catatan": "Kompor 2 agak kecil apinya"
  }
}
```

Endpoint hanya boleh mengembalikan laporan terbaru dari shift **TUTUP_SELESAI** pada cabang tersebut dan harus memverifikasi bahwa pemanggil berperan BOS/OWNER/ADMIN. Untuk implementasi produksi, ganti `api_key` yang tertanam di APK dengan token sesi hasil login.
