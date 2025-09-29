import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafariErrorBoundary } from '@/components/SafariErrorBoundary';
import { BookingErrorBoundary } from '@/components/BookingErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Send, Inbox, Clock, Eye, Check } from 'lucide-react';
import { BookingActions } from '@/components/BookingActions';
import { BookingCardStep1 } from '@/components/BookingCardStep1';
import { BookingCardStep2 } from '@/components/BookingCardStep2';
import { BookingCardStep3 } from '@/components/BookingCardStep3';
import { BookingAgreementSummaryModal } from '@/components/BookingAgreementSummaryModal';
import { format } from 'date-fns';
import { SafeBookingsSection } from '@/components/SafeBookingsSection';
import { useNavigate, useLocation } from 'react-router-dom';
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'upcoming'>('incoming');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['incoming', 'sent', 'ongoing', 'upcoming'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location.search]);
  
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
      setIsDetailsModalOpen(true);
    };

    const handleEditClick = () => {
      navigate(`/booking/${booking.id}/edit`);
    };

    const handleConceptClick = () => {
      if (booking.concept_ids?.length > 0) {
        const firstConceptId = booking.concept_ids[0];
        navigate(`/concept/${firstConceptId}`, { state: { from: 'bookings' } });
      }
    };

    const handleConfirmationClick = () => {
      navigate(`/booking/${booking.id}/confirm`);
    };

    const handleAgreementClick = () => {
      navigate(`/booking/${booking.id}/agreement`);
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
        <div className="w-full h-full bg-background">
          {/* Tab Navigation Header */}
          <div className="p-3 md:p-4 bg-background border-b border-border/10 shrink-0">
            <div className="max-w-4xl mx-auto">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
                  <TabsTrigger value="incoming" className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    <span className="hidden sm:inline">Innkommende</span>
                    <Badge variant="secondary" className="text-xs">
                      {incomingRequests.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Sendt</span>
                    <Badge variant="secondary" className="text-xs">
                      {sentRequests.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="ongoing" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Pågående</span>
                    <Badge variant="secondary" className="text-xs">
                      {ongoingAgreements.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Publisert</span>
                    <Badge variant="secondary" className="text-xs">
                      {upcomingEvents.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} className="h-full">
              {/* Incoming Tab Content */}
              <TabsContent value="incoming" className="h-full m-0">
                <div className="flex-1 flex flex-col h-full">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-3 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">Innkommende forespørsler</h2>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {incomingRequests.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-6 md:py-12 px-3 md:px-6">
                             <Inbox className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-muted-foreground" />
                             <p className="text-muted-foreground text-sm md:text-base">Ingen innkommende forespørsler</p>
                           </CardContent>
                         </Card>
                      ) : (
                        incomingRequests.map((booking) => (
                          <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sent Tab Content */}
              <TabsContent value="sent" className="h-full m-0">
                <div className="flex-1 flex flex-col h-full">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-3 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">Sendte forespørsler</h2>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {sentRequests.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-6 md:py-12 px-3 md:px-6">
                             <Send className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-muted-foreground" />
                             <p className="text-muted-foreground text-sm md:text-base">Ingen sendte forespørsler</p>
                           </CardContent>
                         </Card>
                      ) : (
                        sentRequests.map((booking) => (
                          <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Ongoing Tab Content */}
              <TabsContent value="ongoing" className="h-full m-0">
                <div className="flex-1 flex flex-col h-full">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-3 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">Pågående avtaler</h2>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {ongoingAgreements.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-6 md:py-12 px-3 md:px-6">
                             <Clock className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-muted-foreground" />
                             <p className="text-muted-foreground text-sm md:text-base">Ingen pågående avtaler</p>
                           </CardContent>
                         </Card>
                      ) : (
                        ongoingAgreements.map((booking) => (
                          <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Published Tab Content */}
              <TabsContent value="upcoming" className="h-full m-0">
                <div className="flex-1 flex flex-col h-full">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-3 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">Publiserte arrangementer</h2>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
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
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </div>

        {/* Agreement Summary Modal */}
        {selectedBooking && (
          <BookingAgreementSummaryModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            currentUserId={profile.user_id}
          />
        )}
      </BookingErrorBoundary>
    </SafariErrorBoundary>
  );
};