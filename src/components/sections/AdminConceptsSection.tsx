import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Plus } from 'lucide-react';
import { ConceptWizard } from '@/components/ConceptWizard';
import ConceptCard from '@/components/ConceptCard';
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

interface AdminConceptsSectionProps {
  profile: UserProfile;
}

export const AdminConceptsSection = ({ profile }: AdminConceptsSectionProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const { concepts, loading, refetch } = useUserConcepts(profile.user_id);

  const handleDeleteConcept = async (conceptId: string) => {
    // This will be handled by the ConceptCard component
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mine Konsepter</h1>
        <p className="text-muted-foreground">Opprett og administrer dine kreative konsepter</p>
      </div>

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

      <ConceptWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={refetch}
        userId={profile.user_id}
      />
    </div>
  );
};