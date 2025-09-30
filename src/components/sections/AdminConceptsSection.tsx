import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Lightbulb, Plus, ChevronDown, FileText } from 'lucide-react';
import ConceptCard from '@/components/ConceptCard';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useUserDrafts } from '@/hooks/useUserDrafts';
import { supabase } from '@/integrations/supabase/client';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { cn } from '@/lib/utils';
interface AdminConceptsSectionProps {
  profile: UserProfile;
}
export const AdminConceptsSection = ({
  profile
}: AdminConceptsSectionProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const [showDrafts, setShowDrafts] = useState(false);
  const {
    concepts,
    loading,
    refetch
  } = useUserConcepts(profile.user_id);
  const {
    drafts,
    loading: draftsLoading,
    refetch: refetchDrafts
  } = useUserDrafts(profile.user_id);
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
      refetch();
      refetchDrafts();
    } catch (error: any) {
      console.error('Failed to delete concept:', error);
      throw error;
    }
  };

  const handleSuccess = () => {
    refetch();
    refetchDrafts();
  };

  const handleEdit = (conceptId: string) => {
    navigate(`/create-offer?edit=${conceptId}`);
  };

  const handleCreate = () => {
    navigate('/create-offer');
  };
  return <div className="space-y-6">

      <Card className="bg-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('My Offers')}</span>
            <Button onClick={handleCreate}>
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
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFirstOffer')}
                  </Button>
                </div>}
            </div>}
        </CardContent>
      </Card>

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <Collapsible open={showDrafts} onOpenChange={setShowDrafts}>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                <CardTitle className="flex items-center justify-between text-amber-900 dark:text-amber-100">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('drafts')} ({drafts.length})
                  </span>
                  <ChevronDown className={cn("h-5 w-5 transition-transform", showDrafts && "rotate-180")} />
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  {t('draftsDescription')}
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {draftsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-amber-700 dark:text-amber-300">Laster utkast...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drafts.map(draft => (
                      <ConceptCard
                        key={draft.id}
                        concept={draft}
                        showActions={true}
                        showConceptActions={true}
                        onDelete={() => handleDeleteConcept(draft.id)}
                        onEdit={handleEdit}
                        onConceptAction={action => {
                          if (action === 'deleted' || action === 'rejected') {
                            refetch();
                            refetchDrafts();
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>;
};