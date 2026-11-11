package com.example.rotibakarborneo.ui

import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.rotibakarborneo.R
import com.example.rotibakarborneo.databinding.ActivityHomeBinding
import com.example.rotibakarborneo.ui.fragments.DashboardFragment
import com.example.rotibakarborneo.ui.fragments.HistoryFragment
import com.example.rotibakarborneo.ui.fragments.PayrollFragment
import com.example.rotibakarborneo.ui.fragments.PresensiFragment
import com.example.rotibakarborneo.ui.fragments.ProfilFragment
import com.example.rotibakarborneo.ui.karyawan.BonActivity
import com.example.rotibakarborneo.ui.admin.BonAdminActivity
import com.example.rotibakarborneo.ui.admin.KasirAdminActivity
import android.content.Intent
import com.example.rotibakarborneo.util.SessionManager

class HomeActivity : AppCompatActivity() {
    private lateinit var binding: ActivityHomeBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        session = SessionManager(this)
        val role = session.getRole()?.uppercase()?.trim() ?: ""

        setupBottomNavigation(role)
    }

    private fun setupBottomNavigation(role: String) {
        binding.bottomNavigation.menu.clear()
        if (role == "ADMIN") {
            binding.bottomNavigation.inflateMenu(R.menu.menu_bottom_bos)
            loadFragment(DashboardFragment())
            
            binding.bottomNavigation.setOnItemSelectedListener { item: MenuItem ->
                when (item.itemId) {
                    R.id.nav_dashboard -> loadFragment(DashboardFragment())
                    R.id.nav_payroll -> loadFragment(PayrollFragment())
                    R.id.nav_kasir -> startActivity(Intent(this, KasirAdminActivity::class.java))
                    R.id.nav_bon -> startActivity(Intent(this, BonAdminActivity::class.java))
                    R.id.nav_more -> loadFragment(ProfilFragment())
                }
                true
            }
        } else {
            binding.bottomNavigation.inflateMenu(R.menu.menu_bottom_karyawan)
            loadFragment(PresensiFragment())
            
            binding.bottomNavigation.setOnItemSelectedListener { item: MenuItem ->
                when (item.itemId) {
                    R.id.nav_presensi -> loadFragment(PresensiFragment())
                    R.id.nav_history -> loadFragment(HistoryFragment())
                    R.id.nav_bon -> startActivity(Intent(this, BonActivity::class.java))
                    R.id.nav_profile -> loadFragment(ProfilFragment())
                }
                true
            }
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.nav_host_fragment, fragment)
            .commit()
    }
}
