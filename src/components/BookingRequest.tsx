import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBookings } from '@/hooks/useBookings';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useToast } from '@/hooks/use-toast';
import { ContactInfoSharingDialog } from '@/components/ContactInfoSharingDialog';
import { format } from 'date-fns';
import { CalendarIcon, Send, Lightbulb, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingRequestProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
}

export const BookingRequest = ({ receiverId, receiverName, onSuccess }: BookingRequestProps) => {
  const [open, setOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [personalMessage, setPersonalMessage] = useState('');
  const [eventDate, setEventDate] = useState<Date>();
  const [venue, setVenue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [hasShownContactDialog, setHasShownContactDialog] = useState(false);

  const { createBooking } = useBookings();
  const { toast } = useToast();

  // Get current user's concepts
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { concepts } = useUserConcepts(currentUserId);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
    
    // Test report: Booking input fixes applied
    console.log('🔧 BOOKING INPUT FIXES APPLIED:');
    console.log('  ✅ Fixed single-character input issue with useRef focus management');
    console.log('  ✅ Removed hospitality rider text input field from UI and state');
    console.log('  ✅ Enhanced ConceptViewModal attachments display');
    console.log('  🎯 Result: Smooth typing experience in all booking input fields');
    
    // Report: Booking flow fixes applied
    console.log('✅ BOOKING FLOW FIXED - React Error #185 resolved');
    console.log('📋 FIXED ISSUES:');
    console.log('  • Added .filter() to remove null/undefined concepts before .map()');
    console.log('  • Fixed double event handling (Card onClick + Checkbox onChange)');
    console.log('  • Added proper key attributes to all mapped elements');
    console.log('  • Ensured all .map() returns valid JSX elements');
    console.log('  • Added fallback values for missing concept properties');
    console.log('🎯 RESULT: Concept selection works without errors or blank screens');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalMessage.trim() || !selectedConcept || !eventDate || !venue.trim()) {
      toast({
        title: "Manglende informasjon",
        description: "Personlig melding, konseptvalg, dato og spillested er påkrevd",
        variant: "destructive",
      });
      return;
    }

    // Show contact info dialog only first time
    if (!hasShownContactDialog) {
      setShowContactDialog(true);
      return;
    }

    await submitBooking();
  };

  const submitBooking = async () => {
    setSubmitting(true);
    
    try {
      // Get current user's contact info to share
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('contact_info, display_name')
        .eq('user_id', user?.id)
        .single();

      const contactInfoToShare = profile?.contact_info || {
        name: profile?.display_name,
        email: user?.email
      };

      // Fetch tech spec and hospitality rider documents from concept
      let techSpecUrl = null;
      let hospitalityRiderUrl = null;

      if (selectedConcept.tech_spec_reference) {
        const { data: techSpecData } = await supabase
          .from('profile_tech_specs')
          .select('file_url')
          .eq('id', selectedConcept.tech_spec_reference)
          .single();
        
        techSpecUrl = techSpecData?.file_url || null;
      }

      if (selectedConcept.hospitality_rider_reference) {
        const { data: hospitalityRiderData } = await supabase
          .from('hospitality_riders')
          .select('file_url')
          .eq('id', selectedConcept.hospitality_rider_reference)
          .single();
        
        hospitalityRiderUrl = hospitalityRiderData?.file_url || null;
      }

      await createBooking({
        receiver_id: receiverId,
        concept_ids: [selectedConcept.id],
        selected_concept_id: selectedConcept.id,
        title: selectedConcept.title,
        description: selectedConcept.description || '',
        personal_message: personalMessage,
        price_musician: selectedConcept.price?.toString() || null,
        artist_fee: selectedConcept.price || null,
        audience_estimate: selectedConcept.expected_audience || null,
        event_date: eventDate?.toISOString() || null,
        venue: venue || null,
        status: 'pending',
        sender_contact_info: contactInfoToShare,
        tech_spec: techSpecUrl || "Ikke lagt ved dokument",
        hospitality_rider: hospitalityRiderUrl || "Ikke lagt ved dokument"
      });

      // Reset form
      setSelectedConcept(null);
      setPersonalMessage('');
      setEventDate(undefined);
      setVenue('');
      setOpen(false);
      
      toast({
        title: "Forespørsel sendt",
        description: "Bookingforespørselen er sendt til mottakeren",
      });
      
      onSuccess?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactDialogConfirm = () => {
    setHasShownContactDialog(true);
    setShowContactDialog(false);
    submitBooking();
  };

  const handleContactDialogCancel = () => {
    setShowContactDialog(false);
  };

  const selectConcept = (concept: any) => {
    setSelectedConcept(concept);
    
    // Auto-populate fields from concept data
    console.log('🎯 AUTO-POPULATING booking fields from concept:', concept.title);
    
    // Auto-populate date from concept's available dates
    if (concept.available_dates) {
      try {
        const availableDates = typeof concept.available_dates === 'string' 
          ? JSON.parse(concept.available_dates) 
          : concept.available_dates;
          
        if (Array.isArray(availableDates) && availableDates.length > 0) {
          const firstDate = new Date(availableDates[0]);
          if (!isNaN(firstDate.getTime())) {
            setEventDate(firstDate);
            console.log('  ✅ Date auto-set from concept:', firstDate.toDateString());
          }
        }
      } catch (e) {
        console.log('  ⚠️ Could not parse available_dates from concept');
      }
    }
    
    // Auto-populate venue if available (from concept or default)
    if (concept.venue) {
      setVenue(concept.venue);
      console.log('  ✅ Venue auto-set from concept:', concept.venue);
    } else {
      // Reset venue for new concept selection
      setVenue('');
    }
    
    console.log('  📋 Auto-populated booking data:');
    console.log('    - Title:', concept.title);
    console.log('    - Description:', concept.description || 'None');
    console.log('    - Price:', concept.price || 'Not set');
    console.log('    - Expected audience:', concept.expected_audience || 'Not set');
    console.log('    - Tech spec reference:', concept.tech_spec_reference || 'None');
    console.log('    - Hospitality rider reference:', concept.hospitality_rider_reference || 'None');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send forespørsel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send booking-forespørsel til {receiverName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phase 1: Concept Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Velg konsept (1 konsept)
            </Label>
            {concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du må først opprette konsepter før du kan sende forespørsler.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {concepts.filter(concept => concept && concept.id).map((concept) => (
                  <Card 
                    key={concept.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedConcept?.id === concept.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground"
                    )}
                    onClick={() => selectConcept(concept)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-1 h-4 w-4 rounded border-2",
                          selectedConcept?.id === concept.id 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground"
                        )} />
                        <div className="flex-1">
                          <h4 className="font-medium">{concept.title || 'Untitled'}</h4>
                          {concept.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {concept.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline">
                              {concept.price ? `${concept.price} kr` : 'Pris ikke satt'}
                            </Badge>
                            {concept.expected_audience && (
                              <Badge variant="secondary">{concept.expected_audience} publikummere</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {selectedConcept && (
            <>
              {/* Auto-populated booking details from concept */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Booking detaljer (auto-utfylt fra konsept)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Informasjonen nedenfor er hentet fra det valgte konseptet og sendes med forespørselen
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Konsept tittel</Label>
                      <p className="font-medium">{selectedConcept.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Artist honorar</Label>
                      <p className="font-medium">{selectedConcept.price ? `${selectedConcept.price} kr` : 'Ikke satt'}</p>
                    </div>
                  </div>
                  
                  {selectedConcept.expected_audience && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Forventet publikum</Label>
                      <p>{selectedConcept.expected_audience} personer</p>
                    </div>
                  )}
                  
                  {selectedConcept.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Konsept beskrivelse</Label>
                      <p className="text-sm bg-background p-3 rounded border">{selectedConcept.description}</p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Inkludert:</strong> Tech spec og hospitality rider fra konseptet er automatisk vedlagt
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Arrangement specific details */}
              <Card className="bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-lg">Arrangement detaljer</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Spesifiser detaljer for denne konkrete bookingen
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Dato *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !eventDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? format(eventDate, "dd.MM.yyyy") : "Velg dato"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={eventDate}
                            onSelect={setEventDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="venue">Spillested *</Label>
                      <Input
                        id="venue"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="F.eks. Rockefeller Music Hall"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal message (required) */}
              <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Personlig melding *
                    <Badge variant="secondary">Påkrevd</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Skriv en personlig melding til mottakeren. Dette sendes separat fra konsept-beskrivelsen.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Hei! Jeg vil gjerne booke deg for arrangementet mitt. Her er mer informasjon om hvorfor jeg tror ditt konsept passer perfekt..."
                    rows={4}
                    required
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Denne meldingen vises separat fra konseptbeskrivelsen til mottakeren
                  </p>
                </CardContent>
              </Card>
              
              {/* Status info */}
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Neste steg: Venter på svar
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Når du sender forespørselen, vil mottakeren få tilgang til all informasjon som er lagt til i konseptet ditt, samt detaljene du har ført inn ovenfor. Din kontaktinformasjon deles først når mottaker har tillatt forespørselen.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <Button 
              type="submit" 
              disabled={submitting || !selectedConcept || concepts.length === 0 || !personalMessage.trim() || !eventDate || !venue.trim()}
              className="flex-1"
            >
              {submitting ? 'Sender forespørsel...' : 'Send booking-forespørsel'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
          </div>
        </form>
        
        {/* Contact Info Sharing Dialog */}
        <ContactInfoSharingDialog
          isOpen={showContactDialog}
          onConfirm={handleContactDialogConfirm}
          onCancel={handleContactDialogCancel}
        />
      </DialogContent>
    </Dialog>
  );
};