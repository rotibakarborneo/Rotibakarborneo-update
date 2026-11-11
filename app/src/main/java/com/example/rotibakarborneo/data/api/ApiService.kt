package com.example.rotibakarborneo.data.api

import com.example.rotibakarborneo.data.model.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {
    @GET("exec")
    suspend fun getDashboardCabang(
        @Query("action") action: String = "dashboard_cabang",
        @Query("api_key") apiKey: String,
        // Parameter ini diabaikan backend, tetapi mencegah respons dashboard lama dari cache jaringan.
        @Query("_") cacheBust: Long = System.currentTimeMillis()
    ): DashboardResponse

    @GET("exec")
    suspend fun getPerformaKaryawan(
        @Query("action") action: String = "performa_karyawan",
        @Query("api_key") apiKey: String,
        @Query("id_karyawan") employeeId: String
    ): PerformaKaryawanResponse

    @GET("exec")
    suspend fun getPayroll(
        @Query("action") action: String = "payroll",
        @Query("api_key") apiKey: String,
        @Query("tanggal_mulai") tglMulai: String,
        @Query("tanggal_selesai") tglSelesai: String
    ): PayrollResponse

    @GET("exec")
    suspend fun getPayrollDetail(
        @Query("action") action: String = "payroll_detail",
        @Query("api_key") apiKey: String,
        @Query("id_karyawan") employeeId: String,
        @Query("tanggal_mulai") start: String,
        @Query("tanggal_selesai") end: String
    ): PayrollDetailResponse

    @GET("exec")
    suspend fun getRiwayatPresensi(
        @Query("action") action: String = "riwayat_presensi",
        @Query("api_key") apiKey: String,
        @Query("tanggal_mulai") tglMulai: String,
        @Query("tanggal_selesai") tglSelesai: String
    ): retrofit2.Response<okhttp3.ResponseBody>

    @POST("exec")
    suspend fun absenMasuk(@Body body: AbsenRequest): AbsenResponse

    @POST("exec")
    suspend fun absenPulang(@Body body: AbsenRequest): AbsenResponse

    @POST("exec")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("exec")
    suspend fun uploadFotoProfil(@Body body: FotoProfilRequest): FotoProfilResponse

    @GET("exec")
    suspend fun getListCabang(
        @Query("action") action: String = "list_cabang",
        @Query("api_key") apiKey: String
    ): retrofit2.Response<okhttp3.ResponseBody>

    @GET("exec")
    suspend fun getMasterCabang(@Query("action") action: String = "master_cabang", @Query("api_key") apiKey: String): CabangMasterResponse

    @GET("exec")
    suspend fun getLaporanShift(
        @Query("action") action: String = "laporan_shift",
        @Query("api_key") apiKey: String,
        @Query("id_cabang") idCabang: String
    ): LaporanShiftResponse

    @GET("exec")
    suspend fun getLaporanContext(@Query("action") action: String = "laporan_context", @Query("api_key") apiKey: String, @Query("id_karyawan") idKaryawan: String, @Query("id_cabang") idCabang: String): LaporanContextResponse

    @POST("exec")
    suspend fun simpanLaporanShift(@Body body: LaporanShiftRequest): AbsenResponse

    @POST("exec") suspend fun simpanTransaksiKasir(@Body body: TransaksiKasirRequest): AbsenResponse
    @POST("exec") suspend fun ajukanBon(@Body body: BonRequest): AbsenResponse
    @GET("exec") suspend fun getBonSaya(@Query("action") action: String = "bon_saya", @Query("api_key") apiKey: String, @Query("id_karyawan") idKaryawan: String, @Query("id_cabang") idCabang: String): BonResponse
    @GET("exec") suspend fun getBonAdmin(@Query("action") action: String = "bon_admin", @Query("api_key") apiKey: String): BonResponse
    @GET("exec") suspend fun getTransaksiKasirAdmin(@Query("action") action: String = "transaksi_kasir_admin", @Query("api_key") apiKey: String, @Query("tanggal_operasional") tanggal: String = ""): TransaksiKasirAdminResponse
    @GET("exec") suspend fun getRiwayatLaporanShift(@Query("action") action: String = "riwayat_laporan_shift", @Query("api_key") apiKey: String, @Query("tanggal_mulai") mulai: String, @Query("tanggal_selesai") selesai: String, @Query("id_cabang") idCabang: String = ""): RiwayatLaporanResponse
    @GET("exec") suspend fun getBonus(@Query("action") action: String = "bonus", @Query("api_key") apiKey: String, @Query("tanggal_mulai") mulai: String, @Query("tanggal_selesai") selesai: String): BonusResponse
    @GET("exec") suspend fun getKeuangan(@Query("action") action: String = "keuangan", @Query("api_key") apiKey: String, @Query("tanggal_mulai") mulai: String, @Query("tanggal_selesai") selesai: String, @Query("id_cabang") idCabang: String = ""): KeuanganResponse
    @POST("exec") suspend fun verifikasiBon(@Body body: VerifikasiBonRequest): AbsenResponse
    @POST("exec") suspend fun simpanKeuangan(@Body body: KeuanganRequest): AbsenResponse

    @POST("exec")
    suspend fun simpanRequestBahan(@Body body: RequestBahanRequest): AbsenResponse

    @POST("exec") suspend fun tambahCabang(@Body body: TambahCabangRequest): AbsenResponse
    @POST("exec") suspend fun tambahKaryawan(@Body body: TambahKaryawanRequest): AbsenResponse
    @POST("exec") suspend fun daftarTokenPerangkat(@Body body: DeviceTokenRequest): AbsenResponse

    @GET("exec")
    suspend fun getRequestBahan(
        @Query("action") action: String = "request_bahan",
        @Query("api_key") apiKey: String,
        @Query("_") cacheBust: Long = System.currentTimeMillis()
    ): RequestBahanResponse
}
