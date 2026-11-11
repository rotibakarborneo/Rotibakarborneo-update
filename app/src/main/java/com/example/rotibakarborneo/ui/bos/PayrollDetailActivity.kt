package com.example.rotibakarborneo.ui.bos

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.databinding.ActivityPayrollDetailBinding
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class PayrollDetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); val b = ActivityPayrollDetailBinding.inflate(layoutInflater); setContentView(b.root)
        val id = intent.getStringExtra("id").orEmpty(); val start = intent.getStringExtra("start").orEmpty(); val end = intent.getStringExtra("end").orEmpty()
        b.tvTitle.text = intent.getStringExtra("nama").orEmpty(); b.tvPeriod.text = "$start s.d. $end"
        lifecycleScope.launch { try { val r = RetrofitClient.instance.getPayrollDetail(apiKey = BuildConfig.API_KEY, employeeId = id, start = start, end = end); val rupiah = NumberFormat.getCurrencyInstance(Locale("id", "ID")); b.tvContent.text = if (r.data.isEmpty()) "Belum ada shift selesai pada periode ini." else r.data.joinToString("\n\n") { "${it.tanggal}\n${it.jam_masuk} – ${it.jam_pulang}  •  ${it.total_jam} jam\nTerlambat: ${it.menit_terlambat} menit\nGaji harian: ${rupiah.format(it.gaji_harian)}" } } catch (_: Exception) { b.tvContent.text = "Gagal memuat rincian payroll." } }
    }
}
