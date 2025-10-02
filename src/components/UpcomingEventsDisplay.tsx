import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { UpcomingEventCard } from '@/components/UpcomingEventCard';
import { Calendar } from 'lucide-react';

interface UpcomingEventsDisplayProps {
  userId: string;
}

export const UpcomingEventsDisplay = ({ userId }: UpcomingEventsDisplayProps) => {
  const { events, loading, error } = useUpcomingEvents(userId);

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
        <UpcomingEventCard key={event.id} event={event} />
      ))}
    </div>
  );
};