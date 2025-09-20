import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle, Check, X, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';

import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';

interface BookingDetailsProps {
  bookingId: string;
  onClose?: () => void;
}

interface Booking {
  id: string;
  sender_id: string;
  receiver_id: string;
  concept_ids: string[];
  selected_concept_id: string | null;
  title: string;
  description: string | null;
  price_musician: string | null;
  price_ticket: string | null;
  event_date: string | null;
  venue: string | null;
  hospitality_rider: string | null;
  tech_spec: string | null;
  status: string;
  sender_confirmed: boolean;
  receiver_confirmed: boolean;
  sender_read_agreement: boolean;
  receiver_read_agreement: boolean;
  created_at: string;
  updated_at: string;
}

export const BookingDetails = ({ bookingId, onClose }: BookingDetailsProps) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const { updateBooking, rejectBooking } = useBookings();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setBooking(data);
        
        // Fetch concepts
        if (data.concept_ids && data.concept_ids.length > 0) {
          const { data: conceptsData } = await supabase
            .from('concepts')
            .select('*')
            .in('id', data.concept_ids);
          
          setConcepts(conceptsData || []);
        }
      } catch (error: any) {
        toast({
          title: "Feil ved lasting av booking",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, toast]);

  const handleFieldEdit = async (fieldName: string, newValue: any) => {
    if (!booking || !currentUserId) return;

    try {
      await updateBooking(bookingId, { [fieldName]: newValue });
      setBooking(prev => prev ? { ...prev, [fieldName]: newValue } : null);
      setEditingField(null);
      setTempValues({});
      
      toast({
        title: "Oppdatert",
        description: `${fieldName} er oppdatert`,
      });
    } catch (error) {
      // Error handled in hook
    }
  };


  const EditableField = ({ 
    fieldName, 
    label, 
    value, 
    type = 'text', 
    placeholder 
  }: { 
    fieldName: string; 
    label: string; 
    value: any; 
    type?: string; 
    placeholder?: string; 
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isEditing = editingField === fieldName;
    const tempValue = tempValues[fieldName] ?? value;

    // Focus input when editing starts
    useEffect(() => {
      if (isEditing) {
        if (type === 'textarea' && textareaRef.current) {
          textareaRef.current.focus();
        } else if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [isEditing, type]);

    if (type === 'date') {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          {isEditing ? (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempValue ? format(new Date(tempValue), "dd.MM.yyyy") : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tempValue ? new Date(tempValue) : undefined}
                    onSelect={(date) => setTempValues(prev => ({ ...prev, [fieldName]: date?.toISOString() }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={() => handleFieldEdit(fieldName, tempValue)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="p-2 border rounded cursor-pointer hover:bg-muted/50"
              onClick={() => {
                setEditingField(fieldName);
                setTempValues({ [fieldName]: value });
              }}
            >
              {value ? format(new Date(value), "dd.MM.yyyy") : placeholder || 'Ikke satt'}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {isEditing ? (
          <div className="flex gap-2">
            {type === 'textarea' ? (
              <Textarea
                ref={textareaRef}
                value={tempValue || ''}
                onChange={(e) => setTempValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
              />
            ) : (
              <Input
                ref={inputRef}
                value={tempValue || ''}
                onChange={(e) => setTempValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                placeholder={placeholder}
              />
            )}
            <Button size="sm" onClick={() => handleFieldEdit(fieldName, tempValue)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 border rounded cursor-pointer hover:bg-muted/50"
            onClick={() => {
              setEditingField(fieldName);
              setTempValues({ [fieldName]: value });
            }}
          >
            {value || placeholder || 'Ikke satt'}
          </div>
        )}
      </div>
    );
  };

  const handleRejectBooking = async () => {
    if (!booking || !currentUserId) return;

    try {
      if (booking.status === 'pending') {
        // This is rejection of a pending request - use permanent deletion
        await rejectBooking(bookingId);
        
        toast({
          title: "Forespørsel avvist",
          description: "Forespørselen er permanent slettet fra systemet",
        });

        // Close the dialog since booking is permanently deleted
        if (onClose) {
          onClose();
        }
      } else {
        // This is cancellation of an approved booking - use soft deletion
        await updateBooking(bookingId, { status: 'cancelled' });
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
        
        toast({
          title: "Avtale avlyst",
          description: "Avtalen har blitt avlyst og flyttet til historikk",
        });
      }
    } catch (error) {
      toast({
        title: "Feil ved avvisning",
        description: "Kunne ikke avvise forespørselen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async () => {
    if (!booking || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking slettet",
        description: "Bookingen har blitt slettet",
      });

      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Laster booking...</div>;
  }

  if (!booking) {
    return <div className="p-6 text-center">Booking ikke funnet</div>;
  }

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const canEdit = canBeEditedByParties(booking.status as BookingStatus) || booking.status === 'approved_by_both' || booking.status === 'upcoming';
  const isNegotiationPhase = booking.status === 'approved_by_both';
  const isConfirmationPhase = booking.status === 'upcoming';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{booking.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={booking.status === 'upcoming' ? 'default' : 'secondary'}>
              {booking.status}
            </Badge>
            {isSender && <Badge variant="outline">Du er avsender</Badge>}
            {isReceiver && <Badge variant="outline">Du er mottaker</Badge>}
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        )}
      </div>

      {/* Concept Selection */}
      {concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tilbudsvalg</CardTitle>
          </CardHeader>
          <CardContent>
            {concepts.length > 1 && canEdit ? (
              <div className="space-y-2">
                <Label>Velg tilbud for dette arrangementet</Label>
                <Select 
                  value={booking.selected_concept_id || ''} 
                  onValueChange={(value) => handleFieldEdit('selected_concept_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg tilbud..." />
                  </SelectTrigger>
                  <SelectContent>
                    {concepts.filter(concept => concept && concept.id).map((concept) => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.title || 'Untitled'} - {concept.price ? `${concept.price} Kr` : 'Pris ikke satt'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                {concepts.filter(concept => concept && concept.id).map((concept) => (
                  <div 
                    key={concept.id}
                    className={cn(
                      "p-3 border rounded",
                      concept.id === booking.selected_concept_id && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{concept.title || 'Untitled'}</h4>
                      {concept.id === booking.selected_concept_id && (
                        <Badge>Valgt tilbud</Badge>
                      )}
                    </div>
                    {concept.description && (
                      <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Arrangementsdetaljer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField 
            fieldName="description"
            label="Beskrivelse"
            value={booking.description}
            type="textarea"
            placeholder="Beskriv arrangementet..."
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField 
              fieldName="event_date"
              label="Dato"
              value={booking.event_date}
              type="date"
              placeholder="Velg dato"
            />
            
            <EditableField 
              fieldName="venue"
              label="Spillested"
              value={booking.venue}
              placeholder="F.eks. Rockefeller Music Hall"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <EditableField 
                fieldName="price_musician"
                label="Pris for musiker"
                value={booking.price_musician}
                placeholder="1500 eller 'spiller for døra'"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Skriv fast beløp (f.eks. 1500) eller "spiller for døra"
              </p>
            </div>
            
            <div>
              <EditableField 
                fieldName="price_ticket"
                label="Billettpris"
                value={booking.price_ticket}
                placeholder="200 eller 'gratis'"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Skriv fast beløp (f.eks. 200) eller "gratis"
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Documents */}
      <BookingDocumentViewer
        techSpec={booking.tech_spec}
        hospitalityRider={booking.hospitality_rider}
      bookingStatus={booking.status}
      isVisible={booking.status === 'approved_by_both' || booking.status === 'upcoming' || booking.status === 'published'}
      />

      {/* Status and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Status og handlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              {booking.sender_confirmed ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span>Avsender bekreftet</span>
            </div>
            
            <div className="flex items-center gap-2">
              {booking.receiver_confirmed ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span>Mottaker bekreftet</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <>
                {isSender && !booking.sender_confirmed && (
                  <Button onClick={() => handleFieldEdit('sender_confirmed', true)}>
                    Bekreft som avsender
                  </Button>
                )}
                
                {isReceiver && !booking.receiver_confirmed && (
                  <Button onClick={() => handleFieldEdit('receiver_confirmed', true)}>
                    Bekreft som mottaker
                  </Button>
                )}
              </>
            )}
            
            {booking.sender_confirmed && booking.receiver_confirmed && booking.status !== 'upcoming' && (
              <Button onClick={() => handleFieldEdit('status', 'upcoming')}>
                Publiser arrangement
              </Button>
            )}

            {/* Reject and Delete buttons for both sender and receiver */}
            {(isSender || isReceiver) && booking.status !== 'cancelled' && booking.status !== 'upcoming' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleRejectBooking}
                >
                  Avvis
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Denne handlingen kan ikke angres. Bookingen vil bli permanent slettet.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteBooking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Slett booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {booking.status === 'cancelled' && (
              <Badge variant="destructive" className="ml-2">
                Avlyst
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};