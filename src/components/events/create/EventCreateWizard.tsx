import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EventFormData, useCreateEvent } from '@/hooks/useCreateEvent';
import { EventCreateModalA } from './EventCreateModalA';
import { EventCreateModalB } from './EventCreateModalB';
import { EventCreateModalC } from './EventCreateModalC';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const EventCreateWizard = () => {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createEvent, updateEvent, isCreating, isUpdating } = useCreateEvent();
  const [currentModal, setCurrentModal] = useState<'A' | 'B' | 'C'>('A');
  const [userId, setUserId] = useState<string>('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    description: '',
    banner_url: '',
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    address: '',
    ticket_price: '',
    has_paid_tickets: false,
    expected_audience: '',
    participants: {
      musicians: [],
      bands: [],
      organizers: [],
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (draftId && userId) {
      loadDraft();
    }
  }, [draftId, userId]);

  const loadDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('events_market')
        .select('*')
        .eq('id', draftId)
        .eq('created_by', userId)
        .eq('status', 'draft')
        .single();

      if (error) throw error;

      if (data) {
        // Parse participants from Json type
        let participants = {
          musicians: [],
          bands: [],
          organizers: [],
        };
        
        if (data.participants) {
          try {
            const parsed = typeof data.participants === 'string' 
              ? JSON.parse(data.participants) 
              : data.participants;
            participants = parsed as any;
          } catch (e) {
            console.error('Error parsing participants:', e);
          }
        }

        setEventData({
          title: data.title,
          description: data.description || '',
          banner_url: (data as any).banner_url || '',
          event_date: data.date,
          start_time: (data as any).start_time || data.time || '',
          end_time: (data as any).end_time || '',
          venue: data.venue || '',
          address: (data as any).address || '',
          ticket_price: data.ticket_price ? data.ticket_price.toString() : '',
          has_paid_tickets: data.has_paid_tickets || false,
          expected_audience: data.expected_audience ? data.expected_audience.toString() : '',
          participants: participants,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Feil ved lasting av utkast',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!eventData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        description: 'Du må legge til en tittel',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData.event_date) {
      toast({
        title: 'Dato påkrevd',
        description: 'Du må velge en dato',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData.venue) {
      toast({
        title: 'Venue påkrevd',
        description: 'Du må legge til venue',
        variant: 'destructive',
      });
      return;
    }

    if (eventData.has_paid_tickets && !eventData.ticket_price) {
      toast({
        title: 'Billettpris påkrevd',
        description: 'Du må sette billettpris når billettsalg er aktivert',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (draftId) {
        await updateEvent({ eventId: draftId, eventData, status: 'published' });
        setCreatedEventId(draftId);
      } else {
        const result = await new Promise<{ id: string }>((resolve, reject) => {
          createEvent(
            { eventData, userId, status: 'published' },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });
        setCreatedEventId(result.id);
      }
      setIsDraft(false);
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: ['user-event-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      // Error is handled in the hook
      console.error('Error publishing event:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!eventData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        description: 'Du må legge til en tittel før du lagrer',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (draftId) {
        await updateEvent({ eventId: draftId, eventData, status: 'draft' });
        setCreatedEventId(draftId);
      } else {
        const result = await new Promise<{ id: string }>((resolve, reject) => {
          createEvent(
            { eventData, userId, status: 'draft' },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });
        setCreatedEventId(result.id);
      }
      setIsDraft(true);
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: ['user-event-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      // Error is handled in the hook
      console.error('Error saving draft:', error);
    }
  };

  const handleSuccessDialogAction = () => {
    setShowSuccessDialog(false);
    if (isDraft) {
      navigate(`/profile/${userId}?section=dashboard`);
    } else if (createdEventId) {
      navigate(`/arrangement/${createdEventId}`);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/events')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-2xl font-bold">Opprett arrangement</h1>
          <div className="flex gap-2 mt-4">
            <div className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              currentModal === 'A' || currentModal === 'B' || currentModal === 'C' ? 'bg-primary' : 'bg-muted'
            )} />
            <div className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              currentModal === 'B' || currentModal === 'C' ? 'bg-primary' : 'bg-muted'
            )} />
            <div className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              currentModal === 'C' ? 'bg-primary' : 'bg-muted'
            )} />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {currentModal === 'A' && (
          <EventCreateModalA
            onNext={() => setCurrentModal('B')}
            eventData={eventData}
            setEventData={setEventData}
            userId={userId}
          />
        )}

        {currentModal === 'B' && (
          <EventCreateModalB
            onNext={() => setCurrentModal('C')}
            onBack={() => setCurrentModal('A')}
            eventData={eventData}
            setEventData={setEventData}
            userId={userId}
          />
        )}

        {currentModal === 'C' && (
          <EventCreateModalC
            onBack={() => setCurrentModal('B')}
            eventData={eventData}
            userId={userId}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            isCreating={isCreating || isUpdating}
          />
        )}
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDraft ? 'Utkast lagret!' : 'Arrangement opprettet!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDraft
                ? 'Arrangementet er lagret som utkast. Du kan fortsette å redigere det senere.'
                : 'Arrangementet er nå publisert og synlig for alle.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessDialogAction}>
              {isDraft ? 'Gå til dashboard' : 'Se arrangement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
