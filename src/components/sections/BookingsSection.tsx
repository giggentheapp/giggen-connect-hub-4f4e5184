import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { EnhancedBookingDetails } from '@/components/EnhancedBookingDetails';
import { BookingConfirmation } from '@/components/BookingConfirmation';
import { BookingAgreement } from '@/components/BookingAgreement';
import { ConceptViewModal } from '@/components/ConceptViewModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Inbox, Clock, Eye, Check } from 'lucide-react';
import { BookingActions } from '@/components/BookingActions';
import { BookingCardStep1 } from '@/components/BookingCardStep1';
import { BookingCardStep2 } from '@/components/BookingCardStep2';
import { BookingCardStep3 } from '@/components/BookingCardStep3';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface BookingsSectionProps {
  profile: UserProfile;
}

export const BookingsSection = ({ profile }: BookingsSectionProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [conceptViewOpen, setConceptViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'upcoming' | 'history'>('incoming');
  
  const { bookings, loading, updateBooking, refetch, fetchHistorical } = useBookings(profile.user_id);
  const { toast } = useToast();

  // New workflow-based filtering
  const incomingRequests = bookings.filter(b => 
    b.receiver_id === profile.user_id && b.status === 'pending'
  );
  const sentRequests = bookings.filter(b => 
    b.sender_id === profile.user_id && b.status === 'pending'
  );
  const ongoingAgreements = bookings.filter(b => 
    (b.sender_id === profile.user_id || b.receiver_id === profile.user_id) && 
    (b.status === 'allowed' || b.status === 'approved_by_sender' || b.status === 'approved_by_receiver' || b.status === 'approved_by_both')
  );
  const upcomingEvents = bookings.filter(b => 
    (b.sender_id === profile.user_id || b.receiver_id === profile.user_id) && 
    b.status === 'upcoming'
  );
  const historicalBookings = bookings.filter(b => 
    (b.sender_id === profile.user_id || b.receiver_id === profile.user_id) &&
    (b.status === 'cancelled' || b.status === 'completed')
  );

  // Helper functions for booking status display with new workflow
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'allowed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'both_parties_approved': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'upcoming': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Venter svar';
      case 'allowed': return 'Tillatt';
      case 'both_parties_approved': return 'Godkjent';
      case 'upcoming': return 'Publisert';
      case 'completed': return 'Gjennomført';
      case 'cancelled': return 'Avlyst';
      default: return status;
    }
  };

  const getPhaseText = (booking: any) => {
    switch (booking.status) {
      case 'pending':
        return booking.receiver_id === profile.user_id ? '1. Forespørsel' : 'Sendt forespørsel';
      case 'allowed':
        return '2. Pågående avtale - Kan redigeres';
      case 'both_parties_approved':
        return '2. Pågående avtale - Klar for publisering';
      case 'upcoming':
        return '3. Publisert arrangement';
      case 'completed':
        return 'Gjennomført';
      case 'cancelled':
        return 'Avlyst';
      default:
        return 'Ukjent status';
    }
  };

  const handleBookingAction = async () => {
    // Force refresh of bookings data and fetch historical if on history tab
    console.log('📄 Refreshing bookings after action...');
    try {
      if (activeTab === 'history') {
        await fetchHistorical();
      } else {
        await refetch();
      }
      console.log('✅ Bookings refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh bookings:', error);
      toast({
        title: "Kunne ikke oppdatere listen",
        description: "Prøv å oppdatere siden manuelt",
        variant: "destructive",
      });
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const handleDetailsClick = () => {
      setSelectedBooking(booking);
      setDetailsOpen(true);
    };

    const handleConceptClick = () => {
      setSelectedBooking(booking);
      setConceptViewOpen(true);
    };

    // Use different card components based on booking status
    if (booking.status === 'pending') {
      return (
        <BookingCardStep1
          booking={booking}
          currentUserId={profile.user_id}
          onDetailsClick={handleDetailsClick}
          onConceptClick={handleConceptClick}
          onAction={handleBookingAction}
        />
      );
    }

    if (booking.status === 'approved_by_both' || booking.status === 'upcoming') {
      return (
        <BookingCardStep2
          booking={booking}
          currentUserId={profile.user_id}
          onDetailsClick={handleDetailsClick}
          onConceptClick={handleConceptClick}
          onAction={handleBookingAction}
        />
      );
    }

    if (booking.status === 'upcoming') {
      return (
        <BookingCardStep3
          booking={booking}
          currentUserId={profile.user_id}
          onDetailsClick={handleDetailsClick}
          onConceptClick={handleConceptClick}
          onAction={handleBookingAction}
        />
      );
    }

    // Fallback for other statuses (cancelled, completed, etc.)
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{booking.title}</CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDetailsClick}>
              Se detaljer
            </Button>
            <BookingActions 
              booking={booking}
              currentUserId={profile.user_id}
              onAction={handleBookingAction}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Laster bookinger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Tab Navigation - New Workflow */}
      <div className="flex gap-2 border-b flex-wrap">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('incoming')}
          className="flex items-center gap-2"
        >
          <Inbox className="h-4 w-4" />
          Innkommende forespørsler ({incomingRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sent')}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Sendt forespørsel ({sentRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'ongoing' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('ongoing')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Pågående avtaler ({ongoingAgreements.length})
        </Button>
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('upcoming')}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Kommende arrangementer ({upcomingEvents.length})
        </Button>
        <Button 
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={async () => {
            setActiveTab('history');
            // Fetch historical bookings when switching to history tab
            try {
              await fetchHistorical();
            } catch (error) {
              console.error('Failed to fetch historical bookings:', error);
            }
          }}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Historikk ({historicalBookings.length})
        </Button>
      </div>

      {/* Bookings List - New Workflow */}
      <div className="space-y-4">
        {activeTab === 'incoming' && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Innkommende forespørsler</h3>
              <p className="text-sm text-muted-foreground">
                Forespørsler som venter på ditt svar. Kontaktinfo og dokumenter vises ikke før du tillater forespørselen.
              </p>
            </div>
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen innkommende forespørsler</p>
                </CardContent>
              </Card>
            ) : (
              incomingRequests.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </>
        )}

        {activeTab === 'sent' && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Sendt forespørsel</h3>
              <p className="text-sm text-muted-foreground">
                Forespørsler du har sendt som venter på svar fra mottakeren.
              </p>
            </div>
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen sendte forespørsler</p>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </>
        )}

        {activeTab === 'ongoing' && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Pågående avtaler</h3>
              <p className="text-sm text-muted-foreground">
                Tillatte avtaler hvor dere kan redigere detaljer og se hverandres kontaktinfo og dokumenter.
              </p>
            </div>
            {ongoingAgreements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen pågående avtaler</p>
                </CardContent>
              </Card>
            ) : (
              ongoingAgreements.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </>
        )}

        {activeTab === 'upcoming' && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Kommende arrangementer</h3>
              <p className="text-sm text-muted-foreground">
                Publiserte arrangementer som er synlige for andre brukere (med begrenset info). Avtaler er låst for redigering.
              </p>
            </div>
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen kommende arrangementer</p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Historikk</h3>
              <p className="text-sm text-muted-foreground">
                Avviste, avlyste eller slettede bookinger. Sensitiv data er fjernet for personvern.
              </p>
            </div>
            {historicalBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen historiske bookinger</p>
                </CardContent>
              </Card>
            ) : (
              historicalBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </>
        )}
      </div>

      {/* Enhanced Booking Details Dialog */}
      {selectedBooking && (
        <>
          <EnhancedBookingDetails
            bookingId={selectedBooking.id}
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
          />

          <ConceptViewModal
            isOpen={conceptViewOpen}
            onClose={() => setConceptViewOpen(false)}
            conceptIds={selectedBooking?.concept_ids || []}
            initialConceptIndex={0}
            showConceptActions={true}
            onConceptAction={(conceptId, action) => {
              console.log(`Concept ${conceptId} ${action}`);
              setConceptViewOpen(false);
              // Refresh bookings after concept action
              if (action === 'deleted' || action === 'rejected') {
                handleBookingAction();
              }
            }}
          />
        </>
      )}
    </div>
  );
};