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
    try {
      switch (status) {
        case 'pending':
          return safeT('waitingResponse');
        case 'allowed':
          return safeT('allowed');
        case 'approved_by_both':
          return safeT('approved');
        case 'upcoming':
          return safeT('published');
        case 'completed':
          return safeT('completed');
        case 'cancelled':
          return safeT('cancelled');
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
          return booking.receiver_id === profile.user_id ? safeT('Request Phase') : safeT('Sent Request Phase');
        case 'allowed':
          return safeT('Ongoing Agreement Editable Phase');
        case 'approved_by_both':
          return safeT('Ongoing Agreement Ready Phase');
        case 'upcoming':
          return safeT('Published Event Phase');
        case 'completed':
          return safeT('Completed Phase');
        case 'cancelled':
          return safeT('Cancelled Phase');
        default:
          return safeT('Unknown Status');
      }
    } catch (error) {
      console.warn('Error in getPhaseText:', error);
      return 'Unknown Status';
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
              {safeT('seeDetails')}
            </Button>
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

  // Use the safe version instead of the complex version
  return (
    <SafeBookingsSection profile={profile} />
  );
};