import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Heart, Calendar, MapPin } from 'lucide-react';
import { FavoriteEvent } from '@/hooks/useFavorites';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface FavoriteEventCardProps {
  event: FavoriteEvent;
  onRemove: (eventId: string) => void;
}

export const FavoriteEventCard = ({ event, onRemove }: FavoriteEventCardProps) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(event.id);
  };

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return 'Dato ikke angitt';
    try {
      return format(new Date(dateString), 'dd. MMMM yyyy, HH:mm', { locale: nb });
    } catch {
      return 'Ugyldig dato';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">{event.title}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatEventDate(event.event_date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
          >
            <Heart className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </CardHeader>
      {event.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        </CardContent>
      )}
    </Card>
  );
};