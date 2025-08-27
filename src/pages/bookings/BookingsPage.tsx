import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, DollarSign } from "lucide-react";

interface Booking {
  id: string;
  event_date: string;
  venue: string;
  status: string;
  created_at: string;
  goer_message?: string;
  maker_response?: string;
  description?: string;
  price_musician?: string;
  price_ticket?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Du må være logget inn",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .or(`goer_id.eq.${user.id},maker_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Feil ved lasting av bookinger",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Venter", className: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Godkjent", className: "bg-green-100 text-green-800" },
      rejected: { label: "Avvist", className: "bg-red-100 text-red-800" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800" 
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster bookinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Kommende arrangementer</h1>
          <p className="text-muted-foreground">
            Oversikt over dine bookingforespørsler
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen bookinger ennå</h3>
            <p className="text-muted-foreground">
              Dine bookingforespørsler vil vises her
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="bg-card p-6 rounded-lg border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {booking.description || 'Arrangement'}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.event_date).toLocaleDateString('no-NO')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.venue}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(booking.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                </div>

                {booking.goer_message && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Melding fra goer:</p>
                    <p className="text-sm">{booking.goer_message}</p>
                  </div>
                )}

                {booking.maker_response && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium mb-1">Svar fra maker:</p>
                    <p className="text-sm">{booking.maker_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}