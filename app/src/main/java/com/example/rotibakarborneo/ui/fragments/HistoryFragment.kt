package com.example.rotibakarborneo.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.RiwayatItem
import com.example.rotibakarborneo.databinding.FragmentHistoryBinding
import com.example.rotibakarborneo.ui.adapter.RiwayatAdapter
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class HistoryFragment : Fragment() {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: RiwayatAdapter
    private lateinit var session: SessionManager

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        session = SessionManager(requireContext())
        
        adapter = RiwayatAdapter(emptyList())
        binding.rvHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHistory.adapter = adapter

        muatRiwayat()
    }

    private fun muatRiwayat() {
        binding.progressBar.visibility = View.VISIBLE
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Jakarta"))
        val tglSelesai = sdf.format(cal.time)
        cal.add(Calendar.DAY_OF_YEAR, -30)
        val tglMulai = sdf.format(cal.time)

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getRiwayatPresensi(
                    apiKey = BuildConfig.API_KEY,
                    tglMulai = tglMulai,
                    tglSelesai = tglSelesai
                )

                if (response.isSuccessful) {
                    val body = response.body()?.string() ?: ""
                    val json = JSONObject(body)
                    if (json.getBoolean("success")) {
                        val dataArray = json.getJSONArray("data")
                        val riwayatList = mutableListOf<RiwayatItem>()
                        val myIdKaryawan = session.getIdKaryawan()?.trim()

                        for (i in 0 until dataArray.length()) {
                            val obj = dataArray.getJSONObject(i)
                            val rowIdKaryawan = obj.getString("id_karyawan").trim()
                            
                            if (rowIdKaryawan == myIdKaryawan) {
                                riwayatList.add(RiwayatItem(
                                    tanggal = obj.optString("tanggal", "-"),
                                    jam_masuk = if (obj.isNull("jam_masuk")) "-" else obj.getString("jam_masuk"),
                                    jam_pulang = if (obj.isNull("jam_pulang")) "-" else obj.getString("jam_pulang"),
                                    status_presensi = obj.optString("status_presensi", "Proses")
                                ))
                            }
                        }
                        adapter.updateData(riwayatList.reversed())
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Gagal sinkron riwayat", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}