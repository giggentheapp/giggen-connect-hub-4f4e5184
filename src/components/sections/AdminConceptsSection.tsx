import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lightbulb, Plus, ChevronDown, Edit, X, Clock, Eye, EyeOff } from 'lucide-react';
import { ProfileConceptCard } from '@/components/ProfileConceptCard';
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
  
  console.log('🔧 ADMIN SECTION - All concepts (should show all):', {
    totalConcepts: concepts.length,
    concepts: concepts.map(c => ({
      title: c.title,
      id: c.id,
      is_published: c.is_published,
      status: c.status
    }))
  });
  
  const toggleConceptVisibility = async (conceptId: string, currentState: boolean) => {
    try {
      const newPublishedState = !currentState;
      
      console.log('🔄 TOGGLE START:', {
        conceptId,
        currentState,
        newPublishedState,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase
        .from('concepts')
        .update({ 
          is_published: newPublishedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', conceptId)
        .select();

      if (error) {
        console.error('❌ TOGGLE FAILED:', error);
        throw error;
      }

      console.log('✅ TOGGLE SUCCESS:', {
        conceptId,
        updatedData: data,
        newState: newPublishedState
      });

      toast({
        title: newPublishedState ? '✅ Tilbud publisert' : '🔒 Tilbud skjult',
        description: newPublishedState 
          ? 'Tilbudet er nå synlig på profilsiden' 
          : 'Tilbudet er nå skjult fra profilsiden',
      });
      
      await refetch();
      console.log('♻️ Refetch completed');
      
    } catch (error: any) {
      console.error('❌ TOGGLE ERROR:', error);
      toast({
        title: 'Kunne ikke endre synlighet',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('myOffers')}</h1>
          <p className="text-sm text-muted-foreground">{t('createAndManageOffers')}</p>
        </div>
        <Button onClick={() => navigate('/create-offer')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newOffer')}
        </Button>
      </div>

      {/* Published Offers */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Laster tilbud...</p>
          </div>
        ) : (
          <>
            {concepts.length > 0 ? (
              concepts.map(concept => (
                <div key={concept.id} className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 hover:border-border transition-all">
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div onClick={() => navigate(`/profile/${concept.maker_id}/concept/${concept.id}`)} className="cursor-pointer">
                        <h3 className="text-sm font-semibold truncate">{concept.title}</h3>
                        {concept.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {concept.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange"></span>
                            {concept.price ? `${concept.price} kr` : 'Etter avtale'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border shrink-0">
                      {concept.is_published ? (
                        <>
                          <Eye className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium">Offentlig</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Skjult</span>
                        </>
                      )}
                      <Switch
                        checked={concept.is_published}
                        onCheckedChange={() => toggleConceptVisibility(concept.id, concept.is_published)}
                        className="data-[state=checked]:bg-green-500 scale-75"
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteConcept(concept.id)}
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t('noOffersCreated')}
                </p>
                <Button onClick={() => navigate('/create-offer')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createFirstOffer')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drafts Section */}
      <Collapsible open={showDrafts} onOpenChange={setShowDrafts}>
        <div className="space-y-3">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Mine utkast ({drafts.length})</h2>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDrafts ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {draftsLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs text-muted-foreground">Laster utkast...</p>
              </div>
            ) : drafts.length > 0 ? (
              <div className="space-y-2">
                {drafts.map((draft) => {
                  const progress = calculateProgress(draft);
                  return (
                    <div key={draft.id} className="rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {draft.title || 'Nytt tilbud'}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Sist endret: {format(new Date(draft.updated_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-orange transition-all"
                                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/create-offer?edit=${draft.id}`)}
                            className="h-7 px-2 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Fortsett
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Ingen utkast for øyeblikket
                </p>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};