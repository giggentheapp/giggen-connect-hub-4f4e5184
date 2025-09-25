import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Banknote } from 'lucide-react';
import { SafeBooking } from '@/hooks/useBookingsSafe';
import { SafeBookingActions } from './SafeBookingActions';

interface SafeBookingCardProps {
  booking: SafeBooking;
  currentUserId: string;
  onDetailsClick?: () => void;
  onAction?: () => void;
}

// Safe date formatter
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('nb-NO');
  } catch {
    return '';
  }
};

// Safe status display
const getStatusInfo = (status: string, isReceiver: boolean) => {
  const statusMap = {
    pending: {
      label: isReceiver ? 'Ny forespørsel' : 'Venter på svar',
      color: 'bg-blue-100 text-blue-800',
      phase: 'Fase 1'
    },
    allowed: {
      label: 'Forhandling',
      color: 'bg-yellow-100 text-yellow-800',
      phase: 'Fase 2'
    },
    approved_by_both: {
      label: 'Godkjent',
      color: 'bg-purple-100 text-purple-800',
      phase: 'Fase 2'
    },
    both_parties_approved: {
      label: 'Godkjent',
      color: 'bg-purple-100 text-purple-800',
      phase: 'Fase 2'
    },
    upcoming: {
      label: 'Publisert',
      color: 'bg-green-100 text-green-800',
      phase: 'Fase 3'
    },
    completed: {
      label: 'Fullført',
      color: 'bg-gray-100 text-gray-800',
      phase: 'Fase 4'
    },
    cancelled: {
      label: 'Avbrutt',
      color: 'bg-red-100 text-red-800',
      phase: 'Avbrutt'
    }
  };

  return statusMap[status as keyof typeof statusMap] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    phase: 'Ukjent'
  };
};

export const SafeBookingCard = memo(({ 
  booking, 
  currentUserId, 
  onDetailsClick, 
  onAction 
}: SafeBookingCardProps) => {
  console.log('🎯 Rendering SafeBookingCard:', booking.id, booking.status);

  if (!booking?.id) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4">
          <p className="text-destructive">Ugyldig booking data</p>
        </CardContent>
      </Card>
    );
  }

  const isReceiver = currentUserId === booking.receiver_id;
  const isSender = currentUserId === booking.sender_id;
  const statusInfo = getStatusInfo(booking.status, isReceiver);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {booking.title}
            </CardTitle>
            {booking.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {booking.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {statusInfo.phase}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Event Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {booking.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(booking.event_date)}</span>
              {booking.time && <span className="text-muted-foreground">kl. {booking.time}</span>}
            </div>
          )}
          
          {booking.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{booking.venue}</span>
            </div>
          )}
          
          {booking.audience_estimate && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.audience_estimate} personer</span>
            </div>
          )}
          
          {booking.ticket_price && (
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span>{booking.ticket_price} kr</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onDetailsClick && (
            <Button size="sm" variant="outline" onClick={onDetailsClick}>
              Se detaljer
            </Button>
          )}
          
          <SafeBookingActions 
            booking={booking}
            currentUserId={currentUserId}
            onAction={onAction}
          />
        </div>

        {/* Status Help Text */}
        <div className="text-xs text-muted-foreground pt-1">
          {booking.status === 'pending' && isReceiver && 'Du har mottatt en ny booking-forespørsel'}
          {booking.status === 'pending' && isSender && 'Venter på svar fra mottaker'}
          {booking.status === 'allowed' && 'Begge parter kan redigere detaljer'}
          {(booking.status === 'approved_by_both' || booking.status === 'both_parties_approved') && 'Klar for publisering'}
          {booking.status === 'upcoming' && 'Arrangementet er publisert'}
          {booking.status === 'completed' && 'Arrangementet er gjennomført'}
        </div>
      </CardContent>
    </Card>
  );
});

SafeBookingCard.displayName = 'SafeBookingCard';