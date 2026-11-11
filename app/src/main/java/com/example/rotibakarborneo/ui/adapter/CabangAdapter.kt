package com.example.rotibakarborneo.ui.adapter

import android.content.res.ColorStateList
import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.data.model.CabangDashboard
import com.example.rotibakarborneo.data.model.LaporanShift
import com.google.android.material.progressindicator.LinearProgressIndicator
import java.text.NumberFormat
import java.util.Locale

class CabangAdapter(
    private var list: List<CabangDashboard>,
    private val onCabangExpanded: (CabangDashboard) -> Unit
) : RecyclerView.Adapter<CabangAdapter.ViewHolder>() {

    private var expandedCabangId: String? = null
    private val reports = mutableMapOf<String, LaporanShift?>()
    private val loadingReports = mutableSetOf<String>()
    private val reportErrors = mutableMapOf<String, String>()

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvNama: TextView = view.findViewById(R.id.tvNamaCabang)
        val tvStatus: TextView = view.findViewById(R.id.tvStatusCabang)
        val rvKaryawan: RecyclerView = view.findViewById(R.id.rvKaryawanAbsen)
        val tvInfo: TextView = view.findViewById(R.id.tvInfoAbsen)
        val tvJamBuka: TextView = view.findViewById(R.id.tvJamBukaInfo)
        val layoutDetail: View = view.findViewById(R.id.layoutLaporanDetail)
        val tvLaporanStatus: TextView = view.findViewById(R.id.tvLaporanStatus)
        val layoutIsiLaporan: View = view.findViewById(R.id.layoutIsiLaporan)
        val tvPeriodeShift: TextView = view.findViewById(R.id.tvPeriodeShift)
        val tvRotiTerjual: TextView = view.findViewById(R.id.tvRotiTerjual)
        val progressRoti: LinearProgressIndicator = view.findViewById(R.id.progressRoti)
        val tvRotiAwal: TextView = view.findViewById(R.id.tvRotiAwal)
        val tvRotiSisa: TextView = view.findViewById(R.id.tvRotiSisa)
        val tvBahanHabis: TextView = view.findViewById(R.id.tvBahanHabis)
        val tvPengeluaran: TextView = view.findViewById(R.id.tvPengeluaran)
        val tvSetorUang: TextView = view.findViewById(R.id.tvSetorUang)
        val tvSisaModal: TextView = view.findViewById(R.id.tvSisaModal)
        val tvCatatan: TextView = view.findViewById(R.id.tvCatatan)
        val card: com.google.android.material.card.MaterialCardView = view as com.google.android.material.card.MaterialCardView
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder =
        ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_cabang, parent, false))

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = list[position]
        holder.tvNama.text = item.nama_cabang
        val context = holder.itemView.context
        val green = ContextCompat.getColor(context, R.color.primary_green)
        val red = ContextCompat.getColor(context, R.color.status_closed)

        when (item.status.trim().uppercase()) {
            "BUKA" -> {
                holder.tvStatus.text = "BUKA"
                holder.tvStatus.backgroundTintList = ColorStateList.valueOf(green)
                holder.card.alpha = 1f
                holder.tvJamBuka.isVisible = true
                holder.tvJamBuka.text = "Buka ${item.jam_buka_pertama ?: "-"} • ${item.total_kerja_hari_ini} jam berjalan • ${rupiah(item.estimasi_gaji_hari_ini)}"
                holder.tvJamBuka.setTextColor(green)
                holder.tvInfo.text = "Shift sedang berjalan"
            }
            "TUTUP_SELESAI" -> {
                holder.tvStatus.text = "SELESAI"
                holder.tvStatus.backgroundTintList = ColorStateList.valueOf(red)
                holder.card.alpha = 1f
                holder.tvJamBuka.isVisible = true
                holder.tvJamBuka.text = "Total ${item.total_kerja_hari_ini} jam • ${rupiah(item.estimasi_gaji_hari_ini)}"
                holder.tvJamBuka.setTextColor(Color.WHITE)
                holder.tvInfo.text = "Ketuk untuk melihat laporan shift"
            }
            else -> {
                holder.tvStatus.text = "BELUM BUKA"
                holder.tvStatus.backgroundTintList = ColorStateList.valueOf(Color.DKGRAY)
                holder.card.alpha = .7f
                holder.tvJamBuka.isVisible = false
                holder.tvInfo.text = "Outlet belum memulai shift"
            }
        }

        if (item.karyawan_absen.isEmpty()) {
            holder.rvKaryawan.isVisible = false
        } else {
            holder.rvKaryawan.isVisible = true
            holder.rvKaryawan.layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
            holder.rvKaryawan.adapter = KaryawanAbsenAdapter(item.karyawan_absen)
        }

        val expanded = expandedCabangId == item.id_cabang
        holder.layoutDetail.isVisible = expanded
        if (expanded) bindReport(holder, item)

        holder.card.setOnClickListener {
            val shouldExpand = expandedCabangId != item.id_cabang
            expandedCabangId = if (shouldExpand) item.id_cabang else null
            notifyDataSetChanged()
            if (shouldExpand && !reports.containsKey(item.id_cabang)) {
                loadingReports.add(item.id_cabang)
                onCabangExpanded(item)
            }
        }
    }

    private fun bindReport(holder: ViewHolder, item: CabangDashboard) {
        val id = item.id_cabang
        val report = reports[id]
        holder.layoutIsiLaporan.isVisible = report != null
        holder.tvLaporanStatus.isVisible = report == null
        holder.tvLaporanStatus.text = when {
            loadingReports.contains(id) -> "Memuat laporan shift..."
            reportErrors.containsKey(id) -> reportErrors[id] ?: "Laporan belum tersedia."
            else -> "Laporan belum tersedia untuk shift ini."
        }
        report ?: return

        val rotiTerjual = (report.roti_awal - report.roti_sisa).coerceAtLeast(0)
        holder.tvPeriodeShift.text = "Shift ${report.tanggal_operasional} • ${report.jam_mulai ?: "-"} – ${report.jam_selesai ?: "-"}"
        holder.tvRotiTerjual.text = "$rotiTerjual roti terjual"
        holder.progressRoti.max = report.roti_awal.coerceAtLeast(1)
        holder.progressRoti.progress = rotiTerjual.coerceAtMost(holder.progressRoti.max)
        holder.tvRotiAwal.text = "Sisa kemarin: ${report.roti_sisa_kemarin} • Diantar: ${report.roti_diantar}"
        holder.tvRotiSisa.text = "Sisa: ${report.roti_sisa}"
        holder.tvBahanHabis.text = "Kasir: ${report.penjualan_offline_roti} roti • Luar kasir: ${report.penjualan_luar_kasir_roti} roti\nRusak/bonus: ${report.roti_rusak_bonus} • Selisih: ${report.selisih_stok}"
        holder.tvPengeluaran.text = rupiah(report.pengeluaran)
        holder.tvSetorUang.text = rupiah(report.setor_uang)
        holder.tvSisaModal.text = rupiah(report.sisa_modal)
        holder.tvCatatan.isVisible = !report.catatan.isNullOrBlank()
        holder.tvCatatan.text = report.catatan.orEmpty()
    }

    private fun rupiah(value: Double) = NumberFormat.getCurrencyInstance(Locale("id", "ID")).format(value)

    override fun getItemCount(): Int = list.size

    fun showReport(idCabang: String, report: LaporanShift?) {
        loadingReports.remove(idCabang)
        reports[idCabang] = report
        reportErrors.remove(idCabang)
        notifyDataSetChanged()
    }

    fun showReportError(idCabang: String, message: String) {
        loadingReports.remove(idCabang)
        reportErrors[idCabang] = message
        notifyDataSetChanged()
    }

    fun updateData(newList: List<CabangDashboard>) {
        list = newList
        notifyDataSetChanged()
    }
}
