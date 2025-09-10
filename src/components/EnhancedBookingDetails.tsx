import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedBookingDetailsPanel } from './EnhancedBookingDetailsPanel';
import { BookingConfirmation } from './BookingConfirmation';
import { BookingAgreement } from './BookingAgreement';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Check, X, FileText, Eye, Trash2 } from 'lucide-react';
interface EnhancedBookingDetailsProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}
export const EnhancedBookingDetails = ({
  bookingId,
  isOpen,
  onClose
}: EnhancedBookingDetailsProps) => {
  const [booking, setBooking] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);
  useEffect(() => {
    const fetchBooking = async () => {
      if (!isOpen || !bookingId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        if (error) throw error;
        setBooking(data);
      } catch (error: any) {
        toast({
          title: "Feil ved lasting av booking",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, isOpen, toast]);

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!booking?.id) return;
    const channel = supabase.channel('enhanced-booking-updates').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookings',
      filter: `id=eq.${booking.id}`
    }, payload => {
      setBooking(prev => ({
        ...prev,
        ...payload.new
      }));
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id]);
  if (!isOpen) return null;
  if (loading) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster booking...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  if (!booking || !currentUserId) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Booking ikke funnet eller ingen tilgang</p>
          </div>
        </DialogContent>
      </Dialog>;
  }
  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const canEdit = booking.status === 'pending' || booking.status === 'allowed';
  const isNegotiationPhase = booking.status === 'pending' || booking.status === 'allowed';
  const isConfirmationPhase = booking.status === 'both_parties_approved';
  const isPublished = booking.status === 'upcoming';
  const bothConfirmed = booking.sender_confirmed && booking.receiver_confirmed;
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Venter på svar'
        };
      case 'allowed':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Tillatt - Kan redigeres'
        };
      case 'both_parties_approved':
        return {
          color: 'bg-purple-100 text-purple-800',
          label: 'Godkjent - Klar for publisering'
        };
      case 'upcoming':
        return {
          color: 'bg-green-100 text-green-800',
          label: 'Publisert'
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Gjennomført'
        };
      case 'cancelled':
        return {
          color: 'bg-orange-100 text-orange-800',
          label: 'Avlyst'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          label: status
        };
    }
  };
  const statusInfo = getStatusInfo(booking.status);
  return <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{booking.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                  {isSender && <Badge variant="outline">Du er avsender</Badge>}
                  {isReceiver && <Badge variant="outline">Du er mottaker</Badge>}
                </div>
              </div>
              
              <div className="flex gap-2">
                {isNegotiationPhase}
                
                {isConfirmationPhase && <Button variant="outline" onClick={() => setShowAgreement(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Vis avtale
                  </Button>}
                
                
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            <EnhancedBookingDetailsPanel booking={booking} currentUserId={currentUserId} canEdit={canEdit} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <BookingConfirmation booking={booking} isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} currentUserId={currentUserId} />

      {/* Agreement Dialog */}
      <BookingAgreement booking={booking} isOpen={showAgreement} onClose={() => setShowAgreement(false)} currentUserId={currentUserId} />
    </>;
};