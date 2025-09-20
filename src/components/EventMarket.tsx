import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Banknote, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { EventModal } from "@/components/EventModal";

interface EventMarketItem {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  date: string;
  time: string | null;
  is_public: boolean;
}

export const EventMarket = () => {
  const [events, setEvents] = useState<EventMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    loadPublicEvents();
  }, []);

  const loadPublicEvents = async () => {
    try {
      setLoading(true);
      // Security: Only select non-sensitive fields for public events
      const { data, error } = await supabase
        .from("events_market")
        .select("id, title, description, venue, date, time, is_public")
        .eq("is_public", true)
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  const handleEventClick = (eventId: string) => {
    console.log('EventMarket: Event card clicked', { eventId });
    setSelectedEventId(eventId);
    setIsEventModalOpen(true);
  };

  const handleEventModalClose = () => {
    console.log('EventMarket: Event modal closed');
    setIsEventModalOpen(false);
    setSelectedEventId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Arrangementsmarked</h1>
          <p className="text-muted-foreground">Se alle offentlige arrangementer</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arrangementsmarked</h1>
        <p className="text-muted-foreground">Se alle offentlige arrangementer</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Ingen offentlige arrangementer tilgjengelig</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleEventClick(event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                    Offentlig
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatEventDate(event.date)}</span>
                    {event.time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{formatEventTime(event.time)}</span>
                      </>
                    )}
                  </div>

                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  )}

                  {/* Security: Ticket prices removed from public display */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EventModal 
        isOpen={isEventModalOpen}
        onClose={handleEventModalClose}
        eventId={selectedEventId}
      />
    </div>
  );
};