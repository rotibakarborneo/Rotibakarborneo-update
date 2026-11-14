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
import { MasterMenuView } from './views/bos/MasterMenuView';
import { AiAssistantView } from './views/bos/AiAssistantView';
import { FlutterApiHubView } from './views/bos/FlutterApiHubView';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';
import { apiService } from './services/api';

const DashboardLayout: React.FC = () => {
  const { refreshAll } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [pendingKasbon, setPendingKasbon] = useState<number>(0);

  const fetchBadgeCounts = async () => {
    try {
      const bons = await apiService.getBonList();
      setPendingKasbon(
        bons.filter((b) => b.status === 'MENUNGGU' || b.status === 'DIAJUKAN').length
      );
    } catch (err) {
      console.warn('Failed fetching badge counts', err);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshAll(true), fetchBadgeCounts()]);
    setRefreshTick((t) => t + 1);
    setIsRefreshing(false);
  };

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'live_outlets':
        return { title: 'Monitoring Gerai' };
      case 'ai_assistant':
        return { title: 'Asisten AI Bos' };
      case 'laporan_shift':
        return { title: 'Rekonsiliasi Shift' };
      case 'pos_transactions':
        return { title: 'Transaksi Kasir' };
      case 'master_menu':
        return { title: 'Kelola Menu' };
      case 'payroll':
        return { title: 'Payroll' };
      case 'keuangan':
        return { title: 'Arus Kas' };
      case 'kasbon':
        return { title: 'Persetujuan Kasbon' };
      case 'master_cabang':
        return { title: 'Kelola Cabang' };
      case 'master_karyawan':
        return { title: 'Kelola Karyawan' };
      case 'mobile_api':
        return { title: 'API Mobile' };
      case 'dashboard':
      default:
        return { title: 'Dashboard' };
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'live_outlets':
        return <LiveOutletsView key={refreshTick} />;
      case 'ai_assistant':
        return <AiAssistantView />;
      case 'laporan_shift':
        return <ShiftReconciliationView key={refreshTick} />;
      case 'pos_transactions':
        return <POSTransactionsView key={refreshTick} />;
      case 'master_menu':
        return <MasterMenuView key={refreshTick} />;
      case 'payroll':
        return <PayrollManagementView key={refreshTick} />;
      case 'keuangan':
        return <CashflowLedgerView key={refreshTick} />;
      case 'kasbon':
        return <KasbonApprovalView key={refreshTick} />;
      case 'master_cabang':
        return <MasterCabangView key={refreshTick} />;
      case 'master_karyawan':
        return <MasterKaryawanView key={refreshTick} />;
      case 'mobile_api':
        return <FlutterApiHubView />;
      case 'dashboard':
      default:
        return <ExecutiveDashboardView key={refreshTick} />;
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#050811] text-[#f1f5f9] flex overflow-x-hidden relative">
      {/* Glowing Spherical 3D Orbs Behind Frosted Glass Cards */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Top-Right Warm Golden Amber Sphere */}
        <div
          className="absolute -top-12 right-[10%] w-64 h-64 sm:w-80 sm:h-80 rounded-full opacity-90"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #fde047 0%, #f59e0b 38%, #b45309 78%, #451a03 100%)',
            boxShadow: '0 0 90px 10px rgba(245, 158, 11, 0.25)'
          }}
        />

        {/* Bottom-Left Deep Ocean Blue Sphere Behind Sidebar */}
        <div
          className="absolute -bottom-24 -left-16 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full opacity-90"
          style={{
            background:
              'radial-gradient(circle at 38% 32%, #60a5fa 0%, #2563eb 42%, #1d4ed8 74%, #0f172a 100%)',
            boxShadow: '0 0 110px 15px rgba(37, 99, 235, 0.28)'
          }}
        />

        {/* Center-Bottom Emerald Teal Sphere Behind Cards */}
        <div
          className="absolute bottom-[8%] left-[42%] w-64 h-64 sm:w-80 sm:h-80 rounded-full opacity-80"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #34d399 0%, #10b981 45%, #047857 80%, #022c22 100%)',
            boxShadow: '0 0 90px 10px rgba(16, 185, 129, 0.22)'
          }}
        />

        {/* Center-Top Subtle Indigo Accent Sphere */}
        <div
          className="absolute top-[24%] left-[26%] w-44 h-44 rounded-full opacity-55"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #818cf8 0%, #4f46e5 55%, #1e1b4b 100%)',
            boxShadow: '0 0 70px 8px rgba(99, 102, 241, 0.18)'
          }}
        />
      </div>

      {/* Desktop Frosted Glass Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingKasbonCount={pendingKasbon}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto relative z-10">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <HeaderBar
            title={headerMeta.title}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <div className="animate-fade-in pb-12">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Drawer for Bos */}
      <FloatingAiAssistant />
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
