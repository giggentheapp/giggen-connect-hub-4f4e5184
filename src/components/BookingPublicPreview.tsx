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
          {/* Public Event Preview */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">{booking.title}</CardTitle>
              {booking.description && (
                <p className="text-muted-foreground">{booking.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
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

                {/* Removed ticket_price display for security - financial data should not be public */}
              </div>

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
            </CardContent>
          </Card>

          {/* Information about what's NOT shown */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Informasjon som IKKE vises til publikum:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Artist honorar/betalingsdetaljer</li>
                <li>• Billettpriser og finansielle detaljer</li>
                <li>• Kontaktinformasjon</li>
                <li>• Tekniske spesifikasjoner</li>
                <li>• Hospitality rider</li>
                <li>• Interne avtaledetaljer</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onPublish} 
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