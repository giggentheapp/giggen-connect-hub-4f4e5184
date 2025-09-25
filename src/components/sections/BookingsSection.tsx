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
  // Safari compatibility state
  const [isLoading, setIsLoading] = useState(true);
  const [browserSupported, setBrowserSupported] = useState(true);

  // Enhanced Safari/mobile compatibility with better detection
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isIOSChrome = /CriOS/i.test(navigator.userAgent);
    
    if (isSafari || isMobile || isIOSChrome) {
      // Increased delay for Safari/mobile to ensure proper initialization
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      // Safari-specific optimizations
      try {
        const documentStyle = document.documentElement.style as any;
        documentStyle.webkitOverflowScrolling = 'touch';
        documentStyle.overflowScrolling = 'touch';
        // Alternative approach using setProperty
        document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
      } catch (e) {
        console.warn('Safari styling failed:', e);
      }
    } else {
      setIsLoading(false);
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

  // Enhanced timeout with better Safari/mobile handling
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    const timeoutDuration = (isSafari || isMobile) ? 8000 : 5000; // Longer timeout for Safari/mobile
    
    const timeout = setTimeout(() => {
      if (loading) {
        setBrowserSupported(false);
      }
    }, timeoutDuration);
    
    return () => clearTimeout(timeout);
  }, [loading, bookings, profile.user_id]);

  // Simplified real-time subscription - disable for Safari/mobile to prevent crashes
  useEffect(() => {
    if (!profile.user_id) return;
    
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Skip real-time subscriptions on Safari/mobile to prevent white screen issues
    if (isSafari || isMobile) {
      return;
    }

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
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `receiver_id=eq.${profile.user_id}`,
        },
        () => refetch()
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
        return booking.receiver_id === profile.user_id ? t('Request Phase') : t('Sent Request Phase');
      case 'allowed':
        return t('Ongoing Agreement Editable Phase');
      case 'approved_by_both':
        return t('Ongoing Agreement Ready Phase');
      case 'upcoming':
        return t('Published Event Phase');
      case 'completed':
        return t('Completed Phase');
      case 'cancelled':
        return t('Cancelled Phase');
      default:
        return t('Unknown Status');
    }
  };
  const handleBookingAction = async () => {
    try {
      await refetch();
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
    return <Card className="booking-card hover:shadow-md transition-shadow">
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
  // Enhanced loading state with Safari/mobile compatibility
  if (isLoading || loading) {
    return (
      <div className="bookings-loading text-center py-8 min-h-[200px] flex flex-col justify-center">
        <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t('Loading Bookings')}</p>
        <p className="text-xs text-muted-foreground mt-2">Safari/Mobile optimizations enabled</p>
      </div>
    );
  }

  // Enhanced Safari/mobile fallback with better error handling
  if (!browserSupported) {
    return (
      <div className="safari-error-fallback text-center py-8 min-h-[300px] flex flex-col justify-center">
        <h2 className="text-xl font-semibold mb-4 text-destructive">{t('Bookings Loading Issue')}</h2>
        <p className="text-muted-foreground mb-4">Safari/mobile compatibility mode activated</p>
        <div className="space-y-2">
          <Button onClick={() => window.location.reload()} className="mr-2">
            {t('Reload Page')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setBrowserSupported(true);
              setIsLoading(true);
            }}
          >
            Try Again
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Try using Chrome desktop for the best experience
        </p>
      </div>
    );
  }
  return <SafariErrorBoundary>
    <BookingErrorBoundary>
      <div className="bookings-page space-y-6 safari-compatible mobile-optimized" style={{ minHeight: '400px' }}>

      {/* Tab Navigation - New Workflow */}
      <div className="booking-tabs flex gap-2 border-b flex-wrap overflow-x-auto mobile-scroll">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('incoming')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Inbox className="h-4 w-4" />
          <span className="hidden sm:inline">{t('incomingRequests')}</span>
          <span className="sm:hidden">{t('Incoming')}</span>
          ({incomingRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('sent')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Sent Request')}</span>
          <span className="sm:hidden">{t('sent')}</span>
          ({sentRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'ongoing' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('ongoing')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Ongoing Agreements')}</span>
          <span className="sm:hidden">{t('ongoing')}</span>
          ({ongoingAgreements.length})
        </Button>
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('upcoming')} 
          className="flex items-center gap-2 min-h-[44px] touch-target flex-shrink-0"
        >
          <Check className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Upcoming Events')}</span>
          <span className="sm:hidden">{t('Upcoming')}</span>
          ({upcomingEvents.length})
        </Button>
      </div>

      {/* Bookings List - New Workflow */}
      <div className="space-y-4">
        {activeTab === 'incoming' && <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">{t('Incoming Requests')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('incomingRequests')}
              </p>
            </div>
            {incomingRequests.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('No Incoming Requests')}</p>
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
              <h3 className="text-lg font-medium mb-2">{t('Sent Request')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('sentRequestsDesc')}
              </p>
            </div>
            {sentRequests.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('No Sent Requests')}</p>
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
              <h3 className="text-lg font-medium mb-2">{t('Ongoing Agreements')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('ongoingAgreementsDesc')}
              </p>
            </div>
            {ongoingAgreements.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('No Ongoing Agreements')}</p>
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
              <h3 className="text-lg font-medium mb-2">{t('Booking Upcoming Events')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('bookingUpcomingEventsDesc')}
              </p>
            </div>
            {upcomingEvents.length === 0 ? <Card>
                <CardContent className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('No Upcoming Events')}</p>
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
        setConceptViewOpen(false);
        // Refresh bookings after concept action
        if (action === 'deleted' || action === 'rejected') {
          handleBookingAction();
        }
      }} />
        </>}
    </div>
    </BookingErrorBoundary>
  </SafariErrorBoundary>;
};