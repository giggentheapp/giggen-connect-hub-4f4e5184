import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
import { BookingDetailsPanel } from '@/components/BookingDetailsPanel';
import { DocumentViewer } from '@/components/DocumentViewer';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check, 
  X, 
  Eye, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Users, 
  Banknote,
  Lock,
  Unlock 
} from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedBookingDetailsPanelProps {
  booking: any;
  currentUserId: string;
  canEdit: boolean;
}

export const EnhancedBookingDetailsPanel = ({ 
  booking, 
  currentUserId, 
  canEdit 
}: EnhancedBookingDetailsPanelProps) => {
  const navigate = useNavigate();
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const bothConfirmed = booking?.approved_by_sender && booking?.approved_by_receiver;
  const contactInfoVisible = bothConfirmed || booking?.contact_info_shared_at;
  
  // Get tech specs and hospitality riders for the receiver (maker)
  const { files: techSpecFiles } = useProfileTechSpecs(booking?.receiver_id);
  const { files: hospitalityFiles } = useHospitalityRiders(booking?.receiver_id);

  // Load profiles
  useEffect(() => {
    const loadProfiles = async () => {
      if (!booking) return;

      try {
        // Load receiver profile
        const { data: receiverData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', booking.receiver_id)
          .single();

        setReceiverProfile(receiverData);

        // Load current user profile
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUserId)
          .single();

        setUserProfile(userData);
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    };

    loadProfiles();
  }, [booking, currentUserId]);

  const getStatusInfo = () => {
    if (!booking) return { color: 'gray', text: 'Ukjent' };
    
    switch (booking.status) {
      case 'pending':
        return { 
          color: 'blue', 
          text: isSender ? 'Venter på svar fra mottaker' : 'Venter på ditt svar'
        };
      case 'allowed':
        return { color: 'yellow', text: 'Tillatt - Kan redigeres' };
      case 'both_parties_approved':
        return { color: 'purple', text: 'Godkjent - Klar for publisering' };
      case 'upcoming':
        return { color: 'green', text: 'Publisert' };
      case 'completed':
        return { color: 'blue', text: 'Gjennomført' };
      case 'cancelled':
        return { color: 'orange', text: 'Avlyst' };
      default:
        return { color: 'gray', text: booking.status };
    }
  };

  const statusInfo = getStatusInfo();

  if (!booking) return null;

  return (
    <div className="space-y-6">
      {/* Status and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Booking Status</span>
            <Badge variant="outline" className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
              {statusInfo.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {booking.approved_by_sender ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Avsender godkjent for publisering</span>
            </div>
            
            <div className="flex items-center gap-2">
              {booking.approved_by_receiver ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Mottaker godkjent for publisering</span>
            </div>
          </div>

          {/* Approval Button */}
          {booking.status === 'approved_by_both' && !booking[isSender ? 'approved_by_sender' : 'approved_by_receiver'] && (
            <div className="mt-4">
              <Button onClick={() => navigate(`/booking/${booking.id}/review`)} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Godkjenn for publisering
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Contact Information */}
      {contactInfoVisible && isReceiver && booking.sender_contact_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-500" />
              Kontaktinformasjon fra avsender
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {booking.sender_contact_info.name && (
              <div>
                <span className="font-medium">Navn: </span>
                {booking.sender_contact_info.name}
              </div>
            )}
            {booking.sender_contact_info.email && (
              <div>
                <span className="font-medium">E-post: </span>
                <a href={`mailto:${booking.sender_contact_info.email}`} className="text-primary hover:underline">
                  {booking.sender_contact_info.email}
                </a>
              </div>
            )}
            {booking.sender_contact_info.phone && (
              <div>
                <span className="font-medium">Telefon: </span>
                <a href={`tel:${booking.sender_contact_info.phone}`} className="text-primary hover:underline">
                  {booking.sender_contact_info.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!contactInfoVisible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Kontaktinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Kontaktinformasjon vil være synlig når begge parter har godkjent bookingen
            </p>
          </CardContent>
        </Card>
      )}


      {/* Documents from booking concept */}
      <BookingDocumentViewer
        techSpec={booking.tech_spec}
        hospitalityRider={booking.hospitality_rider}
        bookingStatus={booking.status}
        isVisible={bothConfirmed}
      />

      {/* Editable Fields */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Rediger detaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingDetailsPanel 
              booking={booking}
              currentUserId={currentUserId}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Personal Message - visible to both parties */}
      {booking.personal_message && (
        <Card>
          <CardHeader>
            <CardTitle>Personlig melding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{booking.personal_message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};