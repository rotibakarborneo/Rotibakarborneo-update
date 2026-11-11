package com.example.rotibakarborneo.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build

object NotificationChannels {
    fun create(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val manager = context.getSystemService(NotificationManager::class.java)
        val audio = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build()
        listOf(
            // Akhiran v2 membuat Android membuat kanal baru. Pengaturan suara
            // pada kanal lama tidak bisa diubah oleh aplikasi setelah dibuat.
            Triple("request_bahan_v3", "Request bahan", "request_bahan"),
            Triple("outlet_buka_v3", "Outlet dibuka", "outlet_buka"),
            Triple("outlet_tutup_v3", "Outlet ditutup", "outlet_tutup"),
            Triple("pengingat_request_v3", "Pengingat request", "pengingat_request")
        ).forEach { (id, name, sound) ->
            val uri = Uri.parse("android.resource://${context.packageName}/raw/$sound")
            // MP3 diputar langsung oleh BorneoMessagingService agar konsisten
            // pada tiap merek HP. Kanal hanya mengatur kartu dan getaran.
            manager.createNotificationChannel(NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH).apply { setSound(null, audio); enableVibration(true) })
        }
    }
}
