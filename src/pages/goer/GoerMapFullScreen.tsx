import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function GoerMapFullScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events_market")
        .select("*")
        .eq("is_public", true);

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Feil ved lasting av arrangementer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 p-4">
          <Link 
            to="/goer" 
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til dashboard
          </Link>
          <h1 className="text-lg font-semibold">Arrangementskart</h1>
        </div>
      </div>

      {/* Map Container */}
      <div className="pt-16 h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster kart...</p>
            </div>
          </div>
        ) : (
          <div className="h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Kart kommer snart</h3>
              <p className="text-muted-foreground mb-4">
                Fant {events.length} arrangementer å vise på kartet
              </p>
              <div className="text-sm text-muted-foreground">
                Mapbox-integrasjon implementeres her
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}