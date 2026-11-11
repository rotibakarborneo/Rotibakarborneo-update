package com.example.rotibakarborneo.ui.admin

import android.app.DatePickerDialog
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.CabangMaster
import com.example.rotibakarborneo.data.model.KeuanganData
import com.example.rotibakarborneo.data.model.KeuanganItem
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class KeuanganActivity : AppCompatActivity() {
    private lateinit var content: LinearLayout
    private lateinit var dateButton: MaterialButton
    private lateinit var outletSpinner: Spinner
    private val money = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private var branches: List<CabangMaster> = emptyList()
    private var outletId = ""
    private var selectedDate = ""
    private var applyingOutlet = false

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        val page = FrameLayout(this)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(24), dp(20), dp(94)) }
        page.addView(ScrollView(this).apply { addView(root) })
        root.addView(header())
        root.addView(filters(), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })
        content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(content)
        page.addView(FloatingActionButton(this).apply {
            contentDescription = "Tambah catatan keuangan"
            setImageResource(android.R.drawable.ic_input_add)
            backgroundTintList = android.content.res.ColorStateList.valueOf(getColor(R.color.primary_green))
            setOnClickListener { startActivity(Intent(this@KeuanganActivity, TambahKeuanganActivity::class.java)) }
        }, FrameLayout.LayoutParams(dp(58), dp(58), Gravity.END or Gravity.BOTTOM).apply { setMargins(0, 0, dp(24), dp(24)) })
        setContentView(page)
        setup()
    }

    override fun onResume() { super.onResume(); if (::content.isInitialized && selectedDate.isNotBlank()) loadDay() }

    private fun filters(): MaterialCardView {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(12), dp(8), dp(12), dp(8)) }
        dateButton = MaterialButton(this).apply { setIconResource(android.R.drawable.ic_menu_my_calendar); setOnClickListener { chooseDate() } }
        outletSpinner = Spinner(this)
        box.addView(dateButton, LinearLayout.LayoutParams(-1, dp(48)))
        box.addView(outletSpinner, LinearLayout.LayoutParams(-1, dp(48)))
        return surface(box)
    }

    private fun setup() = lifecycleScope.launch {
        branches = try { RetrofitClient.instance.getMasterCabang(apiKey = BuildConfig.API_KEY).data } catch (_: Exception) { emptyList() }
        applyingOutlet = true
        outletSpinner.adapter = ArrayAdapter(this@KeuanganActivity, android.R.layout.simple_spinner_dropdown_item, listOf("Semua Outlet") + branches.map { it.nama_cabang })
        outletSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (applyingOutlet) return
                outletId = if (position == 0) "" else branches[position - 1].id_cabang
                if (selectedDate.isNotBlank()) loadDay()
            }
        }
        applyingOutlet = false
        try {
            val all = RetrofitClient.instance.getKeuangan(apiKey = BuildConfig.API_KEY, mulai = "", selesai = "", idCabang = "").data
            selectedDate = all.transaksi.maxOfOrNull { it.tanggal_operasional }.orEmpty()
        } catch (_: Exception) { }
        if (selectedDate.isBlank()) selectedDate = currentDate()
        loadDay()
    }

    private fun loadDay() = lifecycleScope.launch {
        dateButton.text = "Tanggal: $selectedDate"
        content.removeAllViews()
        content.addView(info("Memuat ringkasan keuangan…"), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        try {
            render(RetrofitClient.instance.getKeuangan(apiKey = BuildConfig.API_KEY, mulai = selectedDate, selesai = selectedDate, idCabang = outletId).data)
        } catch (_: Exception) {
            content.removeAllViews(); content.addView(info("Gagal memuat keuangan. Periksa koneksi lalu coba lagi."), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(16) })
        }
    }

    private fun render(data: KeuanganData) {
        content.removeAllViews()
        val saldo = data.total_pemasukan - data.total_pengeluaran
        content.addView(balanceCard(saldo), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        row.addView(summaryCard("PEMASUKAN", money.format(data.total_pemasukan), Color.rgb(93, 207, 127)), LinearLayout.LayoutParams(0, -2, 1f).apply { rightMargin = dp(5) })
        row.addView(summaryCard("PENGELUARAN", money.format(data.total_pengeluaran), Color.rgb(255, 143, 124)), LinearLayout.LayoutParams(0, -2, 1f).apply { leftMargin = dp(5) })
        content.addView(row, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) })
        val grouped = data.transaksi.groupBy { "${it.jenis}|${it.kategori}" }
        if (grouped.isNotEmpty()) {
            content.addView(section("Ringkasan kategori"), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(20) })
            grouped.entries.sortedBy { it.key }.forEach { entry ->
                val first = entry.value.first()
                content.addView(categoryRow(first.jenis, first.kategori, entry.value.sumOf { it.nominal }), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(7) })
            }
            content.addView(section("Aktivitas hari ini"), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(20) })
            data.transaksi.forEach { content.addView(transactionCard(it), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) }) }
        } else {
            content.addView(emptyCard(), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18) })
        }
    }

    private fun chooseDate() {
        val calendar = Calendar.getInstance()
        runCatching { calendar.time = dateFormat.parse(selectedDate) ?: calendar.time }
        DatePickerDialog(this, { _, year, month, day ->
            selectedDate = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
            loadDay()
        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun balanceCard(saldo: Double) = MaterialCardView(this).apply {
        radius = dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27, 55, 39)); strokeWidth = dp(1); strokeColor = getColor(R.color.primary_green)
        addView(LinearLayout(this@KeuanganActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(17), dp(18), dp(17))
            addView(label("SALDO BERSIH")); addView(TextView(this@KeuanganActivity).apply { text = money.format(saldo); textSize = 30f; setTypeface(null, 1); setTextColor(Color.WHITE) })
            addView(info("Pemasukan otomatis dari setor outlet dan QRIS, dikurangi pengeluaran."))
        })
    }

    private fun summaryCard(label: String, value: String, color: Int) = MaterialCardView(this).apply { radius = dp(18).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54); addView(LinearLayout(this@KeuanganActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(14), dp(13), dp(14), dp(13)); addView(this@KeuanganActivity.label(label)); addView(TextView(this@KeuanganActivity).apply { text = value; textSize = 16f; setTypeface(null, 1); setTextColor(color) }) }) }
    private fun categoryRow(jenis: String, kategori: String, nominal: Double) = surface(LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL; setPadding(dp(14), dp(12), dp(14), dp(12)); addView(TextView(this@KeuanganActivity).apply { text = kategori.replace('_', ' '); textSize = 14f; setTextColor(Color.WHITE); setTypeface(null, 1) }, LinearLayout.LayoutParams(0, -2, 1f)); addView(TextView(this@KeuanganActivity).apply { text = money.format(nominal); textSize = 14f; setTypeface(null, 1); setTextColor(if (jenis == "PEMASUKAN") Color.rgb(93, 207, 127) else Color.rgb(255, 143, 124)) }) })
    private fun transactionCard(item: KeuanganItem) = surface(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(15), dp(13), dp(15), dp(13)); addView(TextView(this@KeuanganActivity).apply { text = "${item.kategori.replace('_', ' ')} • ${item.nama_cabang}"; textSize = 14f; setTypeface(null, 1); setTextColor(Color.WHITE) }); addView(TextView(this@KeuanganActivity).apply { text = money.format(item.nominal); textSize = 18f; setTypeface(null, 1); setTextColor(if (item.jenis == "PEMASUKAN") Color.rgb(93, 207, 127) else Color.rgb(255, 143, 124)) }); addView(info(if (item.otomatis) item.catatan else item.catatan.ifBlank { "Catatan manual" })) })
    private fun emptyCard() = surface(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(18), dp(18), dp(18)); addView(TextView(this@KeuanganActivity).apply { text = "Belum ada aktivitas"; textSize = 18f; setTypeface(null, 1); setTextColor(Color.WHITE) }); addView(info("Tekan tombol + untuk mencatat pemasukan marketplace atau pengeluaran.")) })
    private fun header() = MaterialCardView(this).apply { radius = dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27, 55, 39)); strokeWidth = dp(1); strokeColor = getColor(R.color.primary_green); addView(LinearLayout(this@KeuanganActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(18), dp(18), dp(18)); addView(TextView(this@KeuanganActivity).apply { text = "Keuangan Boss"; textSize = 25f; setTypeface(null, 1); setTextColor(Color.WHITE) }); addView(info("Pantau saldo per hari dan per outlet. Setor dan QRIS masuk otomatis.")) }) }
    private fun section(value: String) = TextView(this).apply { text = value; textSize = 18f; setTypeface(null, 1); setTextColor(Color.WHITE) }
    private fun label(value: String) = TextView(this).apply { text = value; textSize = 10f; setTypeface(null, 1); setTextColor(getColor(R.color.text_secondary)) }
    private fun info(value: String) = TextView(this).apply { text = value; textSize = 13f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(4), 0, 0) }
    private fun surface(view: View) = MaterialCardView(this).apply { radius = dp(18).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54); addView(view) }
    private fun currentDate(): String { val c = Calendar.getInstance(); if (c.get(Calendar.HOUR_OF_DAY) < 5) c.add(Calendar.DAY_OF_YEAR, -1); return dateFormat.format(c.time) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
