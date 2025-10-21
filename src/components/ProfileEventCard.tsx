import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Banknote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProfileEventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    event_date?: string;
    time?: string;
    ticket_price?: number;
    price_musician?: string;
  };
}

export const ProfileEventCard = ({ event }: ProfileEventCardProps) => {
  const navigate = useNavigate();

  const formatSafeDate = (dateString?: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'dd.MM.yyyy');
    } catch {
      return '';
    }
  };

  const handleClick = () => {
    navigate(`/arrangement/${event.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <div className="p-4 space-y-3">
        <div onClick={handleClick} className="cursor-pointer space-y-2">
          <h3 className="text-lg font-semibold">{event.title}</h3>
          
          {event.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm pt-2">
            {event.ticket_price && (
              <div className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>{event.ticket_price} kr</span>
              </div>
            )}
            
            {event.event_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatSafeDate(event.event_date)}</span>
              </div>
            )}
            
            {event.time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.time}</span>
              </div>
            )}
          </div>
        </div>

        <Button className="w-full" disabled variant="secondary">
          Ikke tilgjengelig for kjøp i appen
        </Button>
      </div>
    </Card>
  );
};
