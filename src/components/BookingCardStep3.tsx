import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Banknote, Phone, Mail, Eye, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { BookingActions } from './BookingActions';

interface BookingCardStep3Props {
  booking: any;
  currentUserId: string;
  onDetailsClick: () => void;
  onConceptClick: () => void;
  onAction: () => void;
  onConfirmationClick?: () => void;
  onAgreementClick?: () => void;
}

export const BookingCardStep3 = ({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onConceptClick, 
  onAction,
  onConfirmationClick,
  onAgreementClick
}: BookingCardStep3Props) => {
  // Get contact info from sender_contact_info
  const contactInfo = booking.sender_contact_info || {};

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {booking.title}
              <Badge variant="secondary" className="text-xs">
                Steg 3: Publisert arrangement
              </Badge>
            </CardTitle>
            {booking.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {booking.description}
              </p>
            )}
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Globe className="h-3 w-3 mr-1" />
            Publisert
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Final event details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span>
                <strong>Dato:</strong> {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                {booking.time && ` kl. ${booking.time}`}
              </span>
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span><strong>Spillested:</strong> {booking.venue}</span>
            </div>
          )}
          
          {booking.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span><strong>Adresse:</strong> {booking.address}</span>
            </div>
          )}
          
          {booking.audience_estimate && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span><strong>Forventet publikum:</strong> {booking.audience_estimate} personer</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-600" />
            <span>
              <strong>Avtalt honorar:</strong>{' '}
              {booking.door_deal ? (
                `${booking.door_percentage}% av dørinntekter`
              ) : (
                booking.artist_fee || booking.price_musician || 'Ikke spesifisert'
              )}
              {booking.ticket_price && ` • Billettpris: ${booking.ticket_price} Kr`}
            </span>
          </div>
        </div>

        {/* Contact information - now visible */}
        {(contactInfo.phone || contactInfo.email) && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Kontaktinformasjon (nå synlig)
            </h4>
            <div className="space-y-1 text-sm">
              {contactInfo.phone && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Phone className="h-3 w-3" />
                  <span>{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Mail className="h-3 w-3" />
                  <span>{contactInfo.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio information if available */}
        {booking.portfolio_available && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Portefølje tilgjengelig
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Artistens arbeider, referanser og kreative innhold kan ses i fullt omfang for dette arrangementet.
            </p>
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
              Vis avtale
            </Button>
            
            {booking.concept_ids && booking.concept_ids.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onConceptClick}
              >
                Se tilbud{booking.concept_ids.length > 1 ? '' : ''}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Publisert {booking.published_at && format(new Date(booking.published_at), 'dd.MM.yyyy')}</span>
            <BookingActions 
              booking={booking}
              currentUserId={currentUserId}
              onAction={onAction}
            />
          </div>
        </div>

        {/* Public visibility info with portfolio note */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Arrangementet er synlig for andre brukere. Kun tittel, beskrivelse, dato og sted er offentlig.
          {booking.portfolio_available && (
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              Porteføljeinnhold er også tilgjengelig for dette arrangementet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};