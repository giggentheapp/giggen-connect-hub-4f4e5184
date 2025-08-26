import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Clock, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface EventMarketItem {
  id: string;
  title: string;
  description: string | null;
  ticket_price: number | null;
  venue: string | null;
  date: string;
  time: string | null;
  is_public: boolean;
  portfolio_id: string | null;
  created_by: string | null;
}

interface EventDetailsModalProps {
  event: EventMarketItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailsModal = ({ event, isOpen, onClose }: EventDetailsModalProps) => {
  if (!event) return null;

  const formatEventDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Status */}
          <div className="flex items-center gap-2">
            <Badge variant="default">Publisert arrangment</Badge>
            {event.is_public && <Badge variant="outline">Offentlig</Badge>}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">Beskrivelse</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Dato</p>
                  <p className="text-sm text-muted-foreground">{formatEventDate(event.date)}</p>
                </div>
              </div>

              {event.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Tid</p>
                    <p className="text-sm text-muted-foreground">{formatEventTime(event.time)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Spillested</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}

              {event.ticket_price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Billettpris</p>
                    <p className="text-sm text-muted-foreground">{event.ticket_price} kr</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Link */}
          {event.portfolio_id && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Artist portefølje</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/portfolio/${event.portfolio_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Se portefølje
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};