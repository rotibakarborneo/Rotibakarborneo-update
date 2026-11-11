package com.example.rotibakarborneo.ui.fragments

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.FotoProfilRequest
import com.example.rotibakarborneo.databinding.FragmentProfilBinding
import com.example.rotibakarborneo.ui.login.LoginActivity
import com.example.rotibakarborneo.ui.admin.OutletFormActivity
import com.example.rotibakarborneo.ui.admin.KaryawanFormActivity
import com.example.rotibakarborneo.ui.admin.RiwayatLaporanActivity
import com.example.rotibakarborneo.ui.admin.KeuanganActivity
import com.example.rotibakarborneo.util.SessionManager
import com.example.rotibakarborneo.util.ImageUtils
import kotlinx.coroutines.launch

class ProfilFragment : Fragment() {
    private var _binding: FragmentProfilBinding? = null
    private val binding get() = _binding!!
    private lateinit var session: SessionManager
    private val pilihFoto = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? -> uri?.let(::unggahFoto) }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProfilBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        session = SessionManager(requireContext())

        binding.tvNamaProfil.text = "Mas ${session.getNama()} Ganteng"
        binding.tvRoleProfil.text = session.getRole()?.uppercase()
        binding.tvIdCabangProfil.text = "ID Cabang: ${session.getIdCabang()}"
        session.getFotoProfil()?.takeIf { it.isNotBlank() }?.let { Glide.with(this).load(it).circleCrop().into(binding.ivFotoProfil) }
        binding.btnUbahFotoProfil.setOnClickListener { pilihFoto.launch("image/*") }

        if (session.getRole()?.uppercase() == "ADMIN") {
            binding.tvPusatAdmin.visibility = View.VISIBLE
            binding.layoutAdminTools.visibility = View.VISIBLE
            binding.btnKelolaOutlet.setOnClickListener { startActivity(Intent(requireContext(), OutletFormActivity::class.java)) }
            binding.btnKelolaKaryawan.setOnClickListener { startActivity(Intent(requireContext(), KaryawanFormActivity::class.java)) }
            binding.btnRiwayatLaporan.setOnClickListener { startActivity(Intent(requireContext(), RiwayatLaporanActivity::class.java)) }
            binding.btnKeuanganBoss.setOnClickListener { startActivity(Intent(requireContext(), KeuanganActivity::class.java)) }
        }

        binding.btnLogout.setOnClickListener {
            session.logout()
            startActivity(Intent(requireContext(), LoginActivity::class.java))
            requireActivity().finish()
        }
    }

    private fun unggahFoto(uri: Uri) {
        val bitmap = context?.contentResolver?.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) } ?: return
        binding.btnUbahFotoProfil.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.uploadFotoProfil(FotoProfilRequest(
                    api_key = BuildConfig.API_KEY, id_karyawan = session.getIdKaryawan().orEmpty(), id_cabang = session.getIdCabang().orEmpty(),
                    foto_base64 = ImageUtils.bitmapToBase64(ImageUtils.compressBitmap(bitmap, 300))
                ))
                response.data?.foto_profil_url?.let { url -> session.setFotoProfil(url); Glide.with(this@ProfilFragment).load(url).circleCrop().into(binding.ivFotoProfil) }
            } finally { binding.btnUbahFotoProfil.isEnabled = true }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
