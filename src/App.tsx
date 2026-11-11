import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';

// Bos / Executive Views
import { ExecutiveDashboardView } from './views/bos/ExecutiveDashboardView';
import { LiveOutletsView } from './views/bos/LiveOutletsView';
import { ShiftReconciliationView } from './views/bos/ShiftReconciliationView';
import { POSTransactionsView } from './views/bos/POSTransactionsView';
import { PayrollManagementView } from './views/bos/PayrollManagementView';
import { CashflowLedgerView } from './views/bos/CashflowLedgerView';
import { KasbonApprovalView } from './views/bos/KasbonApprovalView';
import { MasterCabangView } from './views/bos/MasterCabangView';
import { MasterKaryawanView } from './views/bos/MasterKaryawanView';
import { FlutterApiHubView } from './views/bos/FlutterApiHubView';
import { apiService } from './services/api';

const DashboardLayout: React.FC = () => {
  const { refreshAll, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingKasbon, setPendingKasbon] = useState<number>(0);

  const fetchBadgeCounts = async () => {
    try {
      const bons = await apiService.getBonList();
      setPendingKasbon(bons.filter((b) => b.status === 'DIAJUKAN').length);
    } catch (err) {
      console.warn('Failed fetching badge counts', err);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshAll(), fetchBadgeCounts()]);
    setIsRefreshing(false);
  };

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'live_outlets':
        return {
          title: 'Monitoring Outlet Gerai Live',
          subtitle: 'Status real-time outlet buka/tutup, presensi selfie staf, dan omzet harian.'
        };
      case 'laporan_shift':
        return {
          title: 'Audit & Rekonsiliasi Shift',
          subtitle: 'Audit fisik sisa roti, selisih stok, setoran uang tunai kasir, dan modal laci.'
        };
      case 'pos_transactions':
        return {
          title: 'Live Struk Transaksi Kasir POS',
          subtitle: 'Umpan langsung struk penjualan, porsi pesanan, dan metode bayar seluruh gerai.'
        };
      case 'payroll':
        return {
          title: 'Payroll Jam Kerja & Bonus Roti',
          subtitle: 'Perhitungan upah jam kerja, potongan kasbon otomatis, dan insentif target roti.'
        };
      case 'keuangan':
        return {
          title: 'Buku Kas & Arus Dana Pusat',
          subtitle: 'Pencatatan setoran shift otomatis dan pengeluaran belanja bahan grosir.'
        };
      case 'kasbon':
        return {
          title: 'Persetujuan Kasbon Karyawan',
          subtitle: 'Persetujuan pinjaman darurat staf dari mobile app dan pemotongan saat payroll.'
        };
      case 'master_cabang':
        return {
          title: 'Master Cabang & Titik Geofence GPS',
          subtitle: 'Koordinat GPS, radius presensi meter, jam operasional, dan info gerai.'
        };
      case 'master_karyawan':
        return {
          title: 'Master Personel & 2-Role System',
          subtitle: 'Pengaturan akun BOS (akses web HQ) dan KARYAWAN (Flutter mobile app).'
        };
      case 'mobile_api':
        return {
          title: 'Flutter Mobile API & Integration Hub',
          subtitle: 'Spesifikasi REST API, simulator endpoint mobile, dan kontrak client Dart.'
        };
      case 'dashboard':
      default:
        return {
          title: 'Ringkasan Eksekutif & KPI Bisnis',
          subtitle: 'Gambaran komprehensif penjualan roti, omzet, setoran fisik, dan laba operasional.'
        };
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'live_outlets':
        return <LiveOutletsView />;
      case 'laporan_shift':
        return <ShiftReconciliationView />;
      case 'pos_transactions':
        return <POSTransactionsView />;
      case 'payroll':
        return <PayrollManagementView />;
      case 'keuangan':
        return <CashflowLedgerView />;
      case 'kasbon':
        return <KasbonApprovalView />;
      case 'master_cabang':
        return <MasterCabangView />;
      case 'master_karyawan':
        return <MasterKaryawanView />;
      case 'mobile_api':
        return <FlutterApiHubView />;
      case 'dashboard':
      default:
        return <ExecutiveDashboardView />;
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#080b11] text-[#f1f5f9] flex overflow-x-hidden">
      {/* Desktop Frosted Glass Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingKasbonCount={pendingKasbon}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <HeaderBar
            title={headerMeta.title}
            subtitle={headerMeta.subtitle}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <div className="animate-fade-in pb-12">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DashboardLayout />
    </AuthProvider>
  );
}

export default App;
