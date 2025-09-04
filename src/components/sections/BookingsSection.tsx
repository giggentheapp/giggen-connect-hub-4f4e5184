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
import { Calendar, MapPin, DollarSign, Send, Inbox, Clock, Eye, Check } from 'lucide-react';
import { BookingActions } from '@/components/BookingActions';
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
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'confirmed' | 'history'>('received');
  
  const { bookings, loading, updateBooking, refetch } = useBookings(profile.user_id);
  const { toast } = useToast();

  const sentBookings = bookings.filter(b => b.sender_id === profile.user_id);
  const receivedBookings = bookings.filter(b => b.receiver_id === profile.user_id);
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'published');
  const historicalBookings = bookings.filter(b => b.status === 'rejected');

  // Helper functions for booking status display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Venter svar';
      case 'confirmed': return 'Bekreftet';
      case 'published': return 'Publisert';
      case 'rejected': return 'Avvist';
      default: return status;
    }
  };

  const getPhaseText = (booking: any) => {
    if (booking.status === 'pending') {
      return 'Venter på svar';
    } else if (booking.status === 'confirmed') {
      return 'Bekreftet - Klar for publisering';
    } else if (booking.status === 'published') {
      return 'Ferdig: Publisert';
    } else if (booking.status === 'rejected') {
      return 'Avvist';
    }
    return 'Ukjent fase';
  };

  const handleBookingAction = async () => {
    // Force refresh of bookings data instead of page reload
    console.log('📄 Refreshing bookings after action...');
    try {
      await refetch();
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

  const BookingCard = ({ booking }: { booking: any }) => (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => {
          setSelectedBooking(booking);
          setDetailsOpen(true);
        }}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.title}</CardTitle>
            <CardDescription>
              {booking.description && (
                <span className="block">{booking.description}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getPhaseText(booking)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{booking.venue}</span>
            </div>
          )}
          
          {(booking.price_musician || booking.price_ticket) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                {booking.price_musician && `Musiker: ${booking.price_musician}`}
                {booking.price_musician && booking.price_ticket && ' • '}
                {booking.price_ticket && `Billett: ${booking.price_ticket}`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-4">
              <span>Opprettet: {format(new Date(booking.created_at), 'dd.MM.yyyy')}</span>
              {booking.updated_at !== booking.created_at && (
                <span>Oppdatert: {format(new Date(booking.updated_at), 'dd.MM.yyyy')}</span>
              )}
            </div>
            <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBooking(booking);
                    setDetailsOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detaljer
                </Button>
              
              {booking.concept_ids && booking.concept_ids.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBooking(booking);
                    setConceptViewOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Se konsept{booking.concept_ids.length > 1 ? 'er' : ''}
                </Button>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <BookingActions 
                  booking={booking}
                  currentUserId={profile.user_id}
                  onAction={handleBookingAction}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button 
          variant={activeTab === 'received' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('received')}
          className="flex items-center gap-2"
        >
          <Inbox className="h-4 w-4" />
          Mottatt ({receivedBookings.length})
        </Button>
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sent')}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Sendt ({sentBookings.length})
        </Button>
        <Button 
          variant={activeTab === 'confirmed' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('confirmed')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Bekreftet ({confirmedBookings.length})
        </Button>
        <Button 
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Historikk ({historicalBookings.length})
        </Button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {activeTab === 'received' && (
          <>
            {receivedBookings.filter(b => b.status !== 'rejected').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen mottatte forespørsler</p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(receivedBookings) ? receivedBookings
                .filter(booking => booking && booking.id && booking.status !== 'rejected')
                .map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                )) : <></>
            )}
          </>
        )}

        {activeTab === 'sent' && (
          <>
            {sentBookings.filter(b => b.status !== 'rejected').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen sendte forespørsler</p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(sentBookings) ? sentBookings
                .filter(booking => booking && booking.id && booking.status !== 'rejected')
                .map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                )) : <></>
            )}
          </>
        )}

        {activeTab === 'confirmed' && (
          <>
            {confirmedBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen bekreftede arrangementer</p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(confirmedBookings) ? confirmedBookings.filter(booking => booking && booking.id).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              )) : <></>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {historicalBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Ingen historiske bookinger</p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(historicalBookings) ? historicalBookings.filter(booking => booking && booking.id).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              )) : <></>
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