import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Banknote, MessageCircle, Eye, Edit3 } from 'lucide-react';
import { BookingActions } from './BookingActions';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';
import { formatSafeDate, getPaymentDisplayText } from '@/utils/bookingUtils';
import { Booking } from '@/types/booking';
import { bookingService } from '@/services/bookingService';

interface BookingCardStep2Props {
  booking: Booking;
  currentUserId: string;
  onDetailsClick: () => void;
  onEditClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
  onConfirmationClick?: () => void;
  onAgreementClick?: () => void;
}

export const BookingCardStep2 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onEditClick,
  onConceptClick, 
  onAction,
  onConfirmationClick,
  onAgreementClick
}: BookingCardStep2Props) => {
  const navigate = useNavigate();
  const isApprovedByBoth = booking.status === 'approved_by_both';
  const canEdit = canBeEditedByParties(booking.status as BookingStatus) && !isApprovedByBoth;
  const isReceiver = currentUserId === booking.receiver_id;
  const [otherPartyProfile, setOtherPartyProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  // Load other party's profile
  useEffect(() => {
    const otherPartyId = isReceiver ? booking.sender_id : booking.receiver_id;
    if (otherPartyId) {
      const loadProfile = async () => {
        try {
          const profile = await bookingService.getMakerProfile(otherPartyId);
          if (profile) {
            setOtherPartyProfile({
              display_name: profile.display_name || 'Ukjent',
              avatar_url: profile.avatar_url || null
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      };
      loadProfile();
    }
  }, [isReceiver, booking.sender_id, booking.receiver_id]);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const otherPartyId = isReceiver ? booking.sender_id : booking.receiver_id;
    if (otherPartyId) {
      navigate(`/profile/${otherPartyId}`, { 
        state: { fromSection: 'bookings' } 
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{booking.title}</h3>
          {isApprovedByBoth ? (
            <Badge variant="default" className="text-xs whitespace-nowrap bg-green-600 hover:bg-green-700 shrink-0">
              Godkjent
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs whitespace-nowrap shrink-0">
              Forhandling
            </Badge>
          )}
        </div>

        {/* Other party profile */}
        {otherPartyProfile && (
          <div 
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-fit"
            onClick={handleProfileClick}
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={otherPartyProfile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {otherPartyProfile.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {isReceiver ? 'fra' : 'til'} {otherPartyProfile.display_name}
            </span>
          </div>
        )}
        
        {booking.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
            {booking.description}
          </p>
        )}
        
        {/* Essential booking details */}
        <div className="flex flex-wrap gap-4 text-sm pt-2">
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
        </div>

        {/* Personal message */}
        {booking.personal_message && (
          <div className="flex items-start gap-1.5 text-sm bg-muted/30 p-2 rounded">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs">{booking.personal_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {isApprovedByBoth ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onDetailsClick}
              >
                <Eye className="h-4 w-4 mr-1" />
                Se avtale
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={canEdit ? onEditClick : onDetailsClick}
              >
                {canEdit ? (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Rediger
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Detaljer
                  </>
                )}
              </Button>
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
