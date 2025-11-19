import { useNavigate } from 'react-router-dom';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { UserProfile } from '@/types/auth';

interface UpcomingEventsSectionProps {
  profile: UserProfile;
}

export const UpcomingEventsSection = ({ profile }: UpcomingEventsSectionProps) => {
  const navigate = useNavigate();
  const { events, loading, error } = useUpcomingEvents(profile.user_id);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Kunne ikke laste arrangementer: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Kommende arrangementer</h1>
        <p className="text-muted-foreground">
          Arrangementer fra bookingflyten og admin-opprettede events
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Ingen kommende arrangementer</h3>
            <p className="text-muted-foreground mb-6">
              Publiserte bookinger og events vil vises her
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard?section=bookings')}>
                Gå til bookinger
              </Button>
              <Button variant="outline" onClick={() => navigate('/create-event')}>
                Opprett nytt arrangement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/arrangement/${event.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </CardTitle>
                  {event.has_paid_tickets && (
                    <Badge variant="secondary" className="shrink-0">
                      Betalt
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2">
                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium">
                        {format(new Date(event.event_date), 'dd. MMMM yyyy', { locale: nb })}
                      </span>
                    </div>
                  )}

                  {event.time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{event.time}</span>
                    </div>
                  )}

                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">{event.venue}</span>
                    </div>
                  )}

                  {event.audience_estimate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {event.audience_estimate} forventet publikum
                      </span>
                    </div>
                  )}

                  {event.ticket_price && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{event.ticket_price} kr</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {event.is_sender && 'Du er sender'}
                      {event.is_receiver && 'Du er mottaker'}
                      {!event.is_sender && !event.is_receiver && 'Admin-opprettet'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Kommende
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
