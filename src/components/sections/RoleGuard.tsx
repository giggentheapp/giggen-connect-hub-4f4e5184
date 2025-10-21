import { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: ('MUSIKER' | 'ARRANGØR')[];
  children: ReactNode;
  fallback?: ReactNode;
}

// RoleGuard is now a passthrough - all users have access to all features
export const RoleGuard = ({ children }: RoleGuardProps) => {
  return <>{children}</>;
};