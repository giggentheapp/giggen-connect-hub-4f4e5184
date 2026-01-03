import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingErrorBoundary } from '@/components/BookingErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Send, Inbox, Clock, Eye, CheckCircle } from 'lucide-react';
import { BookingActions } from '@/components/BookingActions';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { BookingCardStep1 } from '@/components/BookingCardStep1';
import { BookingCardStep2 } from '@/components/BookingCardStep2';
import { BookingCardStep3 } from '@/components/BookingCardStep3';
import { BookingEditModal } from '@/components/BookingEditModal';
import { BookingConfirmation } from '@/components/BookingConfirmation';
import { BookingAgreement } from '@/components/BookingAgreement';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BookingsSectionProps {
  profile: UserProfile;
}

export const BookingsSection = ({
  profile
}: BookingsSectionProps) => {
  console.log('🔄 BookingsSection rendering for user:', profile.user_id);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'approved'>('incoming');
  const [tabCounts, setTabCounts] = useState({
    incoming: 0,
    sent: 0,
    ongoing: 0,
    approved: 0
  });
  
  // Modal states
  const [editModalBookingId, setEditModalBookingId] = useState<string | null>(null);
  const [confirmModalBookingId, setConfirmModalBookingId] = useState<string | null>(null);
  const [agreementModalBookingId, setAgreementModalBookingId] = useState<string | null>(null);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || params.get('section');
    if (tab && ['incoming', 'sent', 'ongoing', 'approved'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location.search]);
  
  // Hooks with error handling
  const { bookings, loading, updateBooking, refetch } = useBookings(profile.user_id);
  const { toast } = useToast();

  console.log('📊 Bookings data:', { 
    bookingsCount: bookings?.length || 0, 
    loading, 
    userId: profile.user_id 
  });

  // Safe filtering with error handling
  let incomingRequests: any[] = [];
  let sentRequests: any[] = [];
  let ongoingAgreements: any[] = [];
  let approvedAgreements: any[] = [];
  
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
      
      // Ongoing: in negotiation phase (allowed, approved_by_sender, approved_by_receiver)
      ongoingAgreements = bookings.filter(b => 
        (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
        (b?.status === 'allowed' || b?.status === 'approved_by_sender' || b?.status === 'approved_by_receiver')
      );
      
      // Approved: both parties approved, ready for event creation
      approvedAgreements = bookings.filter(b => 
        (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
        b?.status === 'approved_by_both'
      );
    }
  } catch (error) {
    console.error('Error filtering bookings:', error);
  }

  // Update tab counts in useEffect to avoid setState during render
  useEffect(() => {
    setTabCounts({
      incoming: incomingRequests.length,
      sent: sentRequests.length,
      ongoing: ongoingAgreements.length,
      approved: approvedAgreements.length
    });
  }, [bookings, profile.user_id]);

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
          return t('bookings.statusTexts.waitingForResponse');
        case 'allowed':
          return t('bookings.statusTexts.allowedEditable');
        case 'approved_by_sender':
          return t('bookings.statusTexts.approvedBySender');
        case 'approved_by_receiver':
          return t('bookings.statusTexts.approvedByReceiver');
        case 'approved_by_both':
          return t('bookings.statusTexts.approvedByBoth');
        case 'upcoming':
          return t('bookings.statusTexts.published');
        case 'completed':
          return t('bookings.statusTexts.completed');
        case 'cancelled':
          return t('bookings.statusTexts.cancelled');
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
          return booking.receiver_id === profile.user_id ? t('bookings.phaseTexts.receivedRequest') : t('bookings.phaseTexts.sentRequest');
        case 'allowed':
          return t('bookings.phaseTexts.negotiationPhase');
        case 'approved_by_sender':
          return t('bookings.phaseTexts.approvedBySenderWaiting');
        case 'approved_by_receiver':
          return t('bookings.phaseTexts.approvedByReceiverWaiting');
        case 'approved_by_both':
          return t('bookings.phaseTexts.approvedByBothReady');
        case 'upcoming':
          return t('bookings.phaseTexts.publishedEvent');
        case 'completed':
          return t('bookings.phaseTexts.completedEvent');
        case 'cancelled':
          return t('bookings.phaseTexts.cancelledEvent');
        default:
          return t('bookings.phaseTexts.unknownStatus');
      }
    } catch (error) {
      console.warn('Error in getPhaseText:', error);
      return t('bookings.phaseTexts.unknownStatus');
    }
  };
  const handleBookingAction = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh bookings:', error);
      toast({
        title: t('bookings.couldNotUpdateList'),
        description: t('bookings.tryRefreshManually'),
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
      navigate(`/booking/${booking.id}/view`);
    };

    const handleEditClick = () => {
      setEditModalBookingId(booking.id);
    };

    const handleConceptClick = () => {
      if (booking.concept_ids?.length > 0) {
        const firstConceptId = booking.concept_ids[0];
        const isReceiver = profile?.user_id === booking.receiver_id;
        
        // Receivers see public view, senders/owners see admin view
        if (isReceiver) {
          navigate(`/profile/${booking.sender_id}/concept/${firstConceptId}`, { state: { from: 'bookings' } });
        } else {
          navigate(`/concept/${firstConceptId}`, { state: { from: 'bookings' } });
        }
      }
    };

    const handleConfirmationClick = () => {
      setConfirmModalBookingId(booking.id);
    };

    const handleAgreementClick = () => {
      setAgreementModalBookingId(booking.id);
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
    return <div className="group rounded-lg border border-border bg-gradient-to-br from-background to-muted/20 hover:border-primary/20 transition-all duration-300 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{booking.title}</h3>
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
        
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDetailsClick}>
              <Eye className="h-4 w-4 mr-1" />
              {t('bookings.seeDetails')}
            </Button>
            {booking.concept_ids && booking.concept_ids.length > 0 ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleConceptClick}
              >
                {t('bookings.seeOffer')}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground italic py-2">
                {t('bookings.noOfferAttached')}
              </span>
            )}
          </div>
          <BookingActions booking={booking} currentUserId={profile.user_id} onAction={handleBookingAction} />
        </div>
      </div>;
  };
  // Simple loading state
  if (loading) {
    console.log('📱 Showing loading state');
    return (
      <div className="bookings-loading text-center py-8 min-h-[200px] flex flex-col justify-center">
        <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t('bookings.loadingBookings')}</p>
      </div>
    );
  }

  // Use the original booking flow
  return (
    <BookingErrorBoundary>
      <div className="w-full h-full flex flex-col overflow-hidden bg-background">
          {/* Tab Navigation Header - Sticky on mobile */}
          <div className="p-2 md:p-3 bg-background border-b border-border/10 shrink-0 mobile-sticky-header">
            <div className="max-w-4xl mx-auto">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-[700px]">
                  <TabsTrigger value="incoming" className="flex items-center justify-center gap-1">
                    <Inbox className="w-4 h-4" />
                    {tabCounts.incoming > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">
                        {tabCounts.incoming}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center justify-center gap-1">
                    <Send className="w-4 h-4" />
                    {tabCounts.sent > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                        {tabCounts.sent}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ongoing" className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" />
                    {tabCounts.ongoing > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                        {tabCounts.ongoing}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {tabCounts.approved > 0 && (
                      <Badge variant="default" className="h-5 min-w-[20px] px-1 text-xs bg-green-600">
                        {tabCounts.approved}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} className="h-full">
              {/* Incoming Tab Content */}
              <TabsContent value="incoming" className="flex-1 flex flex-col m-0 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">{t('bookings.incomingRequests')}</h2>
                      <Badge variant="secondary" className="text-xs">
                        {incomingRequests.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {incomingRequests.length === 0 ? (
                        <div className="text-center py-8">
                           <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                           <p className="text-muted-foreground">{t('bookings.noIncomingRequests')}</p>
                         </div>
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
              <TabsContent value="sent" className="flex-1 flex flex-col m-0 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">{t('bookings.sentRequests')}</h2>
                      <Badge variant="secondary" className="text-xs">
                        {sentRequests.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {sentRequests.length === 0 ? (
                         <div className="text-center py-8">
                           <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                           <p className="text-muted-foreground">{t('bookings.noSentRequests')}</p>
                         </div>
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
              <TabsContent value="ongoing" className="flex-1 flex flex-col m-0 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">{t('bookings.ongoingAgreements')}</h2>
                      <Badge variant="secondary" className="text-xs">
                        {ongoingAgreements.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {ongoingAgreements.length === 0 ? (
                         <div className="text-center py-8">
                           <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                           <p className="text-muted-foreground">{t('bookings.noOngoingAgreements')}</p>
                         </div>
                      ) : (
                        ongoingAgreements.map((booking) => (
                          <BookingCard key={`${booking.id}-${booking.updated_at}`} booking={booking} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Approved Tab Content */}
              <TabsContent value="approved" className="flex-1 flex flex-col m-0 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* List Header */}
                  <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-semibold text-foreground">Godkjente avtaler</h2>
                      <Badge variant="secondary" className="text-xs">
                        {approvedAgreements.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {approvedAgreements.length === 0 ? (
                         <div className="text-center py-8">
                           <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                           <p className="text-muted-foreground">Ingen godkjente avtaler ennå</p>
                           <p className="text-sm text-muted-foreground mt-2">Avtaler som er godkjent av begge parter vises her</p>
                         </div>
                      ) : (
                        approvedAgreements.map((booking) => (
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
      
      {/* Edit Modal */}
      <Sheet open={!!editModalBookingId} onOpenChange={(open) => !open && setEditModalBookingId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Rediger booking</SheetTitle>
          </SheetHeader>
          {editModalBookingId && bookings.find(b => b.id === editModalBookingId) && (
            <div className="mt-4">
              <BookingEditModal
                booking={bookings.find(b => b.id === editModalBookingId)}
                currentUserId={profile.user_id}
                onSaved={() => {
                  setEditModalBookingId(null);
                  refetch();
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Confirmation Modal */}
      {confirmModalBookingId && bookings.find(b => b.id === confirmModalBookingId) && (
        <BookingConfirmation
          booking={bookings.find(b => b.id === confirmModalBookingId)}
          isOpen={!!confirmModalBookingId}
          onClose={() => setConfirmModalBookingId(null)}
          currentUserId={profile.user_id}
        />
      )}
      
      {/* Agreement Modal */}
      {agreementModalBookingId && bookings.find(b => b.id === agreementModalBookingId) && (
        <BookingAgreement
          booking={bookings.find(b => b.id === agreementModalBookingId)}
          isOpen={!!agreementModalBookingId}
          onClose={() => setAgreementModalBookingId(null)}
          currentUserId={profile.user_id}
        />
      )}
    </BookingErrorBoundary>
  );
};