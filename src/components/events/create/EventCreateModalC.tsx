import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, Banknote, Clock, Music, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { EventFormData } from '@/hooks/useCreateEvent';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface EventCreateModalCProps {
  onBack: () => void;
  eventData: EventFormData;
  userId: string;
  onPublish: () => void;
  onSaveDraft: () => void;
  isCreating: boolean;
}

export const EventCreateModalC = ({
  onBack,
  eventData,
  onPublish,
  onSaveDraft,
  isCreating,
}: EventCreateModalCProps) => {
  const formatEventDate = () => {
    if (!eventData.event_date) return '';
    const date = new Date(eventData.event_date);
    return format(date, 'EEEE d. MMMM yyyy', { locale: nb });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5); // Remove seconds if present
  };

  const totalParticipants = 
    eventData.participants.musicians.length + 
    eventData.participants.bands.length + 
    eventData.participants.organizers.length;

  return (
    <div className="space-y-6 pb-48">
      {/* Banner */}
      {eventData.banner_url && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden">
          <img
            src={eventData.banner_url}
            alt={eventData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title and Description */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{eventData.title}</h1>
        {eventData.description && (
          <p className="text-lg text-muted-foreground whitespace-pre-wrap">
            {eventData.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Event Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detaljer</h2>
        
        <div className="grid gap-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium">{formatEventDate()}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(eventData.start_time)}
                {eventData.end_time && ` - ${formatTime(eventData.end_time)}`}
              </p>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium">{eventData.venue}</p>
              {eventData.address && (
                <p className="text-sm text-muted-foreground">{eventData.address}</p>
              )}
            </div>
          </div>

          {/* Expected Audience */}
          {eventData.expected_audience && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-muted-foreground">
                Ca. {eventData.expected_audience} personer forventet
              </p>
            </div>
          )}

          {/* Ticket Price */}
          {eventData.has_paid_tickets && eventData.ticket_price && (
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-primary" />
              <p className="text-muted-foreground">
                Billett: {eventData.ticket_price} NOK
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Deltakere</h2>
          <Badge variant="outline" className="text-base">
            {totalParticipants}
          </Badge>
        </div>

        {/* Musicians */}
        {eventData.participants.musicians.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Music className="h-4 w-4" />
              Musikere ({eventData.participants.musicians.length})
            </h3>
            <div className="grid gap-2">
              {eventData.participants.musicians.map((musician) => (
                <Card key={musician.user_id} className="border-border/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={musician.avatar_url || undefined} />
                      <AvatarFallback>
                        {musician.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{musician.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{musician.username}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bands */}
        {eventData.participants.bands.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Band ({eventData.participants.bands.length})
            </h3>
            <div className="grid gap-2">
              {eventData.participants.bands.map((band) => (
                <Card key={band.band_id} className="border-border/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={band.image_url || undefined} />
                      <AvatarFallback>
                        {band.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{band.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Organizers */}
        {eventData.participants.organizers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Arrangører ({eventData.participants.organizers.length})
            </h3>
            <div className="grid gap-2">
              {eventData.participants.organizers.map((organizer) => (
                <Card key={organizer.user_id} className="border-border/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={organizer.avatar_url || undefined} />
                      <AvatarFallback>
                        {organizer.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{organizer.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{organizer.username}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {totalParticipants === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ingen deltakere lagt til enda</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3 max-w-4xl mx-auto">
        <Button
          onClick={onPublish}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-accent-orange to-accent-pink hover:opacity-90"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Oppretter...
            </>
          ) : (
            'Opprett arrangement'
          )}
        </Button>
        
        <Button
          onClick={onSaveDraft}
          disabled={isCreating}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lagrer...
            </>
          ) : (
            'Lagre som utkast'
          )}
        </Button>

        <Button
          onClick={onBack}
          disabled={isCreating}
          variant="ghost"
          className="w-full"
        >
          Tilbake
        </Button>
      </div>
    </div>
  );
};
