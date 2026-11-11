package com.example.rotibakarborneo.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.model.KaryawanAbsen
import com.google.android.material.imageview.ShapeableImageView

class KaryawanAbsenAdapter(private val list: List<KaryawanAbsen>) :
    RecyclerView.Adapter<KaryawanAbsenAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivFoto: ShapeableImageView = view.findViewById(R.id.ivFotoKaryawan)
        val tvNama: TextView = view.findViewById(R.id.tvNamaKaryawan)
        val tvJam: TextView = view.findViewById(R.id.tvJamMasuk)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_karyawan_absen, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = list[position]
        holder.tvNama.text = "Mas ${item.nama_karyawan} Ganteng"
        holder.tvJam.text = item.jam_masuk

        Glide.with(holder.itemView.context)
            .load(item.foto_url)
            .placeholder(R.drawable.ic_launcher_background)
            .error(R.drawable.ic_launcher_background)
            .into(holder.ivFoto)
    }

    override fun getItemCount(): Int = list.size
}