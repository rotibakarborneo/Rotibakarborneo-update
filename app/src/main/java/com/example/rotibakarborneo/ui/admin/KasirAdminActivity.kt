package com.example.rotibakarborneo.ui.admin

import android.graphics.Color
import android.os.Bundle
import android.app.DatePickerDialog
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.TransaksiKasirAdmin
import com.google.android.material.card.MaterialCardView
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.TimeZone

class KasirAdminActivity : AppCompatActivity() {
    private lateinit var outletList: LinearLayout
    private val money = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    private val calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Jakarta"))
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).apply { timeZone = TimeZone.getTimeZone("Asia/Jakarta") }
    private lateinit var dateButton: MaterialButton
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        if (calendar.get(Calendar.HOUR_OF_DAY) < 5) calendar.add(Calendar.DAY_OF_YEAR, -1)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(24), dp(20), dp(28)) }
        setContentView(ScrollView(this).apply { addView(root) })
        root.addView(header())
        dateButton = MaterialButton(this).apply { setOnClickListener { pilihTanggal() } }
        updateDate()
        root.addView(dateButton, LinearLayout.LayoutParams(-1, dp(48)).apply { topMargin = dp(10) })
        outletList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(outletList)
        load()
    }
    private fun load() = lifecycleScope.launch {
        outletList.removeAllViews()
        try {
            val items = RetrofitClient.instance.getTransaksiKasirAdmin(apiKey = BuildConfig.API_KEY, tanggal = dateFormat.format(calendar.time)).data
            if (items.isEmpty()) outletList.addView(subtitle("Belum ada transaksi kasir tersinkron."))
            else items.groupBy { it.nama_cabang }.toSortedMap().forEach { (cabang, transaksi) -> outletList.addView(outletCard(cabang, transaksi), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) }) }
        } catch (_: Exception) { outletList.addView(subtitle("Gagal memuat transaksi kasir.")) }
    }
    private fun pilihTanggal() {
        DatePickerDialog(this, { _, y, m, d -> calendar.set(y, m, d); updateDate(); load() }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show()
    }
    private fun updateDate() { dateButton.text = "Tanggal transaksi: ${dateFormat.format(calendar.time)}" }
    private fun outletCard(cabang: String, items: List<TransaksiKasirAdmin>): MaterialCardView {
        val cash = items.filter { it.metode_bayar.equals("CASH", true) }.sumOf { it.total_bayar }
        val qris = items.filter { it.metode_bayar.equals("QRIS", true) }.sumOf { it.total_bayar }
        val card = MaterialCardView(this).apply { radius = dp(22).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54) }
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(17), dp(18), dp(17)) }
        box.addView(title(cabang, 19f))
        box.addView(subtitle("${items.size} transaksi • Total ${money.format(cash + qris)}"))
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; setPadding(0, dp(14), 0, 0) }
        row.addView(paymentBox("💵", "Cash", cash, Color.rgb(65, 158, 99)), LinearLayout.LayoutParams(0, dp(88), 1f).apply { marginEnd = dp(6) })
        row.addView(paymentBox("▣", "QRIS", qris, Color.rgb(66, 126, 198)), LinearLayout.LayoutParams(0, dp(88), 1f).apply { marginStart = dp(6) })
        box.addView(row)
        val details = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; visibility = View.GONE; setPadding(0, dp(12), 0, 0) }
        items.sortedByDescending { it.dibuat_pada }.forEach { transaksi ->
            details.addView(subtitle("${transaksi.metode_bayar} • ${money.format(transaksi.total_bayar)} • ${transaksi.total_roti} roti\n" + transaksi.items.joinToString("; ") { "${it.qty}× ${it.nama}" }), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })
        }
        box.addView(details)
        card.isClickable = true
        card.setOnClickListener { details.visibility = if (details.visibility == View.VISIBLE) View.GONE else View.VISIBLE }
        card.addView(box); return card
    }
    private fun header() = MaterialCardView(this).apply { radius=dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27,55,39)); strokeWidth=dp(1); strokeColor=getColor(R.color.primary_green); addView(LinearLayout(this@KasirAdminActivity).apply { orientation=LinearLayout.VERTICAL; setPadding(dp(18),dp(17),dp(18),dp(17)); addView(title("Kasir per Outlet",25f)); addView(subtitle("Pilih tanggal untuk melihat Cash dan QRIS per cabang.")) }) }
    private fun paymentBox(icon:String, label:String, total:Double, color:Int): MaterialCardView {
        val card = MaterialCardView(this).apply { radius = dp(16).toFloat(); setCardBackgroundColor(Color.rgb(23, 30, 26)); strokeWidth = dp(1); strokeColor = color }
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(14), dp(10), dp(14), dp(10)) }
        box.addView(TextView(this).apply { text = "$icon  $label"; textSize = 13f; setTextColor(color) })
        box.addView(TextView(this).apply { text = money.format(total); textSize = 16f; setTypeface(null, 1); setTextColor(Color.WHITE) })
        card.addView(box); return card
    }
    private fun title(value:String, size:Float) = TextView(this).apply { text=value; textSize=size; setTypeface(null,1); setTextColor(Color.WHITE) }
    private fun subtitle(value:String) = TextView(this).apply { text=value; textSize=13f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(4), 0, 0) }
    private fun dp(value:Int) = (value * resources.displayMetrics.density).toInt()
}
