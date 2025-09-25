import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Banknote, MessageCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';

interface BookingCardStep2Props {
  booking: any;
  currentUserId: string;
  onDetailsClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
  onConfirmationClick?: () => void;
  onAgreementClick?: () => void;
}

export const BookingCardStep2 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onConceptClick, 
  onAction,
  onConfirmationClick,
  onAgreementClick
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
        {/* Comprehensive booking details - all editable in negotiation phase */}
        <div className="space-y-4">
          {/* Event Information */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-3 text-sm">📅 Arrangementsdetaljer</h4>
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
                  <span><strong>Spillested:</strong> {booking.venue}</span>
                </div>
              )}
              
              {booking.address && (
                <div className="flex items-center gap-2 col-span-full">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Adresse:</strong> {booking.address}</span>
                </div>
              )}
              
              {booking.audience_estimate && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Forventet publikum:</strong> {booking.audience_estimate} personer</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-3 text-sm">💰 Prising og økonomi</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Musiker honorar:</strong> 
                  {booking.door_deal ? (
                    ` ${booking.door_percentage || 50}% av dørinntekter`
                  ) : booking.by_agreement ? (
                    ' Avtales direkte mellom partene'
                  ) : (
                    ` ${booking.artist_fee || booking.price_musician || 'Ikke spesifisert'} Kr`
                  )}
                </span>
              </div>
              
              {booking.ticket_price && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Billettpris:</strong> {booking.ticket_price} Kr</span>
                </div>
              )}

              {(booking.door_deal || booking.by_agreement) && (
                <div className="text-xs text-muted-foreground ml-6">
                  {booking.door_deal && '💡 Døravtale - honorar basert på billettsalg'}
                  {booking.by_agreement && '🤝 Fleksibel avtale - pris justeres etter behov'}
                </div>
              )}
            </div>
          </div>

          {/* Technical and Hospitality */}
          {(booking.tech_spec || booking.hospitality_rider) && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-3 text-sm">🎛️ Teknisk og hospitality</h4>
              <div className="space-y-2 text-sm">
                {booking.tech_spec && (
                  <div>
                    <strong>Tekniske krav:</strong>
                    <p className="text-muted-foreground mt-1">{booking.tech_spec}</p>
                  </div>
                )}
                {booking.hospitality_rider && (
                  <div>
                    <strong>Hospitality rider:</strong>
                    <p className="text-muted-foreground mt-1">{booking.hospitality_rider}</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
            
            {booking.concept_ids && booking.concept_ids.length > 0 && booking.status !== 'pending' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
              >
                Se tilbud{booking.concept_ids.length > 1 ? '' : ''}
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