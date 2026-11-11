package com.example.rotibakarborneo.ui.admin

import android.graphics.Color
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.BonusItem
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class BonusActivity : AppCompatActivity() {
    private lateinit var list: LinearLayout
    override fun onCreate(state: Bundle?) { super.onCreate(state)
        val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(28))}
        setContentView(ScrollView(this).apply{addView(root)})
        root.addView(header())
        list=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL};root.addView(list);load()
    }
    private fun load()=lifecycleScope.launch { list.removeAllViews(); try { val data=RetrofitClient.instance.getBonus(apiKey=BuildConfig.API_KEY,mulai="",selesai="").data; if(data.isEmpty()) list.addView(info("Belum ada laporan shift pada 30 hari terakhir.")) else data.forEach{list.addView(card(it),LinearLayout.LayoutParams(-1,-2).apply{topMargin=dp(12)})} } catch(_:Exception){list.addView(info("Gagal memuat bonus."))} }
    private fun card(item:BonusItem)=MaterialCardView(this).apply{radius=dp(20).toFloat();setCardBackgroundColor(getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=Color.rgb(49,63,54);addView(LinearLayout(this@BonusActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(16),dp(18),dp(16));addView(title(item.nama_karyawan,19f));addView(info("${item.total_hari} shift • ${item.total_jam} jam"));addView(title("${item.roti_terjual} roti",24f));addView(info("Target ${item.target_roti} roti • Kelebihan ${item.kelebihan_roti} roti"))})}
    private fun header()=MaterialCardView(this).apply{radius=dp(22).toFloat();setCardBackgroundColor(Color.rgb(27,55,39));strokeWidth=dp(1);strokeColor=getColor(R.color.primary_green);addView(LinearLayout(this@BonusActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(18),dp(18),dp(18));addView(title("Capaian Bonus",25f));addView(info("Periode 30 hari kalender terakhir. Angka shift adalah jumlah shift yang benar-benar dikerjakan dalam periode tersebut."));addView(info("Target per shift: 60 roti hingga 10 jam, 75 roti untuk 11 jam atau lebih."))})}
    private fun title(v:String,s:Float)=TextView(this).apply{text=v;textSize=s;setTextColor(Color.WHITE);setTypeface(null,1)}
    private fun info(v:String)=TextView(this).apply{text=v;textSize=13f;setTextColor(getColor(R.color.text_secondary));setPadding(0,dp(4),0,0)}
    private fun dp(v:Int)=(v*resources.displayMetrics.density).toInt()
}
