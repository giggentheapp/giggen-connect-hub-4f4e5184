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

          {/* What only the owners will see - Enhanced with clear warnings */}
          <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                🔒 PRIVAT INFORMASJON - Kun synlig for dere som parter
              </CardTitle>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Følgende informasjon vil ALDRI bli vist til publikum eller andre brukere
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-red-100 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="space-y-4">
                  {/* Financial details - Enhanced */}
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border-l-4 border-red-500">
                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                      💰 Økonomiske detaljer (KONFIDENSIELT)
                    </h4>
                    <div className="text-sm space-y-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {booking.door_deal ? (
                        <>
                          <p className="font-medium">• Artist honorar: <span className="text-green-600 dark:text-green-400">{booking.door_percentage || 'X'}% av dørinntekter</span></p>
                          {booking.audience_estimate && booking.ticket_price && (
                            <p>• Estimert artist inntekt: <span className="font-bold text-green-600 dark:text-green-400">{Math.round((booking.audience_estimate * booking.ticket_price * (booking.door_percentage || 0)) / 100).toLocaleString('nb-NO')} kr</span></p>
                          )}
                        </>
                      ) : booking.by_agreement ? (
                        <p className="font-medium">• Artist honorar: <span className="text-blue-600 dark:text-blue-400">Avtales direkte mellom partene</span></p>
                      ) : (
                        <p className="font-medium">• Fast artist honorar: <span className="text-green-600 dark:text-green-400">{booking.artist_fee ? `${booking.artist_fee} kr` : 'Ikke spesifisert'}</span></p>
                      )}
                      
                      {booking.audience_estimate && booking.ticket_price && (
                        <p>• Total estimert billetinntekt: <span className="font-bold">{(booking.audience_estimate * booking.ticket_price).toLocaleString('nb-NO')} kr</span></p>
                      )}
                    </div>
                  </div>

                  {/* Contact and private info - Enhanced */}
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border-l-4 border-amber-500">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                      📞 Sensitive personopplysninger (BESKYTTET)
                    </h4>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Kontaktinformasjon (telefonnummer, e-post, personlige adresser)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Tekniske spesifikasjoner og hospitality rider
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Private meldinger mellom partene
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Komplett booking historikk og endringer
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Interne notater og avtaledetaljer
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Fullstendige økonomiske avtaler og betalingsinformasjon
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Privacy guarantee */}
                  <div className="bg-green-100 dark:bg-green-950/20 p-3 rounded border border-green-300 dark:border-green-700">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                      ✅ PERSONVERNGARANTI: All sensitiv informasjon forblir privat mellom dere som parter i avtalen.
                    </p>
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