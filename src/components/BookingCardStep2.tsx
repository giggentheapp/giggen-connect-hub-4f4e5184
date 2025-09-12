import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, DollarSign, MessageCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';

interface BookingCardStep2Props {
  booking: any;
  currentUserId: string;
  onDetailsClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
}

export const BookingCardStep2 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onConceptClick, 
  onAction 
}: BookingCardStep2Props) => {
  const isApprovedByBoth = booking.status === 'approved_by_both';
  const canEdit = canBeEditedByParties(booking.status as BookingStatus) || isApprovedByBoth;

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="p-0 h-auto font-semibold text-lg hover:text-primary transition-colors"
                onClick={onConceptClick}
                disabled={!booking.concept_ids || booking.concept_ids.length === 0}
              >
                {booking.title}
              </Button>
              <Badge variant="secondary" className="text-xs">
                {canEdit ? 'Steg 2: Under forhandling' : 'Steg 2: Venter på godkjenning'}
              </Badge>
            </CardTitle>
            {booking.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {booking.description}
              </p>
            )}
          </div>
          <Badge className={canEdit 
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }>
            {canEdit ? 'Under forhandling' : 'Venter på begge parter'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Detailed negotiable information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong>Dato:</strong> {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                {booking.time && ` kl. ${booking.time}`}
              </span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span><strong>Sted:</strong> {booking.venue}</span>
            </div>
          )}
          
          {booking.audience_estimate && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span><strong>Publikum:</strong> {booking.audience_estimate} personer</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Priser:</strong> 
              {booking.artist_fee && ` Honorar: ${booking.artist_fee}kr`}
              {booking.ticket_price && ` • Billett: ${booking.ticket_price}kr`}
            </span>
          </div>
        </div>

        {/* Personal message if exists */}
        {booking.personal_message && (
          <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded">
            <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Personlig melding:</span>
              <p className="text-muted-foreground mt-1">
                {booking.personal_message}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onDetailsClick}
            >
              <Eye className="h-4 w-4 mr-1" />
              {canEdit ? 'Rediger detaljer' : 'Se detaljer'}
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
          
          <BookingActions 
            booking={booking}
            currentUserId={currentUserId}
            onAction={onAction}
          />
        </div>

        {/* Status info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          {canEdit ? (
            <span>🔄 Begge parter kan redigere detaljer og se kontaktinfo</span>
          ) : (
            <span>⏳ Venter på at begge parter godkjenner før redigering er mulig</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};