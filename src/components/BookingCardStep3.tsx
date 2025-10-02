import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Banknote, MessageCircle, Eye, Users, CheckCircle, EyeOff } from 'lucide-react';
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
    navigate(`/booking/${booking.id}/preview`);
  };

  return (
    <Card className="hover:shadow-sm transition-all border-l-4 border-l-green-400">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg leading-tight">
              {booking.title}
            </CardTitle>
            {booking.description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                {booking.description}
              </p>
            )}
          </div>
          
          {/* Visibility toggle in top right corner */}
          <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-2 border">
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
      </CardHeader>
      
      <CardContent className="px-3 md:px-4 pb-3 space-y-3">
        {/* Essential booking details - compact grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
               <span className="truncate">
                 {formatSafeDate(booking.event_date)}
                 {booking.time && ` ${booking.time}`}
               </span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{booking.venue}</span>
            </div>
          )}
        </div>

        {/* Actions - Only two buttons */}
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
      </CardContent>
    </Card>
  );
};