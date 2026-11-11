package com.example.rotibakarborneo.data.model

data class AbsenRequest(
    val action: String, val api_key: String, val id_karyawan: String,
    val id_cabang: String, val lat: Double, val lng: Double, val foto_base64: String
)
data class AbsenResponse(val success: Boolean, val message: String, val data: Map<String, Any>?)
data class TambahCabangRequest(val action: String = "tambah_cabang", val api_key: String, val id_admin: String, val id_cabang_admin: String, val id_cabang: String, val nama_cabang: String, val latitude: Double, val longitude: Double, val radius_meter: Double)
data class TambahKaryawanRequest(val action: String = "tambah_karyawan", val api_key: String, val id_admin: String, val id_cabang_admin: String, val id_karyawan: String, val nama: String, val username: String, val password: String, val role: String, val id_cabang: String, val tarif_per_jam: Double)
data class DeviceTokenRequest(val action: String = "daftar_token_perangkat", val api_key: String, val id_karyawan: String, val id_cabang: String, val fcm_token: String)

data class LoginRequest(val action: String = "login", val api_key: String, val username: String, val password: String)
data class LoginResponse(val success: Boolean, val message: String?, val data: KaryawanData?)
data class KaryawanData(val id_karyawan: String, val nama: String, val role: String, val id_cabang: String, val foto_profil_url: String? = null)
data class FotoProfilRequest(val action: String = "upload_foto_profil", val api_key: String, val id_karyawan: String, val id_cabang: String, val foto_base64: String)
data class FotoProfilResponse(val success: Boolean, val message: String, val data: FotoProfilData? = null)
data class FotoProfilData(val foto_profil_url: String)

data class DashboardResponse(val success: Boolean, val data: List<CabangDashboard>)
data class CabangMaster(val id_cabang: String, val nama_cabang: String)
data class CabangMasterResponse(val success: Boolean, val data: List<CabangMaster> = emptyList())
data class PerformaKaryawanResponse(val success: Boolean, val data: PerformaKaryawan)
data class PerformaKaryawan(val total_jam: Double = 0.0, val estimasi_gaji: Double = 0.0, val status: String = "BELUM_ABSEN")
data class CabangDashboard(
    val id_cabang: String, val nama_cabang: String, val status: String,
    val jam_buka_pertama: String?, val total_kerja_hari_ini: Double = 0.0,
    val estimasi_gaji_hari_ini: Double = 0.0,
    val roti_terjual_hari_ini: Int = 0,
    val karyawan_absen: List<KaryawanAbsen>
)
data class KaryawanAbsen(val nama_karyawan: String, val jam_masuk: String, val foto_url: String?, val status_masuk: String)

/** Laporan ditutup per shift, bukan per tanggal kalender. */
data class LaporanShiftResponse(
    val success: Boolean,
    val message: String? = null,
    val data: LaporanShift? = null
)

data class LaporanShift(
    val tanggal_operasional: String,
    val jam_mulai: String? = null,
    val jam_selesai: String? = null,
    val roti_awal: Int = 0,
    val roti_sisa: Int = 0,
    val roti_sisa_kemarin: Int = 0,
    val roti_diantar: Int = 0,
    val roti_rusak_bonus: Int = 0,
    val penjualan_offline_roti: Double = 0.0,
    val penjualan_luar_kasir_roti: Double = 0.0,
    val selisih_stok: Double = 0.0,
    val bahan_habis: List<BahanHabis> = emptyList(),
    val pengeluaran: Double = 0.0,
    val setor_uang: Double = 0.0,
    val sisa_modal: Double = 0.0,
    val catatan: String? = null
)

data class LaporanContextResponse(val success: Boolean, val message: String? = null, val data: LaporanContext? = null)
data class LaporanContext(val roti_sisa_kemarin: Int = 0, val penjualan_offline_roti: Double = 0.0)

data class BahanHabis(val nama: String, val jumlah: String = "")

data class RequestBahanRequest(
    val action: String = "simpan_request_bahan", val api_key: String, val id_karyawan: String,
    val id_cabang: String, val roti_sisa: Int, val request_bahan: List<BahanHabis>, val catatan: String? = null
)
data class RequestBahanResponse(val success: Boolean, val data: List<RequestBahanItem> = emptyList())
data class RequestBahanItem(
    val request_id: String, val id_cabang: String, val nama_cabang: String, val id_karyawan: String,
    val tanggal_operasional: String, val roti_sisa: Int, val request_bahan: List<BahanHabis> = emptyList(),
    val catatan: String? = null, val status: String
)

