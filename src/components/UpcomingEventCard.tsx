import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface UpcomingEvent {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  time?: string;
  venue?: string;
  address?: string;
  ticket_price?: number;
  audience_estimate?: number;
  status: string;
  created_at: string;
  is_sender: boolean;
  is_receiver: boolean;
  is_public_after_approval?: boolean;
}

interface UpcomingEventCardProps {
  event: UpcomingEvent;
}

const formatSafeDate = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ingen dato satt';
    return format(date, 'dd.MM.yyyy');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Ugyldig dato';
  }
};

export const UpcomingEventCard = ({ event }: UpcomingEventCardProps) => {
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    // Navigate to public event view
    navigate(`/arrangement/${event.id}`);
  };

  const userRole = event.is_sender ? 'Arrangør' : 'Artist';

  return (
    <Card className="hover:shadow-sm transition-all border-l-4 border-l-green-400">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg leading-tight">
              {event.title}
            </CardTitle>
            {event.description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs whitespace-nowrap bg-green-50 text-green-700 border-green-200">
              Publisert
            </Badge>
            <Badge variant="outline" className="text-xs">
              {userRole}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 md:px-4 pb-3 space-y-3">
        {/* Event details - compact grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
          {event.event_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">
                {formatSafeDate(event.event_date)}
                {event.time && ` ${event.time}`}
              </span>
            </div>
          )}
          
          {event.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          
          {event.address && (
            <div className="flex items-center gap-1.5 col-span-full">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{event.address}</span>
            </div>
          )}
          
          {event.ticket_price && (
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">Billett: {event.ticket_price} kr</span>
            </div>
          )}
          
          {event.audience_estimate && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{event.audience_estimate} pers</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1.5">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleDetailsClick}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Detaljer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
