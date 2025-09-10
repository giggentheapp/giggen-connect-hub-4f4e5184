import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';

interface BookingCardStep1Props {
  booking: any;
  currentUserId: string;
  onDetailsClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
}

export const BookingCardStep1 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onConceptClick, 
  onAction 
}: BookingCardStep1Props) => {
  const isReceiver = currentUserId === booking.receiver_id;
  const isSender = currentUserId === booking.sender_id;

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {booking.title}
              <Badge variant="secondary" className="text-xs">
                Steg 1: Første forespørsel
              </Badge>
            </CardTitle>
            {booking.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {booking.description}
              </p>
            )}
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Venter på svar
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Core event details */}
        <div className="space-y-2">
          {booking.event_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Ønsket dato: {format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Spillested: {booking.venue}</span>
            </div>
          )}
          
          {booking.personal_message && (
            <div className="flex items-start gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Personlig melding:</span>
                <p className="text-muted-foreground mt-1 line-clamp-3">
                  {booking.personal_message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onDetailsClick}
            >
              Se detaljer
            </Button>
            
            {booking.concept_ids && booking.concept_ids.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
              >
                Se konsept{booking.concept_ids.length > 1 ? 'er' : ''}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isSender && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Sendt {format(new Date(booking.created_at), 'dd.MM')}
              </div>
            )}
            
            <BookingActions 
              booking={booking}
              currentUserId={currentUserId}
              onAction={onAction}
            />
          </div>
        </div>

        {/* Info note for receivers */}
        {isReceiver && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 Kontaktinfo og dokumenter blir synlige først når du tillater forespørselen
          </div>
        )}
      </CardContent>
    </Card>
  );
};