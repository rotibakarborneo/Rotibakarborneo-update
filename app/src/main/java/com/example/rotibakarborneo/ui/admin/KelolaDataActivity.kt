package com.example.rotibakarborneo.ui.admin

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.rotibakarborneo.R
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

/** Halaman khusus tombol + Dashboard: hanya penambahan master outlet dan karyawan. */
class KelolaDataActivity : AppCompatActivity() {
    override fun onCreate(state: Bundle?) { super.onCreate(state)
        val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(28))}
        setContentView(ScrollView(this).apply{addView(root)})
        root.addView(header())
        root.addView(action("Tambah Outlet / Cabang", "Pilih lokasi di peta, isi radius, ID dibuat otomatis.") { startActivity(Intent(this,OutletFormActivity::class.java)) },LinearLayout.LayoutParams(-1,dp(96)).apply{topMargin=dp(14)})
        root.addView(action("Tambah Karyawan", "Pilih nama outlet, tarif awal Rp6.820, role KARYAWAN.") { startActivity(Intent(this,KaryawanFormActivity::class.java)) },LinearLayout.LayoutParams(-1,dp(96)).apply{topMargin=dp(12)})
    }
    private fun header()=MaterialCardView(this).apply{radius=dp(22).toFloat();setCardBackgroundColor(Color.rgb(27,55,39));strokeWidth=dp(1);strokeColor=getColor(R.color.primary_green);addView(LinearLayout(this@KelolaDataActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(18),dp(18),dp(18));addView(TextView(this@KelolaDataActivity).apply{text="Tambah Data";textSize=25f;setTextColor(Color.WHITE);setTypeface(null,1)});addView(TextView(this@KelolaDataActivity).apply{text="Pilih data baru yang ingin ditambahkan.";textSize=13f;setTextColor(getColor(R.color.text_secondary))})})}
    private fun action(title:String,sub:String,click:()->Unit)=MaterialCardView(this).apply{radius=dp(20).toFloat();setCardBackgroundColor(getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=Color.rgb(49,63,54);isClickable=true;setOnClickListener{click()};addView(LinearLayout(this@KelolaDataActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(16),dp(18),dp(16));addView(TextView(this@KelolaDataActivity).apply{text=title;textSize=18f;setTextColor(Color.WHITE);setTypeface(null,1)});addView(TextView(this@KelolaDataActivity).apply{text=sub;textSize=13f;setTextColor(getColor(R.color.text_secondary))})})}
    private fun dp(v:Int)=(v*resources.displayMetrics.density).toInt()
}
