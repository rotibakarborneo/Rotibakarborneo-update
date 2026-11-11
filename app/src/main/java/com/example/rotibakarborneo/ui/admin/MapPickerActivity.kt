package com.example.rotibakarborneo.ui.admin

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MapPickerActivity : AppCompatActivity() {
    @SuppressLint("SetJavaScriptEnabled") override fun onCreate(state: Bundle?) { super.onCreate(state)
        val map = WebView(this).apply { settings.javaScriptEnabled = true; settings.domStorageEnabled = true; webViewClient = WebViewClient(); addJavascriptInterface(Bridge(), "OutletMap"); loadUrl("file:///android_asset/map_picker.html") }
        setContentView(map)
    }
    inner class Bridge { @JavascriptInterface fun pilih(lat: Double, lng: Double) { runOnUiThread { setResult(Activity.RESULT_OK, Intent().putExtra("latitude",lat).putExtra("longitude",lng)); finish() } } }
}
