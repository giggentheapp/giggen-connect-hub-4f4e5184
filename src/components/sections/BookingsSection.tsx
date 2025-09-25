import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafariErrorBoundary } from '@/components/SafariErrorBoundary';
import { BookingErrorBoundary } from '@/components/BookingErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { EnhancedBookingDetails } from '@/components/EnhancedBookingDetails';
import { BookingEditModal } from '@/components/BookingEditModal';
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
import { SafeBookingsSection } from '@/components/SafeBookingsSection';
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
export const BookingsSection = ({
  profile
}: BookingsSectionProps) => {
  console.log('🔄 BookingsSection rendering for user:', profile.user_id);
  
  // Simplified state management
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [conceptViewOpen, setConceptViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'upcoming'>('incoming');
  
  // Hooks with error handling
  const { bookings, loading, updateBooking, refetch } = useBookings(profile.user_id);
  const { toast } = useToast();
  
  // Safe translation function
  const safeT = (key: string) => {
    try {
      return key; // Just return the key as fallback for now
    } catch (error) {
      console.warn('Translation failed for key:', key);
      return key;
    }
  };

  console.log('📊 Bookings data:', { 
    bookingsCount: bookings?.length || 0, 
    loading, 
    userId: profile.user_id 
  });

  // Safe filtering with error handling
  let incomingRequests: any[] = [];
  let sentRequests: any[] = [];
  let ongoingAgreements: any[] = [];
  let upcomingEvents: any[] = [];
  
  try {
    if (Array.isArray(bookings)) {
      incomingRequests = bookings.filter(b => 
        b?.receiver_id === profile.user_id && 
        b?.status === 'pending'
      );
      
      sentRequests = bookings.filter(b => 
        b?.sender_id === profile.user_id && 
        b?.status === 'pending'
      );
      
      ongoingAgreements = bookings.filter(b => 
        (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
        (b?.status === 'allowed' || b?.status === 'approved_by_sender' || b?.status === 'approved_by_receiver' || b?.status === 'approved_by_both')
      );
      
      upcomingEvents = bookings.filter(b => 
        (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
        b?.status === 'upcoming'
      );
    }
  } catch (error) {
    console.error('Error filtering bookings:', error);
  }
  
  // Remove historical bookings - we now permanently delete all bookings

  // Helper functions for booking status display with new workflow
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'allowed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved_by_sender':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'approved_by_receiver':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'approved_by_both':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'upcoming':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  const getStatusText = (status: string) => {
    try {
      switch (status) {
        case 'pending':
          return 'Venter på svar';
        case 'allowed':
          return 'Tillatt - kan redigeres';
        case 'approved_by_sender':
          return 'Godkjent av avsender';
        case 'approved_by_receiver':
          return 'Godkjent av mottaker';
        case 'approved_by_both':
          return 'Godkjent av begge';
        case 'upcoming':
          return 'Publisert';
        case 'completed':
          return 'Gjennomført';
        case 'cancelled':
          return 'Avlyst';
        default:
          return status;
      }
    } catch (error) {
      console.warn('Error in getStatusText:', error);
      return status;
    }
  };
  const getPhaseText = (booking: any) => {
    try {
      switch (booking?.status) {
        case 'pending':
          return booking.receiver_id === profile.user_id ? 'Mottatt forespørsel' : 'Sendt forespørsel';
        case 'allowed':
          return 'Forhandlingsfase - kan redigeres';
        case 'approved_by_sender':
          return 'Godkjent av avsender - venter på mottaker';
        case 'approved_by_receiver':
          return 'Godkjent av mottaker - venter på avsender';
        case 'approved_by_both':
          return 'Godkjent av begge - klar for publisering';
        case 'upcoming':
          return 'Publisert arrangement';
        case 'completed':
          return 'Gjennomført arrangement';
        case 'cancelled':
          return 'Avlyst arrangement';
        default:
          return 'Ukjent status';
      }
    } catch (error) {
      console.warn('Error in getPhaseText:', error);
      return 'Ukjent status';
    }
  };
  const handleBookingAction = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('❌ Failed to refresh bookings:', error);
      toast({
        title: safeT('couldNotUpdateList'),
        description: safeT('tryRefreshManually'),
        variant: "destructive"
      });
    }
  };
  const BookingCard = ({
    booking
  }: {
    booking: any;
  }) => {
    const handleDetailsClick = () => {
      setSelectedBooking(booking);
      setDetailsOpen(true);
    };

    const handleEditClick = () => {
      setSelectedBooking(booking);
      setEditOpen(true);
    };

    const handleConceptClick = () => {
      setSelectedBooking(booking);
      setConceptViewOpen(true);
    };

    const handleConfirmationClick = () => {
      setSelectedBooking(booking);
      setConfirmationOpen(true);
    };

    const handleAgreementClick = () => {
      setSelectedBooking(booking);
      setAgreementOpen(true);
    };

    // Use different card components based on booking status
    if (booking.status === 'pending') {
      return <BookingCardStep1 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onEditClick={handleEditClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} onConfirmationClick={handleConfirmationClick} onAgreementClick={handleAgreementClick} />;
    }
    if (booking.status === 'allowed' || booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver' || booking.status === 'approved_by_both') {
      return <BookingCardStep2 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onEditClick={handleEditClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} onConfirmationClick={handleConfirmationClick} onAgreementClick={handleAgreementClick} />;
    }
    if (booking.status === 'upcoming') {
      return <BookingCardStep3 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onEditClick={handleEditClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} onConfirmationClick={handleConfirmationClick} onAgreementClick={handleAgreementClick} />;
    }

    // Fallback for other statuses (cancelled, completed, etc.)
    return <Card className="booking-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{booking.title}</CardTitle>
              {booking.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {booking.description}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDetailsClick}>
                <Eye className="h-4 w-4 mr-1" />
                Se detaljer
              </Button>
              {booking.concept_ids && booking.concept_ids.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleConceptClick}
                >
                  Se tilbud
                </Button>
              )}
            </div>
            <BookingActions booking={booking} currentUserId={profile.user_id} onAction={handleBookingAction} />
          </div>
        </CardContent>
      </Card>;
  };
  // Simple loading state
  if (loading) {
    console.log('📱 Showing loading state');
    return (
      <div className="bookings-loading text-center py-8 min-h-[200px] flex flex-col justify-center">
        <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Bookings...</p>
      </div>
    );
  }

  // Use the original booking flow
  return (
    <SafariErrorBoundary>
      <BookingErrorBoundary>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b overflow-x-auto pb-2">
            <Button 
              variant={activeTab === 'incoming' ? 'default' : 'ghost'} 
              onClick={() => setActiveTab('incoming')} 
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Inbox className="h-4 w-4" />
              Innkommende ({incomingRequests.length})
            </Button>
            
            <Button 
              variant={activeTab === 'sent' ? 'default' : 'ghost'} 
              onClick={() => setActiveTab('sent')} 
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
              Sendt ({sentRequests.length})
            </Button>
            
            <Button 
              variant={activeTab === 'ongoing' ? 'default' : 'ghost'} 
              onClick={() => setActiveTab('ongoing')} 
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Clock className="h-4 w-4" />
              Pågående ({ongoingAgreements.length})
            </Button>
            
            <Button 
              variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
              onClick={() => setActiveTab('upcoming')} 
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Publisert ({upcomingEvents.length})
            </Button>
          </div>

          {/* Current Tab Content */}
          <div className="space-y-4">
            {activeTab === 'incoming' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Innkommende forespørsler</h3>
                {incomingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Ingen innkommende forespørsler</p>
                    </CardContent>
                  </Card>
                ) : (
                  incomingRequests.map((booking) => (
                    <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Sendte forespørsler</h3>
                {sentRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Ingen sendte forespørsler</p>
                    </CardContent>
                  </Card>
                ) : (
                  sentRequests.map((booking) => (
                    <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'ongoing' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Pågående avtaler</h3>
                {ongoingAgreements.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Ingen pågående avtaler</p>
                    </CardContent>
                  </Card>
                ) : (
                  ongoingAgreements.map((booking) => (
                    <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Publiserte arrangementer</h3>
                {upcomingEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Ingen publiserte arrangementer</p>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingEvents.map((booking) => (
                    <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Modals */}
          {selectedBooking && (
            <>
              <EnhancedBookingDetails
                bookingId={selectedBooking.id}
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
              />

              <BookingEditModal
                booking={selectedBooking}
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                currentUserId={profile.user_id}
                onSaved={handleBookingAction}
              />

              <BookingConfirmation
                booking={selectedBooking}
                isOpen={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                currentUserId={profile.user_id}
              />

              <BookingAgreement
                booking={selectedBooking}
                isOpen={agreementOpen}
                onClose={() => setAgreementOpen(false)}
                currentUserId={profile.user_id}
              />

              <ConceptViewModal
                isOpen={conceptViewOpen}
                onClose={() => setConceptViewOpen(false)}
                conceptIds={selectedBooking?.concept_ids || []}
                initialConceptIndex={selectedBooking?.concept_ids?.findIndex((id: string) => id === selectedBooking?.selected_concept_id) || 0}
              />
            </>
          )}
        </div>
      </BookingErrorBoundary>
    </SafariErrorBoundary>
  );
};