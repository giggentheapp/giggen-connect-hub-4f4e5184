import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EventParticipant {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export interface BandParticipant {
  band_id: string;
  name: string;
  image_url: string | null;
}

export interface EventFormData {
  title: string;
  description?: string;
  banner_url?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  venue: string;
  address?: string;
  ticket_price?: string;
  has_paid_tickets: boolean;
  expected_audience?: string;
  participants: {
    musicians: EventParticipant[];
    bands: BandParticipant[];
    organizers: EventParticipant[];
  };
}

export const useCreateEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEvent = useMutation({
    mutationFn: async ({ eventData, userId, status = 'published' }: { 
      eventData: EventFormData; 
      userId: string;
      status?: 'draft' | 'published';
    }) => {
      // Combine date and time for event_datetime
      const eventDateTime = new Date(`${eventData.event_date}T${eventData.start_time}`);
      
      const payload = {
        title: eventData.title,
        description: eventData.description || null,
        banner_url: eventData.banner_url || null,
        event_datetime: eventDateTime.toISOString(),
        date: eventData.event_date,
        time: eventData.start_time,
        start_time: eventData.start_time,
        end_time: eventData.end_time || null,
        venue: eventData.venue,
        address: eventData.address || null,
        ticket_price: eventData.has_paid_tickets && eventData.ticket_price 
          ? parseFloat(eventData.ticket_price) 
          : null,
        has_paid_tickets: eventData.has_paid_tickets || false,
        expected_audience: eventData.expected_audience 
          ? parseInt(eventData.expected_audience) 
          : null,
        participants: eventData.participants as any, // Cast to Json type
        status: status,
        is_public: status === 'published',
        created_by: userId,
      };

      const { data, error } = await supabase
        .from('events_market')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      
      toast({
        title: variables.status === 'published' ? '✓ Arrangement opprettet' : '✓ Utkast lagret',
        description: variables.status === 'published' 
          ? 'Arrangementet er nå publisert' 
          : 'Dine endringer er trygt lagret',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved lagring',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ 
      eventId, 
      eventData, 
      status = 'published' 
    }: { 
      eventId: string; 
      eventData: EventFormData;
      status?: 'draft' | 'published';
    }) => {
      const eventDateTime = new Date(`${eventData.event_date}T${eventData.start_time}`);
      
      const payload = {
        title: eventData.title,
        description: eventData.description || null,
        banner_url: eventData.banner_url || null,
        event_datetime: eventDateTime.toISOString(),
        date: eventData.event_date,
        time: eventData.start_time,
        start_time: eventData.start_time,
        end_time: eventData.end_time || null,
        venue: eventData.venue,
        address: eventData.address || null,
        ticket_price: eventData.has_paid_tickets && eventData.ticket_price 
          ? parseFloat(eventData.ticket_price) 
          : null,
        has_paid_tickets: eventData.has_paid_tickets || false,
        expected_audience: eventData.expected_audience 
          ? parseInt(eventData.expected_audience) 
          : null,
        participants: eventData.participants as any, // Cast to Json type
        status: status,
        is_public: status === 'published',
      };

      const { error } = await supabase
        .from('events_market')
        .update(payload)
        .eq('id', eventId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      
      toast({
        title: variables.status === 'published' ? '✓ Arrangement oppdatert' : '✓ Utkast lagret',
        description: 'Endringene er lagret',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppdatering',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    isCreating: createEvent.isPending,
    isUpdating: updateEvent.isPending,
  };
};
