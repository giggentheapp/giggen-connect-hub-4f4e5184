import { ReactNode } from 'react';
import { useRole } from '@/contexts/RoleProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BookingGuardProps {
  children: ReactNode;
}

export const BookingGuard = ({ children }: BookingGuardProps) => {
  const { ismaker, loading } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center py-4">Laster...</div>;
  }

  if (!ismaker) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Kun makere har tilgang til booking-funksjoner. Denne funksjonen er ikke tilgjengelig for goers.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};