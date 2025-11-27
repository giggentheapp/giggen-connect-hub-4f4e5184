import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BandPortfolioManager from '@/components/BandPortfolioManager';
import { Info } from 'lucide-react';

interface PortfolioTabProps {
  bandId?: string;
  userId: string;
}

export const PortfolioTab = ({ bandId, userId }: PortfolioTabProps) => {
  return (
    <>
      {!bandId && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Portfolio kan lastes opp etter at bandet er lagret
          </AlertDescription>
        </Alert>
      )}
      <BandPortfolioManager
        bandId={bandId || ''}
        userId={userId}
        title="Portfolio"
        description="Last opp bilder, videoer og annet materiale"
      />
    </>
  );
};
