import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Radio,
  FileSpreadsheet,
  Receipt,
  Users2,
  Wallet2,
  Coins,
  Building,
  UserCheck,
  Smartphone,
  Sparkles,
  ChevronRight,
  UtensilsCrossed
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
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />
        },
        {
          id: 'live_outlets',
          label: 'Monitoring Gerai',
          icon: <Radio className="w-4 h-4 text-emerald-400" />
        },
        {
          id: 'ai_assistant',
          label: 'Asisten AI Bos',
          icon: <Sparkles className="w-4 h-4 text-amber-300" />
        }
      ]
    },
    {
      title: 'OPERASIONAL GERAI',
      items: [
        {
          id: 'laporan_shift',
          label: 'Rekonsiliasi Shift',
          icon: <FileSpreadsheet className="w-4 h-4" />
        },
        {
          id: 'pos_transactions',
          label: 'Transaksi Kasir',
          icon: <Receipt className="w-4 h-4" />
        },
        {
          id: 'master_menu',
          label: 'Kelola Menu',
          icon: <UtensilsCrossed className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'KEUANGAN & SDM',
      items: [
        {
          id: 'payroll',
          label: 'Payroll',
          icon: <Users2 className="w-4 h-4" />
        },
        {
          id: 'keuangan',
          label: 'Arus Kas',
          icon: <Wallet2 className="w-4 h-4" />
        },
        {
          id: 'kasbon',
          label: 'Persetujuan Kasbon',
          icon: <Coins className="w-4 h-4" />,
          badge: pendingKasbonCount > 0 ? pendingKasbonCount : null
        }
      ]
    },
    {
      title: 'PENGATURAN & MOBILE',
      items: [
        {
          id: 'master_cabang',
          label: 'Kelola Cabang',
          icon: <Building className="w-4 h-4" />
        },
        {
          id: 'master_karyawan',
          label: 'Kelola Karyawan',
          icon: <UserCheck className="w-4 h-4" />
        },
        {
          id: 'mobile_api',
          label: 'API Mobile',
          icon: <Smartphone className="w-4 h-4 text-sky-400" />
        }
      ]
    }
  ];

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col justify-between p-4 z-30 select-none">
      <div className="ios-glass rounded-3xl p-4 flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="pb-4 mb-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-lg shadow-blue-950/40 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0a0f1c] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-white truncate">
              Roti Bakar Borneo
            </h1>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Manajemen 6 Gerai Jogja
            </p>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 px-2.5 uppercase">
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
                          : 'text-slate-300 hover:text-white hover:bg-white/6'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-slate-400 group-hover:text-sky-300 group-hover:bg-sky-500/10'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <p className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-slate-200 font-medium'}`}>
                          {item.label}
                        </p>
                      </div>

                      {item.badge ? (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom */}
        <div className="pt-3 mt-2 border-t border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow">
            {currentUser.nama.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser.nama}</p>
            <p className="text-[10px] text-slate-400 truncate">Owner / Bos</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
