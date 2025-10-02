import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const formatSafeDate = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ugyldig dato';
    return format(date, 'dd.MM.yyyy');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Ugyldig dato';
  }
};

interface BookingCardStep3Props {
  booking: any;
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

  const handleViewAgreement = () => {
    navigate(`/booking/${booking.id}/view`);
  };

  const handleViewPublicEvent = () => {
    navigate(`/arrangement/${booking.id}`);
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
          
          {/* Visibility toggle */}
          <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-2 border shrink-0">
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
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
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
      </div>
    </Card>
  );
};