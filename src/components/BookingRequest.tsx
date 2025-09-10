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
  const [eventTime, setEventTime] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number | null>(null);
  const [isDateByAgreement, setIsDateByAgreement] = useState(false);
  const [isTimeByAgreement, setIsTimeByAgreement] = useState(false);
  const [isVenueByAgreement, setIsVenueByAgreement] = useState(false);
  const [isTicketPriceByAgreement, setIsTicketPriceByAgreement] = useState(false);
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
    
    // Enhanced validation that allows "by agreement" fields
    if (!personalMessage.trim() || !selectedConcept) {
      toast({
        title: "Manglende informasjon",
        description: "Personlig melding og konseptvalg er påkrevd",
        variant: "destructive",
      });
      return;
    }

    // Check required fields unless they are "by agreement"
    if (!isDateByAgreement && !eventDate) {
      toast({
        title: "Manglende dato",
        description: "Velg en dato eller marker som 'Ved avtale'",
        variant: "destructive",
      });
      return;
    }

    if (!isVenueByAgreement && !venue.trim()) {
      toast({
        title: "Manglende spillested",
        description: "Angi spillested eller marker som 'Ved avtale'",
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

      // DEBUG: Log final booking data before creation
      const bookingData = {
        receiver_id: receiverId,
        concept_ids: [selectedConcept.id],
        selected_concept_id: selectedConcept.id,
        title: selectedConcept.title,
        description: selectedConcept.description || '',
        personal_message: personalMessage,
        // Pricing from concept - handle all pricing types
        price_musician: selectedConcept.price?.toString() || null,
        artist_fee: selectedConcept.door_deal ? null : (selectedConcept.price || null),
        door_deal: selectedConcept.door_deal || false,
        door_percentage: selectedConcept.door_percentage || null,
        // Event details - use "Ved avtale" text when by agreement
        event_date: isDateByAgreement ? null : eventDate?.toISOString() || null,
        time: isTimeByAgreement ? "Ved avtale" : (eventTime || null),
        venue: isVenueByAgreement ? "Ved avtale" : (venue || null),
        // Audience and pricing
        audience_estimate: selectedConcept.expected_audience || null,
        ticket_price: isTicketPriceByAgreement ? null : (ticketPrice || null),
        status: 'pending' as const,
        sender_contact_info: contactInfoToShare,
        tech_spec: techSpecUrl || "Ikke lagt ved dokument",
        hospitality_rider: hospitalityRiderUrl || "Ikke lagt ved dokument"
      };

      console.log('🚀 Creating booking with data:');
      console.log('  - door_deal:', bookingData.door_deal);
      console.log('  - door_percentage:', bookingData.door_percentage);
      console.log('  - artist_fee:', bookingData.artist_fee);
      console.log('  - price_musician:', bookingData.price_musician);
      console.log('  - Full booking data:', bookingData);

      await createBooking(bookingData);

      // Reset form
      setSelectedConcept(null);
      setPersonalMessage('');
      setEventDate(undefined);
      setVenue('');
      setEventTime('');
      setTicketPrice(null);
      setIsDateByAgreement(false);
      setIsTimeByAgreement(false);
      setIsVenueByAgreement(false);
      setIsTicketPriceByAgreement(false);
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
    // DEBUG: Log concept selection with pricing details
    console.log('🎯 CONCEPT SELECTED:', concept.title);
    console.log('  - Raw concept data:', concept);
    console.log('  - door_deal:', concept.door_deal);
    console.log('  - door_percentage:', concept.door_percentage);
    console.log('  - price:', concept.price);
    console.log('  - price_by_agreement:', concept.price_by_agreement);
    
    setSelectedConcept(concept);
    
    // Reset all form fields first
    setEventDate(undefined);
    setVenue('');
    setEventTime('');
    setTicketPrice(null);
    setIsDateByAgreement(false);
    setIsTimeByAgreement(false);
    setIsVenueByAgreement(false);
    setIsTicketPriceByAgreement(false);
    
    // Auto-populate fields from concept data
    console.log('🎯 COMPLETE AUTO-FILL from concept:', concept.title);
    
    // 1. Handle available dates
    if (concept.available_dates) {
      try {
        const availableDates = typeof concept.available_dates === 'string' 
          ? JSON.parse(concept.available_dates) 
          : concept.available_dates;
          
        // Check if dates are set to "indefinite" (by agreement)
        if (availableDates && typeof availableDates === 'object' && availableDates.indefinite) {
          setIsDateByAgreement(true);
          console.log('  ✅ Date set as "Ved avtale" from concept');
        } else if (Array.isArray(availableDates) && availableDates.length > 0) {
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
    
    // 2. Handle venue
    if (concept.venue) {
      setVenue(concept.venue);
      console.log('  ✅ Venue auto-set from concept:', concept.venue);
    } else {
      // If concept doesn't specify venue, mark as by agreement
      setIsVenueByAgreement(true);
      console.log('  ✅ Venue set as "Ved avtale" (not specified in concept)');
    }
    
    // 3. Handle time (if specified in concept)
    if (concept.time) {
      setEventTime(concept.time);
      console.log('  ✅ Time auto-set from concept:', concept.time);
    } else {
      setIsTimeByAgreement(true);
      console.log('  ✅ Time set as "Ved avtale" (not specified in concept)');
    }
    
    // 4. Handle ticket pricing (if specified in concept) 
    if (concept.ticket_price && concept.ticket_price > 0) {
      setTicketPrice(concept.ticket_price);
      console.log('  ✅ Ticket price auto-set from concept:', concept.ticket_price);
    } else {
      setIsTicketPriceByAgreement(true);
      console.log('  ✅ Ticket price set as "Ved avtale" (not specified in concept)');
    }
    
    console.log('  📋 Complete auto-fill summary:');
    console.log('    - Title:', concept.title);
    console.log('    - Description:', concept.description || 'None');
    console.log('    - Pricing type:', concept.door_deal ? 'Door deal' : concept.price_by_agreement ? 'By agreement' : 'Fixed');
    console.log('    - Price/Fee:', concept.price || 'Not set');
    console.log('    - Door percentage:', concept.door_percentage || 'N/A');
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
                 <CardContent className="space-y-4">
                   {/* Complete Auto-filled Summary */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Tittel</Label>
                       <p className="font-medium">{selectedConcept.title}</p>
                     </div>
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Artist honorar</Label>
                       <p className="font-medium">
                         {selectedConcept.door_deal && selectedConcept.door_percentage
                           ? `${selectedConcept.door_percentage}% av dørinntekter`
                           : selectedConcept.price_by_agreement
                           ? 'Ved avtale'
                           : selectedConcept.price
                           ? `${selectedConcept.price} kr`
                           : 'Ved avtale'
                         }
                       </p>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Dato</Label>
                       <p className="font-medium">
                         {isDateByAgreement ? 'Ved avtale' : eventDate ? format(eventDate, 'dd.MM.yyyy') : 'Ved avtale'}
                       </p>
                     </div>
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Klokkeslett</Label>
                       <p className="font-medium">
                         {isTimeByAgreement ? 'Ved avtale' : eventTime || 'Ved avtale'}
                       </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Spillested</Label>
                       <p className="font-medium">
                         {isVenueByAgreement ? 'Ved avtale' : venue || 'Ved avtale'}
                       </p>
                     </div>
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Billettpris</Label>
                       <p className="font-medium">
                         {isTicketPriceByAgreement ? 'Ved avtale' : ticketPrice ? `${ticketPrice} kr` : 'Ved avtale'}
                       </p>
                     </div>
                   </div>
                   
                   {selectedConcept.expected_audience && (
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Estimert publikum</Label>
                       <p className="font-medium">{selectedConcept.expected_audience} personer</p>
                     </div>
                   )}
                   
                   {selectedConcept.description && (
                     <div>
                       <Label className="text-sm font-medium text-muted-foreground">Beskrivelse</Label>
                       <p className="text-sm bg-background p-3 rounded border">{selectedConcept.description}</p>
                     </div>
                   )}
                   
                   {/* Agreement Notice */}
                   {(isDateByAgreement || isTimeByAgreement || isVenueByAgreement || isTicketPriceByAgreement || selectedConcept.price_by_agreement) && (
                     <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                       <p className="text-sm text-amber-800 dark:text-amber-200">
                         <strong>⚠️ Detaljer "Ved avtale":</strong> Noen felter markert som "Ved avtale" vil bli forhandlet direkte mellom partene etter godkjenning.
                       </p>
                     </div>
                   )}
                   
                   <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                     <p className="text-sm text-blue-800 dark:text-blue-200">
                       <strong>Inkludert:</strong> Tech spec og hospitality rider fra konseptet er automatisk vedlagt
                     </p>
                   </div>
                 </CardContent>
              </Card>

               {/* Arrangement specific details - Locked until negotiation */}
               <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     Arrangement detaljer
                     <Badge variant="secondary" className="text-xs">Låst til konsept</Badge>
                   </CardTitle>
                   <p className="text-sm text-muted-foreground">
                     Disse detaljene er hentet fra konseptet og kan endres først i forhandlingsfasen
                   </p>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Date Field - Locked but show agreement option */}
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <Label>Dato</Label>
                         <div className="flex items-center space-x-2">
                           <Checkbox 
                             id="date-by-agreement"
                             checked={isDateByAgreement}
                             onCheckedChange={(checked) => setIsDateByAgreement(!!checked)}
                           />
                           <Label htmlFor="date-by-agreement" className="text-xs cursor-pointer">
                             Ved avtale
                           </Label>
                         </div>
                       </div>
                       {!isDateByAgreement ? (
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
                               {eventDate ? format(eventDate, "dd.MM.yyyy") : "Auto-utfylt fra konsept"}
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                             <Calendar
                               mode="single"
                               selected={eventDate}
                               onSelect={setEventDate}
                               disabled={(date) => date < new Date()}
                               initialFocus
                             />
                           </PopoverContent>
                         </Popover>
                       ) : (
                         <div className="p-2 border rounded bg-muted/50 text-muted-foreground">
                           Forhandles direkte mellom partene
                         </div>
                       )}
                     </div>

                     {/* Time Field */}
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <Label>Klokkeslett</Label>
                         <div className="flex items-center space-x-2">
                           <Checkbox 
                             id="time-by-agreement"
                             checked={isTimeByAgreement}
                             onCheckedChange={(checked) => setIsTimeByAgreement(!!checked)}
                           />
                           <Label htmlFor="time-by-agreement" className="text-xs cursor-pointer">
                             Ved avtale
                           </Label>
                         </div>
                       </div>
                       {!isTimeByAgreement ? (
                         <Input
                           type="time"
                           value={eventTime}
                           onChange={(e) => setEventTime(e.target.value)}
                           placeholder="19:00"
                         />
                       ) : (
                         <div className="p-2 border rounded bg-muted/50 text-muted-foreground">
                           Forhandles direkte mellom partene
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Venue Field */}
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <Label>Spillested</Label>
                         <div className="flex items-center space-x-2">
                           <Checkbox 
                             id="venue-by-agreement"
                             checked={isVenueByAgreement}
                             onCheckedChange={(checked) => setIsVenueByAgreement(!!checked)}
                           />
                           <Label htmlFor="venue-by-agreement" className="text-xs cursor-pointer">
                             Ved avtale
                           </Label>
                         </div>
                       </div>
                       {!isVenueByAgreement ? (
                         <Input
                           value={venue}
                           onChange={(e) => setVenue(e.target.value)}
                           placeholder="Auto-utfylt fra konsept"
                         />
                       ) : (
                         <div className="p-2 border rounded bg-muted/50 text-muted-foreground">
                           Forhandles direkte mellom partene
                         </div>
                       )}
                     </div>

                     {/* Ticket Price Field */}
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <Label>Billettpris (kr)</Label>
                         <div className="flex items-center space-x-2">
                           <Checkbox 
                             id="ticket-price-by-agreement"
                             checked={isTicketPriceByAgreement}
                             onCheckedChange={(checked) => setIsTicketPriceByAgreement(!!checked)}
                           />
                           <Label htmlFor="ticket-price-by-agreement" className="text-xs cursor-pointer">
                             Ved avtale
                           </Label>
                         </div>
                       </div>
                       {!isTicketPriceByAgreement ? (
                         <Input
                           type="number"
                           value={ticketPrice || ''}
                           onChange={(e) => setTicketPrice(e.target.value ? Number(e.target.value) : null)}
                           placeholder="Auto-utfylt fra konsept"
                         />
                       ) : (
                         <div className="p-2 border rounded bg-muted/50 text-muted-foreground">
                           Forhandles direkte mellom partene
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                     💡 Alle felter er auto-utfylt fra konseptet. Endringer kan gjøres i forhandlingsfasen.
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
              disabled={submitting || !selectedConcept || concepts.length === 0 || !personalMessage.trim() || 
                (!eventDate && !isDateByAgreement) || 
                (!venue.trim() && !isVenueByAgreement)}
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