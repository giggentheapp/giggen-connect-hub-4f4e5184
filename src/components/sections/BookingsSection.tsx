import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafariErrorBoundary } from '@/components/SafariErrorBoundary';
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
import { useAppTranslation } from '@/hooks/useAppTranslation';
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
  // Safari compatibility - Add error handling and performance optimizations
  useEffect(() => {
    // Safari-specific initialization
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      // Enable smooth scrolling for Safari (use setAttribute to avoid TS errors)
      document.documentElement.setAttribute('style', 'overflow-scrolling: touch; -webkit-overflow-scrolling: touch;');
      
      // Safari performance logging (with type safety)
      const perf = window.performance as any;
      if (perf?.memory) {
        console.log('Safari memory usage:', perf.memory);
      }
    }
  }, []);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [conceptViewOpen, setConceptViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'upcoming'>('incoming');
  const { bookings, loading, updateBooking, refetch } = useBookings(profile.user_id);
  const { toast } = useToast();
  const { t } = useAppTranslation();

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!profile.user_id) return;

    const channel = supabase
      .channel('bookings-section-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `sender_id=eq.${profile.user_id}`,
        },
        (payload) => {
          console.log('📝 Booking updated (as sender):', payload.new);
          // Force refetch to ensure UI is in sync
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `receiver_id=eq.${profile.user_id}`,
        },
        (payload) => {
          console.log('📝 Booking updated (as receiver):', payload.new);
          // Force refetch to ensure UI is in sync
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.user_id, refetch]);

  // Stable filtering - always filter from complete dataset
  const incomingRequests = bookings.filter(b => 
    b.receiver_id === profile.user_id && 
    b.status === 'pending'
  );
  
  const sentRequests = bookings.filter(b => 
    b.sender_id === profile.user_id && 
    b.status === 'pending'
  );
  
  const ongoingAgreements = bookings.filter(b => 
    (b.sender_id === profile.user_id || b.receiver_id === profile.user_id) && 
    (b.status === 'allowed' || b.status === 'approved_by_sender' || b.status === 'approved_by_receiver' || b.status === 'approved_by_both')
  );
  
  const upcomingEvents = bookings.filter(b => 
    (b.sender_id === profile.user_id || b.receiver_id === profile.user_id) && 
    b.status === 'upcoming'
  );
  
  // Remove historical bookings - we now permanently delete all bookings

  // Helper functions for booking status display with new workflow
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'allowed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved_by_both':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'upcoming':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('waitingResponse');
      case 'allowed':
        return t('allowed');
      case 'approved_by_both':
        return t('approved');
      case 'upcoming':
        return t('published');
      case 'completed':
        return t('completed');
      case 'cancelled':
        return t('cancelled');
      default:
        return status;
    }
  };
  const getPhaseText = (booking: any) => {
    switch (booking.status) {
      case 'pending':
        return booking.receiver_id === profile.user_id ? t('requestPhase') : t('sentRequestPhase');
      case 'allowed':
        return t('ongoingAgreementEditablePhase');
      case 'approved_by_both':
        return t('ongoingAgreementReadyPhase');
      case 'upcoming':
        return t('publishedEventPhase');
      case 'completed':
        return t('completedPhase');
      case 'cancelled':
        return t('cancelledPhase');
      default:
        return t('unknownStatus');
    }
  };
  const handleBookingAction = async () => {
    // Always fetch all bookings - no need to check active tab
    console.log('📄 Refreshing all bookings after action...');
    try {
      await refetch();
      console.log('✅ All bookings refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh bookings:', error);
      toast({
        title: t('couldNotUpdateList'),
        description: t('tryRefreshManually'),
        variant: "destructive"
      });
    }
  };
  const BookingCard = ({
    booking
  }: {
    booking: any;
  }) => {
    // Force re-render when booking data changes by using booking ID + updated_at as key
    const bookingKey = `${booking.id}-${booking.updated_at || booking.created_at}`;
    
    console.log('🎴 Rendering BookingCard:', {
      id: booking.id,
      title: booking.title,
      status: booking.status,
      updated_at: booking.updated_at,
      key: bookingKey
    });
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
      return <BookingCardStep1 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} />;
    }
    if (booking.status === 'allowed' || booking.status === 'approved_by_both') {
      return <BookingCardStep2 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} />;
    }
    if (booking.status === 'upcoming') {
      return <BookingCardStep3 booking={booking} currentUserId={profile.user_id} onDetailsClick={handleDetailsClick} onConceptClick={handleConceptClick} onAction={handleBookingAction} />;
    }

    // Fallback for other statuses (cancelled, completed, etc.)
    return <Card className="hover:shadow-md transition-shadow">
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
              {t('seeDetails')}
            </Button>
            <BookingActions booking={booking} currentUserId={profile.user_id} onAction={handleBookingAction} />
          </div>
        </CardContent>
      </Card>;
  };
  if (loading) {
    return <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>{t('loadingBookings')}</p>
      </div>;
  }
  return <SafariErrorBoundary>
    <div className="space-y-6 safari-compatible mobile-optimized">

      {/* Tab Navigation - New Workflow */}
      <div className="flex gap-2 border-b flex-wrap overflow-x-auto mobile-scroll">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('incoming')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Inbox className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Incoming Requests')}</span>
          <span className="sm:hidden">{t('incoming')}</span>
          ({incomingRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('sent')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t('sentRequest')}</span>
          <span className="sm:hidden">{t('sent')}</span>
          ({sentRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'ongoing' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('ongoing')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">{t('ongoingAgreements')}</span>
          <span className="sm:hidden">{t('ongoing')}</span>
          ({ongoingAgreements.length})
        </Button>
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('upcoming')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Check className="h-4 w-4" />
          <span className="hidden sm:inline">{t('upcomingEventsBookings')}</span>
          <span className="sm:hidden">{t('upcoming')}</span>
          ({upcomingEvents.length})
        </Button>
      </div>

      {/* Bookings List - New Workflow */}
      <div className="space-y-4">
        {activeTab === 'incoming' && <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">{t('incomingRequests')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('incomingRequestsDesc')}
              </p>
            </div>
            {incomingRequests.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('noIncomingRequests')}</p>
                </CardContent>
              </Card> : incomingRequests.map(booking => (
                <BookingCard 
                  key={`${booking.id}-${booking.updated_at || booking.created_at}`} 
                  booking={booking} 
                />
              ))}
          </>}

        {activeTab === 'sent' && <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">{t('sentRequest')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('sentRequestsDesc')}
              </p>
            </div>
            {sentRequests.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('noSentRequests')}</p>
                </CardContent>
              </Card> : sentRequests.map(booking => (
                <BookingCard 
                  key={`${booking.id}-${booking.updated_at || booking.created_at}`} 
                  booking={booking} 
                />
              ))}
          </>}

        {activeTab === 'ongoing' && <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">{t('ongoingAgreements')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('ongoingAgreementsDesc')}
              </p>
            </div>
            {ongoingAgreements.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('noOngoingAgreements')}</p>
                </CardContent>
              </Card> : ongoingAgreements.map(booking => (
                <BookingCard 
                  key={`${booking.id}-${booking.updated_at || booking.created_at}`} 
                  booking={booking} 
                />
              ))}
          </>}

        {activeTab === 'upcoming' && <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">{t('upcomingEventsBookings')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('bookingUpcomingEventsDesc')}
              </p>
            </div>
            {upcomingEvents.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('noUpcomingEvents')}</p>
                </CardContent>
              </Card> : upcomingEvents.map(booking => (
                <BookingCard 
                  key={`${booking.id}-${booking.updated_at || booking.created_at}`} 
                  booking={booking} 
                />
              ))}
          </>}

        {/* History tab removed - all deletions are now permanent */}
      </div>

      {/* Enhanced Booking Details Dialog */}
      {selectedBooking && <>
          <EnhancedBookingDetails bookingId={selectedBooking.id} isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} />

          <ConceptViewModal isOpen={conceptViewOpen} onClose={() => setConceptViewOpen(false)} conceptIds={selectedBooking?.concept_ids || []} initialConceptIndex={0} showConceptActions={true} onConceptAction={(conceptId, action) => {
        console.log(`Concept ${conceptId} ${action}`);
        setConceptViewOpen(false);
        // Refresh bookings after concept action
        if (action === 'deleted' || action === 'rejected') {
          handleBookingAction();
        }
      }} />
        </>}
    </div>
  </SafariErrorBoundary>;
};