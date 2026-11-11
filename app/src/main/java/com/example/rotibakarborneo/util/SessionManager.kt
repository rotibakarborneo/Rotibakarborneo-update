package com.example.rotibakarborneo.util

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("RotiBakarPrefs", Context.MODE_PRIVATE)

    companion object {
        const val IS_LOGGED_IN = "isLoggedIn"
        const val KEY_NAMA = "nama"
        const val KEY_ROLE = "role"
        const val KEY_ID_CABANG = "idCabang"
        const val KEY_ID_KARYAWAN = "idKaryawan"
        const val KEY_FOTO_PROFIL = "fotoProfil"
    }

    fun saveLogin(id: String, nama: String, role: String, idCabang: String, fotoProfil: String? = null) {
        prefs.edit().apply {
            putBoolean(IS_LOGGED_IN, true)
            putString(KEY_ID_KARYAWAN, id)
            putString(KEY_NAMA, nama)
            putString(KEY_ROLE, role)
            putString(KEY_ID_CABANG, idCabang)
            putString(KEY_FOTO_PROFIL, fotoProfil)
            apply()
        }
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(IS_LOGGED_IN, false)

    fun getNama(): String? = prefs.getString(KEY_NAMA, "")
    fun getRole(): String? = prefs.getString(KEY_ROLE, "")
    fun getIdCabang(): String? = prefs.getString(KEY_ID_CABANG, "")
    fun getIdKaryawan(): String? = prefs.getString(KEY_ID_KARYAWAN, "")
    fun getFotoProfil(): String? = prefs.getString(KEY_FOTO_PROFIL, "")
    fun setFotoProfil(url: String) { prefs.edit().putString(KEY_FOTO_PROFIL, url).apply() }

    fun logout() {
        prefs.edit().clear().apply()
    }
}
