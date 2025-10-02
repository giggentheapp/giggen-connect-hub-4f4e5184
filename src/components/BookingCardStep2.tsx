import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, MessageCircle, Eye, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';

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

interface BookingCardStep2Props {
  booking: any;
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
  const isApprovedByBoth = booking.status === 'approved_by_both';
  const canEdit = canBeEditedByParties(booking.status as BookingStatus) && !isApprovedByBoth;

  return (
    <Card className="hover:shadow-sm transition-all border-l-4 border-l-orange-400">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg leading-tight">
              <Button 
                variant="ghost" 
                className="p-0 h-auto font-semibold hover:text-primary transition-colors text-left justify-start"
                onClick={onConceptClick}
                disabled={!booking.concept_ids || booking.concept_ids.length === 0}
              >
                {booking.title}
              </Button>
            </CardTitle>
            {booking.description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                {booking.description}
              </p>
            )}
          </div>
          {isApprovedByBoth ? (
            <Badge variant="default" className="text-xs whitespace-nowrap bg-green-600 hover:bg-green-700">
              Godkjent av begge
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              Forhandling
            </Badge>
          )}
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
            {isApprovedByBoth ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onDetailsClick}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Se avtale
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={canEdit ? onEditClick : onDetailsClick}
                className="h-7 px-2 text-xs"
              >
                {canEdit ? (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Rediger
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Detaljer
                  </>
                )}
              </Button>
            )}
            
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