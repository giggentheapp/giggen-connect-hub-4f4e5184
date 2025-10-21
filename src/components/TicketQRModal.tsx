import { Dialog, DialogContent } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import { Calendar, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface TicketQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    qr_code_data: string;
    ticket_code: string;
    status: string;
  };
  event: {
    title: string;
    description: string | null;
    event_date: string | null;
    time: string | null;
    venue: string | null;
    address: string | null;
  };
}

export const TicketQRModal = ({ open, onOpenChange, ticket, event }: TicketQRModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-6 py-8 max-w-2xl">
            {/* QR Code Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <QRCode 
                  value={ticket.qr_code_data} 
                  size={280}
                  level="H"
                />
              </div>
              <p className="text-sm text-muted-foreground font-mono mb-2">
                {ticket.ticket_code}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20">
                <span className="text-sm font-medium">
                  {ticket.status === 'valid' ? 'Gyldig billett' : 
                   ticket.status === 'used' ? 'Brukt' : ticket.status}
                </span>
              </div>
            </div>

            {/* Event Details Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
                {event.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                {event.event_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Dato{event.time && ' og tid'}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                        {event.time && ` kl. ${event.time}`}
                      </p>
                    </div>
                  </div>
                )}

                {(event.venue || event.address) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Sted</p>
                      {event.venue && <p className="text-muted-foreground mb-1">{event.venue}</p>}
                      {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
