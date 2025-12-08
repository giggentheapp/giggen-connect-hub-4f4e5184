import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BandFileManager from '@/components/BandFileManager';
import { Info } from 'lucide-react';

interface TechSpecTabProps {
  bandId?: string;
  userId: string;
}

export const TechSpecTab = ({ bandId, userId }: TechSpecTabProps) => {
  return (
    <>
      {!bandId && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Tekniske spesifikasjoner kan lastes opp etter at bandet er lagret
          </AlertDescription>
        </Alert>
      )}
      <BandFileManager
        bandId={bandId || ''}
        userId={userId}
        type="tech_spec"
        title="Tekniske spesifikasjoner"
        description="Last opp tekniske spesifikasjoner for bandet"
      />
    </>
  );
};
