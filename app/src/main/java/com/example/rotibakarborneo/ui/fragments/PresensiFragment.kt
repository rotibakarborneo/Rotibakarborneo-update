package com.example.rotibakarborneo.ui.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.databinding.FragmentPresensiBinding
import com.example.rotibakarborneo.ui.karyawan.AbsenActivity
import com.example.rotibakarborneo.ui.karyawan.LaporanShiftActivity
import com.example.rotibakarborneo.ui.karyawan.KasirActivity

import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class PresensiFragment : Fragment() {
    private var _binding: FragmentPresensiBinding? = null
    private val binding get() = _binding!!
    private lateinit var session: SessionManager

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPresensiBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        session = SessionManager(requireContext())
        
        binding.tvGreeting.text = "Semangat bekerja,\n${session.getNama()}"

        binding.btnBukaAbsen.setOnClickListener {
            startActivity(Intent(requireContext(), AbsenActivity::class.java))
        }

        binding.btnLaporanShift.setOnClickListener {
            startActivity(Intent(requireContext(), LaporanShiftActivity::class.java))
        }
        binding.btnKasir.setOnClickListener { startActivity(Intent(requireContext(), KasirActivity::class.java)) }
        muatPerformaHariIni()
    }

    override fun onResume() { super.onResume(); if (this::session.isInitialized) muatPerformaHariIni() }

    private fun muatPerformaHariIni() {
        lifecycleScope.launch {
            try {
                val result = RetrofitClient.instance.getPerformaKaryawan(apiKey = BuildConfig.API_KEY, employeeId = session.getIdKaryawan().orEmpty())
                binding.tvJamKerjaHariIni.text = String.format(Locale.getDefault(), "%.1f Jam", result.data.total_jam)
                binding.tvEstimasiGaji.text = NumberFormat.getCurrencyInstance(Locale("id", "ID")).format(result.data.estimasi_gaji)
            } catch (_: Exception) { /* Tetap tampilkan nilai default saat jaringan tidak tersedia. */ }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
