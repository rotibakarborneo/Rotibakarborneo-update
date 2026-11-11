package com.example.rotibakarborneo.ui.karyawan

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.LaporanShiftRequest
import com.example.rotibakarborneo.databinding.ActivityLaporanShiftBinding
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch

class LaporanShiftActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLaporanShiftBinding
    private lateinit var session: SessionManager
    private var sisaKemarin = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLaporanShiftBinding.inflate(layoutInflater)
        setContentView(binding.root)
        session = SessionManager(this)

        binding.btnKembali.setOnClickListener { finish() }
        binding.btnSimpanLaporan.setOnClickListener { simpanLaporan() }
        muatKonteks()
    }

    private fun muatKonteks() = lifecycleScope.launch {
        try {
            val r = RetrofitClient.instance.getLaporanContext(apiKey = BuildConfig.API_KEY, idKaryawan = session.getIdKaryawan().orEmpty(), idCabang = session.getIdCabang().orEmpty())
            if (r.success) { sisaKemarin = r.data?.roti_sisa_kemarin ?: 0; binding.tvSisaKemarin.text = "Sisa roti kemarin: $sisaKemarin roti"; binding.tvKasirOffline.text = "Terjual kasir hari ini: ${r.data?.penjualan_offline_roti ?: 0.0} roti" }
        } catch (_: Exception) { binding.tvSisaKemarin.text = "Sisa roti kemarin belum dapat dimuat" }
    }

    private fun simpanLaporan() {
        val rotiDiantar = binding.etRotiDiantar.text?.toString()?.trim()?.toIntOrNull()
        val rotiSisa = binding.etRotiSisa.text?.toString()?.trim()?.toIntOrNull()
        val rotiAwal = sisaKemarin + (rotiDiantar ?: -1)
        if (rotiDiantar == null || rotiSisa == null || rotiDiantar < 0 || rotiSisa < 0 || rotiSisa > rotiAwal) {
            binding.tilRotiSisa.error = "Isi stok dengan benar; sisa tidak boleh melebihi stok awal."
            return
        }
        binding.tilRotiSisa.error = null

        val request = LaporanShiftRequest(
            api_key = BuildConfig.API_KEY,
            id_karyawan = session.getIdKaryawan().orEmpty(),
            id_cabang = session.getIdCabang().orEmpty(),
            roti_diantar = rotiDiantar,
            roti_sisa = rotiSisa,
            roti_rusak_bonus = binding.etRotiRusakBonus.text?.toString()?.trim()?.toDoubleOrNull()?.toInt() ?: 0,
            pengeluaran = binding.etPengeluaran.text?.toString()?.trim()?.toDoubleOrNull() ?: 0.0,
            setor_uang = binding.etSetorUang.text?.toString()?.trim()?.toDoubleOrNull() ?: 0.0,
            sisa_modal = binding.etSisaModal.text?.toString()?.trim()?.toDoubleOrNull() ?: 0.0,
            catatan = binding.etCatatan.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
        )

        binding.progressSimpan.visibility = View.VISIBLE
        binding.btnSimpanLaporan.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.simpanLaporanShift(request)
                if (response.success) {
                    Toast.makeText(this@LaporanShiftActivity, response.message, Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    Toast.makeText(this@LaporanShiftActivity, response.message, Toast.LENGTH_LONG).show()
                }
            } catch (_: Exception) {
                Toast.makeText(this@LaporanShiftActivity, "Gagal mengirim laporan. Periksa koneksi lalu coba lagi.", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressSimpan.visibility = View.GONE
                binding.btnSimpanLaporan.isEnabled = true
            }
        }
    }

}