data class LaporanShiftRequest(
    val action: String = "simpan_laporan_shift",
    val api_key: String,
    val id_karyawan: String,
    val id_cabang: String,
    val roti_diantar: Int,
    val roti_sisa: Int,
    val roti_rusak_bonus: Int = 0,
    val pengeluaran: Double,
    val setor_uang: Double,
    val sisa_modal: Double,
    val catatan: String? = null
)

data class KasirItem(val nama: String, val harga: Double, val qty: Int, val satuan_roti: Double, val porsi: String, val cara_masak: String)
data class TransaksiKasirRequest(val action: String = "simpan_transaksi_kasir", val api_key: String, val id_karyawan: String, val id_cabang: String, val transaksi_id: String, val items: List<KasirItem>, val metode_bayar: String)
data class BonRequest(val action: String = "ajukan_bon", val api_key: String, val id_karyawan: String, val id_cabang: String, val nominal: Double, val catatan: String)
data class BonItem(val bon_id: String, val nominal: Double, val catatan: String, val status: String, val dibuat_pada: String, val dibayar: Double = 0.0, val sisa_bon: Double = 0.0, val id_karyawan: String = "", val nama_karyawan: String = "", val id_cabang: String = "", val nama_cabang: String = "")
data class BonResponse(val success: Boolean, val message: String? = null, val data: List<BonItem> = emptyList())
data class TransaksiKasirAdmin(val transaksi_id: String, val nama_karyawan: String, val nama_cabang: String, val metode_bayar: String, val total_bayar: Double, val total_roti: Double, val dibuat_pada: String, val items: List<KasirItem> = emptyList())
data class TransaksiKasirAdminResponse(val success: Boolean, val data: List<TransaksiKasirAdmin> = emptyList())
data class VerifikasiBonRequest(val action: String = "verifikasi_bon", val api_key: String, val id_admin: String, val id_cabang_admin: String, val bon_id: String, val status: String, val dibayar: Double, val catatan_admin: String = "")
data class RiwayatLaporanItem(val laporan_id: String, val tanggal_operasional: String, val id_cabang: String, val nama_cabang: String, val id_karyawan: String, val nama_karyawan: String, val roti_sisa_kemarin: Int = 0, val roti_diantar: Int = 0, val roti_awal: Int, val roti_sisa: Int, val roti_rusak_bonus: Int, val penjualan_offline_roti: Double = 0.0, val penjualan_luar_kasir_roti: Double = 0.0, val roti_terjual: Int, val pengeluaran: Double, val setor_uang: Double, val catatan: String = "")
data class RiwayatLaporanResponse(val success: Boolean, val data: List<RiwayatLaporanItem> = emptyList())
data class BonusItem(val id_karyawan: String, val nama_karyawan: String, val id_cabang: String, val total_hari: Int, val total_jam: Double, val roti_terjual: Int, val target_roti: Int, val kelebihan_roti: Int)
data class BonusResponse(val success: Boolean, val data: List<BonusItem> = emptyList())
data class KeuanganRequest(val action: String = "simpan_keuangan", val api_key: String, val id_admin: String, val id_cabang_admin: String, val tanggal_operasional: String, val id_cabang: String = "", val jenis: String, val kategori: String, val nominal: Double, val catatan: String = "")
data class KeuanganItem(val keuangan_id: String, val tanggal_operasional: String, val id_cabang: String, val nama_cabang: String, val jenis: String, val kategori: String, val nominal: Double, val catatan: String = "", val otomatis: Boolean = false)
data class KeuanganData(val transaksi: List<KeuanganItem> = emptyList(), val total_pemasukan: Double = 0.0, val total_pengeluaran: Double = 0.0)
data class KeuanganResponse(val success: Boolean, val data: KeuanganData = KeuanganData())

data class PayrollResponse(val success: Boolean, val data: List<PayrollItem>)
data class PayrollItem(
    val id_karyawan: String, val nama: String, val jumlah_hari_masuk: Int,
    val total_jam_kerja: Double, val total_menit_terlambat: Int,
    val gaji_kotor: Double, val total_potongan: Double, val gaji_bersih: Double
)

data class RiwayatItem(
    val tanggal: String,
    val jam_masuk: String?,
    val jam_pulang: String?,
    val status_presensi: String?
)
data class PayrollDetailResponse(val success: Boolean, val data: List<PayrollDailyItem> = emptyList())
data class PayrollDailyItem(val tanggal: String, val jam_masuk: String, val jam_pulang: String, val total_jam: Double, val menit_terlambat: Int, val gaji_harian: Double)
