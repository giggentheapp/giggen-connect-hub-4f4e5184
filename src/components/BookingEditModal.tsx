import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { BookingPortfolioAttachments } from '@/components/BookingPortfolioAttachments';
import { PublicVisibilitySettings } from '@/components/PublicVisibilitySettings';
import { TeachingBookingDetailsPanel } from '@/components/TeachingBookingDetailsPanel';
import { EditableTeachingDetails } from '@/components/EditableTeachingDetails';
import { TeachingAgreementApproval } from '@/components/TeachingAgreementApproval';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Save, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Validation schema
const bookingEditSchema = z.object({
  title: z.string().trim().min(1, "Tittel er påkrevet").max(200, "Tittel må være under 200 tegn"),
  description: z.string().max(2000, "Beskrivelse må være under 2000 tegn").optional().nullable(),
  venue: z.string().max(200, "Spillested må være under 200 tegn").optional().nullable(),
  address: z.string().max(300, "Adresse må være under 300 tegn").optional().nullable(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  start_time: z.string().max(10, "Tid må være i format HH:MM").optional().nullable(),
  end_time: z.string().max(10, "Tid må være i format HH:MM").optional().nullable(),
  ticket_price: z.number().min(0, "Billetpris må være positiv").optional().nullable(),
  artist_fee: z.number().min(0, "Honorar må være positivt").optional().nullable(),
  audience_estimate: z.number().min(1, "Publikumsestimat må være minst 1").optional().nullable(),
  door_percentage: z.number().min(0).max(100, "Prosent må være mellom 0-100").optional().nullable(),
  personal_message: z.string().max(1000, "Personlig melding må være under 1000 tegn").optional().nullable(),
});

interface BookingEditModalProps {
  booking: any;
  currentUserId: string;
  onSaved: () => void;
}

export const BookingEditModal = ({ booking, currentUserId, onSaved }: BookingEditModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conceptData, setConceptData] = useState<any>(null);
  const [loadingConcept, setLoadingConcept] = useState(true);
  const isInitializedRef = useRef(false);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // Fetch concept data to determine if it's a teaching concept
  useEffect(() => {
    const fetchConcept = async () => {
      if (!booking?.selected_concept_id) {
        setLoadingConcept(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('concepts')
          .select('*')
          .eq('id', booking.selected_concept_id)
          .maybeSingle();

        if (error) throw error;
        setConceptData(data);
      } catch (error) {
        console.error('Failed to fetch concept', error);
      } finally {
        setLoadingConcept(false);
      }
    };

    fetchConcept();
  }, [booking?.selected_concept_id]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    start_time: '',
    end_time: '',
    ticket_price: '',
    artist_fee: '',
    audience_estimate: '',
    door_deal: false,
    door_percentage: '',
    by_agreement: false,
    personal_message: '',
    latitude: null as number | null,
    longitude: null as number | null,
    public_visibility_settings: {} as Record<string, boolean>,
  });

  // Initialize form with booking data (only once)
  useEffect(() => {
    if (booking && !isInitializedRef.current) {
      setFormData({
        title: booking.title || '',
        description: booking.description || '',
        venue: booking.venue || '',
        address: booking.address || '',
        start_date: booking.event_date ? new Date(booking.event_date) : null,
        end_date: booking.end_date ? new Date(booking.end_date) : null,
        start_time: booking.time || booking.start_time || '',
        end_time: booking.end_time || '',
        ticket_price: booking.ticket_price?.toString() || '',
        artist_fee: booking.artist_fee?.toString() || '',
        audience_estimate: booking.audience_estimate?.toString() || '',
        door_deal: booking.door_deal || false,
        door_percentage: booking.door_percentage?.toString() || '',
        by_agreement: booking.by_agreement || false,
        personal_message: booking.personal_message || '',
        latitude: booking.latitude || null,
        longitude: booking.longitude || null,
        public_visibility_settings: booking.public_visibility_settings || {},
      });
      setErrors({});
      isInitializedRef.current = true;
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Prepare data for validation
      const dataToValidate = {
        title: formData.title,
        description: formData.description || null,
        venue: formData.venue || null,
        address: formData.address || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        ticket_price: formData.ticket_price ? parseFloat(formData.ticket_price) : null,
        artist_fee: formData.artist_fee ? parseFloat(formData.artist_fee) : null,
        audience_estimate: formData.audience_estimate ? parseInt(formData.audience_estimate) : null,
        door_percentage: formData.door_percentage ? parseFloat(formData.door_percentage) : null,
        personal_message: formData.personal_message || null,
      };

      // Validate with zod
      const validatedData = bookingEditSchema.parse(dataToValidate);

      // Prepare update object
      const updateData: any = {
        title: validatedData.title,
        description: validatedData.description,
        venue: validatedData.venue,
        address: validatedData.address,
        event_date: validatedData.start_date?.toISOString(),
        end_date: validatedData.end_date?.toISOString(),
        time: validatedData.start_time,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        ticket_price: validatedData.ticket_price,
        artist_fee: validatedData.artist_fee,
        audience_estimate: validatedData.audience_estimate,
        door_deal: formData.door_deal,
        door_percentage: validatedData.door_percentage,
        by_agreement: formData.by_agreement,
        personal_message: validatedData.personal_message,
        latitude: formData.latitude,
        longitude: formData.longitude,
        public_visibility_settings: formData.public_visibility_settings,
        last_modified_by: currentUserId,
        last_modified_at: new Date().toISOString()
      };

      await updateBooking(booking.id, updateData);

      toast({
        title: "Detaljer oppdatert",
        description: "Booking-detaljene har blitt lagret",
      });

      // Navigate back to bookings page - uses '/bookings' which will redirect to profile if logged in
      navigate('/bookings', { replace: true });
      onSaved();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Valideringsfeil",
          description: "Sjekk feltene og prøv igjen",
          variant: "destructive"
        });
      } else {
        console.error('Error updating booking:', error);
        toast({
          title: "Feil ved lagring",
          description: "Kunne ikke lagre endringene",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!booking) return null;

  const isSender = currentUserId === booking.sender_id;
  const canEdit = booking.status === 'allowed' || booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver' || booking.status === 'approved_by_both';
  const isInNegotiation = booking.status === 'allowed' || booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver' || booking.status === 'approved_by_both';
  const showContactInfo = isInNegotiation && booking.contact_info_shared_at;
  const isTeaching = conceptData?.concept_type === 'teaching';

  if (loadingConcept) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Laster...</p>
      </div>
    );
  }

  // If it's a teaching concept, handle differently based on status
  if (isTeaching) {
    // If both parties have approved, show the approval confirmation view
    if (booking.approved_by_sender && booking.approved_by_receiver) {
      return <TeachingAgreementApproval 
        booking={booking} 
        conceptData={conceptData} 
        currentUserId={currentUserId}
      />;
    }

    // If status is approved_by_both, show approval interface
    if (booking.status === 'approved_by_both') {
      return <TeachingAgreementApproval 
        booking={booking} 
        conceptData={conceptData} 
        currentUserId={currentUserId}
      />;
    }

    // Otherwise show editable details during negotiation
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Save className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Undervisningsavtale - Forhandling</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Undervisning</Badge>
            {isSender && <Badge variant="outline">Du er avsender</Badge>}
            <Badge variant="secondary">{booking.status}</Badge>
          </div>
        </div>

        {/* Delt kontaktinfo */}
        {showContactInfo && booking.sender_contact_info && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Delt kontaktinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.sender_contact_info.email && (
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">E-post:</span>
                  <a href={`mailto:${booking.sender_contact_info.email}`} className="text-primary hover:underline">
                    {booking.sender_contact_info.email}
                  </a>
                </div>
              )}
              {booking.sender_contact_info.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">Telefon:</span>
                  <a href={`tel:${booking.sender_contact_info.phone}`} className="text-primary hover:underline">
                    {booking.sender_contact_info.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <EditableTeachingDetails 
          booking={booking} 
          conceptData={conceptData} 
          currentUserId={currentUserId}
          onSaved={onSaved}
        />
      </div>
    );
  }

  // Regular concert/event booking form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Save className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Rediger booking-detaljer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {canEdit ? "Kan redigeres" : "Kun visning"}
          </Badge>
          {isSender && <Badge variant="outline">Du er avsender</Badge>}
        </div>
      </div>

      {/* Delt kontaktinfo - vises i forhandlingsfasen */}
      {showContactInfo && booking.sender_contact_info && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Delt kontaktinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {booking.sender_contact_info.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">E-post:</span>
                <a href={`mailto:${booking.sender_contact_info.email}`} className="text-primary hover:underline">
                  {booking.sender_contact_info.email}
                </a>
              </div>
            )}
            {booking.sender_contact_info.phone && (
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Telefon:</span>
                <a href={`tel:${booking.sender_contact_info.phone}`} className="text-primary hover:underline">
                  {booking.sender_contact_info.phone}
                </a>
              </div>
            )}
            {booking.sender_contact_info.website && (
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Nettside:</span>
                <a href={booking.sender_contact_info.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {booking.sender_contact_info.website}
                </a>
              </div>
            )}
            {booking.sender_contact_info.instagram && (
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Instagram:</span>
                <a href={`https://instagram.com/${booking.sender_contact_info.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  @{booking.sender_contact_info.instagram.replace('@', '')}
                </a>
              </div>
            )}
            {booking.sender_contact_info.facebook && (
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">Facebook:</span>
                <a href={booking.sender_contact_info.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {booking.sender_contact_info.facebook}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grunnleggende informasjon */}
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende informasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormField('title', e.target.value)}
                disabled={!canEdit || loading}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                disabled={!canEdit || loading}
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label htmlFor="personal_message">Personlig melding</Label>
              <Textarea
                id="personal_message"
                value={formData.personal_message}
                onChange={(e) => updateFormField('personal_message', e.target.value)}
                disabled={!canEdit || loading}
                rows={2}
                placeholder="Eventuell personlig melding..."
                className={errors.personal_message ? "border-red-500" : ""}
              />
              {errors.personal_message && <p className="text-sm text-red-500 mt-1">{errors.personal_message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Dato og sted */}
        <Card>
          <CardHeader>
            <CardTitle>Dato og sted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fra dato</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                      disabled={!canEdit || loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP", { locale: nb }) : "Velg startdato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                    avoidCollisions={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    sticky="always"
                  >
                    <div className="min-h-[350px] w-[280px] flex items-start justify-center">
                      <Calendar
                        mode="single"
                        selected={formData.start_date || undefined}
                        onSelect={(date) => {
                          updateFormField('start_date', date);
                          setStartDateOpen(false);
                        }}
                        className="pointer-events-auto"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <Label>Til dato</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                      disabled={!canEdit || loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP", { locale: nb }) : "Velg sluttdato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start" 
                    side="bottom" 
                    sideOffset={4}
                    avoidCollisions={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    sticky="always"
                  >
                    <div className="min-h-[350px] w-[280px] flex items-start justify-center">
                      <Calendar
                        mode="single"
                        selected={formData.end_date || undefined}
                        onSelect={(date) => {
                          updateFormField('end_date', date);
                          setEndDateOpen(false);
                        }}
                        disabled={(date) => formData.start_date ? date < formData.start_date : false}
                        defaultMonth={formData.start_date || undefined}
                        className="pointer-events-auto"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Fra klokkeslett</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => updateFormField('start_time', e.target.value)}
                    disabled={!canEdit || loading}
                    className={cn("pl-10", errors.start_time && "border-destructive")}
                  />
                </div>
                {errors.start_time && <p className="text-sm text-destructive mt-1">{errors.start_time}</p>}
              </div>

              <div>
                <Label htmlFor="end_time">Til klokkeslett</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => updateFormField('end_time', e.target.value)}
                    disabled={!canEdit || loading}
                    className={cn("pl-10", errors.end_time && "border-destructive")}
                  />
                </div>
                {errors.end_time && <p className="text-sm text-destructive mt-1">{errors.end_time}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Spillested/Venue</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => updateFormField('venue', e.target.value)}
                disabled={!canEdit || loading}
                placeholder="F.eks. Oslo Spektrum, Rockefeller..."
                className={errors.venue ? "border-red-500" : ""}
              />
              {errors.venue && <p className="text-sm text-red-500 mt-1">{errors.venue}</p>}
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(address, coordinates) => {
                  updateFormField('address', address);
                  if (coordinates) {
                    updateFormField('latitude', coordinates.lat);
                    updateFormField('longitude', coordinates.lng);
                  }
                }}
                placeholder="Søk etter adresse..."
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
            </div>

            <div>
              <Label htmlFor="audience_estimate">Forventet publikum</Label>
              <Input
                id="audience_estimate"
                type="number"
                value={formData.audience_estimate}
                onChange={(e) => updateFormField('audience_estimate', e.target.value)}
                disabled={!canEdit || loading}
                placeholder="Antall personer"
                min="1"
                className={errors.audience_estimate ? "border-red-500" : ""}
              />
              {errors.audience_estimate && <p className="text-sm text-red-500 mt-1">{errors.audience_estimate}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Økonomi */}
        <Card>
          <CardHeader>
            <CardTitle>Økonomi og priser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ticket_price">Billettpris (Kr)</Label>
              <Input
                id="ticket_price"
                type="number"
                value={formData.ticket_price}
                onChange={(e) => updateFormField('ticket_price', e.target.value)}
                disabled={!canEdit || loading}
                placeholder="F.eks. 300"
                min="0"
                step="0.01"
                className={errors.ticket_price ? "border-red-500" : ""}
              />
              {errors.ticket_price && <p className="text-sm text-red-500 mt-1">{errors.ticket_price}</p>}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Artist honorar</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="by_agreement"
                  checked={formData.by_agreement}
                  onCheckedChange={(checked) => updateFormField('by_agreement', checked)}
                  disabled={!canEdit || loading}
                />
                <Label htmlFor="by_agreement">Avtales direkte mellom partene</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="door_deal"
                  checked={formData.door_deal}
                  onCheckedChange={(checked) => updateFormField('door_deal', checked)}
                  disabled={!canEdit || loading}
                />
                <Label htmlFor="door_deal">Døravtale (prosent av inntekter)</Label>
              </div>

              {formData.door_deal && (
                <div>
                  <Label htmlFor="door_percentage">Prosent av dørinntekter (%)</Label>
                  <Input
                    id="door_percentage"
                    type="number"
                    value={formData.door_percentage}
                    onChange={(e) => updateFormField('door_percentage', e.target.value)}
                    disabled={!canEdit || loading}
                    placeholder="F.eks. 70"
                    min="0"
                    max="100"
                    className={errors.door_percentage ? "border-red-500" : ""}
                  />
                  {errors.door_percentage && <p className="text-sm text-red-500 mt-1">{errors.door_percentage}</p>}
                </div>
              )}

              {!formData.by_agreement && !formData.door_deal && (
                <div>
                  <Label htmlFor="artist_fee">Fast honorar (Kr)</Label>
                  <Input
                    id="artist_fee"
                    type="number"
                    value={formData.artist_fee}
                    onChange={(e) => updateFormField('artist_fee', e.target.value)}
                    disabled={!canEdit || loading}
                    placeholder="F.eks. 15000"
                    min="0"
                    step="0.01"
                    className={errors.artist_fee ? "border-red-500" : ""}
                  />
                  {errors.artist_fee && <p className="text-sm text-red-500 mt-1">{errors.artist_fee}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Public Visibility Settings - ONLY SENDER CAN EDIT */}
        {isInNegotiation && isSender && (
          <PublicVisibilitySettings
            value={formData.public_visibility_settings}
            onChange={(settings) => updateFormField('public_visibility_settings', settings)}
            mode="booking"
          />
        )}

        {/* Public Preview for Receiver - READ ONLY */}
        {isInNegotiation && !isSender && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Slik vil arrangementet vises offentlig</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Arrangøren kontrollerer hva som er synlig for publikum. Dette er hva som vil vises når arrangementet publiseres:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                {Object.entries(formData.public_visibility_settings).map(([key, visible]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center",
                      visible ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {visible && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className={visible ? "text-foreground" : "text-muted-foreground"}>
                      {key === 'showDate' && 'Dato'}
                      {key === 'showTime' && 'Tidspunkt'}
                      {key === 'showVenue' && 'Spillested'}
                      {key === 'showAddress' && 'Adresse'}
                      {key === 'showTicketPrice' && 'Billettpris'}
                      {key === 'showAudienceEstimate' && 'Publikumsestimat'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Attachments */}
        {isInNegotiation && (
          <BookingPortfolioAttachments
            bookingId={booking.id}
            currentUserId={currentUserId}
            canEdit={canEdit && !loading}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {canEdit && (
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};