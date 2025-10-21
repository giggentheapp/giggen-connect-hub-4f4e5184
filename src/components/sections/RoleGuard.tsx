import { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: ('musiker' | 'arrangør')[];
  children: ReactNode;
  fallback?: ReactNode;
}

// RoleGuard is now a passthrough - all users have access to all features
export const RoleGuard = ({ children }: RoleGuardProps) => {
  return <>{children}</>;
};