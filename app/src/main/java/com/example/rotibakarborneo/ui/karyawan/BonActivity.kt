package com.example.rotibakarborneo.ui.karyawan

import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.BonItem
import com.example.rotibakarborneo.data.model.BonRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.card.MaterialCardView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class BonActivity : AppCompatActivity() {
    private lateinit var list: LinearLayout
    private val session by lazy { SessionManager(this) }
    private val money = NumberFormat.getCurrencyInstance(Locale("id", "ID"))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val page = FrameLayout(this)
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(24), dp(20), dp(96))
            addView(header())
            list = LinearLayout(this@BonActivity).apply { orientation = LinearLayout.VERTICAL }
            addView(list)
        }
        page.addView(ScrollView(this).apply { addView(content) })
        page.addView(FloatingActionButton(this).apply {
            contentDescription = "Ajukan bon"
            setImageResource(android.R.drawable.ic_menu_edit)
            setColorFilter(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(getColor(R.color.primary_green))
            setOnClickListener { form() }
        }, FrameLayout.LayoutParams(dp(58), dp(58), Gravity.END or Gravity.BOTTOM).apply {
            setMargins(0, 0, dp(24), dp(24))
        })
        setContentView(page)
        muat()
    }

    private fun header() = MaterialCardView(this).apply {
        radius = dp(22).toFloat(); setCardBackgroundColor(Color.rgb(27, 55, 39)); strokeWidth = dp(1); strokeColor = getColor(R.color.primary_green)
        addView(LinearLayout(this@BonActivity).apply {
            orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(18), dp(18), dp(18))
            addView(title("Bon Saya", 25f))
            addView(subtitle("Pantau pengajuan bon dan status verifikasinya. Bon tidak otomatis memotong gaji."))
        })
    }

    private fun render(items: List<BonItem>) {
        list.removeAllViews()
        if (items.isEmpty()) {
            list.addView(subtitle("Belum ada pengajuan bon. Tekan tombol pensil untuk membuat pengajuan."), LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(20) })
            return
        }
        items.forEach { bon ->
            val statusColor = when (bon.status.uppercase()) { "DISETUJUI" -> Color.rgb(76, 175, 80); "DITOLAK" -> Color.rgb(218, 75, 69); "LUNAS", "LUNAS_SEBAGIAN" -> Color.rgb(232, 179, 49); else -> Color.rgb(125, 135, 129) }
            val card = MaterialCardView(this).apply { radius = dp(20).toFloat(); setCardBackgroundColor(getColor(R.color.dark_surface)); strokeWidth = dp(1); strokeColor = Color.rgb(49, 63, 54) }
            val box = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL; setPadding(dp(18), dp(16), dp(18), dp(16))
                val row = LinearLayout(this@BonActivity).apply { gravity = Gravity.CENTER_VERTICAL }
                row.addView(title(money.format(bon.nominal), 20f), LinearLayout.LayoutParams(0, -2, 1f))
                row.addView(TextView(this@BonActivity).apply { text = bon.status.replace('_', ' '); textSize = 11f; setTextColor(statusColor); setTypeface(null, 1) })
                addView(row)
                if (bon.catatan.isNotBlank()) addView(subtitle(bon.catatan))
                addView(TextView(this@BonActivity).apply { text = "Sisa bon  ${money.format(bon.sisa_bon)}"; textSize = 13f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(12), 0, 0) })
            }
            card.addView(box)
            list.addView(card, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        }
    }

    private fun form() {
        val nominal = EditText(this).apply { hint = "Nominal bon"; inputType = InputType.TYPE_CLASS_NUMBER }
        val note = EditText(this).apply { hint = "Catatan / alasan" }
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(28), 0, dp(28), 0); addView(nominal); addView(note) }
        AlertDialog.Builder(this).setTitle("Ajukan bon").setView(box).setPositiveButton("Kirim") { _, _ -> kirim(nominal.text.toString().toDoubleOrNull() ?: 0.0, note.text.toString()) }.setNegativeButton("Batal", null).show()
    }

    private fun kirim(nominal: Double, catatan: String) = lifecycleScope.launch {
        if (nominal <= 0) { Toast.makeText(this@BonActivity, "Nominal harus diisi", Toast.LENGTH_SHORT).show(); return@launch }
        try {
            val result = RetrofitClient.instance.ajukanBon(BonRequest(
                api_key = BuildConfig.API_KEY,
                id_karyawan = session.getIdKaryawan().orEmpty(),
                id_cabang = session.getIdCabang().orEmpty(),
                nominal = nominal,
                catatan = catatan
            ))
            Toast.makeText(this@BonActivity, result.message ?: "Bon dikirim", Toast.LENGTH_LONG).show()
            if (result.success) muat()
        } catch (_: Exception) { Toast.makeText(this@BonActivity, "Gagal mengirim bon", Toast.LENGTH_SHORT).show() }
    }

    private fun muat() = lifecycleScope.launch {
        try { render(RetrofitClient.instance.getBonSaya(
            apiKey = BuildConfig.API_KEY,
            idKaryawan = session.getIdKaryawan().orEmpty(),
            idCabang = session.getIdCabang().orEmpty()
        ).data) }
        catch (_: Exception) { list.removeAllViews(); list.addView(subtitle("Riwayat bon belum dapat dimuat.")) }
    }

    private fun title(value: String, size: Float) = TextView(this).apply { text = value; textSize = size; setTypeface(null, 1); setTextColor(Color.WHITE) }
    private fun subtitle(value: String) = TextView(this).apply { text = value; textSize = 13f; setTextColor(getColor(R.color.text_secondary)); setPadding(0, dp(4), 0, 0) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
