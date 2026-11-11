package com.example.rotibakarborneo.ui.admin

import android.app.DatePickerDialog
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.RiwayatLaporanItem
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class RiwayatLaporanActivity : AppCompatActivity() {
    private lateinit var list: LinearLayout
    private lateinit var dateButton: MaterialButton
    private val money = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    private val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private var allReports: List<RiwayatLaporanItem> = emptyList()
    private var selectedDate = ""

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(24), dp(20), dp(28)) }
        setContentView(ScrollView(this).apply { addView(root) })
        root.addView(header())
        dateButton = MaterialButton(this).apply {
            text = "Memuat tanggal laporan…"
            setIconResource(android.R.drawable.ic_menu_my_calendar)
            setOnClickListener { chooseDate() }
        }
        root.addView(dateButton, LinearLayout.LayoutParams(-1, dp(48)).apply { topMargin = dp(12) })
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(list)
        load()
    }

    private fun load() = lifecycleScope.launch {
        list.removeAllViews()
        list.addView(info("Memuat laporan shift…"), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18) })
        try {
            allReports = RetrofitClient.instance.getRiwayatLaporanShift(apiKey = BuildConfig.API_KEY, mulai = "", selesai = "").data
            if (selectedDate.isBlank()) selectedDate = allReports.firstOrNull()?.tanggal_operasional.orEmpty()
            renderSelectedDay()
        } catch (_: Exception) {
            list.removeAllViews()
            list.addView(info("Gagal memuat riwayat laporan."))
        }
    }

    private fun renderSelectedDay() {
        list.removeAllViews()
        dateButton.text = if (selectedDate.isBlank()) "Pilih tanggal laporan" else "Tanggal laporan: $selectedDate"
        val shown = allReports.filter { it.tanggal_operasional == selectedDate }
        if (shown.isEmpty()) {
            list.addView(info("Belum ada laporan shift pada tanggal ini."), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18) })
        } else {
            list.addView(info("${shown.size} outlet mengirim laporan pada tanggal ini."), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })
            shown.forEach { list.addView(card(it), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) }) }
        }
    }

    private fun chooseDate() {
        val cal = Calendar.getInstance()
        runCatching { cal.time = formatter.parse(selectedDate) ?: cal.time }
        DatePickerDialog(this, { _, year, month, day ->
            selectedDate = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
            renderSelectedDay()
        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun card(item: RiwayatLaporanItem): MaterialCardView {
        val card = MaterialCardView(this).apply { radius = dp(20).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54); isClickable = true }
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(16), dp(18), dp(16)) }
        val titleRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        titleRow.addView(title(item.nama_cabang, 19f), LinearLayout.LayoutParams(0, -2, 1f))
        titleRow.addView(info(item.tanggal_operasional))
        box.addView(titleRow)
        box.addView(info(item.nama_karyawan))
        val summary = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; setPadding(0, dp(14), 0, 0) }
        summary.addView(metric("ROTI TERJUAL", item.roti_terjual.toString(), Color.rgb(100, 210, 133)), LinearLayout.LayoutParams(0, -2, 1f))
        summary.addView(metric("SISA ROTI", item.roti_sisa.toString(), Color.rgb(247, 198, 74)), LinearLayout.LayoutParams(0, -2, 1f))
        summary.addView(metric("SETOR", money.format(item.setor_uang), Color.rgb(115, 177, 255)), LinearLayout.LayoutParams(0, -2, 1f))
        box.addView(summary)
        val detail = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; visibility = View.GONE; setPadding(0, dp(14), 0, 0) }
        detail.addView(divider(), LinearLayout.LayoutParams(-1, dp(1)))
        detail.addView(info("Sisa kemarin ${item.roti_sisa_kemarin}  •  Roti diantar ${item.roti_diantar}  •  Roti awal ${item.roti_awal}"))
        detail.addView(info("Roti sisa ${item.roti_sisa}  •  Rusak/bonus ${item.roti_rusak_bonus}"))
        detail.addView(info("Kasir ${item.penjualan_offline_roti} roti  •  Luar kasir ${item.penjualan_luar_kasir_roti} roti"))
        detail.addView(info("Pengeluaran ${money.format(item.pengeluaran)}  •  Setor ${money.format(item.setor_uang)}"))
        if (item.catatan.isNotBlank()) detail.addView(info("Catatan: ${item.catatan}"))
        box.addView(detail)
        card.setOnClickListener { detail.visibility = if (detail.visibility == View.VISIBLE) View.GONE else View.VISIBLE }
        card.addView(box)
        return card
    }

    private fun header() = MaterialCardView(this).apply { radius = dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27, 55, 39)); strokeWidth = dp(1); strokeColor = getColor(R.color.primary_green); addView(LinearLayout(this@RiwayatLaporanActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(18), dp(18), dp(18)); addView(title("Riwayat Laporan Shift", 25f)); addView(info("Menampilkan laporan per tanggal. Ketuk kartu untuk melihat rincian outlet.")) }) }
    private fun metric(label: String, value: String, color: Int) = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; addView(TextView(this@RiwayatLaporanActivity).apply { text = label; textSize = 10f; setTextColor(getColor(R.color.text_secondary)) }); addView(TextView(this@RiwayatLaporanActivity).apply { text = value; textSize = 16f; setTypeface(null, 1); setTextColor(color) }) }
    private fun divider() = View(this).apply { setBackgroundColor(Color.rgb(49, 63, 54)) }
    private fun title(value: String, size: Float) = TextView(this).apply { text = value; textSize = size; setTypeface(null, 1); setTextColor(Color.WHITE) }
    private fun info(value: String) = TextView(this).apply { text = value; textSize = 13f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(4), 0, 0) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
