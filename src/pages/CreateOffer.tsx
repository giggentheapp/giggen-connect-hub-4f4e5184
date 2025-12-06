import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConceptTypeSelector } from '@/components/ConceptTypeSelector';
import { TeachingWizard } from '@/components/wizards/TeachingWizard';
import { ArrangørTilbudWizard } from '@/components/wizards/ArrangørTilbudWizard';
import { SessionMusicianWizard } from '@/components/wizards/SessionMusicianWizard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { conceptService } from '@/services/conceptService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function CreateOffer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('edit');
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const userId = user?.id || '';
  const [conceptType, setConceptType] = useState<'session_musician' | 'teaching' | 'arrangør_tilbud' | null>(null);
  const [loading, setLoading] = useState(!!draftId);
  const [loadedConcept, setLoadedConcept] = useState<any>(null);

  // Load draft data if editing
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !userId) return;

      setLoading(true);
      try {
        const data = await conceptService.getById(draftId, true);
        if (!data) {
          throw new Error('Concept not found');
        }

        // Set concept type from database
        if (data.concept_type) {
          setConceptType(data.concept_type as 'session_musician' | 'teaching' | 'arrangør_tilbud');
          
          // Load concept files
          const files = await conceptService.getConceptFiles(draftId);

          if (data.concept_type === 'teaching') {
            // Teaching uses different structure
            setLoadedConcept({ 
              ...data, 
              concept_files: files,
              portfolio_files: files.map((file: any) => ({
                conceptFileId: file.id,
                filebankId: null,
                filename: file.filename,
                file_path: file.file_path,
                file_type: file.file_type,
                mime_type: file.mime_type,
                file_size: file.file_size,
                file_url: file.file_url,
                publicUrl: file.file_url,
                title: file.title || file.filename,
                thumbnail_path: file.thumbnail_path,
                uploadedAt: file.created_at
              }))
            });
          } else {
            // Session musician and arrangør use same structure
            const portfolioFiles = files.map((file: any) => ({
              conceptFileId: file.id,
              filebankId: null,
              filename: file.filename,
              file_path: file.file_path,
              file_type: file.file_type,
              mime_type: file.mime_type,
              file_size: file.file_size,
              file_url: file.file_url,
              publicUrl: file.file_url,
              title: file.title || file.filename,
              thumbnail_path: file.thumbnail_path,
              uploadedAt: file.created_at
            }));

            // Transform available_dates
            const availableDates = data.available_dates 
              ? (typeof data.available_dates === 'string' 
                  ? JSON.parse(data.available_dates) 
                  : data.available_dates)
              : null;

            const isIndefinite = availableDates && typeof availableDates === 'object' && 'indefinite' in availableDates;
            const dateArray = Array.isArray(availableDates) ? availableDates : [];

            setLoadedConcept({
              ...data,
              available_dates: dateArray.map((d: any) => new Date(d)),
              portfolio_files: portfolioFiles,
              is_indefinite: isIndefinite,
              pricing_type: data.door_deal ? 'door_deal' : data.price_by_agreement ? 'by_agreement' : 'fixed',
              door_percentage: data.door_percentage?.toString() || '',
              ticket_price: data.ticket_price?.toString() || '',
            });
          }

          toast({
            title: 'Utkast lastet',
            description: 'Fortsett der du slapp',
          });
        }
      } catch (error: any) {
        console.error('Error loading draft:', error);
        toast({
          title: 'Kunne ikke laste utkast',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [draftId, userId, toast]);

  // Stable callbacks to prevent wizard re-initialization
  const handleTeachingSuccess = useCallback(() => {
    toast({
      title: 'Suksess!',
      description: 'Undervisningsavtalen er lagret',
    });
    navigate(`/profile/${userId}?section=dashboard`);
  }, [toast, navigate, userId]);

  const handleTeachingBack = useCallback(() => {
    if (!draftId) {
      setConceptType(null);
    } else {
      navigate(`/profile/${userId}?section=dashboard`);
    }
  }, [draftId, navigate, userId]);

  const handleArrangørSuccess = useCallback(() => {
    toast({
      title: '🎉 Tilbud publisert!',
      description: 'Ditt arrangør-tilbud er nå synlig for musikere',
    });
    navigate(`/profile/${userId}?section=dashboard`);
  }, [toast, navigate, userId]);

  const handleArrangørBack = useCallback(() => {
    if (!draftId) {
      setConceptType(null);
    } else {
      navigate(`/profile/${userId}?section=dashboard`);
    }
  }, [draftId, navigate, userId]);

  const handleSessionSuccess = useCallback(() => {
    toast({
      title: '🎉 Tilbud publisert!',
      description: 'Ditt tilbud er nå synlig for andre',
    });
    navigate(`/profile/${userId}?section=dashboard`);
  }, [toast, navigate, userId]);

  const handleSessionBack = useCallback(() => {
    if (!draftId) {
      setConceptType(null);
    } else {
      navigate(`/profile/${userId}?section=dashboard`);
    }
  }, [draftId, navigate, userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show type selector if no type selected */}
      {!conceptType && !draftId && (
        <div className="container mx-auto px-4 py-16">
          <ConceptTypeSelector 
            onSelect={(type) => {
              console.log('CreateOffer: Setting concept type to:', type);
              setConceptType(type);
            }}
            onBack={() => navigate(-1)}
          />
        </div>
      )}

      {/* Show Teaching Wizard */}
      {conceptType === 'teaching' && (
        <div className="container mx-auto px-4 py-8">
          <TeachingWizard
            userId={userId}
            existingConcept={loadedConcept}
            onSuccess={handleTeachingSuccess}
            onBack={handleTeachingBack}
          />
        </div>
      )}

      {/* Show Arrangør Tilbud Wizard */}
      {conceptType === 'arrangør_tilbud' && (
        <ArrangørTilbudWizard
          userId={userId}
          onSuccess={handleArrangørSuccess}
          onBack={handleArrangørBack}
          existingConcept={loadedConcept}
        />
      )}

      {/* Show Session Musician Wizard */}
      {conceptType === 'session_musician' && (
        <>
          {console.log('CreateOffer: Rendering SessionMusicianWizard with userId:', userId, 'existingConcept:', loadedConcept)}
          <SessionMusicianWizard
            userId={userId}
            onSuccess={handleSessionSuccess}
            onBack={handleSessionBack}
            existingConcept={loadedConcept}
          />
        </>
      )}
    </div>
  );
}
