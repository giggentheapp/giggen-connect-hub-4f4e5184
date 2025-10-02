import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from "date-fns";
import { nb } from "date-fns/locale";

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
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventMarketItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    console.log('EventMarket: Navigating to public event view', { eventId });
    navigate(`/arrangement/${eventId}`);
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
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Ingen offentlige arrangementer tilgjengelig</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleEventClick(event.id)}
            >
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold line-clamp-2">{event.title}</h3>
                
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                  
                  {event.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatEventTime(event.time)}</span>
                    </div>
                  )}

                  {event.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};