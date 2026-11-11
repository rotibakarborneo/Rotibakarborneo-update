package com.example.rotibakarborneo.ui.fragments

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.view.setPadding
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.RequestBahanItem
import kotlinx.coroutines.launch

class RequestCabangFragment : Fragment() {
    private var riwayat = false
    private lateinit var container: LinearLayout
    private lateinit var progress: ProgressBar

    companion object {
        fun create(riwayat: Boolean) = RequestCabangFragment().apply { arguments = Bundle().apply { putBoolean("riwayat", riwayat) } }
    }

    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); riwayat = arguments?.getBoolean("riwayat") ?: false }
    override fun onCreateView(inflater: LayoutInflater, parent: ViewGroup?, state: Bundle?): View {
        val scroll = ScrollView(requireContext()).apply { setBackgroundColor(Color.rgb(18, 18, 18)) }
        container = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; setPadding(24) }
        progress = ProgressBar(requireContext()).apply { isIndeterminate = true }
        container.addView(judul(if (riwayat) "Riwayat request" else "Request per cabang", 26, Color.WHITE))
        container.addView(judul(if (riwayat) "Request bahan yang telah masuk." else "Siapkan dan antar request dari setiap outlet.", 14, Color.LTGRAY))
        container.addView(progress, LinearLayout.LayoutParams(-2, -2).apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = 32 })
        scroll.addView(container)
        return scroll
    }
    override fun onViewCreated(view: View, state: Bundle?) { super.onViewCreated(view, state); muatRequest() }
    private fun muatRequest() = lifecycleScope.launch {
        try {
            val result = RetrofitClient.instance.getRequestBahan(apiKey = BuildConfig.API_KEY)
            progress.visibility = View.GONE
            val list = result.data.sortedByDescending { it.tanggal_operasional }
            if (list.isEmpty()) container.addView(judul("Belum ada request bahan.", 16, Color.LTGRAY))
            else list.forEach { container.addView(kartu(it)) }
        } catch (_: Exception) { progress.visibility = View.GONE; container.addView(judul("Gagal memuat request. Tarik ulang halaman nanti.", 16, Color.RED)) }
    }
    private fun kartu(item: RequestBahanItem): View {
        val bahan = item.request_bahan.joinToString("\n") { "• ${it.nama}" }
        return LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL; setPadding(20); setBackgroundColor(Color.rgb(38, 38, 40))
            layoutParams = LinearLayout.LayoutParams(-1, -2).apply { topMargin = 18 }
            addView(judul(item.nama_cabang, 19, Color.WHITE))
            addView(judul("${item.tanggal_operasional} • Sisa roti: ${item.roti_sisa}", 13, Color.rgb(120, 210, 160)))
            addView(judul(bahan, 16, Color.WHITE))
            item.catatan?.takeIf { it.isNotBlank() }?.let { addView(judul("Catatan: $it", 13, Color.LTGRAY)) }
        }
    }
    private fun judul(text: String, size: Int, color: Int) = TextView(requireContext()).apply { this.text = text; textSize = size.toFloat(); setTextColor(color); setPadding(0, 8, 0, 8) }
}
