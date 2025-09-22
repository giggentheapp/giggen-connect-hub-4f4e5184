import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Banknote, Users, Eye, Check } from 'lucide-react';
import { format } from 'date-fns';

interface BookingPublicPreviewProps {
  booking: any;
  makerProfile: any;
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

export const BookingPublicPreview = ({ 
  booking, 
  makerProfile, 
  isOpen, 
  onClose, 
  onPublish 
}: BookingPublicPreviewProps) => {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Slik vil arrangementet bli vist til publikum
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* What the public will see */}
          <Card className="border-2 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dette vil andre brukere og publikum se
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-xl font-semibold text-primary mb-2">{booking.title}</h3>
                {booking.description && (
                  <p className="text-muted-foreground mb-4">{booking.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                        {booking.time && ` kl. ${booking.time}`}
                      </span>
                    </div>
                  )}
                  
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{booking.venue}</span>
                    </div>
                  )}

                  {booking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Forventet publikum: {booking.audience_estimate}</span>
                    </div>
                  )}
                </div>

                {/* Public ticket price if available */}
                {booking.ticket_price && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span className="font-medium">Billettpris: {booking.ticket_price} kr</span>
                    </div>
                  </div>
                )}

                {/* Maker Info */}
                {makerProfile && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Artist</h4>
                    <div className="flex items-center gap-3">
                      {makerProfile.avatar_url && (
                        <img 
                          src={makerProfile.avatar_url} 
                          alt={makerProfile.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{makerProfile.display_name}</p>
                        {makerProfile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {makerProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What only the owners will see */}
          <Card className="border-2 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-amber-700 dark:text-amber-300 flex items-center gap-2">
                🔒 Dette ser kun dere som parter i avtalen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="space-y-3">
                  {/* Financial details */}
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">💰 Finansielle detaljer</h4>
                    <div className="text-sm space-y-1">
                      {booking.door_deal ? (
                        <>
                          <p>• Artist honorar: {booking.door_percentage || 'X'}% av dørinntekter</p>
                          {booking.audience_estimate && booking.ticket_price && (
                            <p>• Estimert artist inntekt: {Math.round((booking.audience_estimate * booking.ticket_price * (booking.door_percentage || 0)) / 100).toLocaleString('nb-NO')} kr</p>
                          )}
                        </>
                      ) : booking.by_agreement ? (
                        <p>• Artist honorar: Avtales direkte mellom partene</p>
                      ) : (
                        <p>• Fast artist honorar: {booking.artist_fee ? `${booking.artist_fee} kr` : 'Ikke spesifisert'}</p>
                      )}
                      
                      {booking.audience_estimate && booking.ticket_price && (
                        <p>• Total estimert billetinntekt: {(booking.audience_estimate * booking.ticket_price).toLocaleString('nb-NO')} kr</p>
                      )}
                    </div>
                  </div>

                  {/* Contact and private info */}
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">📞 Privat informasjon</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Kontaktinformasjon (telefon/e-post)</li>
                      <li>• Tekniske spesifikasjoner og rider</li>
                      <li>• Personlige meldinger mellom partene</li>
                      <li>• Booking historikk og endringer</li>
                      <li>• Interne notater og avtaledetaljer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Publish button clicked');
                onPublish();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Tilbake til avtale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};