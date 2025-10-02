import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, MessageCircle, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';

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

interface BookingCardStep1Props {
  booking: any;
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
  const isReceiver = currentUserId === booking.receiver_id;
  const isSender = currentUserId === booking.sender_id;

  return (
    <Card className="hover:shadow-sm transition-all border-l-4 border-l-blue-400">
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
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {isReceiver ? 'Ny forespørsel' : 'Sendt'}
          </Badge>
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
          
          {booking.address && (
            <div className="flex items-center gap-1.5 col-span-full">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{booking.address}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Banknote className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {booking.door_deal ? (
                `${booking.door_percentage || 50}% av dør`
              ) : booking.by_agreement ? (
                'Etter avtale'
              ) : (
                `${booking.artist_fee || booking.price_musician || '0'} kr`
              )}
            </span>
          </div>
          
          {booking.ticket_price && (
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">Billett: {booking.ticket_price} kr</span>
            </div>
          )}
          
          {booking.audience_estimate && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{booking.audience_estimate} pers</span>
            </div>
          )}
        </div>

        {/* Personal message */}
        {booking.personal_message && (
          <div className="flex items-start gap-1.5 text-xs md:text-sm bg-muted/30 p-2 rounded">
            <MessageCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground line-clamp-2">{booking.personal_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1.5">
            {booking.concept_ids && booking.concept_ids.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
                className="h-7 px-2 text-xs"
              >
                Tilbud
              </Button>
            )}
          </div>
          
          <BookingActions 
            booking={booking}
            currentUserId={currentUserId}
            onAction={onAction}
          />
        </div>
      </CardContent>
    </Card>
  );
};