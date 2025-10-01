import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { UpcomingEventCard } from '@/components/UpcomingEventCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Eye, EyeOff } from 'lucide-react';

interface UpcomingEventsDisplayProps {
  userId: string;
}

export const UpcomingEventsDisplay = ({ userId }: UpcomingEventsDisplayProps) => {
  const { events, loading, error, refetch } = useUpcomingEvents(userId);

  const toggleEventVisibility = async (eventId: string, currentState: boolean) => {
    try {
      const newPublicState = !currentState;
      
      const { error } = await supabase
        .from('bookings')
        .update({ is_public_after_approval: newPublicState })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(
        newPublicState 
          ? 'Arrangementet er nå offentlig' 
          : 'Arrangementet er nå skjult'
      );
      
      refetch();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error('Kunne ikke endre synlighet');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 md:py-8">
        <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2 md:mb-4"></div>
        <p className="text-muted-foreground text-sm md:text-base">Laster kommende arrangementer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 md:py-8 text-destructive">
        <p className="text-sm md:text-base">Kunne ikke laste arrangementer: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-4 md:py-8">
        <Calendar className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm md:text-base">Ingen kommende arrangementer</p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Publiserte bookinger vil vises her
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-3">
          <div className="flex-1">
            <UpcomingEventCard event={event} />
          </div>
          <div className="flex flex-col items-center gap-2 bg-muted/30 rounded-lg p-3 border min-w-[100px]">
            <Label htmlFor={`event-visibility-${event.id}`} className="text-xs font-medium text-center">
              {event.is_public_after_approval ? (
                <div className="flex flex-col items-center gap-1">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span>Offentlig</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span>Skjult</span>
                </div>
              )}
            </Label>
            <Switch
              id={`event-visibility-${event.id}`}
              checked={event.is_public_after_approval ?? false}
              onCheckedChange={() => toggleEventVisibility(event.id, event.is_public_after_approval ?? false)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
};