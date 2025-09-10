import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
        // For now, create a simple change history based on booking status
        const changeHistory = [
          {
            id: 1,
            timestamp: booking.created_at,
            action: 'Booking opprettet',
            user_id: booking.sender_id,
            details: 'Booking ble opprettet og sendt til mottaker'
          },
          ...(booking.updated_at !== booking.created_at ? [{
            id: 2,
            timestamp: booking.updated_at,
            action: 'Booking oppdatert',
            user_id: currentUserId,
            details: 'Booking detaljer ble endret'
          }] : [])
        ];

        setChanges(changeHistory);
      } catch (error) {
        console.error('Error fetching booking changes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [bookingId, booking, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Ingen endringer registrert</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <Card key={change.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {change.action}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(change.timestamp), 'dd.MM.yyyy HH:mm')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {change.details}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bruker ID: {change.user_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};