import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Lightbulb, Plus, ChevronDown, Edit, Trash2, Clock } from 'lucide-react';
import ConceptCard from '@/components/ConceptCard';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useUserDrafts } from '@/hooks/useUserDrafts';
import { supabase } from '@/integrations/supabase/client';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
interface AdminConceptsSectionProps {
  profile: UserProfile;
}
export const AdminConceptsSection = ({
  profile
}: AdminConceptsSectionProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDrafts, setShowDrafts] = useState(true);
  
  const { concepts, loading, refetch } = useUserConcepts(profile.user_id);
  const { drafts, loading: draftsLoading, refetch: refetchDrafts } = useUserDrafts(profile.user_id);
  const handleDeleteConcept = async (conceptId: string) => {
    try {
      const { error } = await supabase.from('concepts').delete().eq('id', conceptId);
      if (error) throw error;
      
      toast({
        title: 'Tilbud slettet',
        description: 'Tilbudet er permanent fjernet',
      });
      
      refetch();
    } catch (error: any) {
      console.error('Failed to delete concept:', error);
      toast({
        title: 'Kunne ikke slette',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      // Delete associated files first
      const { data: files } = await supabase
        .from('concept_files')
        .select('file_path')
        .eq('concept_id', draftId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => f.file_path);
        await supabase.storage.from('concept-drafts').remove(filePaths);
      }

      // Delete concept_files records
      await supabase.from('concept_files').delete().eq('concept_id', draftId);

      // Delete the draft
      const { error } = await supabase.from('concepts').delete().eq('id', draftId);
      if (error) throw error;

      toast({
        title: 'Utkast slettet',
        description: 'Utkastet er permanent fjernet',
      });

      refetchDrafts();
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      toast({
        title: 'Kunne ikke slette utkast',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calculateProgress = (draft: any) => {
    let completed = 0;
    const total = 6;

    if (draft.title) completed++;
    if (draft.expected_audience && (draft.price || draft.door_percentage || draft.price_by_agreement)) completed++;
    // Portfolio is optional but counted
    completed++;
    // Tech specs are optional but counted
    completed++;
    if (draft.available_dates) completed++;
    // Preview step
    if (draft.is_published) completed++;

    return { completed, total };
  };
  return <div className="space-y-6">

      {/* Published Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('My Offers')}</span>
            <Button onClick={() => navigate('/create-offer')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newOffer')}
            </Button>
          </CardTitle>
          <CardDescription>
            {t('createAndManageOffers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster tilbud...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {concepts.length > 0 ? (
                concepts.map(concept => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    showActions={true}
                    showConceptActions={true}
                    onDelete={() => handleDeleteConcept(concept.id)}
                    onConceptAction={(action) => {
                      if (action === 'deleted' || action === 'rejected') {
                        refetch();
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {t('noOffersCreated')}
                  </p>
                  <Button onClick={() => navigate('/create-offer')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFirstOffer')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drafts Section */}
      <Card>
        <Collapsible open={showDrafts} onOpenChange={setShowDrafts}>
          <CardHeader>
            <CollapsibleTrigger className="w-full">
              <CardTitle className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mine utkast ({drafts.length})
                </span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${showDrafts ? 'rotate-180' : ''}`}
                />
              </CardTitle>
            </CollapsibleTrigger>
            <CardDescription>
              Uferdige tilbud som du kan fortsette på
            </CardDescription>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              {draftsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Laster utkast...</p>
                </div>
              ) : drafts.length > 0 ? (
                <div className="grid gap-4">
                  {drafts.map((draft) => {
                    const progress = calculateProgress(draft);
                    return (
                      <Card key={draft.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">
                                {draft.title || 'Nytt tilbud'}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Sist endret: {format(new Date(draft.updated_at), 'PPp', { locale: nb })}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {progress.completed}/{progress.total} steg
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/create-offer?edit=${draft.id}`)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Fortsett
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDraft(draft.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Ingen utkast for øyeblikket
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>;
};