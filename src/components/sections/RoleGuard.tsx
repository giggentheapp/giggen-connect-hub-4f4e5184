import { ReactNode } from 'react';
import { useRole } from '@/contexts/RoleProvider';

interface RoleGuardProps {
  allowedRoles: ('maker' | 'goer')[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGuard = ({ allowedRoles, children, fallback = null }: RoleGuardProps) => {
  const { role, loading } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center py-4">Laster...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback;
  }

  return <>{children}</>;
};