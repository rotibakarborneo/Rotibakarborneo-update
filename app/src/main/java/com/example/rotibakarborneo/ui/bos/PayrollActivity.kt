package com.example.rotibakarborneo.ui.bos

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.ui.adapter.PayrollAdapter
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class PayrollActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: PayrollAdapter
    private var tglMulai = ""
    private var tglSelesai = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_payroll)
        recyclerView = findViewById(R.id.rvPayroll)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = PayrollAdapter(emptyList())
        recyclerView.adapter = adapter

        findViewById<Button>(R.id.btnFilterMinggu).setOnClickListener { setPeriode(7) }
        findViewById<Button>(R.id.btnFilterBulan).setOnClickListener { setPeriode(30) }
    }

    private fun setPeriode(hari: Int) {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val cal = Calendar.getInstance()
        tglSelesai = sdf.format(cal.time)
        cal.add(Calendar.DAY_OF_YEAR, -hari)
        tglMulai = sdf.format(cal.time)
        muatPayroll()
    }

    private fun muatPayroll() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getPayroll(
                    apiKey = BuildConfig.API_KEY, tglMulai = tglMulai, tglSelesai = tglSelesai
                )
                if (response.success) {
                    adapter.updateData(response.data)
                } else {
                    Toast.makeText(this@PayrollActivity, "Payroll ditolak server. Cek deployment Apps Script.", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                val detail = e.message?.replace("\n", " ")?.take(120) ?: "kesalahan koneksi"
                Toast.makeText(this@PayrollActivity, "Gagal payroll: $detail", Toast.LENGTH_LONG).show()
            }
        }
    }
}
