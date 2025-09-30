import { ReactNode } from 'react';
import { useRole } from '@/contexts/RoleProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BookingGuardProps {
  children: ReactNode;
}

export const BookingGuard = ({ children }: BookingGuardProps) => {
  const { isArtist, loading } = useRole();

  if (loading) {
    return <div className="flex items-center justify-center py-4">Laster...</div>;
  }

  if (!isArtist) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Kun artister har tilgang til booking-funksjoner. Denne funksjonen er ikke tilgjengelig for audience.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};