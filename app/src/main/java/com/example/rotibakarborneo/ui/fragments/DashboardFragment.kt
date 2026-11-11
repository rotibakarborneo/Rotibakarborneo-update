package com.example.rotibakarborneo.ui.fragments

import android.os.Bundle
import android.content.Intent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.CabangDashboard
import com.example.rotibakarborneo.databinding.ActivityDashboardCabangBinding
import com.example.rotibakarborneo.ui.adapter.CabangAdapter
import com.example.rotibakarborneo.util.SessionManager
import com.example.rotibakarborneo.ui.admin.KelolaDataActivity
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*

class DashboardFragment : Fragment() {
    private var _binding: ActivityDashboardCabangBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: CabangAdapter
    private lateinit var session: SessionManager

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = ActivityDashboardCabangBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        session = SessionManager(requireContext())
        
        binding.btnLogout.visibility = if (session.getRole()?.uppercase() == "ADMIN") View.VISIBLE else View.GONE
        binding.btnLogout.setImageResource(android.R.drawable.ic_input_add)
        binding.btnLogout.setOnClickListener { startActivity(Intent(requireContext(), KelolaDataActivity::class.java)) }
        binding.tvHeaderTitle.text = "Monitoring Outlet"
        binding.tvHeaderSubtitle.text = "Pantau cabang dan penjualan hari ini"
        
        setupRecyclerView()
        
        binding.swipeRefresh.setOnRefreshListener {
            muatDataDashboard()
        }

        muatDataDashboard()
    }

    private fun setupRecyclerView() {
        adapter = CabangAdapter(emptyList(), ::muatLaporanShift)
        // Kartu dibuat satu kolom agar laporan yang dibuka nyaman dibaca.
        binding.rvCabang.layoutManager = LinearLayoutManager(requireContext())
        binding.rvCabang.adapter = adapter
    }

    private fun muatDataDashboard() {
        val ctx = context ?: return
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getDashboardCabang(apiKey = BuildConfig.API_KEY)
                if (response.success) {
                    val filteredList = response.data.filter { it.nama_cabang.isNotBlank() }
                    adapter.updateData(filteredList)
                    binding.tvTotalRotiTerjual.text = filteredList.sumOf { it.roti_terjual_hari_ini }.toString()
                    binding.weeklySummary.visibility = View.GONE
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Toast.makeText(ctx, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun muatLaporanShift(cabang: CabangDashboard) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getLaporanShift(
                    apiKey = BuildConfig.API_KEY,
                    idCabang = cabang.id_cabang
                )
                if (response.success) {
                    adapter.showReport(cabang.id_cabang, response.data)
                } else {
                    adapter.showReportError(
                        cabang.id_cabang,
                        response.message ?: "Laporan belum dikirim oleh outlet."
                    )
                }
            } catch (_: Exception) {
                adapter.showReportError(cabang.id_cabang, "Gagal memuat laporan. Tarik layar untuk mencoba lagi.")
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
