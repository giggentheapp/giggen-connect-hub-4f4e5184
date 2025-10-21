import React, { ReactNode, createContext, useContext } from 'react';
import { useRoleData } from '@/hooks/useRole';

interface RoleContextType {
  role: 'MUSIKER' | 'ARRANGØR' | null;
  loading: boolean;
  error: string | null;
  isOrganizer: boolean;
  isMusician: boolean;
  refresh: () => void;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  loading: true,
  error: null,
  isOrganizer: false,
  isMusician: false,
  refresh: () => {},
});

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const roleData = useRoleData();

  return (
    <RoleContext.Provider value={roleData}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};