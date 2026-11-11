package com.example.rotibakarborneo.ui.admin

import android.graphics.Color
import android.os.Bundle
import android.text.InputType
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
import com.example.rotibakarborneo.data.model.TambahKaryawanRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch

class KaryawanFormActivity : AppCompatActivity() {
    private val session by lazy { SessionManager(this) }; private var branches:List<CabangMaster> = emptyList()
    private lateinit var name:EditText;private lateinit var username:EditText;private lateinit var password:EditText;private lateinit var rate:EditText;private lateinit var outlet:Spinner
    override fun onCreate(state:Bundle?){super.onCreate(state);build()}
    private fun build(){val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(28))};setContentView(ScrollView(this).apply{addView(root)});root.addView(header());lifecycleScope.launch{branches=try{RetrofitClient.instance.getMasterCabang(apiKey=BuildConfig.API_KEY).data}catch(_:Exception){emptyList()};if(branches.isEmpty()){root.addView(info("Belum ada outlet aktif. Tambahkan outlet terlebih dahulu."));return@launch};val form=LinearLayout(this@KaryawanFormActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(16),dp(18),dp(16))};outlet=Spinner(this@KaryawanFormActivity).apply{adapter=ArrayAdapter(this@KaryawanFormActivity,android.R.layout.simple_spinner_dropdown_item,branches.map{it.nama_cabang})};name=field("Nama karyawan");username=field("Username");password=field("Password minimal 8 karakter").apply{inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD};rate=field("Tarif per jam").apply{setText("6820");inputType=InputType.TYPE_CLASS_NUMBER};form.addView(outlet);form.addView(name);form.addView(username);form.addView(password);form.addView(rate);root.addView(card(form),LinearLayout.LayoutParams(-1,-2).apply{topMargin=dp(14)});root.addView(MaterialButton(this@KaryawanFormActivity).apply{text="Simpan karyawan";setOnClickListener{save()}},LinearLayout.LayoutParams(-1,dp(56)).apply{topMargin=dp(16)})}}
    private fun save()=lifecycleScope.launch{try{val r=RetrofitClient.instance.tambahKaryawan(TambahKaryawanRequest(api_key=BuildConfig.API_KEY,id_admin=session.getIdKaryawan().orEmpty(),id_cabang_admin=session.getIdCabang().orEmpty(),id_karyawan="",nama=name.text.toString().trim(),username=username.text.toString().trim(),password=password.text.toString(),role="KARYAWAN",id_cabang=branches[outlet.selectedItemPosition].id_cabang,tarif_per_jam=rate.text.toString().toDoubleOrNull()?:6820.0));Toast.makeText(this@KaryawanFormActivity,r.message,Toast.LENGTH_LONG).show();if(r.success)finish()}catch(_:Exception){Toast.makeText(this@KaryawanFormActivity,"Lengkapi data. Username harus unik dan password minimal 8 karakter.",Toast.LENGTH_LONG).show()}}
    private fun header()=card(LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(18),dp(18),dp(18));addView(TextView(this@KaryawanFormActivity).apply{text="Tambah Karyawan";textSize=25f;setTypeface(null,1);setTextColor(Color.WHITE)});addView(info("ID dibuat otomatis dan role langsung KARYAWAN."))},true)
    private fun field(h:String)=EditText(this).apply{hint=h;setHintTextColor(getColor(R.color.text_secondary));setTextColor(Color.WHITE);setPadding(0,dp(10),0,dp(10))}
    private fun info(v:String)=TextView(this).apply{text=v;textSize=13f;setTextColor(getColor(R.color.text_secondary));setPadding(0,dp(4),0,0)}
    private fun card(v:android.view.View,green:Boolean=false)=MaterialCardView(this).apply{radius=dp(22).toFloat();setCardBackgroundColor(if(green)Color.rgb(27,55,39)else getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=if(green)getColor(R.color.primary_green)else Color.rgb(49,63,54);addView(v)}
    private fun dp(v:Int)=(v*resources.displayMetrics.density).toInt()
}
