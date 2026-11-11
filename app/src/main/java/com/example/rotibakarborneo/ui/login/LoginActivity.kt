package com.example.rotibakarborneo.ui.login

import android.content.Intent
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.databinding.ActivityLoginBinding
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.LoginRequest
import com.example.rotibakarborneo.ui.HomeActivity
import com.example.rotibakarborneo.util.SessionManager
import com.google.firebase.messaging.FirebaseMessaging
import com.example.rotibakarborneo.data.model.DeviceTokenRequest
import com.example.rotibakarborneo.notification.NotificationChannels
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        session = SessionManager(this)
        if (session.isLoggedIn()) {
            startActivity(Intent(this, HomeActivity::class.java))
            finish()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 91)

        binding.btnLogin.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Harap isi semua kolom", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            prosesLogin(username, password)
        }
    }

    private fun prosesLogin(user: String, pass: String) {
        binding.btnLogin.isEnabled = false
        binding.btnLogin.text = "Memproses..."

        lifecycleScope.launch {
            try {
                val request = LoginRequest(api_key = BuildConfig.API_KEY, username = user, password = pass)
                val response = RetrofitClient.instance.login(request)

                if (response.success && response.data != null) {
                    val data = response.data
                    session.saveLogin(data.id_karyawan, data.nama, data.role, data.id_cabang, data.foto_profil_url)
                    NotificationChannels.create(this@LoginActivity)
                    FirebaseMessaging.getInstance().token.addOnSuccessListener { token -> lifecycleScope.launch { runCatching { RetrofitClient.instance.daftarTokenPerangkat(DeviceTokenRequest(api_key = BuildConfig.API_KEY, id_karyawan = data.id_karyawan, id_cabang = data.id_cabang, fcm_token = token)) } } }
                    
                    Toast.makeText(this@LoginActivity, "Selamat datang, ${data.nama}", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this@LoginActivity, HomeActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@LoginActivity, response.message ?: "Login Gagal", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnLogin.isEnabled = true
                binding.btnLogin.text = "Masuk ke Aplikasi"
            }
        }
    }
}
