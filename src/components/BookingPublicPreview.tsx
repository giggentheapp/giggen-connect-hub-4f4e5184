import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Users, Eye, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { BookingPortfolioAttachments } from '@/components/BookingPortfolioAttachments';

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

  // Get visibility settings from booking, with defaults
  const visibilitySettings = booking.public_visibility_settings || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Forhåndsvisning av arrangement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Slik vises arrangementet til publikum når det publiseres
            </AlertDescription>
          </Alert>

          {/* Public View - Clean, card-less design */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {makerProfile?.avatar_url && (
                  <img 
                    src={makerProfile.avatar_url} 
                    alt={makerProfile.display_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{booking.title}</h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    med {makerProfile?.display_name || 'Artist'}
                  </p>
                  {booking.description && visibilitySettings.show_description !== false && (
                    <p className="text-base leading-relaxed">{booking.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Information Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {booking.event_date && visibilitySettings.show_date !== false && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-semibold">Dato og tid</span>
                  </div>
                  <p className="text-lg">
                    {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                    {booking.time && visibilitySettings.show_time !== false && ` kl. ${booking.time}`}
                  </p>
                </div>
              )}

              {(booking.venue || booking.address) && (visibilitySettings.show_venue !== false || visibilitySettings.show_address !== false) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">Sted</span>
                  </div>
                  {booking.venue && visibilitySettings.show_venue !== false && <p className="text-lg">{booking.venue}</p>}
                  {booking.address && visibilitySettings.show_address !== false && <p className="text-sm text-muted-foreground">{booking.address}</p>}
                </div>
              )}

              {booking.ticket_price && visibilitySettings.show_ticket_price !== false && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">Billettpris</span>
                  </div>
                  <p className="text-lg font-medium">{booking.ticket_price} kr</p>
                </div>
              )}

              {booking.audience_estimate && visibilitySettings.show_audience_estimate !== false && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">Kapasitet</span>
                  </div>
                  <p className="text-lg">{booking.audience_estimate} personer</p>
                </div>
              )}
            </div>

            {/* Portfolio Attachments */}
            {booking.id && visibilitySettings.show_portfolio !== false && (
              <div className="pt-4">
                <BookingPortfolioAttachments
                  bookingId={booking.id}
                  currentUserId={booking.receiver_id}
                  canEdit={false}
                />
              </div>
            )}

            {/* Artist Bio */}
            {makerProfile?.bio && visibilitySettings.show_artist_bio !== false && (
              <div className="pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-3">Om artisten</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {makerProfile.bio}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPublish();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};