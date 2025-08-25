import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileText, Lightbulb, Settings, Plus } from 'lucide-react';
import { ConceptWizard } from '@/components/ConceptWizard';
import ConceptCard from '@/components/ConceptCard';
import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';
import { SettingsSection } from '@/components/sections/SettingsSection';
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

interface AdminSectionProps {
  profile: UserProfile;
  initialTab?: string;
}

export const AdminSection = ({ profile, initialTab = 'files' }: AdminSectionProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState(profile);
  const { concepts, loading, refetch } = useUserConcepts(profile.user_id);
  const isMobile = useIsMobile();

  const handleDeleteConcept = async (conceptId: string) => {
    // This will be handled by the ConceptCard component
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrasjon</h1>
        <p className="text-muted-foreground">Administrer filer, konsepter og innstillinger</p>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className={isMobile ? "grid w-full grid-cols-3" : "grid w-full grid-cols-3 max-w-md"}>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {!isMobile && <span>Filer</span>}
          </TabsTrigger>
          <TabsTrigger value="concepts" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {!isMobile && <span>Konsepter</span>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {!isMobile && <span>Innstillinger</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filhåndtering</CardTitle>
              <CardDescription>
                Administrer portefølje, tekniske spesifikasjoner og hospitality riders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <ProfilePortfolioManager 
                  userId={profile.user_id}
                  title="Profilportefølje"
                  description="Last opp bilder, videoer og andre filer som viser frem ditt arbeid"
                />
              </div>
              
              <div>
                <TechSpecManager 
                  userId={profile.user_id}
                  title="Tekniske spesifikasjoner"
                  description="Last opp tekniske spesifikasjoner og rider-dokumenter"
                />
              </div>
              
              <div>
                <HospitalityRiderManager 
                  userId={profile.user_id}
                  title="Hospitality Riders"
                  description="Last opp hospitality rider-dokumenter for arrangementer"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concepts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mine Konsepter</span>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt konsept
                </Button>
              </CardTitle>
              <CardDescription>
                Opprett og administrer dine kreative konsepter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Laster konsepter...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {concepts.map((concept) => (
                    <ConceptCard 
                      key={concept.id}
                      concept={concept}
                      showActions={true}
                      onDelete={() => handleDeleteConcept(concept.id)}
                    />
                  ))}
                  {concepts.length === 0 && (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Du har ikke opprettet noen konsepter ennå
                      </p>
                      <Button onClick={() => setShowWizard(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Opprett ditt første konsept
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsSection 
            profile={updatedProfile} 
            onProfileUpdate={setUpdatedProfile}
          />
        </TabsContent>
      </Tabs>

      <ConceptWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={refetch}
        userId={profile.user_id}
      />
    </div>
  );
};