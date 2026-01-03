import { useState, useEffect, SetStateAction, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Image as ImageIcon, Loader2, Info, FileText, Check } from 'lucide-react';
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
import { BookingAgreementModal } from '@/components/BookingAgreementModal';
import { UniversalGallery, GalleryFile } from '@/components/UniversalGallery';

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
  
  // Stable update function to prevent re-renders
  const updateField = useCallback((field: keyof EventFormData, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  }, [setEventData]);
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
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<string[]>([]);
  const [selectedBannerFromGallery, setSelectedBannerFromGallery] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);

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

  const loadPortfolioAttachments = async (bookingId: string) => {
    try {
      const { data: attachments, error } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_url,
            mime_type,
            file_type,
            title,
            thumbnail_path
          )
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;

      if (attachments && attachments.length > 0) {
        // Convert to GalleryFile format
        const files: GalleryFile[] = attachments
          .map((attachment: any) => {
            if (!attachment.portfolio_file) return null;
            
            const file = attachment.portfolio_file;
            let fileUrl = file.file_url;
            if (!fileUrl && file.file_path) {
              fileUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
            }
            
            return {
              id: file.id || attachment.id,
              filename: file.filename,
              file_path: file.file_path,
              file_url: fileUrl,
              file_type: file.file_type,
              mime_type: file.mime_type,
              title: file.title || file.filename,
              thumbnail_path: file.thumbnail_path || null,
            } as GalleryFile;
          })
          .filter((file): file is GalleryFile => file !== null);

        // Save gallery files to state
        setGalleryFiles(files);

        // Separate images and videos for banner selection
        const images: string[] = [];
        const videos: string[] = [];

        files.forEach((file) => {
          const publicUrl = file.file_url || 
            supabase.storage.from('filbank').getPublicUrl(file.file_path || '').data.publicUrl;
          
          if (file.mime_type?.startsWith('image/')) {
            images.push(publicUrl);
          } else if (file.mime_type?.startsWith('video/')) {
            videos.push(publicUrl);
          }
        });

        setGalleryImages(images);
        setGalleryVideos(videos);
        
        // Save to eventData so it persists to database
        setEventData((prev) => ({
          ...prev,
          gallery_images: images,
          gallery_videos: videos,
          // If no banner selected, use first image
          banner_url: prev.banner_url || images[0] || prev.banner_url,
        }));
        
        if (images.length > 0 && !eventData.banner_url) {
          setSelectedBannerFromGallery(images[0]);
          setBannerPreview(images[0]);
        }
      }
    } catch (error) {
      console.error('Error loading portfolio attachments:', error);
    }
  };

  const loadBookingFromUrl = async (bookingId: string) => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (booking && (
        booking.status === 'approved_by_both' || 
        booking.status === 'both_parties_approved' || 
        booking.status === 'upcoming'
      )) {
        setSelectedBooking(booking);
        autoFillFromBooking(booking);
        onBookingSelected?.(booking.id);
        
        // Load portfolio attachments from booking
        await loadPortfolioAttachments(bookingId);
        
        // Load profile images for sender and receiver
        if (booking.sender_id) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', booking.sender_id)
            .single();
          if (senderProfile?.avatar_url) {
            setEventData((prev) => ({
              ...prev,
              sender_profile_image: senderProfile.avatar_url,
            }));
          }
        }
        
        if (booking.receiver_id) {
          const { data: receiverProfile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', booking.receiver_id)
            .single();
          if (receiverProfile?.avatar_url) {
            setEventData((prev) => ({
              ...prev,
              receiver_profile_image: receiverProfile.avatar_url,
            }));
          }
        }
        
        toast({
          title: 'Booking lastet',
          description: 'Arrangement-detaljer er fylt ut fra booking-avtalen',
        });
      } else if (booking) {
        toast({
          title: 'Booking ikke klar',
          description: 'Booking-avtalen må være godkjent av begge parter før arrangement kan opprettes',
          variant: 'destructive',
        });
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
      
      // Billettpris - autofill hvis visibility tillater (men IKKE has_paid_tickets uten whitelist)
      ticket_price: visibilitySettings.show_ticket_price !== false 
        ? (booking.ticket_price?.toString() || eventData.ticket_price) 
        : eventData.ticket_price,
      // has_paid_tickets should NOT be auto-enabled - requires whitelist check
      has_paid_tickets: false,
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
            <div className="space-y-2 mt-2">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Arrangementet er koblet til booking-avtale. Kun publikumsrelevante felter er autofylt basert på synlighetsinnstillinger.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAgreementModal(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Se booking-avtale
              </Button>
            </div>
          )}
        </div>

        {/* Portfolio Images from Booking */}
        {selectedBooking && galleryFiles.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Label>Bilder og videoer fra booking-avtale</Label>
            
            {/* Banner Selection from Gallery - Only show images */}
            {galleryImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Velg bannerbilde</Label>
                <div className="grid grid-cols-3 gap-2">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedBannerFromGallery(imageUrl);
                        setEventData((prev) => ({ ...prev, banner_url: imageUrl }));
                        setBannerPreview(imageUrl);
                      }}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedBannerFromGallery === imageUrl 
                          ? "border-primary ring-2 ring-primary" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedBannerFromGallery === imageUrl && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Klikk på et bilde for å velge det som banner
                </p>
              </div>
            )}
            
            {/* Universal Gallery - Shows all files with clickable modal */}
            <div className="space-y-2">
              <Label className="text-sm">
                Galleri ({galleryFiles.length} {galleryFiles.length === 1 ? 'fil' : 'filer'})
              </Label>
              <UniversalGallery
                files={galleryFiles}
                gridCols="grid-cols-4"
                gap="gap-2"
                showFilename={true}
              />
            </div>
          </div>
        )}

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
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse (valgfri)</Label>
              <Textarea
                id="description"
                placeholder="Beskriv arrangementet..."
                value={eventData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
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
                  onChange={(e) => updateField('start_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Sluttid (valgfri)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={eventData.end_time || ''}
                  onChange={(e) => updateField('end_time', e.target.value)}
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
                onChange={(e) => updateField('venue', e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse (valgfri)</Label>
              <AddressAutocomplete
                value={eventData.address || ''}
                onChange={(address) => updateField('address', address)}
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
                onChange={(e) => updateField('expected_audience', e.target.value)}
              />
            </div>

            {/* Ticket Price - always available */}
            <div className="space-y-2">
              <Label htmlFor="ticket_price">Billettpris (NOK) (valgfri)</Label>
              <Input
                id="ticket_price"
                type="number"
                min="0"
                step="10"
                value={eventData.ticket_price || ''}
                onChange={(e) => updateField('ticket_price', e.target.value)}
                placeholder="F.eks. 150"
              />
              <p className="text-xs text-muted-foreground">
                Billettpris kan settes uavhengig av betalingsmetode
              </p>
            </div>

            {/* Stripe Ticketing Section - only for whitelisted users */}
            {checkingAccess ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sjekker tilgang...
              </div>
            ) : hasTicketingAccess && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Aktiver Stripe-betaling</Label>
                    <p className="text-xs text-muted-foreground">
                      Tillat billettkjøp gjennom appen med Stripe
                    </p>
                  </div>
                  <Button
                    variant={eventData.has_paid_tickets ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => updateField('has_paid_tickets', !eventData.has_paid_tickets)}
                  >
                    {eventData.has_paid_tickets ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                </div>
                {eventData.has_paid_tickets && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Stripe-betaling er aktivert. Billetter kan kjøpes gjennom appen. Billettpris må være satt.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

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

      <BookingAgreementModal
        bookingId={selectedBooking?.id || null}
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        currentUserId={userId}
      />
    </>
  );
};
