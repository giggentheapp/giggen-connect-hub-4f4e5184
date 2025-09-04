import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Clock, Check, X, AlertTriangle, Bell } from 'lucide-react';

interface BookingChangeHistoryPanelProps {
  bookingId: string;
  currentUserId: string;
  booking: any;
}

interface BookingChange {
  id: string;
  booking_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const BookingChangeHistoryPanel = ({ bookingId, currentUserId, booking }: BookingChangeHistoryPanelProps) => {
  const [changes, setChanges] = useState<BookingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const { approveChange, rejectChange } = useBookings();
  const { toast } = useToast();

  const fetchChanges = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_changes')
        .select('*')
        .eq('booking_id', bookingId)
        .order('change_timestamp', { ascending: false });

      if (error) throw error;
      setChanges((data || []) as BookingChange[]);
    } catch (error: any) {
      console.error('Error fetching changes:', error);
      toast({
        title: "Feil ved lasting av endringer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [bookingId]);

  // Real-time subscription for changes
  useEffect(() => {
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_changes',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChanges(prev => [payload.new as BookingChange, ...prev]);
            
            // Show notification for new changes from other user
            if (payload.new.changed_by !== currentUserId) {
              toast({
                title: "Ny endring foreslått! 📝",
                description: `${payload.new.field_name} er foreslått endret`,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setChanges(prev => prev.map(change => 
              change.id === payload.new.id ? payload.new as BookingChange : change
            ));
            
            // Show notification for status updates
            if (payload.new.changed_by !== currentUserId) {
              const status = payload.new.status;
              if (status === 'accepted') {
                toast({
                  title: "Endring godkjent! ✅",
                  description: `Din endring til ${payload.new.field_name} er godkjent`,
                });
              } else if (status === 'rejected') {
                toast({
                  title: "Endring avvist ❌",
                  description: `Din endring til ${payload.new.field_name} er avvist`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, currentUserId, toast]);

  const handleApproveChange = async (change: BookingChange) => {
    await approveChange(change.id, bookingId, change.field_name, change.new_value);
    fetchChanges();
  };

  const handleRejectChange = async (changeId: string) => {
    await rejectChange(changeId);
    fetchChanges();
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: Record<string, string> = {
      title: 'Tittel',
      description: 'Beskrivelse',
      venue: 'Spillested',
      event_date: 'Dato',
      time: 'Klokkeslett',
      audience_estimate: 'Publikumsestimat',
      ticket_price: 'Billettpris',
      artist_fee: 'Artist honorar',
      personal_message: 'Personlig melding',
      hospitality_rider_status: 'Hospitality rider status'
    };
    return fieldNames[fieldName] || fieldName;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const pendingChanges = changes.filter(change => change.status === 'pending');
  const historicalChanges = changes.filter(change => change.status !== 'pending');

  if (loading) {
    return <div className="text-center p-4">Laster endringer...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Changes Section */}
      {pendingChanges.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Bell className="h-5 w-5" />
              Ventende endringer ({pendingChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingChanges.map((change) => (
              <div key={change.id} className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(change.status)}>
                        {change.status === 'pending' ? 'Venter' : change.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getFieldDisplayName(change.field_name)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Fra:</span>
                        <span className="font-mono bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                          {change.old_value || 'ikke satt'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Til:</span>
                        <span className="font-mono bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                          {change.new_value || 'ikke satt'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(change.change_timestamp), 'dd.MM.yyyy HH:mm')}
                      <span>•</span>
                      <span>{change.changed_by === currentUserId ? 'Dine endringer' : 'Andres endringer'}</span>
                    </div>
                  </div>

                  {/* Action buttons - only show if this change was made by someone else */}
                  {change.changed_by !== currentUserId && change.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Check className="h-4 w-4 mr-1" />
                            Godkjenn
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Godkjenn endring</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil godkjenne denne endringen til {getFieldDisplayName(change.field_name)}?
                              Dette vil oppdatere booking med den nye verdien.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApproveChange(change)}>
                              Godkjenn endring
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <X className="h-4 w-4 mr-1" />
                            Avvis
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Avvis endring</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil avvise denne endringen til {getFieldDisplayName(change.field_name)}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRejectChange(change.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Avvis endring
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Historical Changes Section */}
      {historicalChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Endringshistorikk ({historicalChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historicalChanges.map((change) => (
              <div key={change.id} className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(change.status)}>
                      {change.status === 'accepted' ? 'Godkjent' : 'Avvist'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getFieldDisplayName(change.field_name)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(change.change_timestamp), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    {change.old_value || 'ikke satt'} → {change.new_value || 'ikke satt'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {changes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ingen endringer ennå</p>
            <p className="text-sm text-muted-foreground mt-1">
              Endringer som foreslås vil vises her for godkjenning
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};