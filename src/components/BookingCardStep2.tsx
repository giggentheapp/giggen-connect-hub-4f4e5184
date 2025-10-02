import { Card } from '@/components/ui/card';
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
            <span>
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
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span>Billett: {booking.ticket_price} kr</span>
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
            
            {booking.concept_ids && booking.concept_ids.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
              >
                Se tilbud
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