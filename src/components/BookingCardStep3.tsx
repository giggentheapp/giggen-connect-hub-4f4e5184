import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, MessageCircle, Eye, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';

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
  return (
    <Card className="hover:shadow-sm transition-all border-l-4 border-l-green-400">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg leading-tight flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
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
          <Badge variant="secondary" className="text-xs whitespace-nowrap bg-green-50 text-green-700 border-green-200">
            Publisert
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
                {format(new Date(booking.event_date), 'dd.MM.yyyy')}
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
            <Button 
              size="sm" 
              variant="outline"
              onClick={onDetailsClick}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Detaljer
            </Button>
            
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