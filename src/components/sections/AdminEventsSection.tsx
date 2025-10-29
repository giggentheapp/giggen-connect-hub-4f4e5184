import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Eye, EyeOff } from 'lucide-react';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface AdminEventsSectionProps {
  profile: UserProfile;
}

export const AdminEventsSection = ({ profile }: AdminEventsSectionProps) => {
  const { events, loading, refetch } = useUpcomingEvents(profile.user_id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleEventVisibility = async (eventId: string, eventTitle: string, currentState: boolean) => {
    try {
      const newVisibilityState = !currentState;
      
      console.log('🔄 Toggling event visibility:', { eventId, eventTitle, currentState, newVisibilityState });
      
      // Update bookings table
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          is_public_after_approval: newVisibilityState
        })
        .eq('id', eventId);

      if (bookingError) {
        console.error('❌ Failed to update booking:', bookingError);
        throw bookingError;
      }

      console.log('✅ Booking updated successfully');

      // Get booking details for matching
      const { data: booking } = await supabase
        .from('bookings')
        .select('title, event_date')
        .eq('id', eventId)
        .single();

      if (booking) {
        const eventDate = booking.event_date ? new Date(booking.event_date).toISOString().split('T')[0] : null;
        
        console.log('🔍 Updating ALL events_market with title:', booking.title);

        // Update ALL events_market rows that match this title (regardless of created_by)
        // This handles cases where duplicates were created
        const { data: updated, error: marketError } = await supabase
          .from('events_market')
          .update({ 
            is_public: newVisibilityState
          })
          .eq('title', booking.title)
          .select();

        if (marketError) {
          console.error('❌ Could not update events_market:', marketError);
        } else {
          console.log('✅ Events_market updated:', updated?.length, 'rows');
        }
      }

      toast({
        title: newVisibilityState ? '✅ Arrangement vist offentlig' : '🔒 Arrangement skjult fra offentlig visning',
        description: newVisibilityState 
          ? `"${eventTitle}" er nå synlig for alle i Explore` 
          : `"${eventTitle}" er nå skjult fra offentlig visning`,
      });
      
      await refetch();
      
    } catch (error: any) {
      console.error('❌ Toggle visibility error:', error);
      toast({
        title: 'Kunne ikke endre synlighet',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mine Arrangementer</h1>
            <p className="text-sm text-muted-foreground">Administrer synlighet for dine arrangementer</p>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Laster arrangementer...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event: any) => (
              <div key={event.id} className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 hover:border-border transition-all">
                <div className="flex items-start gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div 
                      onClick={() => navigate(`/arrangement/${event.id}`)}
                      className="cursor-pointer"
                    >
                      <h3 className="text-sm font-semibold truncate">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        {event.event_date && (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange"></span>
                            {format(new Date(event.event_date), 'dd.MM.yyyy')}
                          </span>
                        )}
                        {event.venue && (
                          <span className="inline-flex items-center gap-1">
                            <span>•</span>
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border shrink-0">
                    {event.is_public_after_approval ? (
                      <>
                        <Eye className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium">Offentlig</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">Skjult</span>
                      </>
                    )}
                    <Switch
                      checked={event.is_public_after_approval}
                      onCheckedChange={() => toggleEventVisibility(event.id, event.title, event.is_public_after_approval)}
                      className="data-[state=checked]:bg-green-500 scale-75"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Du har ingen kommende arrangementer ennå
            </p>
          </div>
        )}
      </div>
    </div>
  );
};