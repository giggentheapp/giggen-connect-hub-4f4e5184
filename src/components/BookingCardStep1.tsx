import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Banknote, MessageCircle, Users } from 'lucide-react';
import { BookingActions } from './BookingActions';
import { formatSafeDate, getPaymentDisplayText } from '@/utils/bookingUtils';
import { Booking } from '@/types/booking';
import { bookingService } from '@/services/bookingService';

interface BookingCardStep1Props {
  booking: Booking;
  currentUserId: string;
  onDetailsClick: () => void;
  onEditClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
  onConfirmationClick?: () => void;
  onAgreementClick?: () => void;
}

export const BookingCardStep1 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick,
  onEditClick, 
  onConceptClick, 
  onAction,
  onConfirmationClick,
  onAgreementClick
}: BookingCardStep1Props) => {
  const navigate = useNavigate();
  const isReceiver = currentUserId === booking.receiver_id;
  const [senderProfile, setSenderProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  // Load sender profile for receivers
  useEffect(() => {
    if (isReceiver && booking.sender_id) {
      const loadSenderProfile = async () => {
        try {
          const profile = await bookingService.getMakerProfile(booking.sender_id);
          if (profile) {
            setSenderProfile({
              display_name: profile.display_name || 'Ukjent',
              avatar_url: profile.avatar_url || null
            });
          }
        } catch (error) {
          console.error('Error loading sender profile:', error);
        }
      };
      loadSenderProfile();
    }
  }, [isReceiver, booking.sender_id]);

  const handleSenderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (booking.sender_id) {
      navigate(`/profile/${booking.sender_id}`, { 
        state: { fromSection: 'bookings' } 
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold">{booking.title}</h3>
            {booking.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {booking.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {isReceiver ? 'Ny forespørsel' : 'Sendt'}
          </Badge>
        </div>

        {/* Sender profile - only show for receivers */}
        {isReceiver && senderProfile && (
          <div 
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-fit"
            onClick={handleSenderClick}
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={senderProfile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {senderProfile.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              fra {senderProfile.display_name}
            </span>
          </div>
        )}
        
        {/* Essential booking details */}
        <div className="flex flex-wrap gap-4 text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatSafeDate(booking.event_date)}
                {booking.time && ` ${booking.time}`}
              </span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking.venue}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>{getPaymentDisplayText(booking)}</span>
          </div>
          
          {booking.ticket_price && (
            <div className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span>Billett: {booking.ticket_price} kr</span>
            </div>
          )}
          
          {booking.audience_estimate && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.audience_estimate} pers</span>
            </div>
          )}
        </div>

        {booking.address && (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{booking.address}</span>
          </div>
        )}

        {/* Personal message */}
        {booking.personal_message && (
          <div className="flex items-start gap-1.5 text-sm bg-muted/30 p-3 rounded">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground">{booking.personal_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            {booking.concept_ids && booking.concept_ids.length > 0 ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
              >
                Se tilbud
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground italic py-2">
                Ingen tilbud vedlagt
              </span>
            )}
          </div>
          
          <BookingActions 
            booking={booking}
            currentUserId={currentUserId}
            onAction={onAction}
          />
        </div>
      </div>
    </Card>
  );
};
