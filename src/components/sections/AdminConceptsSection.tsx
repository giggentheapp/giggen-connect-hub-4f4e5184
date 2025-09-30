import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Plus } from 'lucide-react';
import { ConceptWizard } from '@/components/ConceptWizard';
import ConceptCard from '@/components/ConceptCard';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { supabase } from '@/integrations/supabase/client';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
interface AdminConceptsSectionProps {
  profile: UserProfile;
}
export const AdminConceptsSection = ({
  profile
}: AdminConceptsSectionProps) => {
  const { t } = useAppTranslation();
  const [showWizard, setShowWizard] = useState(false);
  const {
    concepts,
    loading,
    refetch
  } = useUserConcepts(profile.user_id);
  const handleDeleteConcept = async (conceptId: string) => {
    console.log('Attempting to delete concept with ID:', conceptId);
    try {
      const {
        error
      } = await supabase.from('concepts').delete().eq('id', conceptId);
      if (error) {
        console.error('Error deleting concept:', error);
        throw error;
      }
      console.log('Concept deleted successfully');
      refetch(); // Refresh the concepts list
    } catch (error: any) {
      console.error('Failed to delete concept:', error);
      throw error;
    }
  };
  return <div className="space-y-6">

      <Card className="bg-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('My Offers')}</span>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newOffer')}
            </Button>
          </CardTitle>
          <CardDescription>
            {t('createAndManageOffers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster tilbud...</p>
            </div> : <div className="space-y-4">
              {Array.isArray(concepts) ? concepts.filter(concept => concept && concept.id).map(concept => <ConceptCard key={concept.id} concept={concept} showActions={true} showConceptActions={true} onDelete={() => handleDeleteConcept(concept.id)} onConceptAction={action => {
            if (action === 'deleted' || action === 'rejected') {
              // Refresh the concepts list when a concept is deleted or rejected
              refetch();
            }
          }} />) : <></>}
              {concepts.length === 0 && <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {t('noOffersCreated')}
                  </p>
                  <Button onClick={() => setShowWizard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFirstOffer')}
                  </Button>
                </div>}
            </div>}
        </CardContent>
      </Card>

      <ConceptWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onSuccess={refetch} userId={profile.user_id} />
    </div>;
};