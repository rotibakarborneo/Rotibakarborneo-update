import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Radio,
  FileSpreadsheet,
  Receipt,
  Boxes,
  Users2,
  Wallet2,
  Coins,
  Building,
  UserCheck,
  Smartphone,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingKasbonCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingKasbonCount
}) => {
  const { currentUser } = useAuth();

  const menuSections = [
    {
      title: 'IKHTISAR UTAMA',
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan Eksekutif',
          icon: <LayoutDashboard className="w-4 h-4" />,
          desc: 'KPI omzet & performa'
        },
        {
          id: 'live_outlets',
          label: 'Monitoring Gerai Live',
          icon: <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />,
          desc: 'Status buka & absen selfie'
        }
      ]
    },
    {
      title: 'OPERASIONAL GERAI',
      items: [
        {
          id: 'laporan_shift',
          label: 'Rekonsiliasi Shift',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          desc: 'Audit stok roti & setoran'
        },
        {
          id: 'pos_transactions',
          label: 'Transaksi Kasir POS',
          icon: <Receipt className="w-4 h-4" />,
          desc: 'Live feed struk penjualan'
        }
      ]
    },
    {
      title: 'KEUANGAN & SDM',
      items: [
        {
          id: 'payroll',
          label: 'Payroll & Bonus Staf',
          icon: <Users2 className="w-4 h-4" />,
          desc: 'Jam kerja & insentif roti'
        },
        {
          id: 'keuangan',
          label: 'Arus Kas & Buku Kas',
          icon: <Wallet2 className="w-4 h-4" />,
          desc: 'Pemasukan & belanja pusat'
        },
        {
          id: 'kasbon',
          label: 'Persetujuan Kasbon',
          icon: <Coins className="w-4 h-4" />,
          desc: 'Approval pinjaman staf',
          badge: pendingKasbonCount > 0 ? pendingKasbonCount : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        }
      ]
    },
    {
      title: 'PENGATURAN & MOBILE',
      items: [
        {
          id: 'master_cabang',
          label: 'Master Cabang',
          icon: <Building className="w-4 h-4" />,
          desc: 'Geofence GPS & radius gerai'
        },
        {
          id: 'master_karyawan',
          label: 'Master Karyawan',
          icon: <UserCheck className="w-4 h-4" />,
          desc: 'Kelola akun 2 role'
        },
        {
          id: 'mobile_api',
          label: 'Flutter Mobile API Hub',
          icon: <Smartphone className="w-4 h-4 text-sky-400" />,
          desc: 'Kontrak app iOS & Android'
        }
      ]
    }
  ];

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col justify-between p-4 z-30 select-none">
      <div className="ios-glass rounded-3xl p-4 flex flex-col h-full overflow-hidden border border-white/10 shadow-2xl">
        {/* Brand Header */}
        <div className="pb-4 mb-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-950/40 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0c1017] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-white truncate">
                ROTI BAKAR BORNEO
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-indigo-300 border border-indigo-500/30">
                HQ BOS PORTAL
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v2.0</span>
            </div>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 px-2.5 uppercase">
                {section.title}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group cursor-pointer ${
                        isActive
                          ? 'ios-glass-active text-white'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                              : 'bg-white/5 text-slate-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {item.badge ? (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 opacity-80" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom */}
        <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow">
              {currentUser.nama.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.nama}</p>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wide">ROLE: BOS / OWNER</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
