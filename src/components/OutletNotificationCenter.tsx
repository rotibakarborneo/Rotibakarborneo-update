import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Store, CreditCard, FileText, Trash2, BellRing } from 'lucide-react';
import { apiService } from '../services/api';

interface NotifEntry {
  id: string;
  title: string;
  body: string;
  category: 'BUKA' | 'TUTUP' | 'KASBON' | 'LAPORAN';
  time: string;
  unread: boolean;
}

const STORAGE_KEY = 'borneo_web_notif_logs';

export const OutletNotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<NotifEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as NotifEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [banner, setBanner] = useState<NotifEntry | null>(null);
  const [permStatus, setPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const prevOutletsRef = useRef<Record<string, string>>({});
  const prevBonsRef = useRef<Set<string>>(new Set());
  const prevLaporanRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const wibTimeNow = () =>
    new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

  const saveLogs = (next: NotifEntry[]) => {
    const trimmed = next.slice(0, 35);
    setLogs(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore storage quota
    }
  };

  const pushNotification = (entry: Omit<NotifEntry, 'id' | 'time' | 'unread'>, withBrowser = true) => {
    const item: NotifEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: wibTimeNow(),
      unread: true
    };
    setLogs((prev) => {
      const next = [item, ...prev].slice(0, 35);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setBanner(item);
    setTimeout(() => {
      setBanner((cur) => (cur?.id === item.id ? null : cur));
    }, 5500);

    if (
      withBrowser &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(item.title, { body: item.body });
      } catch {
        // ignore browser restriction
      }
    }
  };

  const requestBrowserNotif = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPermStatus(res);
      if (res === 'granted') {
        pushNotification(
          {
            title: 'Notifikasi Browser Aktif',
            body: 'Dashboard akan memberi tahu otomatis saat outlet buka, tutup, atau ada pengajuan baru.',
            category: 'BUKA'
          },
          true
        );
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const checkChanges = async () => {
      try {
        const [outlets, bons, laporans] = await Promise.all([
          apiService.getLiveOutlets(),
          apiService.getBonList(),
          apiService.getLaporanShift()
        ]);

        if (!seededRef.current) {
          const map: Record<string, string> = {};
          outlets.forEach((o) => {
            map[o.id_cabang] = o.status;
          });
          prevOutletsRef.current = map;
          prevBonsRef.current = new Set(bons.map((b) => b.bon_id));
          prevLaporanRef.current = new Set(laporans.map((l) => l.laporan_id));
          seededRef.current = true;
          return;
        }

        // Diff outlet buka/tutup
        outlets.forEach((o) => {
          const prev = prevOutletsRef.current[o.id_cabang];
          if (prev && prev !== o.status) {
            if (o.status === 'BUKA') {
              const staf = o.karyawan_absen?.[0];
              pushNotification({
                title: `Outlet Buka: ${o.nama_cabang}`,
                body: staf
                  ? `Staf: ${staf.nama_karyawan} masuk pukul ${o.jam_buka_pertama || staf.jam_masuk} WIB`
                  : `Gerai ${o.nama_cabang} mulai beroperasi.`,
                category: 'BUKA'
              });
            } else if (o.status === 'TUTUP') {
              pushNotification({
                title: `Outlet Tutup: ${o.nama_cabang}`,
                body: `Operasional selesai • ${o.roti_terjual_hari_ini} roti terjual hari ini.`,
                category: 'TUTUP'
              });
            }
          }
          prevOutletsRef.current[o.id_cabang] = o.status;
        });

        // Diff kasbon baru
        bons.forEach((b) => {
          if (!prevBonsRef.current.has(b.bon_id)) {
            prevBonsRef.current.add(b.bon_id);
            if (b.status === 'MENUNGGU' || b.status === 'DIAJUKAN') {
              pushNotification({
                title: 'Pengajuan Kasbon Baru',
                body: `${b.nama_karyawan} (${b.nama_cabang}) • Rp ${b.nominal.toLocaleString('id-ID')}`,
                category: 'KASBON'
              });
            }
          }
        });

        // Diff laporan shift baru
        laporans.forEach((l) => {
          if (!prevLaporanRef.current.has(l.laporan_id)) {
            prevLaporanRef.current.add(l.laporan_id);
            pushNotification({
              title: `Laporan Shift Masuk: ${l.nama_cabang || l.id_cabang}`,
              body: `${l.nama_karyawan || l.id_karyawan} • Setor Rp ${l.setor_uang.toLocaleString('id-ID')}`,
              category: 'LAPORAN'
            });
          }
        });
      } catch {
        // silent background check
      }
    };

    checkChanges();
    const timer = setInterval(checkChanges, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const unreadCount = logs.filter((l) => l.unread).length;

  const markAllRead = () => {
    saveLogs(logs.map((l) => ({ ...l, unread: false })));
  };

  const catBadge = (cat: NotifEntry['category']) => {
    switch (cat) {
      case 'BUKA':
        return { icon: <Store className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/15 border-emerald-500/30' };
      case 'TUTUP':
        return { icon: <Store className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/15 border-rose-500/30' };
      case 'KASBON':
        return { icon: <CreditCard className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/15 border-amber-500/30' };
      default:
        return { icon: <FileText className="w-4 h-4 text-sky-400" />, bg: 'bg-sky-500/15 border-sky-500/30' };
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* iOS Dynamic Island Floating Banner */}
      {banner && (
        <div
          onClick={() => {
            setBanner(null);
            setOpen(true);
            markAllRead();
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md ios-glass rounded-3xl px-4 py-3 border border-white/20 shadow-2xl cursor-pointer animate-fade-in flex items-center gap-3"
        >
          <div className={`p-2 rounded-2xl border ${catBadge(banner.category).bg}`}>
            {catBadge(banner.category).icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{banner.title}</div>
            <div className="text-[11px] text-slate-300 truncate">{banner.body}</div>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">{banner.time}</span>
        </div>
      )}

      {/* Bell Trigger */}
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) markAllRead();
        }}
        className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer"
        title="Notifikasi Outlet Buka/Tutup & Shift"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* iOS Popover Notification Center */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl ios-glass border border-white/15 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Notifikasi Outlet</span>
            </div>
            <div className="flex items-center gap-2">
              {permStatus === 'default' && (
                <button
                  onClick={requestBrowserNotif}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-semibold cursor-pointer"
                >
                  Aktifkan Alert
                </button>
              )}
              {logs.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Tandai dibaca"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => saveLogs([])}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada notifikasi baru. Pemberitahuan muncul otomatis saat outlet buka, tutup, kasbon baru, atau laporan shift masuk.
              </div>
            ) : (
              logs.map((n) => {
                const st = catBadge(n.category);
                return (
                  <div key={n.id} className="p-3.5 flex items-start gap-3 hover:bg-white/5 transition">
                    <div className={`p-2 rounded-xl border shrink-0 ${st.bg}`}>{st.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
