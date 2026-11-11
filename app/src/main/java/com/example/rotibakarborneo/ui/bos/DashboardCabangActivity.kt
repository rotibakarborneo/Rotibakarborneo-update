package com.example.rotibakarborneo.ui.bos

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.databinding.ActivityDashboardCabangBinding
import com.example.rotibakarborneo.ui.adapter.CabangAdapter
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch

class DashboardCabangActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDashboardCabangBinding
    private lateinit var adapter: CabangAdapter
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardCabangBinding.inflate(layoutInflater)
        setContentView(binding.root)

        session = SessionManager(this)
        
        // Update subtitle dengan nama user
        binding.tvHeaderTitle.text = "Dashboard Cabang"
        binding.tvHeaderSubtitle.text = "Selamat datang, ${session.getNama()}"
        
        setupRecyclerView()
        
        binding.swipeRefresh.setOnRefreshListener {
            muatDataDashboard()
        }

        binding.btnLogout.setOnClickListener {
            session.logout()
            startActivity(android.content.Intent(this, com.example.rotibakarborneo.ui.login.LoginActivity::class.java))
            finish()
        }

        muatDataDashboard()
    }

    private fun setupRecyclerView() {
        // Layar lama ini tidak lagi menjadi navigasi utama; callback tetap diperlukan
        // agar adapter kartu cabang dapat dikompilasi.
        adapter = CabangAdapter(emptyList()) { }
        binding.rvCabang.layoutManager = LinearLayoutManager(this)
        binding.rvCabang.adapter = adapter
    }

    private fun muatDataDashboard() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getDashboardCabang(apiKey = BuildConfig.API_KEY)
                if (response.success) {
                    val filteredList = response.data.filter { it.nama_cabang.isNotBlank() }
                    adapter.updateData(filteredList)
                } else {
                    Toast.makeText(this@DashboardCabangActivity, "Gagal: ${response.success}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@DashboardCabangActivity, "Koneksi Bermasalah", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }
}
