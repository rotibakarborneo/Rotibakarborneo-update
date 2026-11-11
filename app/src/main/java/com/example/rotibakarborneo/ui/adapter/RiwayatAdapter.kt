package com.example.rotibakarborneo.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.model.RiwayatItem

class RiwayatAdapter(private var list: List<RiwayatItem>) : RecyclerView.Adapter<RiwayatAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTanggal: TextView = view.findViewById(R.id.tvTanggal)
        val tvStatus: TextView = view.findViewById(R.id.tvStatusPresensi)
        val tvMasuk: TextView = view.findViewById(R.id.tvJamMasuk)
        val tvPulang: TextView = view.findViewById(R.id.tvJamPulang)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_riwayat, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = list[position]
        holder.tvTanggal.text = item.tanggal
        holder.tvStatus.text = item.status_presensi ?: "Proses"
        holder.tvMasuk.text = "Masuk: ${item.jam_masuk ?: "-"}"
        holder.tvPulang.text = "Pulang: ${item.jam_pulang ?: "-"}"
    }

    override fun getItemCount(): Int = list.size

    fun updateData(newList: List<RiwayatItem>) {
        list = newList
        notifyDataSetChanged()
    }
}