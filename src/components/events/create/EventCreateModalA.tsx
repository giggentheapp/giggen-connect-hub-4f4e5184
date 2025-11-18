import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { supabase } from '@/integrations/supabase/client';
import { EventFormData } from '@/hooks/useCreateEvent';
import { useToast } from '@/hooks/use-toast';

interface EventCreateModalAProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  eventData: EventFormData;
  setEventData: (data: EventFormData) => void;
  userId: string;
}

export const EventCreateModalA = ({ 
  isOpen, 
  onClose, 
  onNext, 
  eventData, 
  setEventData,
  userId 
}: EventCreateModalAProps) => {
  const { toast } = useToast();
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [bannerFile, setBannerFile] = useState<any>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [hasTicketingAccess, setHasTicketingAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    eventData.event_date ? new Date(eventData.event_date) : undefined
  );

  useEffect(() => {
    checkTicketingAccess();
  }, []);

  useEffect(() => {
    if (eventData.banner_url) {
      setBannerPreview(eventData.banner_url);
    }
  }, [eventData.banner_url]);

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
    setEventData({
      ...eventData,
      banner_url: publicUrl,
    });
    setShowFilebankModal(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setEventData({
        ...eventData,
        event_date: format(date, 'yyyy-MM-dd'),
      });
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
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Opprett arrangement - Grunninformasjon</SheetTitle>
            <SheetDescription>
              Fyll inn grunnleggende informasjon om arrangementet
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
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
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse (valgfri)</Label>
              <Textarea
                id="description"
                placeholder="Beskriv arrangementet..."
                value={eventData.description || ''}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
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
                  onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Sluttid (valgfri)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={eventData.end_time || ''}
                  onChange={(e) => setEventData({ ...eventData, end_time: e.target.value })}
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
                onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse (valgfri)</Label>
              <Input
                id="address"
                placeholder="F.eks. Olaf Ryes plass 2, Oslo"
                value={eventData.address || ''}
                onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
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
                onChange={(e) => setEventData({ ...eventData, expected_audience: e.target.value })}
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
                      onClick={() => setEventData({ ...eventData, has_paid_tickets: true })}
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
                          onClick={() => setEventData({ ...eventData, has_paid_tickets: false, ticket_price: undefined })}
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
                          onChange={(e) => setEventData({ ...eventData, ticket_price: e.target.value })}
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
        </SheetContent>
      </Sheet>

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
