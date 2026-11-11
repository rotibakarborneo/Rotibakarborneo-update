package com.example.rotibakarborneo.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.model.PayrollItem
import java.text.NumberFormat
import java.util.Locale

class PayrollAdapter(private var list: List<PayrollItem>, private val onClick: (PayrollItem) -> Unit = {}) : RecyclerView.Adapter<PayrollAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvNama: TextView = view.findViewById(R.id.tvNamaKaryawan)
        val tvInfo: TextView = view.findViewById(R.id.tvInfoPayroll)
        val tvGaji: TextView = view.findViewById(R.id.tvGajiBersih)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_payroll, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = list[position]
        holder.tvNama.text = item.nama
        holder.tvInfo.text = "${item.jumlah_hari_masuk} Hari | ${item.total_jam_kerja} Jam | -${item.total_menit_terlambat}m"
        
        val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
        holder.tvGaji.text = format.format(item.gaji_bersih)
        holder.itemView.setOnClickListener { onClick(item) }
    }

    override fun getItemCount(): Int = list.size

    fun updateData(newList: List<PayrollItem>) {
        list = newList
        notifyDataSetChanged()
    }
}
