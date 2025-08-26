import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EventMarketItem {
  id: string;
  title: string;
  description: string | null;
  ticket_price: number | null;
  venue: string | null;
  date: string;
  time: string | null;
  is_public: boolean;
}

const GoerMap = () => {
  const [events, setEvents] = useState<EventMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventsWithVenues();
  }, []);

  const loadEventsWithVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("events_market")
        .select("id, title, description, ticket_price, venue, date, time, is_public")
        .eq("is_public", true)
        .not("venue", "is", null)
        .order("date", { ascending: true });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err: any) {
      console.error("Error loading events:", err);
      setError(err.message);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Arrangementskart</h1>
          <p className="text-muted-foreground">Se arrangementer på kartet</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Arrangementskart</h1>
          <p className="text-muted-foreground">Se arrangementer på kartet</p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">Feil ved lasting av arrangementer: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arrangementskart</h1>
        <p className="text-muted-foreground">Se arrangementer på kartet</p>
      </div>

      {/* Map Placeholder - Will be enhanced with actual map later */}
      <Card className="h-96 bg-muted/50">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Kart kommer snart</p>
            <p className="text-sm text-muted-foreground mt-2">
              {events.length} arrangementer med venue-informasjon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Arrangementer med venue</h2>
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Ingen arrangementer med venue-informasjon</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      På kart
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
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

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>

                    {event.ticket_price && (
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Billetter: {event.ticket_price} kr</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoerMap;