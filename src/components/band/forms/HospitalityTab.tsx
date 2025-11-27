import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BandHospitalityManager from '@/components/BandHospitalityManager';
import { Info } from 'lucide-react';

interface HospitalityTabProps {
  bandId?: string;
  userId: string;
}

export const HospitalityTab = ({ bandId, userId }: HospitalityTabProps) => {
  return (
    <>
      {!bandId && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Hospitality rider kan lastes opp etter at bandet er lagret
          </AlertDescription>
        </Alert>
      )}
      <BandHospitalityManager
        bandId={bandId || ''}
        userId={userId}
        title="Hospitality Rider"
        description="Last opp hospitality rider for bandet"
      />
    </>
  );
};
