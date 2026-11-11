package com.example.rotibakarborneo.ui.admin

import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.BonItem
import com.example.rotibakarborneo.data.model.VerifikasiBonRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class BonAdminActivity : AppCompatActivity() {
    private lateinit var list: LinearLayout; private val session by lazy{SessionManager(this)}; private val money=NumberFormat.getCurrencyInstance(Locale("id","ID"))
    override fun onCreate(state:Bundle?){super.onCreate(state);val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(28))};setContentView(ScrollView(this).apply{addView(root)});root.addView(header("Persetujuan Bon","Pilih kartu bon untuk menyetujui, menolak, atau mencatat pembayaran."));list=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL};root.addView(list);load()}
    private fun load()=lifecycleScope.launch{list.removeAllViews();try{val items=RetrofitClient.instance.getBonAdmin(apiKey=BuildConfig.API_KEY).data.filterNot{it.status.equals("LUNAS",true)};if(items.isEmpty())list.addView(info("Tidak ada bon aktif. Bon yang telah lunas disembunyikan.")) else items.forEach{list.addView(bonCard(it),LinearLayout.LayoutParams(-1,-2).apply{topMargin=dp(12)})}}catch(_:Exception){list.addView(info("Gagal memuat data bon."))}}
    private fun header(title:String,sub:String)=MaterialCardView(this).apply{radius=dp(22).toFloat();setCardBackgroundColor(Color.rgb(27,55,39));strokeWidth=dp(1);strokeColor=getColor(R.color.primary_green);addView(LinearLayout(this@BonAdminActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(18),dp(17),dp(18),dp(17));addView(TextView(this@BonAdminActivity).apply{text=title;textSize=25f;setTypeface(null,1);setTextColor(Color.WHITE)});addView(TextView(this@BonAdminActivity).apply{text=sub;textSize=13f;setTextColor(getColor(R.color.text_secondary))})})}
    private fun bonCard(item:BonItem)=MaterialCardView(this).apply{radius=dp(20).toFloat();setCardBackgroundColor(getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=Color.rgb(50,62,54);isClickable=true;setOnClickListener{form(item)};addView(LinearLayout(this@BonAdminActivity).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(17),dp(15),dp(17),dp(15));addView(TextView(this@BonAdminActivity).apply{text=money.format(item.nominal);textSize=20f;setTypeface(null,1);setTextColor(Color.WHITE)});addView(TextView(this@BonAdminActivity).apply{text="${item.nama_karyawan.ifBlank{item.id_karyawan}} • ${item.nama_cabang.ifBlank{item.id_cabang}}";textSize=14f;setTypeface(null,1);setTextColor(Color.WHITE)});addView(TextView(this@BonAdminActivity).apply{text=item.status;textSize=12f;setTypeface(null,1);setTextColor(getColor(R.color.primary_green))});addView(TextView(this@BonAdminActivity).apply{text=item.catatan;textSize=14f;setTextColor(getColor(R.color.text_secondary))});addView(TextView(this@BonAdminActivity).apply{text="Sisa bon: ${money.format(item.sisa_bon)}";textSize=13f;setTextColor(Color.WHITE)})})}
    private fun info(value:String)=TextView(this).apply{text=value;textSize=15f;setTextColor(getColor(R.color.text_secondary));setPadding(0,dp(18),0,0)}
    private fun form(item:BonItem){val choices=arrayOf("DISETUJUI","DITOLAK","LUNAS_SEBAGIAN","LUNAS");AlertDialog.Builder(this).setTitle("Pilih status bon").setItems(choices){_,i->detail(item,choices[i])}.setNegativeButton("Batal",null).show()}
    private fun detail(item:BonItem,status:String){val paid=EditText(this).apply{hint="Nominal sudah dibayar/dipotong";inputType=InputType.TYPE_CLASS_NUMBER};val note=EditText(this).apply{hint="Catatan admin (opsional)"};val box=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(42),0,dp(42),0);addView(paid);addView(note)};AlertDialog.Builder(this).setTitle(status).setView(box).setPositiveButton("Simpan"){_,_->save(item,status,paid.text.toString().toDoubleOrNull()?:0.0,note.text.toString())}.setNegativeButton("Batal",null).show()}
    private fun save(item:BonItem,status:String,paid:Double,note:String)=lifecycleScope.launch{try{val r=RetrofitClient.instance.verifikasiBon(VerifikasiBonRequest(api_key=BuildConfig.API_KEY,id_admin=session.getIdKaryawan().orEmpty(),id_cabang_admin=session.getIdCabang().orEmpty(),bon_id=item.bon_id,status=status,dibayar=paid,catatan_admin=note));Toast.makeText(this@BonAdminActivity,r.message,Toast.LENGTH_LONG).show();if(r.success)load()}catch(_:Exception){Toast.makeText(this@BonAdminActivity,"Gagal memperbarui bon",Toast.LENGTH_SHORT).show()}}
    private fun dp(v:Int)=(v*resources.displayMetrics.density).toInt()
}
