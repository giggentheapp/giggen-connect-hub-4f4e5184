import { useState, useEffect, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Image as ImageIcon, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { EventFormData } from '@/hooks/useCreateEvent';
import { useToast } from '@/hooks/use-toast';
import { BookingSelector } from './BookingSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EventCreateModalAProps {
  onNext: () => void;
  eventData: EventFormData;
  setEventData: (data: SetStateAction<EventFormData>) => void;
  userId: string;
  onBookingSelected?: (bookingId: string | null) => void;
}

export const EventCreateModalA = ({ 
  onNext, 
  eventData, 
  setEventData,
  userId,
  onBookingSelected 
}: EventCreateModalAProps) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get('bookingId');
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [bannerFile, setBannerFile] = useState<any>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [hasTicketingAccess, setHasTicketingAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    eventData.event_date ? new Date(eventData.event_date) : undefined
  );
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    checkTicketingAccess();
  }, []);

  useEffect(() => {
    if (eventData.banner_url) {
      setBannerPreview(eventData.banner_url);
    }
  }, [eventData.banner_url]);

  // Load booking from URL parameter
  useEffect(() => {
    if (bookingIdFromUrl && userId && !selectedBooking) {
      loadBookingFromUrl(bookingIdFromUrl);
    }
  }, [bookingIdFromUrl, userId]);

  const loadBookingFromUrl = async (bookingId: string) => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (booking && (booking.status === 'both_parties_approved' || booking.status === 'upcoming')) {
        setSelectedBooking(booking);
        autoFillFromBooking(booking);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast({
        title: 'Kunne ikke laste booking',
        description: 'Booking-avtalen kunne ikke lastes',
        variant: 'destructive',
      });
    }
  };

  const autoFillFromBooking = (booking: any) => {
    if (autoFilled) return; // Ikke autofill flere ganger
    
    const visibilitySettings = booking.public_visibility_settings || {};
    
    // Autofyll kun publikumsrelevante felter basert på visibility settings
    const newEventData: EventFormData = {
      ...eventData,
      // Grunnleggende - alltid autofill hvis tilgjengelig
      title: booking.title || eventData.title,
      description: visibilitySettings.show_description !== false 
        ? (booking.description || eventData.description) 
        : eventData.description,
      
      // Sted - autofill hvis visibility tillater
      venue: visibilitySettings.show_venue !== false 
        ? (booking.venue || eventData.venue) 
        : eventData.venue,
      address: visibilitySettings.show_address !== false 
        ? (booking.address || eventData.address) 
        : eventData.address,
      
      // Dato og tid - alltid autofill hvis tilgjengelig
      event_date: booking.event_date 
        ? format(new Date(booking.event_date), 'yyyy-MM-dd')
        : eventData.event_date,
      start_time: booking.start_time || booking.time || eventData.start_time,
      end_time: booking.end_time || eventData.end_time,
      
      // Publikum - autofill hvis visibility tillater
      expected_audience: visibilitySettings.show_audience_estimate !== false 
        ? (booking.audience_estimate?.toString() || eventData.expected_audience) 
        : eventData.expected_audience,
      
      // Billettpris - autofill hvis visibility tillater
      ticket_price: visibilitySettings.show_ticket_price !== false 
        ? (booking.ticket_price?.toString() || eventData.ticket_price) 
        : eventData.ticket_price,
      has_paid_tickets: visibilitySettings.show_ticket_price !== false && booking.ticket_price 
        ? true 
        : eventData.has_paid_tickets,
    };
    
    // Oppdater selected date for kalender
    if (booking.event_date) {
      setSelectedDate(new Date(booking.event_date));
    }
    
    setEventData(newEventData);
    setAutoFilled(true);
    
    toast({
      title: 'Felter autofylt',
      description: 'Arrangement-detaljer er fylt ut fra booking-avtalen',
    });
  };

  const checkTicketingAccess = async () => {
    try {
      setCheckingAccess(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: whitelistEntry } = await supabase
        .from('admin_whitelist')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();

      setHasTicketingAccess(!!whitelistEntry);
    } catch (error) {
      console.error('Error checking ticketing access:', error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleBannerSelect = (file: any) => {
    setBannerFile(file);
    const publicUrl = supabase.storage
      .from('filbank')
      .getPublicUrl(file.file_path).data.publicUrl;
    
    setBannerPreview(publicUrl);
    setEventData((prev) => ({
      ...prev,
      banner_url: publicUrl,
    }));
    setShowFilebankModal(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setEventData((prev) => ({
        ...prev,
        event_date: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleNext = () => {
    if (!eventData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        description: 'Du må legge til en tittel før du fortsetter',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData.event_date) {
      toast({
        title: 'Dato påkrevd',
        description: 'Du må velge en dato for arrangementet',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData.start_time) {
      toast({
        title: 'Starttid påkrevd',
        description: 'Du må legge til starttid',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData.venue) {
      toast({
        title: 'Venue påkrevd',
        description: 'Du må legge til venue/sted',
        variant: 'destructive',
      });
      return;
    }

    onNext();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Booking Selection Section */}
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
          <Label>Koble til booking-avtale (valgfritt)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Velg en godkjent booking-avtale for å autofylle arrangement-detaljer
          </p>
          <BookingSelector
            userId={userId}
            onSelect={(booking) => {
              setSelectedBooking(booking);
              setAutoFilled(false); // Reset for å tillate ny autofill
              autoFillFromBooking(booking);
              onBookingSelected?.(booking.id);
            }}
            selectedBookingId={selectedBooking?.id}
            onClear={() => {
              setSelectedBooking(null);
              setAutoFilled(false);
              onBookingSelected?.(null);
            }}
          />
          
          {selectedBooking && (
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Arrangementet er koblet til booking-avtale. Kun publikumsrelevante felter er autofylt basert på synlighetsinnstillinger.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Banner Image */}
        <div className="space-y-2">
          <Label>Bannerbilde (valgfri)</Label>
              {bannerPreview ? (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Banner"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setShowFilebankModal(true)}
                  >
                    Endre
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => setShowFilebankModal(true)}
                >
                  <ImageIcon className="h-8 w-8 mr-2" />
                  Velg bannerbilde fra filbank
                </Button>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                placeholder="F.eks. Sommerjazz i parken"
                value={eventData.title}
                onChange={(e) => setEventData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse (valgfri)</Label>
              <Textarea
                id="description"
                placeholder="Beskriv arrangementet..."
                value={eventData.description || ''}
                onChange={(e) => setEventData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Dato *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP', { locale: nb }) : 'Velg dato'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Starttid *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={eventData.start_time}
                  onChange={(e) => setEventData((prev) => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Sluttid (valgfri)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={eventData.end_time || ''}
                  onChange={(e) => setEventData((prev) => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                placeholder="F.eks. Parkteatret"
                value={eventData.venue}
                onChange={(e) => setEventData((prev) => ({ ...prev, venue: e.target.value }))}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse (valgfri)</Label>
              <AddressAutocomplete
                value={eventData.address || ''}
                onChange={(address) => setEventData((prev) => ({ ...prev, address }))}
                placeholder="F.eks. Olaf Ryes plass 2, Oslo"
              />
            </div>

            {/* Expected Audience */}
            <div className="space-y-2">
              <Label htmlFor="expected_audience">Forventet publikum (valgfri)</Label>
              <Input
                id="expected_audience"
                type="number"
                placeholder="F.eks. 100"
                value={eventData.expected_audience || ''}
                onChange={(e) => setEventData((prev) => ({ ...prev, expected_audience: e.target.value }))}
              />
            </div>

            {/* Ticketing Section */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">Billettfunksjon</Label>
              
              {checkingAccess ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sjekker tilgang...
                </div>
              ) : hasTicketingAccess ? (
                <div className="space-y-4">
                  {!eventData.has_paid_tickets ? (
                    <Button
                      variant="outline"
                      onClick={() => setEventData((prev) => ({ ...prev, has_paid_tickets: true }))}
                      className="w-full"
                    >
                      Sett opp billettsalg
                    </Button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Billettsalg aktivert</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventData((prev) => ({ ...prev, has_paid_tickets: false, ticket_price: undefined }))}
                        >
                          Fjern
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ticket_price">Billettpris (NOK) *</Label>
                        <Input
                          id="ticket_price"
                          type="number"
                          placeholder="F.eks. 250"
                          value={eventData.ticket_price || ''}
                          onChange={(e) => setEventData((prev) => ({ ...prev, ticket_price: e.target.value }))}
                          min="0"
                          step="10"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Billettkjøp i appen er ikke tilgjengelig for denne brukeren.
                </p>
              )}
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-6">
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-accent-orange to-accent-pink hover:opacity-90"
                size="lg"
              >
                Neste
              </Button>
            </div>
          </div>

      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={handleBannerSelect}
        userId={userId}
        fileTypes={['image']}
        category="all"
      />
    </>
  );
};
