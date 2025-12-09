import { useNavigate } from 'react-router-dom';
import { useCompletedEvents } from '@/hooks/useCompletedEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, DollarSign, Archive, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { UserProfile } from '@/types/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { navigateToProfile } from '@/lib/navigation';

interface HistorySectionProps {
  profile: UserProfile;
}

export const HistorySection = ({ profile }: HistorySectionProps) => {
  const navigate = useNavigate();
  const { events, loading, error } = useCompletedEvents(profile.user_id);

  if (loading) {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster historikk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full p-6">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Kunne ikke laste historikk: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Historikk</h1>
        <p className="text-muted-foreground">
          Fullførte arrangementer fra bookingflyten og admin-opprettede events
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Ingen arrangementer i historikk</h3>
            <p className="text-muted-foreground mb-6">
              Fullførte arrangementer vil vises her
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigateToProfile(navigate, profile.user_id, 'upcoming-events', false)}>
                Se kommende arrangementer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 pb-4">
            {events.map((event) => {
              const isFromMarket = !event.is_sender && !event.is_receiver;
              
              return (
                <Card key={event.id} className="hover:border-primary/50 transition-all group">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {event.title}
                      </CardTitle>
                      {event.has_paid_tickets && (
                        <Badge variant="secondary" className="shrink-0">
                          Betalt
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                            {event.audience_estimate} publikum
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
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>
                          {event.is_sender && 'Du var sender'}
                          {event.is_receiver && 'Du var mottaker'}
                          {isFromMarket && 'Admin-opprettet'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Archive className="h-3 w-3 mr-1" />
                          Fullført
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {!isFromMarket && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => navigate(`/booking/${event.id}/view`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Se avtale
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={!isFromMarket ? "w-full text-xs" : "col-span-2 text-xs"}
                          onClick={() => navigate(`/arrangement/${event.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Vis arrangement
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
