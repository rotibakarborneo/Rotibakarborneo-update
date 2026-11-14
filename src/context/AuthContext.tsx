import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cabang, Role } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  allCabang: Cabang[];
  selectedCabangId: string;
  setSelectedCabangId: (id: string) => void;
  refreshAll: (triggerSync?: boolean) => Promise<void>;
  isLoading: boolean;
}

const defaultBos: User = {
  id_karyawan: 'ADM001',
  nama: 'Faqih',
  username: 'admin',
  role: 'BOS',
  id_cabang: 'CBG01',
  aktif: true,
  tarif_per_jam: 6820,
  foto_profil_url: 'https://lh3.googleusercontent.com/d/1FzfOK7KjRNV0Ks-M9l6mcCcVJvC90h7p',
  telepon: '0812-5100-9988'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser] = useState<User>(defaultBos);
  const [allUsers, setAllUsers] = useState<User[]>([defaultBos]);
  const [allCabang, setAllCabang] = useState<Cabang[]>([]);
  const [selectedCabangId, setSelectedCabangId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAll = async (triggerSync: boolean = false) => {
    try {
      setIsLoading(true);
      if (triggerSync) {
        await apiService.syncSheets().catch(() => null);
      }
      const [cabangData, karyawanData] = await Promise.all([
        apiService.getCabangList(),
        apiService.getKaryawanList()
      ]);
      setAllCabang(cabangData);
      setAllUsers(karyawanData);
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        allCabang,
        selectedCabangId,
        setSelectedCabangId,
        refreshAll,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
