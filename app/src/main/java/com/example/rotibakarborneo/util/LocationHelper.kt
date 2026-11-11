package com.example.rotibakarborneo.util

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

class LocationHelper(private val context: Context) {
    private val fusedClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    fun getCurrentLocation(onResult: (Location?) -> Unit) {
        val request = CurrentLocationRequest.Builder()
            .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
            .build()
        fusedClient.getCurrentLocation(request, null)
            .addOnSuccessListener { location -> onResult(location) }
            .addOnFailureListener { onResult(null) }
    }

    // Untuk validasi cepat di sisi client sebelum kirim ke server (UX only, validasi FINAL tetap di server)
    fun hitungJarakMeter(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Float {
        val hasil = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, hasil)
        return hasil[0]
    }
}