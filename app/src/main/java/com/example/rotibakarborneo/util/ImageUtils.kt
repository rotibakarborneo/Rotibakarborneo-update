package com.example.rotibakarborneo.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayOutputStream

object ImageUtils {
    fun compressBitmap(bitmap: Bitmap, maxKb: Int): Bitmap {
        var quality = 90
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
        while (stream.toByteArray().size / 1024 > maxKb && quality > 10) {
            stream.reset()
            quality -= 10
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
        }
        return BitmapFactory.decodeByteArray(stream.toByteArray(), 0, stream.toByteArray().size)
    }

    fun bitmapToBase64(bitmap: Bitmap): String {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }
}