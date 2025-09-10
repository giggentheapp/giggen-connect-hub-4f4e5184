import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

interface BookingChangeHistoryPanelProps {
  bookingId: string;
  currentUserId: string;
  booking: any;
}

export const BookingChangeHistoryPanel = ({
  bookingId,
  currentUserId,
  booking
}: BookingChangeHistoryPanelProps) => {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        // For now, create a simple change history based on booking data
        const changeHistory = [
          {
            id: 1,
            timestamp: booking.created_at,
            user_id: booking.sender_id,
            action: 'Booking opprettet',
            details: `Forespørsel sendt for "${booking.title}"`
          }
        ];

        if (booking.updated_at !== booking.created_at) {
          changeHistory.push({
            id: 2,
            timestamp: booking.updated_at,
            user_id: currentUserId,
            action: 'Booking oppdatert',
            details: 'Detaljer ble endret'
          });
        }

        setChanges(changeHistory);
      } catch (error) {
        console.error('Error fetching change history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [bookingId, booking, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Endringshistorikk
          </CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <p className="text-muted-foreground">Ingen endringer registrert ennå.</p>
          ) : (
            <div className="space-y-4">
              {changes.map((change) => (
                <div key={change.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{change.action}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(change.timestamp).toLocaleString('nb-NO')}
                      </span>
                    </div>
                    <p className="text-sm">{change.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};