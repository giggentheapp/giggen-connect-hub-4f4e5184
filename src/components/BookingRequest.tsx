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
import { format } from 'date-fns';
import { CalendarIcon, Send, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingRequestProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
}

export const BookingRequest = ({ receiverId, receiverName, onSuccess }: BookingRequestProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMusician, setPriceMusician] = useState('');
  const [priceTicket, setPriceTicket] = useState('');
  const [eventDate, setEventDate] = useState<Date>();
  const [venue, setVenue] = useState('');
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting booking submission with concepts:', selectedConcepts);
    
    if (!title.trim() || selectedConcepts.length === 0) {
      toast({
        title: "Manglende informasjon",
        description: "Tittel og minst ett konsept må velges",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await createBooking({
        receiver_id: receiverId,
        concept_ids: selectedConcepts,
        title,
        description,
        price_musician: priceMusician || null,
        price_ticket: priceTicket || null,
        event_date: eventDate?.toISOString() || null,
        venue: venue || null,
        status: 'draft'
      });

      console.log('✅ Booking created successfully with concepts:', selectedConcepts);

      // Reset form
      setTitle('');
      setDescription('');
      setPriceMusician('');
      setPriceTicket('');
      setEventDate(undefined);
      setVenue('');
      setSelectedConcepts([]);
      setOpen(false);
      
      onSuccess?.();
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const toggleConceptSelection = (conceptId: string) => {
    console.log('🎯 Toggling concept selection:', conceptId);
    setSelectedConcepts(prev => {
      const newSelection = prev.includes(conceptId) 
        ? prev.filter(id => id !== conceptId)
        : [...prev, conceptId];
      console.log('📝 Updated concept selection:', newSelection);
      return newSelection;
    });
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
          {/* Concept Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Velg konsepter (minimum 1)
            </Label>
            {concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du må først opprette konsepter før du kan sende forespørsler.
              </p>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {concepts.map((concept) => (
                  <Card 
                    key={concept.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedConcepts.includes(concept.id) 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground"
                    )}
                    onClick={() => toggleConceptSelection(concept.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedConcepts.includes(concept.id)}
                          onCheckedChange={(checked) => toggleConceptSelection(concept.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{concept.title}</h4>
                          {concept.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {concept.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline">
                              {concept.price ? `${concept.price} kr` : 'Pris ikke satt'}
                            </Badge>
                            {concept.status && (
                              <Badge variant="secondary">{concept.status}</Badge>
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

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tittel på arrangement</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Konsert på Rockefeller"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv arrangementet..."
                rows={3}
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Dato</Label>
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
              <Label htmlFor="venue">Spillested</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="F.eks. Rockefeller Music Hall"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceMusician">Pris for musiker</Label>
              <Input
                id="priceMusician"
                value={priceMusician}
                onChange={(e) => setPriceMusician(e.target.value)}
                placeholder="1500 eller 'spiller for døra'"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Skriv fast beløp (f.eks. 1500) eller "spiller for døra"
              </p>
            </div>

            <div>
              <Label htmlFor="priceTicket">Billettpris</Label>
              <Input
                id="priceTicket"
                value={priceTicket}
                onChange={(e) => setPriceTicket(e.target.value)}
                placeholder="200 eller 'gratis'"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Skriv fast beløp (f.eks. 200) eller "gratis"
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting || concepts.length === 0}>
              {submitting ? 'Sender...' : 'Send forespørsel'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};