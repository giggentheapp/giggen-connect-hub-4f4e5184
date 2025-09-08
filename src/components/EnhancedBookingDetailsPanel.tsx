import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingDetailsPanel } from '@/components/BookingDetailsPanel';
import { DocumentViewer } from '@/components/DocumentViewer';
import { BookingApprovalDialog } from '@/components/BookingApprovalDialog';
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
  DollarSign,
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
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const bothConfirmed = booking?.sender_confirmed && booking?.receiver_confirmed;
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
        return { color: 'blue', text: 'Venter på svar' };
      case 'confirmed':
        return { color: 'yellow', text: 'Bekreftet - Klar for publisering' };
      case 'published':
        return { color: 'green', text: 'Publisert' };
      case 'rejected':
        return { color: 'red', text: 'Avvist' };
      case 'cancelled':
        return { color: 'orange', text: 'Avlyst' };
      case 'deleted':
        return { color: 'gray', text: 'Slettet' };
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
              {booking.sender_confirmed ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Avsender godkjent</span>
            </div>
            
            <div className="flex items-center gap-2">
              {booking.receiver_confirmed ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Mottaker godkjent</span>
            </div>
          </div>

          {/* Approval Button */}
          {booking.status === 'confirmed' && !booking[isSender ? 'sender_confirmed' : 'receiver_confirmed'] && (
            <div className="mt-4">
              <Button onClick={() => setApprovalOpen(true)} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Godkjenn booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      {!bothConfirmed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sensitiv informasjon som kontaktdetaljer, priser og dokumenter vil kun være synlig 
            etter at begge parter har godkjent bookingen.
          </AlertDescription>
        </Alert>
      )}

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

      {/* Enhanced Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Arrangementsdetaljer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{booking.title}</h3>
            {booking.description && (
              <p className="text-muted-foreground mb-4">{booking.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
                {booking.time && <span>kl. {booking.time}</span>}
              </div>
            )}
            
            {booking.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{booking.venue}</span>
              </div>
            )}

            {booking.audience_estimate && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Forventet publikum: {booking.audience_estimate}</span>
              </div>
            )}

            {booking.ticket_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Billettpris: {booking.ticket_price} kr</span>
              </div>
            )}
          </div>

          {/* Sensitive pricing info - only visible to parties after confirmation */}
          {bothConfirmed && booking.artist_fee && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <DollarSign className="h-4 w-4" />
                <span>Artist honorar: {booking.artist_fee} kr</span>
              </div>
            </div>
          )}

          {!bothConfirmed && (booking.artist_fee || booking.price_musician) && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Prisdetaljer synlige etter godkjenning</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <DocumentViewer
        files={techSpecFiles}
        title="Tekniske spesifikasjoner"
        isVisible={bothConfirmed}
        notProvidedMessage="Ingen tekniske spesifikasjoner lagt ved"
      />

      <DocumentViewer
        files={hospitalityFiles}
        title="Hospitality Rider"
        isVisible={bothConfirmed}
        notProvidedMessage="Ingen hospitality rider lagt ved"
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

      {/* Approval Dialog */}
      <BookingApprovalDialog
        booking={booking}
        isOpen={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
};