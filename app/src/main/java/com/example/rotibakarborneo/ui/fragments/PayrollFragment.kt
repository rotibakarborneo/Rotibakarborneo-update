package com.example.rotibakarborneo.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import android.content.Intent
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.databinding.FragmentPayrollBinding
import com.example.rotibakarborneo.ui.adapter.PayrollAdapter
import com.example.rotibakarborneo.ui.bos.PayrollDetailActivity
import com.example.rotibakarborneo.ui.admin.BonusActivity
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class PayrollFragment : Fragment() {
    private var _binding: FragmentPayrollBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: PayrollAdapter
    private var tglMulai = ""
    private var tglSelesai = ""

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPayrollBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        adapter = PayrollAdapter(emptyList()) { item ->
            startActivity(Intent(requireContext(), PayrollDetailActivity::class.java).apply {
                putExtra("id", item.id_karyawan); putExtra("nama", item.nama); putExtra("start", tglMulai); putExtra("end", tglSelesai)
            })
        }
        binding.rvPayroll.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPayroll.adapter = adapter

        binding.btnFilterMinggu.setOnClickListener { setPeriode(7) }
        binding.btnFilterBulan.setOnClickListener { setPeriode(30) }
        binding.btnBonus.setOnClickListener { startActivity(Intent(requireContext(), BonusActivity::class.java)) }
        
        // Default 7 hari
        setPeriode(7)
    }

    private fun setPeriode(hari: Int) {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Jakarta"))
        // Payroll hanya memuat shift yang sudah selesai. Shift operasional berakhir pukul 05.00,
        // sehingga sebelum pukul 05.00 hari operasional terakhir juga belum dimasukkan.
        cal.add(Calendar.DAY_OF_YEAR, if (cal.get(Calendar.HOUR_OF_DAY) < 5) -2 else -1)
        tglSelesai = sdf.format(cal.time)
        // Dari tanggal operasional terakhir yang selesai, ambil tepat sejumlah hari yang dipilih.
        cal.add(Calendar.DAY_OF_YEAR, -(hari - 1))
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
                    Toast.makeText(requireContext(), "Payroll ditolak server. Cek deployment Apps Script.", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                val detail = e.message?.replace("\n", " ")?.take(120) ?: "kesalahan koneksi"
                Toast.makeText(requireContext(), "Gagal payroll: $detail", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
