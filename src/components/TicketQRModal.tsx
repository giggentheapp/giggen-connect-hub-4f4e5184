import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center py-6 bg-muted/30 rounded-lg">
            <div className="bg-white p-4 rounded-lg">
              <QRCode 
                value={ticket.qr_code_data} 
                size={200}
                level="H"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              {ticket.ticket_code}
            </p>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            {event.description && (
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            )}

            {event.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-accent-orange mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-0.5">Dato{event.time && ' og tid'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                    {event.time && ` kl. ${event.time}`}
                  </p>
                </div>
              </div>
            )}

            {(event.venue || event.address) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent-orange mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-0.5">Sted</p>
                  {event.venue && <p className="text-sm text-muted-foreground">{event.venue}</p>}
                  {event.address && <p className="text-xs text-muted-foreground">{event.address}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {ticket.status === 'valid' ? 'Gyldig' : 
                 ticket.status === 'used' ? 'Brukt' : ticket.status}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
