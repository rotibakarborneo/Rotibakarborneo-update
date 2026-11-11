package com.example.rotibakarborneo.ui.karyawan

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.BahanHabis
import com.example.rotibakarborneo.data.model.RequestBahanRequest
import com.example.rotibakarborneo.databinding.ActivityRequestBahanBinding
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch

class RequestBahanActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRequestBahanBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestBahanBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.btnKembali.setOnClickListener { finish() }
        binding.btnKirim.setOnClickListener { kirim() }
    }

    private fun kirim() {
        val sisa = binding.etRotiSisa.text?.toString()?.toIntOrNull()
        val items = binding.etRequest.text?.toString().orEmpty().lines().map(String::trim).filter { it.isNotEmpty() }.distinct().map { BahanHabis(it) }
        if (sisa == null || sisa < 0 || items.isEmpty()) { Toast.makeText(this, "Isi sisa roti dan minimal satu request.", Toast.LENGTH_LONG).show(); return }
        val session = SessionManager(this)
        binding.btnKirim.isEnabled = false
        lifecycleScope.launch {
            try {
                val result = RetrofitClient.instance.simpanRequestBahan(RequestBahanRequest(
                    api_key = BuildConfig.API_KEY, id_karyawan = session.getIdKaryawan().orEmpty(), id_cabang = session.getIdCabang().orEmpty(),
                    roti_sisa = sisa, request_bahan = items, catatan = binding.etCatatan.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                ))
                Toast.makeText(this@RequestBahanActivity, result.message, Toast.LENGTH_LONG).show()
                if (result.success) finish()
            } catch (_: Exception) { Toast.makeText(this@RequestBahanActivity, "Gagal mengirim request.", Toast.LENGTH_LONG).show() }
            finally { binding.btnKirim.isEnabled = true }
        }
    }
}
