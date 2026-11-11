package com.example.rotibakarborneo.ui.admin

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.TambahCabangRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch

class OutletFormActivity : AppCompatActivity() {
    private val session by lazy { SessionManager(this) }
    private lateinit var name: EditText; private lateinit var lat: EditText; private lateinit var lng: EditText; private lateinit var radius: EditText
    override fun onCreate(state: Bundle?) { super.onCreate(state)
        val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(28))};setContentView(ScrollView(this).apply{addView(root)})
        root.addView(header("Tambah Outlet","ID cabang dibuat otomatis. Tentukan lokasi lewat peta agar presensi akurat."))
        val form=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(16),dp(18),dp(16))}
        name=field("Nama outlet");lat=field("Latitude");lng=field("Longitude");radius=field("Radius presensi (meter)").apply{setText("100");inputType=InputType.TYPE_CLASS_NUMBER}
        form.addView(name);form.addView(mapButton());form.addView(lat);form.addView(lng);form.addView(radius);root.addView(card(form),LinearLayout.LayoutParams(-1,-2).apply{topMargin=dp(14)})
        root.addView(MaterialButton(this).apply{text="Simpan outlet";setOnClickListener{save()}},LinearLayout.LayoutParams(-1,dp(56)).apply{topMargin=dp(16)})
    }
    private fun mapButton()=Button(this).apply{text="Pilih lokasi dari peta";setOnClickListener{startActivityForResult(Intent(this@OutletFormActivity,MapPickerActivity::class.java),701)}}
    private fun save()=lifecycleScope.launch{try{val r=RetrofitClient.instance.tambahCabang(TambahCabangRequest(api_key=BuildConfig.API_KEY,id_admin=session.getIdKaryawan().orEmpty(),id_cabang_admin=session.getIdCabang().orEmpty(),id_cabang="",nama_cabang=name.text.toString().trim(),latitude=lat.text.toString().toDouble(),longitude=lng.text.toString().toDouble(),radius_meter=radius.text.toString().toDoubleOrNull()?:100.0));Toast.makeText(this@OutletFormActivity,r.message,Toast.LENGTH_LONG).show();if(r.success)finish()}catch(_:Exception){Toast.makeText(this@OutletFormActivity,"Lengkapi nama outlet, lokasi, dan radius.",Toast.LENGTH_LONG).show()}}
    @Deprecated("Deprecated in Java") override fun onActivityResult(req:Int,res:Int,data:Intent?){super.onActivityResult(req,res,data);if(req==701&&res==RESULT_OK){lat.setText(data?.getDoubleExtra("latitude",0.0)?.toString());lng.setText(data?.getDoubleExtra("longitude",0.0)?.toString())}}
    private fun header(a:String,b:String)=card(LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(18),dp(18),dp(18));addView(TextView(this@OutletFormActivity).apply{text=a;textSize=25f;setTextColor(getColor(R.color.white));setTypeface(null,1)});addView(TextView(this@OutletFormActivity).apply{text=b;textSize=13f;setTextColor(getColor(R.color.text_secondary))})},true)
    private fun field(h:String)=EditText(this).apply{hint=h;setHintTextColor(getColor(R.color.text_secondary));setTextColor(getColor(R.color.white));setPadding(0,dp(10),0,dp(10))}
    private fun card(v:android.view.View,green:Boolean=false)=MaterialCardView(this).apply{radius=dp(22).toFloat();setCardBackgroundColor(if(green)android.graphics.Color.rgb(27,55,39)else getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=if(green)getColor(R.color.primary_green)else android.graphics.Color.rgb(49,63,54);addView(v)}
    private fun dp(v:Int)=(v*resources.displayMetrics.density).toInt()
}
