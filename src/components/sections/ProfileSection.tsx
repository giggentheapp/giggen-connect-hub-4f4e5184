import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, Folder, Lightbulb, Calendar } from 'lucide-react';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import ConceptCard from '@/components/ConceptCard';
import { UpcomingEventsSection } from '@/components/sections/UpcomingEventsSection';
import { useUserConcepts } from '@/hooks/useUserConcepts';
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
interface ProfileSectionProps {
  profile: UserProfile;
}
export const ProfileSection = ({
  profile
}: ProfileSectionProps) => {
  console.log('🚨 ProfileSection RENDERED for user:', profile.user_id);
  console.log('🚨 ProfileSection will call UpcomingEventsSection with isAdminView=true');
  
  const {
    concepts,
    loading: conceptsLoading
  } = useUserConcepts(profile.user_id);
  return <div className="space-y-6">
      {/* Basic Profile Info */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" /> : <User className="h-12 w-12 text-muted-foreground" />}
          </div>
          <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
          <CardDescription className="text-lg capitalize">{profile.role}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {profile.bio && <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Om meg
              </h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>}

          <div className="space-y-2">
            <h3 className="font-semibold">Profilinformasjon</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Rolle: {profile.role}</p>
              {profile.address && profile.is_address_public && <p>Lokasjon: {profile.address}</p>}
            </div>
          </div>

          
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Min Portefølje
          </CardTitle>
          <CardDescription>
            Slik vises porteføljen din til andre makere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePortfolioViewer userId={profile.user_id} isOwnProfile={true} />
        </CardContent>
      </Card>

      {/* Concepts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Mine Publiserte Konsepter
          </CardTitle>
          <CardDescription>
            Konseptene dine som er synlige for andre makere
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conceptsLoading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster konsepter...</p>
            </div> : concepts.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Ingen publiserte konsepter ennå</p>
              <p className="text-sm">Opprett og publiser konsepter for å vise dem her</p>
            </div> : <div className="space-y-4">
              {concepts.map(concept => <ConceptCard key={concept.id} concept={concept} showActions={false} />)}
            </div>}
        </CardContent>
      </Card>

      {/* Upcoming Events Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mine Kommende Arrangementer
          </CardTitle>
          <CardDescription>
            Arrangementer du er involvert i
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpcomingEventsSection profile={profile} isAdminView={true} />
        </CardContent>
      </Card>
    </div>;
};