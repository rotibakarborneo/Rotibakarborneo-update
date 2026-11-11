package com.example.rotibakarborneo.ui.admin

import android.app.DatePickerDialog
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.CabangMaster
import com.example.rotibakarborneo.data.model.KeuanganRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TambahKeuanganActivity : AppCompatActivity() {
    private val session by lazy { SessionManager(this) }
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private lateinit var dateButton: MaterialButton
    private lateinit var incomeCard: MaterialCardView
    private lateinit var expenseCard: MaterialCardView
    private lateinit var outletSpinner: Spinner
    private lateinit var categorySpinner: Spinner
    private lateinit var nominal: EditText
    private lateinit var note: EditText
    private var type = "PEMASUKAN"
    private var date = ""
    private var branches: List<CabangMaster> = emptyList()

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        date = currentDate()
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(24), dp(20), dp(28)) }
        setContentView(ScrollView(this).apply { addView(root) })
        root.addView(header())
        root.addView(TextView(this).apply { text = "Pilih jenis catatan"; textSize = 17f; setTypeface(null, 1); setTextColor(Color.WHITE); setPadding(0, dp(18), 0, dp(8)) })
        val typeRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        incomeCard = choiceCard("↗", "Pemasukan", "Setor, QRIS, marketplace") { chooseType("PEMASUKAN") }
        expenseCard = choiceCard("↘", "Pengeluaran", "Bahan, gaji, operasional") { chooseType("PENGELUARAN") }
        typeRow.addView(incomeCard, LinearLayout.LayoutParams(0, -2, 1f).apply { rightMargin = dp(5) })
        typeRow.addView(expenseCard, LinearLayout.LayoutParams(0, -2, 1f).apply { leftMargin = dp(5) })
        root.addView(typeRow)
        val form = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(13), dp(18), dp(16)) }
        dateButton = MaterialButton(this).apply { setIconResource(android.R.drawable.ic_menu_my_calendar); setOnClickListener { chooseDate() } }
        updateDate()
        outletSpinner = Spinner(this)
        categorySpinner = Spinner(this)
        nominal = field("Nominal (Rp)", InputType.TYPE_CLASS_NUMBER)
        note = field("Catatan (opsional)", InputType.TYPE_CLASS_TEXT)
        form.addView(label("Tanggal operasional")); form.addView(dateButton, LinearLayout.LayoutParams(-1, dp(48)))
        form.addView(label("Outlet")); form.addView(outletSpinner, LinearLayout.LayoutParams(-1, dp(48)))
        form.addView(label("Kategori")); form.addView(categorySpinner, LinearLayout.LayoutParams(-1, dp(48)))
        form.addView(nominal); form.addView(note)
        root.addView(surface(form), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        root.addView(MaterialButton(this).apply { text = "Simpan catatan keuangan"; setOnClickListener { save() } }, LinearLayout.LayoutParams(-1, dp(56)).apply { topMargin = dp(16) })
        chooseType(type)
        loadBranches()
    }

    private fun loadBranches() = lifecycleScope.launch {
        branches = try { RetrofitClient.instance.getMasterCabang(apiKey = BuildConfig.API_KEY).data } catch (_: Exception) { emptyList() }
        outletSpinner.adapter = ArrayAdapter(this@TambahKeuanganActivity, android.R.layout.simple_spinner_dropdown_item, listOf("Pusat / Semua Outlet") + branches.map { it.nama_cabang })
    }

    private fun chooseType(value: String) {
        type = value
        val active = Color.rgb(29, 82, 47); val inactive = getColor(R.color.dark_surface)
        incomeCard.setCardBackgroundColor(if (type == "PEMASUKAN") active else inactive)
        expenseCard.setCardBackgroundColor(if (type == "PENGELUARAN") Color.rgb(91, 49, 40) else inactive)
        // QRIS sudah masuk otomatis dari kasir agar tidak tercatat dua kali.
        val items = if (type == "PEMASUKAN") listOf("CASH", "SHOPEE", "GRAB", "GOJEK", "LAINNYA") else listOf("BAHAN_BAKU", "GAJI_KARYAWAN", "SEWA", "OPERASIONAL", "LAINNYA")
        if (::categorySpinner.isInitialized) categorySpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, items)
    }

    private fun chooseDate() {
        val cal = Calendar.getInstance(); runCatching { cal.time = dateFormat.parse(date) ?: cal.time }
        DatePickerDialog(this, { _, year, month, day -> date = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day); updateDate() }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun updateDate() { dateButton.text = "Tanggal: $date" }

    private fun save() = lifecycleScope.launch {
        val amount = nominal.text.toString().toDoubleOrNull() ?: 0.0
        if (amount <= 0) { Toast.makeText(this@TambahKeuanganActivity, "Nominal wajib diisi.", Toast.LENGTH_SHORT).show(); return@launch }
        val outlet = if (outletSpinner.selectedItemPosition == 0) "" else branches.getOrNull(outletSpinner.selectedItemPosition - 1)?.id_cabang.orEmpty()
        val category = categorySpinner.selectedItem?.toString().orEmpty()
        try {
            val result = RetrofitClient.instance.simpanKeuangan(KeuanganRequest(api_key = BuildConfig.API_KEY, id_admin = session.getIdKaryawan().orEmpty(), id_cabang_admin = session.getIdCabang().orEmpty(), tanggal_operasional = date, id_cabang = outlet, jenis = type, kategori = category, nominal = amount, catatan = note.text.toString().trim()))
            Toast.makeText(this@TambahKeuanganActivity, result.message, Toast.LENGTH_LONG).show()
            if (result.success) finish()
        } catch (_: Exception) { Toast.makeText(this@TambahKeuanganActivity, "Gagal menyimpan catatan keuangan.", Toast.LENGTH_SHORT).show() }
    }

    private fun choiceCard(icon: String, title: String, subtitle: String, action: () -> Unit) = MaterialCardView(this).apply { radius = dp(19).toFloat(); strokeWidth = dp(1); strokeColor = Color.rgb(62, 80, 67); isClickable = true; setOnClickListener { action() }; addView(LinearLayout(this@TambahKeuanganActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(14), dp(14), dp(14), dp(14)); addView(TextView(this@TambahKeuanganActivity).apply { text = icon; textSize = 22f; setTextColor(Color.WHITE) }); addView(TextView(this@TambahKeuanganActivity).apply { text = title; textSize = 16f; setTypeface(null, 1); setTextColor(Color.WHITE) }); addView(TextView(this@TambahKeuanganActivity).apply { text = subtitle; textSize = 11f; setTextColor(getColor(R.color.text_secondary)) }) }) }
    private fun header() = MaterialCardView(this).apply { radius = dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27, 55, 39)); strokeWidth = dp(1); strokeColor = getColor(R.color.primary_green); addView(LinearLayout(this@TambahKeuanganActivity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(18), dp(18), dp(18)); addView(TextView(this@TambahKeuanganActivity).apply { text = "Catat Keuangan"; textSize = 25f; setTypeface(null, 1); setTextColor(Color.WHITE) }); addView(TextView(this@TambahKeuanganActivity).apply { text = "Pilih jenis, outlet, kategori, lalu simpan."; textSize = 13f; setTextColor(getColor(R.color.text_secondary)) }) }) }
    private fun surface(view: View) = MaterialCardView(this).apply { radius = dp(20).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54); addView(view) }
    private fun field(hint: String, input: Int) = EditText(this).apply { this.hint = hint; inputType = input; setTextColor(Color.WHITE); setHintTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(10), 0, dp(10)) }
    private fun label(value: String) = TextView(this).apply { text = value; textSize = 12f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(9), 0, 0) }
    private fun currentDate(): String { val cal = Calendar.getInstance(); if (cal.get(Calendar.HOUR_OF_DAY) < 5) cal.add(Calendar.DAY_OF_YEAR, -1); return dateFormat.format(cal.time) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
