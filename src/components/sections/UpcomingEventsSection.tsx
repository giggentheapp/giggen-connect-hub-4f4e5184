import { useNavigate } from 'react-router-dom';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, DollarSign, Eye, EyeOff, FileText, CalendarCheck, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpcomingEventsSectionProps {
  profile: UserProfile;
}

export const UpcomingEventsSection = ({ profile }: UpcomingEventsSectionProps) => {
  const navigate = useNavigate();
  const { events, loading, error, refetch } = useUpcomingEvents(profile.user_id);
  const { toast } = useToast();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const handleMoveToHistory = async (eventId: string, eventTitle: string, isFromMarket: boolean) => {
    setUpdatingIds(prev => new Set(prev).add(eventId));
    
    try {
      if (isFromMarket) {
        // Update events_market status to completed
        const { error } = await supabase
          .from('events_market')
          .update({ status: 'completed' })
          .eq('id', eventId);

        if (error) throw error;
      } else {
        // Update bookings status to completed
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', eventId);

        if (error) throw error;
      }

      toast({
        title: "Flyttet til historikk",
        description: `"${eventTitle}" er nå arkivert`,
      });

      refetch();
    } catch (error: any) {
      console.error('Error moving to history:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke flytte arrangement til historikk",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const handleToggleVisibility = async (eventId: string, currentVisibility: boolean, isFromMarket: boolean) => {
    setUpdatingIds(prev => new Set(prev).add(eventId));
    
    try {
      if (isFromMarket) {
        // Update in events_market
        const { error } = await supabase
          .from('events_market')
          .update({ is_public: !currentVisibility })
          .eq('id', eventId);

        if (error) throw error;
      } else {
        // Update in bookings
        const { error } = await supabase
          .from('bookings')
          .update({ is_public_after_approval: !currentVisibility })
          .eq('id', eventId);

        if (error) throw error;
      }

      toast({
        title: currentVisibility ? "Skjult" : "Synlig",
        description: currentVisibility ? "Arrangementet er nå skjult" : "Arrangementet er nå synlig",
      });

      refetch();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke endre synlighet",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

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
    <div className="flex flex-col h-full p-6">
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
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 pb-4">
            {events.map((event) => {
            const isUpdating = updatingIds.has(event.id);
            const isFromMarket = !event.is_sender && !event.is_receiver;
            const currentVisibility = isFromMarket ? event.is_public_after_approval : event.is_public_after_approval;
            
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>
                        {event.is_sender && 'Du er sender'}
                        {event.is_receiver && 'Du er mottaker'}
                        {isFromMarket && 'Admin-opprettet'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Kommende
                      </Badge>
                    </div>

                    {/* Admin Actions */}
                    <div className="space-y-2">
                      {/* Visibility Toggle */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {currentVisibility ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {currentVisibility ? 'Synlig' : 'Skjult'}
                          </span>
                        </div>
                        <Switch
                          checked={currentVisibility}
                          onCheckedChange={() => handleToggleVisibility(event.id, currentVisibility, isFromMarket)}
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {!isFromMarket && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => navigate(`/booking/${event.id}`)}
                            disabled={isUpdating}
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
                          disabled={isUpdating}
                        >
                          <CalendarCheck className="h-3 w-3 mr-1" />
                          Se arrangement
                        </Button>
                      </div>

                      {/* Move to History - available for all event types */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleMoveToHistory(event.id, event.title, isFromMarket)}
                        disabled={isUpdating}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        {isUpdating ? 'Behandler...' : 'Legg til i historikk'}
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
