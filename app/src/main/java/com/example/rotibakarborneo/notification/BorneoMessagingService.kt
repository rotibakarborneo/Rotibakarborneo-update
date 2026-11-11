package com.example.rotibakarborneo.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.example.rotibakarborneo.BuildConfig
import com.example.rotibakarborneo.data.RetrofitClient
import com.example.rotibakarborneo.data.model.DeviceTokenRequest
import com.example.rotibakarborneo.util.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BorneoMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) { super.onNewToken(token); daftar(token) }
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        NotificationChannels.create(this)
        val channel = when (message.data["tipe"]?.uppercase()) {
            "OUTLET_BUKA" -> "outlet_buka_v3"
            "OUTLET_TUTUP" -> "outlet_tutup_v3"
            "PENGINGAT_REQUEST" -> "pengingat_request_v3"
            else -> "request_bahan_v3"
        }
        val notification = NotificationCompat.Builder(this, channel)
            // Ikon kecil Android memang wajib satu warna; logo penuh ditampilkan sebagai ikon besar.
            .setSmallIcon(com.example.rotibakarborneo.R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(resources, com.example.rotibakarborneo.R.drawable.logo_roti_bakar_borneo))
            .setContentTitle(message.data["judul"] ?: "Roti Bakar Borneo")
            .setContentText(message.data["isi"] ?: "Ada pembaruan operasional.")
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        (getSystemService(NotificationManager::class.java)).notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
        putarSuara(message.data["tipe"])
    }
    private fun putarSuara(tipe: String?) {
        val sound = when (tipe?.uppercase()) {
            "OUTLET_BUKA" -> com.example.rotibakarborneo.R.raw.outlet_buka
            "OUTLET_TUTUP" -> com.example.rotibakarborneo.R.raw.outlet_tutup
            "PENGINGAT_REQUEST" -> com.example.rotibakarborneo.R.raw.pengingat_request
            else -> com.example.rotibakarborneo.R.raw.request_bahan
        }
        runCatching {
            val attributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            val player = MediaPlayer.create(this, sound, attributes, AudioManager.AUDIO_SESSION_ID_GENERATE) ?: return
            player.setVolume(1f, 1f)
            player.setOnCompletionListener { it.release() }
            player.setOnErrorListener { mediaPlayer, _, _ -> mediaPlayer.release(); true }
            player.start()
        }
    }
    private fun daftar(token: String) { val s=SessionManager(this); if(!s.isLoggedIn()) return; CoroutineScope(Dispatchers.IO).launch { runCatching { RetrofitClient.instance.daftarTokenPerangkat(DeviceTokenRequest(api_key=BuildConfig.API_KEY,id_karyawan=s.getIdKaryawan().orEmpty(),id_cabang=s.getIdCabang().orEmpty(),fcm_token=token)) } } }
}
