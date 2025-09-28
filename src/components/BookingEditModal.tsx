import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { z } from 'zod';

// Validation schema
const bookingEditSchema = z.object({
  title: z.string().trim().min(1, "Tittel er påkrevet").max(200, "Tittel må være under 200 tegn"),
  description: z.string().max(2000, "Beskrivelse må være under 2000 tegn").optional().nullable(),
  venue: z.string().max(200, "Spillested må være under 200 tegn").optional().nullable(),
  address: z.string().max(300, "Adresse må være under 300 tegn").optional().nullable(),
  event_date: z.date().optional().nullable(),
  time: z.string().max(10, "Tid må være i format HH:MM").optional().nullable(),
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    event_date: null as Date | null,
    time: '',
    ticket_price: '',
    artist_fee: '',
    audience_estimate: '',
    door_deal: false,
    door_percentage: '',
    by_agreement: false,
    personal_message: ''
  });

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      setFormData({
        title: booking.title || '',
        description: booking.description || '',
        venue: booking.venue || '',
        address: booking.address || '',
        event_date: booking.event_date ? new Date(booking.event_date) : null,
        time: booking.time || '',
        ticket_price: booking.ticket_price?.toString() || '',
        artist_fee: booking.artist_fee?.toString() || '',
        audience_estimate: booking.audience_estimate?.toString() || '',
        door_deal: booking.door_deal || false,
        door_percentage: booking.door_percentage?.toString() || '',
        by_agreement: booking.by_agreement || false,
        personal_message: booking.personal_message || ''
      });
      setErrors({});
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
        event_date: formData.event_date,
        time: formData.time || null,
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
        event_date: validatedData.event_date?.toISOString(),
        time: validatedData.time,
        ticket_price: validatedData.ticket_price,
        artist_fee: validatedData.artist_fee,
        audience_estimate: validatedData.audience_estimate,
        door_deal: formData.door_deal,
        door_percentage: validatedData.door_percentage,
        by_agreement: formData.by_agreement,
        personal_message: validatedData.personal_message,
        last_modified_by: currentUserId,
        last_modified_at: new Date().toISOString()
      };

      await updateBooking(booking.id, updateData);

      toast({
        title: "Detaljer oppdatert",
        description: "Booking-detaljene har blitt lagret",
      });

      // Navigate back to bookings page
      window.history.replaceState(null, '', '/bookings');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Dato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!formData.event_date && "text-muted-foreground"}`}
                      disabled={!canEdit || loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.event_date ? format(formData.event_date, "PPP", { locale: nb }) : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.event_date}
                      onSelect={(date) => updateFormField('event_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.event_date && <p className="text-sm text-red-500 mt-1">{errors.event_date}</p>}
              </div>

              <div>
                <Label htmlFor="time">Tid (HH:MM)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateFormField('time', e.target.value)}
                  disabled={!canEdit || loading}
                  className={errors.time ? "border-red-500" : ""}
                />
                {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
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
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormField('address', e.target.value)}
                disabled={!canEdit || loading}
                placeholder="F.eks. Sonja Henies plass 2, 1366 Lysaker"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
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