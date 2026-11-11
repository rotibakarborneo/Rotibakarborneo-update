import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cabang, Role } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  allCabang: Cabang[];
  selectedCabangId: string;
  setSelectedCabangId: (id: string) => void;
  refreshAll: () => Promise<void>;
  isLoading: boolean;
}

const defaultBos: User = {
  id_karyawan: 'BOS001',
  nama: 'H. Rahman Borneo',
  username: 'bos',
  role: 'BOS',
  id_cabang: 'CBG01',
  aktif: true,
  telepon: '0811-500-7890'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser] = useState<User>(defaultBos);
  const [allUsers, setAllUsers] = useState<User[]>([defaultBos]);
  const [allCabang, setAllCabang] = useState<Cabang[]>([]);
  const [selectedCabangId, setSelectedCabangId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAll = async () => {
    try {
      setIsLoading(true);
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
    refreshAll();
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
