import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookingActions } from '@/components/BookingActions';
import { formatSafeDate } from '@/utils/bookingUtils';
import { Booking } from '@/types/booking';
import { bookingService } from '@/services/bookingService';

interface BookingCardStep3Props {
  booking: Booking;
  currentUserId: string;
  onDetailsClick: () => void;
  onEditClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
  onConfirmationClick?: () => void;
  onAgreementClick?: () => void;
}

export const BookingCardStep3 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onEditClick,
  onConceptClick, 
  onAction,
  onConfirmationClick,
  onAgreementClick
}: BookingCardStep3Props) => {
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(booking.is_public_after_approval ?? false);
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

  const toggleVisibility = async () => {
    try {
      const newPublicState = !isPublic;
      
      const { error } = await supabase
        .from('bookings')
        .update({ is_public_after_approval: newPublicState })
        .eq('id', booking.id);

      if (error) throw error;

      setIsPublic(newPublicState);
      toast.success(
        newPublicState 
          ? 'Arrangementet er nå offentlig' 
          : 'Arrangementet er nå skjult'
      );
      
      onAction();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error('Kunne ikke endre synlighet');
    }
  };

  const handleViewAgreement = async () => {
    // Check if this is a teaching booking
    if (booking.selected_concept_id) {
      try {
        const { data: conceptData } = await supabase
          .from('concepts')
          .select('concept_type')
          .eq('id', booking.selected_concept_id)
          .single();
        
        if (conceptData?.concept_type === 'teaching') {
          navigate(`/booking/${booking.id}/teaching-agreement`);
          return;
        }
      } catch (error) {
        console.error('Error checking concept type:', error);
      }
    }
    
    navigate(`/booking/${booking.id}/view`);
  };

  const handleViewPublicEvent = () => {
    navigate(`/arrangement/${booking.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{booking.title}</h3>
          
          {/* Visibility toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isPublic ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Switch
              checked={isPublic}
              onCheckedChange={toggleVisibility}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
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
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 items-center justify-between">
          <div className="flex gap-2 flex-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewAgreement}
              className="flex-1"
            >
              Se avtale
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewPublicEvent}
              className="flex-1"
            >
              Se arrangement
            </Button>
          </div>
          
          {/* Booking actions (archive, etc.) */}
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
