package com.example.rotibakarborneo.ui.karyawan

import android.graphics.Color
import android.content.res.ColorStateList
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.KasirItem
import com.example.rotibakarborneo.data.model.TransaksiKasirRequest
import com.example.rotibakarborneo.util.SessionManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale
import java.util.UUID

class KasirActivity : AppCompatActivity() {
    private val cart=mutableListOf<KasirItem>(); private lateinit var grid:GridLayout; private lateinit var cartView:TextView
    private var porsi="UTUH"; private val money=NumberFormat.getCurrencyInstance(Locale("id","ID")); private val gson=Gson()
    private val session by lazy{SessionManager(this)}; private val prefs by lazy{getSharedPreferences("kasir_lokal",MODE_PRIVATE)}
    override fun onCreate(state:Bundle?){super.onCreate(state);ui();sync()}
    private fun ui(){val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(24),dp(20),dp(32))};setContentView(ScrollView(this).apply{addView(root)});root.addView(label("Kasir",30f,true));root.addView(label("Pilih porsi lalu rasa. Harga menu tersimpan di aplikasi.",14f));root.addView(label("Pilih porsi",16f,true).apply{setPadding(0,dp(20),0,dp(8))});val pg=GridLayout(this).apply{columnCount=2};pg.addView(card("🍞","Porsi Utuh","1 roti",true,action={porsi="UTUH";render()}),gp(116));pg.addView(card("½","Porsi Separuh","0,5 roti",false,action={porsi="SEPARUH";render()}),gp(116));root.addView(pg);root.addView(label("Varian rasa",16f,true).apply{setPadding(0,dp(22),0,dp(8))});grid=GridLayout(this).apply{columnCount=2};root.addView(grid);root.addView(card("＋","Menu custom","Input pesanan khusus",false,action={custom()},wide=true),LinearLayout.LayoutParams(-1,dp(78)).apply{topMargin=dp(12)});val cc=MaterialCardView(this).apply{radius=dp(24).toFloat();setCardBackgroundColor(getColor(R.color.dark_surface));strokeWidth=dp(1);strokeColor=Color.DKGRAY;isClickable=true;setOnClickListener{editCart()}};cartView=label("",15f).apply{setPadding(dp(20),dp(18),dp(20),dp(18))};cc.addView(cartView);root.addView(cc,LinearLayout.LayoutParams(-1,-2).apply{topMargin=dp(18)});root.addView(MaterialButton(this).apply{text="Checkout pesanan";textSize=16f;setTextColor(Color.rgb(30,24,10));backgroundTintList=ColorStateList.valueOf(Color.rgb(245,194,65));setOnClickListener{checkout()}},LinearLayout.LayoutParams(-1,dp(58)).apply{topMargin=dp(14)});render();cartText()}
    private fun label(text:String,size:Float,bold:Boolean=false)=TextView(this).apply{this.text=text;textSize=size;setTextColor(if(bold)Color.WHITE else getColor(R.color.text_secondary));if(bold)setTypeface(null,1)}
    private fun dp(value:Int)= (value * resources.displayMetrics.density).toInt()
    private fun gp(height:Int=142)=GridLayout.LayoutParams().apply{width=0;this.height=dp(height);columnSpec=GridLayout.spec(GridLayout.UNDEFINED,1f);setMargins(dp(5),dp(5),dp(5),dp(5))}
    private fun card(icon:String,title:String,sub:String,active:Boolean,action:()->Unit,wide:Boolean=false):MaterialCardView{val c=MaterialCardView(this).apply{radius=dp(20).toFloat();setCardBackgroundColor(if(wide)Color.rgb(151,48,39)else if(active)Color.rgb(22,55,34)else Color.rgb(28,34,30));strokeWidth=dp(if(active)2 else 1);strokeColor=if(active)getColor(R.color.primary_green)else if(wide)Color.rgb(221,96,67)else Color.rgb(51,60,54);isClickable=true;setOnClickListener{action()}};val column=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER;setPadding(dp(8),dp(7),dp(8),dp(7))};column.addView(TextView(this).apply{text=icon;textSize=if(wide)20f else 25f;gravity=Gravity.CENTER},LinearLayout.LayoutParams(-1,dp(30)));column.addView(TextView(this).apply{text=title;textSize=15f;setTypeface(null,1);setTextColor(Color.WHITE);gravity=Gravity.CENTER;maxLines=2},LinearLayout.LayoutParams(-1,dp(40)));column.addView(TextView(this).apply{text=sub;textSize=13f;setTypeface(null,1);setTextColor(if(wide)Color.WHITE else Color.rgb(245,194,65));gravity=Gravity.CENTER;maxLines=1},LinearLayout.LayoutParams(-1,dp(22)));c.addView(column);return c}
    private fun render(){grid.removeAllViews();val data=if(porsi=="UTUH")full else half;data.forEach{(n,h)->grid.addView(card("🍞",n,money.format(h),false,action={masak(n,h)}),gp())}}
    private fun icon(n:String):String{val s=n.lowercase();return when{"coklat" in s||"choco" in s->"🍫";"keju" in s->"🧀";"kacang" in s->"🥜";"stro" in s||"blue" in s||"melon" in s||"nanas" in s||"buah" in s->"🍓";"green" in s->"🍵";"taro" in s->"🟣";else->"🍞"}}
    private fun masak(n:String,h:Double){AlertDialog.Builder(this).setTitle(n).setMessage("Cara masak").setPositiveButton("Bakar"){_,_->jumlah(n,h,"BAKAR")}.setNegativeButton("Kukus"){_,_->jumlah(n,h,"KUKUS")}.show()}
    private fun jumlah(n:String,h:Double,m:String){val e=EditText(this).apply{inputType=InputType.TYPE_CLASS_NUMBER;setText("1")};AlertDialog.Builder(this).setTitle("Jumlah $n").setView(e).setPositiveButton("Masukkan"){_,_->val q=e.text.toString().toIntOrNull()?:0;if(q>0){cart.add(KasirItem(n,h,q,if(porsi=="UTUH")1.0 else .5,porsi,m));cartText()}}.setNegativeButton("Batal",null).show()}
    private fun custom(){val n=EditText(this).apply{hint="Nama menu"};val h=EditText(this).apply{hint="Harga";inputType=InputType.TYPE_CLASS_NUMBER};val b=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(48,0,48,0);addView(n);addView(h)};AlertDialog.Builder(this).setTitle("Menu custom").setView(b).setPositiveButton("Lanjut"){_,_->val p=h.text.toString().toDoubleOrNull()?:0.0;if(n.text.isNotBlank()&&p>0)masak(n.text.toString(),p)}.setNegativeButton("Batal",null).show()}
    private fun cartText(){val t=cart.sumOf{it.harga*it.qty};val r=cart.sumOf{it.satuan_roti*it.qty};cartView.text=if(cart.isEmpty())"🛒  Keranjang masih kosong\nPilih kartu menu untuk menambahkan pesanan." else "🛒  Keranjang • ketuk untuk hapus item\n\n"+cart.joinToString("\n"){"${it.qty}× ${it.nama} • ${it.cara_masak}   ${money.format(it.harga*it.qty)}"}+"\n\nTotal ${money.format(t)}  •  $r roti"}
    private fun editCart(){if(cart.isEmpty())return;AlertDialog.Builder(this).setTitle("Hapus item dari keranjang").setItems(cart.map{"${it.qty}× ${it.nama} • ${it.cara_masak}"}.toTypedArray()){_,index->AlertDialog.Builder(this).setTitle("Hapus item ini?").setPositiveButton("Hapus"){_,_->cart.removeAt(index);cartText()}.setNegativeButton("Batal",null).show()}.show()}
    private fun checkout(){if(cart.isEmpty()){Toast.makeText(this,"Keranjang masih kosong",Toast.LENGTH_SHORT).show();return};AlertDialog.Builder(this).setTitle("Pilih pembayaran").setItems(arrayOf("💵 Cash","▣ QRIS")){_,i->save(if(i==0)"CASH" else "QRIS")}.show()}
    private fun save(m:String){val q=queue();q.add(TransaksiKasirRequest(api_key=BuildConfig.API_KEY,id_karyawan=session.getIdKaryawan().orEmpty(),id_cabang=session.getIdCabang().orEmpty(),transaksi_id=UUID.randomUUID().toString(),items=cart.toList(),metode_bayar=m));store(q);cart.clear();cartText();Toast.makeText(this,"Transaksi tersimpan",Toast.LENGTH_SHORT).show();sync()}
    private fun queue():MutableList<TransaksiKasirRequest>{val type=object:TypeToken<MutableList<TransaksiKasirRequest>>(){}.type;return gson.fromJson(prefs.getString("antrian","[]"),type)?:mutableListOf()};private fun store(q:List<TransaksiKasirRequest>){prefs.edit().putString("antrian",gson.toJson(q)).apply()};private fun sync()=lifecycleScope.launch{val fail=mutableListOf<TransaksiKasirRequest>();queue().forEach{try{if(!RetrofitClient.instance.simpanTransaksiKasir(it).success)fail.add(it)}catch(_:Exception){fail.add(it)}};store(fail)}
    companion object{private val half=listOf("Mentega Susu" to 6000.0,"Stroberi" to 7000.0,"Blueberry" to 7000.0,"Nanas" to 7000.0,"Melon" to 7000.0,"Coklat" to 8000.0,"Durian" to 8000.0,"Kacang" to 9000.0,"Oreo" to 9000.0,"Keju" to 10000.0,"Vanilla" to 10000.0,"Tiramisu" to 11000.0,"Greentea" to 11000.0,"Taro" to 11000.0,"Chococruncy" to 12000.0,"Coklat Keju Mix" to 11000.0,"Chococruncy Keju Mix" to 13000.0);private val full=listOf("Mentega Saja" to 8000.0,"Mentega Susu" to 10000.0,"Blueberry Strawberry" to 12000.0,"Blueberry Nanas" to 12000.0,"Strawberry Nanas" to 12000.0,"Melon Strawberry" to 12000.0,"Coklat Selai Buah (pilih rasa)" to 14000.0,"Coklat Full" to 15000.0,"Coklat Kacang Pisah" to 15000.0,"Coklat Keju Pisah" to 17000.0,"Coklat Keju Campur" to 19000.0,"Keju Full" to 18000.0,"Keju Greentea" to 20000.0,"Kacang Oreo" to 18000.0,"Durian Full" to 16000.0,"Vanilla Full" to 16000.0,"Tiramisu Full" to 21000.0,"Greentea Full" to 21000.0,"Taro Full" to 21000.0,"Chococruncy Full" to 22000.0,"Oreo Keju Campur" to 20000.0,"Greentea Keju Campur" to 22000.0,"Taro Keju Campur" to 22000.0,"Chococruncy Keju Campur" to 25000.0)}
}
