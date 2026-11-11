package com.example.rotibakarborneo.ui.karyawan

import android.Manifest
import android.graphics.BitmapFactory
import android.location.Location
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.AbsenRequest
import com.example.rotibakarborneo.databinding.ActivityAbsenBinding
import com.example.rotibakarborneo.util.ImageUtils
import com.example.rotibakarborneo.util.LocationHelper
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

class AbsenActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAbsenBinding
    private var imageCapture: ImageCapture? = null
    private lateinit var locationHelper: LocationHelper
    private var currentLocation: Location? = null
    private lateinit var session: SessionManager

    private var latCabang = 0.0
    private var lngCabang = 0.0
    private var radiusMeter = 100f
    private var lokasiCabangSiap = false

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        if (perms.values.all { it }) {
            startCamera()
        } else {
            Toast.makeText(this, "Izin kamera & lokasi wajib diberikan", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAbsenBinding.inflate(layoutInflater)
        setContentView(binding.root)

        session = SessionManager(this)
        locationHelper = LocationHelper(this)

        muatLokasiCabang()

        requestPermissionLauncher.launch(
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        )

        binding.btnAmbilFoto.setOnClickListener { startAbsenceFlow() }
    }

    private fun muatLokasiCabang() {
        lokasiCabangSiap = false
        runOnUiThread { binding.tvStatusLokasi.text = "Menyambungkan ke server..." }
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getListCabang(apiKey = BuildConfig.API_KEY)
                if (response.isSuccessful) {
                    val body = response.body()?.string() ?: ""
                    val json = JSONObject(body)
                    if (json.getBoolean("success")) {
                        val dataArray = json.getJSONArray("data")
                        val myIdCabang = session.getIdCabang()?.trim()?.lowercase() ?: ""
                        var foundOutlet = false
                        for (i in 1 until dataArray.length()) {
                            val row = dataArray.getJSONArray(i)
                            val sheetIdCabang = row.optString(0).trim().lowercase()
                            if (sheetIdCabang == myIdCabang) {
                                foundOutlet = true
                                // Google Sheet kadang memakai koma sebagai pemisah desimal.
                                val lat = row.optString(2).trim().replace(',', '.').toDoubleOrNull()
                                val lng = row.optString(3).trim().replace(',', '.').toDoubleOrNull()
                                val radius = row.optString(4).trim().replace(',', '.').toFloatOrNull()
                                if (lat != null && lng != null && radius != null &&
                                    lat in -90.0..90.0 && lng in -180.0..180.0 && radius > 0f
                                ) {
                                    latCabang = lat
                                    lngCabang = lng
                                    radiusMeter = radius
                                    lokasiCabangSiap = true
                                }
                                break
                            }
                        }
                        runOnUiThread {
                            if (lokasiCabangSiap) {
                                binding.tvStatusLokasi.text = "Lokasi outlet siap"
                                binding.tvStatusLokasi.setTextColor(ContextCompat.getColor(this@AbsenActivity, R.color.primary_green))
                            } else if (foundOutlet) {
                                binding.tvStatusLokasi.text = "Koordinat outlet belum valid di Sheet"
                                binding.tvStatusLokasi.setTextColor(ContextCompat.getColor(this@AbsenActivity, R.color.status_closed))
                            } else {
                                binding.tvStatusLokasi.text = "ID Outlet '$myIdCabang' tidak ada di Sheet"
                                binding.tvStatusLokasi.setTextColor(ContextCompat.getColor(this@AbsenActivity, R.color.status_closed))
                            }
                        }
                    } else {
                        runOnUiThread { binding.tvStatusLokasi.text = "Server: " + json.optString("message") }
                    }
                } else {
                    runOnUiThread { binding.tvStatusLokasi.text = "Koneksi gagal (${response.code()})" }
                }
            } catch (e: Exception) {
                runOnUiThread { binding.tvStatusLokasi.text = "Gagal sinkron: ${e.message}" }
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            imageCapture = ImageCapture.Builder().build()
            try {
                cameraProvider.unbindAll()
                // Prioritas kamera belakang; jika rusak/tidak tersedia, gunakan kamera depan agar presensi tetap bisa dilakukan.
                val selector = if (cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA)) {
                    CameraSelector.DEFAULT_BACK_CAMERA
                } else {
                    CameraSelector.DEFAULT_FRONT_CAMERA
                }
                cameraProvider.bindToLifecycle(this, selector, preview, imageCapture)
                if (selector == CameraSelector.DEFAULT_FRONT_CAMERA) {
                    Toast.makeText(this, "Kamera belakang tidak tersedia, memakai kamera depan.", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_FRONT_CAMERA, preview, imageCapture)
                    Toast.makeText(this, "Kamera belakang bermasalah, memakai kamera depan.", Toast.LENGTH_LONG).show()
                } catch (_: Exception) {
                    Toast.makeText(this, "Kamera depan dan belakang tidak dapat digunakan.", Toast.LENGTH_LONG).show()
                }
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startAbsenceFlow() {
        if (!lokasiCabangSiap) {
            Toast.makeText(this, "Data lokasi outlet belum siap. Mohon tunggu sebentar...", Toast.LENGTH_LONG).show()
            muatLokasiCabang()
            return
        }

        binding.tvStatusLokasi.text = "Mengunci lokasi GPS Anda..."
        binding.progressBar.visibility = View.VISIBLE
        binding.btnAmbilFoto.isEnabled = false

        locationHelper.getCurrentLocation { location ->
            if (location == null) {
                binding.progressBar.visibility = View.GONE
                binding.btnAmbilFoto.isEnabled = true
                Toast.makeText(this, "Gagal mendapatkan lokasi GPS", Toast.LENGTH_SHORT).show()
                return@getCurrentLocation
            }
            currentLocation = location
            
            val jarak = locationHelper.hitungJarakMeter(
                location.latitude, location.longitude, latCabang, lngCabang
            )
            
            if (jarak > radiusMeter) {
                binding.progressBar.visibility = View.GONE
                binding.btnAmbilFoto.isEnabled = true
                AlertDialog.Builder(this)
                    .setTitle("Di Luar Jangkauan")
                    .setMessage("Jarak Anda ${jarak.toInt()}m dari outlet. Maksimal radius adalah ${radiusMeter.toInt()}m.")
                    .setPositiveButton("Coba Lagi", null)
                    .show()
                return@getCurrentLocation
            }

            ambilFoto()
        }
    }

    private fun ambilFoto() {
        val photoFile = File(cacheDir, "temp_absen_${System.currentTimeMillis()}.jpg")
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        imageCapture?.takePicture(outputOptions, ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    binding.progressBar.visibility = View.GONE
                    showChoiceDialog(photoFile)
                }
                override fun onError(exc: ImageCaptureException) {
                    binding.progressBar.visibility = View.GONE
                    binding.btnAmbilFoto.isEnabled = true
                    Toast.makeText(this@AbsenActivity, "Gagal ambil foto", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun showChoiceDialog(photoFile: File) {
        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(this, R.style.BottomSheetDialogTheme)
        val view = layoutInflater.inflate(R.layout.dialog_absen_choice, null)
        
        view.findViewById<android.widget.Button>(R.id.btnChoiceMasuk).setOnClickListener {
            dialog.dismiss()
            kirimAbsenKeServer("absen_masuk", photoFile)
        }
        view.findViewById<android.widget.Button>(R.id.btnChoicePulang).setOnClickListener {
            dialog.dismiss()
            kirimAbsenKeServer("absen_pulang", photoFile)
        }
        view.findViewById<android.widget.Button>(R.id.btnChoiceBatal).setOnClickListener {
            dialog.dismiss()
            binding.btnAmbilFoto.isEnabled = true
            photoFile.delete()
        }
        
        dialog.setContentView(view)
        dialog.setCancelable(false)
        dialog.show()
    }

    private fun kirimAbsenKeServer(action: String, photoFile: File) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                val compressed = ImageUtils.compressBitmap(bitmap, maxKb = 300)
                val base64Foto = ImageUtils.bitmapToBase64(compressed)

                val request = AbsenRequest(
                    action = action,
                    api_key = BuildConfig.API_KEY,
                    id_karyawan = session.getIdKaryawan()?.trim() ?: "",
                    id_cabang = session.getIdCabang()?.trim() ?: "",
                    lat = currentLocation!!.latitude,
                    lng = currentLocation!!.longitude,
                    foto_base64 = base64Foto
                )

                val response = if (action == "absen_masuk") {
                    RetrofitClient.instance.absenMasuk(request)
                } else {
                    RetrofitClient.instance.absenPulang(request)
                }

                if (response.success) {
                    Toast.makeText(this@AbsenActivity, response.message, Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    AlertDialog.Builder(this@AbsenActivity)
                        .setTitle("Gagal")
                        .setMessage(response.message)
                        .setPositiveButton("Mengerti") { _, _ ->
                            binding.btnAmbilFoto.isEnabled = true
                        }.show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@AbsenActivity, "Koneksi bermasalah", Toast.LENGTH_LONG).show()
                binding.btnAmbilFoto.isEnabled = true
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
