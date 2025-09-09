import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';
interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}
interface AdminFilesSectionProps {
  profile: UserProfile;
}
export const AdminFilesSection = ({
  profile
}: AdminFilesSectionProps) => {
  return <div className="space-y-6">

      <Card className="bg-slate-200">
        <CardHeader>
          <CardTitle>Filhåndtering</CardTitle>
          <CardDescription>
            Administrer portefølje, tekniske spesifikasjoner og hospitality riders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <ProfilePortfolioManager userId={profile.user_id} title="Profilportefølje" description="Last opp bilder, videoer og andre filer som viser frem ditt arbeid" />
          </div>
          
          <div>
            <TechSpecManager userId={profile.user_id} title="Tekniske spesifikasjoner" description="Last opp tekniske spesifikasjoner og rider-dokumenter" />
          </div>
          
          <div>
            <HospitalityRiderManager userId={profile.user_id} title="Hospitality Riders" description="Last opp hospitality rider-dokumenter for arrangementer" />
          </div>
        </CardContent>
      </Card>
    </div>;
};