import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Check, X, Edit3, Clock, Users, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    updateBookingInParent?: (id: string, updates: any) => void;
  }
}

interface BookingDetailsPanelProps {
  booking: any;
  currentUserId: string;
  canEdit: boolean;
}

interface EditableFieldProps {
  fieldName: string;
  label: string;
  value: any;
  type?: 'text' | 'textarea' | 'date' | 'time' | 'number' | 'select';
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  onPropose: (fieldName: string, oldValue: any, newValue: any) => void;
}
export const BookingDetailsPanel = ({
  booking,
  currentUserId,
  canEdit
}: BookingDetailsPanelProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // DEBUG: Log booking data to see door deal transfer
  useEffect(() => {
    console.log('🔍 BookingDetailsPanel - Booking data received:');
    console.log('  - door_deal:', booking.door_deal);
    console.log('  - door_percentage:', booking.door_percentage);
    console.log('  - artist_fee:', booking.artist_fee);
    console.log('  - price_musician:', booking.price_musician);
    console.log('  - Complete booking object:', booking);
    
    if (booking.door_deal) {
      console.log('  ✅ Door deal detected - should show percentage field');
    } else {
      console.log('  ❌ No door deal - should show fixed fee field');
    }
  }, [booking]);
  const handleFieldUpdate = async (fieldName: string, oldValue: any, newValue: any) => {
    if (!canEdit) {
      toast({
        title: "Kan ikke redigere",
        description: "Booking kan ikke redigeres i nåværende status",
        variant: "destructive"
      });
      return;
    }
    if (oldValue === newValue) {
      setEditingField(null);
      return;
    }

    try {
      const updates: any = { 
        [fieldName]: newValue,
        last_modified_by: currentUserId,
        last_modified_at: new Date().toISOString()
      };

      // Handle coordinates for address field
      if (fieldName === 'address' && typeof newValue === 'object' && newValue.coordinates) {
        updates.address = newValue.address;
        updates.latitude = newValue.coordinates.lat;
        updates.longitude = newValue.coordinates.lng;
        console.log('📍 Storing coordinates:', newValue.coordinates);
      }

      // If either party has approved, reset their approval when changes are made
      const isSender = currentUserId === booking.sender_id;
      const isReceiver = currentUserId === booking.receiver_id;
      
      if (booking.approved_by_sender || booking.approved_by_receiver) {
        // Reset approvals when changes are made
        updates.approved_by_sender = false;
        updates.approved_by_receiver = false;
        updates.sender_approved_at = null;
        updates.receiver_approved_at = null;
        
        toast({
          title: "Godkjenninger nullstilt",
          description: "På grunn av endringene må begge parter godkjenne avtalen på nytt",
          variant: "default"
        });
      }

      console.log('🔄 Updating booking field:', fieldName, 'from', oldValue, 'to', newValue);
      const result = await updateBooking(booking.id, updates);
      
      if (result) {
        // Force immediate update in parent component through callback
        if (window.updateBookingInParent) {
          window.updateBookingInParent(booking.id, updates);
        }
        
        toast({
          title: "Oppdatert",
          description: `${fieldName} er oppdatert`,
        });
      }
    } catch (error) {
      console.error('❌ Error updating field:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere feltet",
        variant: "destructive"
      });
    }
    
    setEditingField(null);
    // Keep other temp values, only clear the current field's temp value
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldName];
      return newValues;
    });
  };
  const EditableField = ({
    fieldName,
    label,
    value,
    type = 'text',
    placeholder,
    options,
    onPropose
  }: EditableFieldProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isEditing = editingField === fieldName;
    const tempValue = tempValues[fieldName] !== undefined ? tempValues[fieldName] : value;
    useEffect(() => {
      if (isEditing) {
        if (type === 'textarea' && textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.focus();
          // Set cursor to end of text
          setTimeout(() => {
            const length = textarea.value.length;
            textarea.setSelectionRange(length, length);
          }, 0);
        } else if (inputRef.current) {
          const input = inputRef.current;
          input.focus();
          // Set cursor to end of text
          setTimeout(() => {
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }, 0);
        }
      }
    }, [isEditing, type]);
    const startEditing = () => {
      setEditingField(fieldName);
      setTempValues(prev => ({
        ...prev,
        [fieldName]: value
      }));
    };
    const cancelEditing = () => {
      setEditingField(null);
      setTempValues(prev => {
        const newValues = { ...prev };
        delete newValues[fieldName];
        return newValues;
      });
    };
    const confirmEdit = () => {
      onPropose(fieldName, value, tempValue);
      setTempValues(prev => {
        const newValues = { ...prev };
        delete newValues[fieldName];
        return newValues;
      });
    };
    if (type === 'date') {
      return <div className="space-y-2">
          <Label className="flex items-center gap-2">
            {label}
            {canEdit && !isEditing && <Button size="sm" variant="ghost" onClick={startEditing}>
                <Edit3 className="h-3 w-3" />
              </Button>}
          </Label>
          {isEditing ? <div className="flex gap-2">
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
                     onSelect={date => {
                       setTempValues(prev => ({
                         ...prev,
                         [fieldName]: date?.toISOString()
                       }));
                     }} 
                     disabled={date => date < new Date()} 
                     initialFocus 
                     className="pointer-events-auto"
                   />
                 </PopoverContent>
              </Popover>
              <Button size="sm" onClick={confirmEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4" />
              </Button>
            </div> : <div className="p-2 border rounded cursor-pointer hover:bg-muted/50" onClick={canEdit ? startEditing : undefined}>
              {value ? format(new Date(value), "dd.MM.yyyy") : placeholder || 'Ikke satt'}
            </div>}
        </div>;
    }
    if (type === 'select' && options) {
      return <div className="space-y-2">
          <Label className="flex items-center gap-2">
            {label}
            {canEdit && !isEditing && <Button size="sm" variant="ghost" onClick={startEditing}>
                <Edit3 className="h-3 w-3" />
              </Button>}
          </Label>
          {isEditing ? <div className="flex gap-2">
              <Select value={tempValue || ''} onValueChange={value => setTempValues(prev => ({
            ...prev,
            [fieldName]: value
          }))}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={confirmEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4" />
              </Button>
            </div> : <div className="p-2 border rounded cursor-pointer hover:bg-muted/50" onClick={canEdit ? startEditing : undefined}>
              {value || placeholder || 'Ikke satt'}
            </div>}
        </div>;
    }
    return <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {label}
          {canEdit && !isEditing && <Button size="sm" variant="ghost" onClick={startEditing}>
              <Edit3 className="h-3 w-3" />
            </Button>}
        </Label>
          {isEditing ? <div className="flex gap-2">
            {type === 'textarea' ? (
              <Textarea 
                ref={textareaRef} 
                value={tempValue || ''} 
                onChange={e => {
                  const newValue = e.target.value;
                  setTempValues(prev => ({
                    ...prev,
                    [fieldName]: newValue
                  }));
                }} 
                placeholder={placeholder} 
                rows={3}
                autoFocus
                onFocus={e => {
                  // Maintain cursor position
                  const length = e.target.value.length;
                  setTimeout(() => {
                    e.target.setSelectionRange(length, length);
                  }, 0);
                }}
              />
            ) : type === 'time' ? (
              <div className="flex items-center gap-2">
                <Input 
                  ref={inputRef} 
                  type="text"
                  value={tempValue || ''} 
                  onChange={e => {
                    const input = e.target.value.replace(/[^\d]/g, '');
                    let formattedTime = '';
                    
                    if (input.length >= 1) {
                      const hours = input.slice(0, 2);
                      const minutes = input.slice(2, 4);
                      
                      if (input.length <= 2) {
                        formattedTime = hours;
                      } else {
                        formattedTime = hours + ':' + minutes;
                      }
                    }
                    
                    setTempValues(prev => ({
                      ...prev,
                      [fieldName]: formattedTime
                    }));
                  }} 
                  placeholder="18:00"
                  autoFocus
                  maxLength={5}
                  className="text-center"
                  onKeyDown={e => {
                    // Allow backspace, delete, tab, escape, enter
                    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">HH:MM</span>
              </div>
            ) : (
              <Input 
                ref={inputRef} 
                type={type} 
                value={tempValue || ''} 
                onChange={e => {
                  const newValue = e.target.value;
                  setTempValues(prev => ({
                    ...prev,
                    [fieldName]: newValue
                  }));
                }} 
                placeholder={placeholder}
                autoFocus
                onFocus={e => {
                  // Maintain cursor position
                  const length = e.target.value.length;
                  setTimeout(() => {
                    e.target.setSelectionRange(length, length);
                  }, 0);
                }}
              />
            )}
            <Button size="sm" onClick={confirmEdit}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEditing}>
              <X className="h-4 w-4" />
            </Button>
          </div> : <div className={cn("p-2 border rounded", canEdit ? "cursor-pointer hover:bg-muted/50" : "cursor-default")} onClick={canEdit ? startEditing : undefined}>
            {value || placeholder || 'Ikke satt'}
          </div>}
      </div>;
  };
  return <div className="space-y-6">
      {/* Basic Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>Grunnleggende informasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField fieldName="title" label="Tittel" value={booking.title} placeholder="Navn på arrangementet" onPropose={handleFieldUpdate} />
          
          <EditableField fieldName="description" label="Beskrivelse" value={booking.description} type="textarea" placeholder="Beskriv arrangementet..." onPropose={handleFieldUpdate} />
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Tidspunkt og sted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField fieldName="event_date" label="Dato" value={booking.event_date} type="date" placeholder="Velg dato" onPropose={handleFieldUpdate} />
            
            <EditableField fieldName="time" label="Klokkeslett" value={booking.time} type="time" placeholder="19:00" onPropose={handleFieldUpdate} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Venue/Spillested field */}
            <EditableField 
              fieldName="venue" 
              label="" 
              value={booking.venue} 
              placeholder="Spillested" 
              onPropose={handleFieldUpdate} 
            />

            {/* Address field - Custom implementation for AddressAutocomplete */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {editingField !== 'address' && canEdit && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setEditingField('address');
                      setTempValues(prev => ({
                        ...prev,
                        address: booking.address || ''
                      }));
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </Label>

              {editingField === 'address' ? (
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <AddressAutocomplete 
                      value={tempValues.address || booking.address || ''} 
                      onChange={(address, coordinates) => {
                        setTempValues(prev => ({
                          ...prev,
                          address: address
                        }));
                        
                        // Auto-save when coordinates are selected
                        if (coordinates) {
                          handleFieldUpdate('address', booking.address, {
                            address: address,
                            coordinates: coordinates
                          });
                          setEditingField(null);
                        }
                      }}
                      placeholder="Adresse" 
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      handleFieldUpdate('address', booking.address, tempValues.address);
                      setEditingField(null);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingField(null);
                      setTempValues(prev => {
                        const newValues = { ...prev };
                        delete newValues.address;
                        return newValues;
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className={cn(
                    "p-2 border rounded", 
                    canEdit ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                  )} 
                  onClick={canEdit ? () => {
                    setEditingField('address');
                    setTempValues(prev => ({
                      ...prev,
                      address: booking.address || ''
                    }));
                  } : undefined}
                >
                  {booking.address || 'Adresse'}
                  {booking.latitude && booking.longitude && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✅ Koordinater: {booking.latitude.toFixed(4)}, {booking.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience and Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Publikum og prising
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <EditableField fieldName="audience_estimate" label="Estimert publikum" value={booking.audience_estimate} type="number" placeholder="100" onPropose={handleFieldUpdate} />

          <div className="space-y-4">
            <EditableField fieldName="ticket_price" label="Billettpris (kr)" value={booking.ticket_price} type="number" placeholder="200" onPropose={handleFieldUpdate} />
            
            {/* Artist Payment Section - Auto-filled from concept */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Artist honorar</Label>
              
              <div className="space-y-3">
                {/* Payment Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                   <Button
                     variant={!booking.door_deal && !booking.by_agreement ? "default" : "outline"}
                     size="sm"
                     onClick={async () => {
                       if (!canEdit) return;
                       
                       const updates = {
                         door_deal: false,
                         by_agreement: false,
                         last_modified_by: currentUserId,
                         last_modified_at: new Date().toISOString()
                       };
                       
                       try {
                         await updateBooking(booking.id, updates);
                         if (window.updateBookingInParent) {
                           window.updateBookingInParent(booking.id, updates);
                         }
                         toast({
                           title: "Oppdatert",
                           description: "Betalingstype satt til fast honorar",
                         });
                       } catch (error) {
                         toast({
                           title: "Feil",
                           description: "Kunne ikke oppdatere betalingstype",
                           variant: "destructive"
                         });
                       }
                     }}
                     disabled={!canEdit}
                     className="h-auto p-3 flex flex-col items-center gap-1"
                   >
                     <span className="font-medium">Fast honorar</span>
                     <span className="text-xs opacity-70">Garantert beløp</span>
                   </Button>
                   
                   <Button
                     variant={booking.door_deal ? "default" : "outline"}
                     size="sm"
                     onClick={async () => {
                       if (!canEdit) return;
                       
                       const updates = {
                         door_deal: true,
                         by_agreement: false,
                         last_modified_by: currentUserId,
                         last_modified_at: new Date().toISOString()
                       };
                       
                       try {
                         await updateBooking(booking.id, updates);
                         if (window.updateBookingInParent) {
                           window.updateBookingInParent(booking.id, updates);
                         }
                         toast({
                           title: "Oppdatert",
                           description: "Betalingstype satt til spiller for døra",
                         });
                       } catch (error) {
                         toast({
                           title: "Feil",
                           description: "Kunne ikke oppdatere betalingstype",
                           variant: "destructive"
                         });
                       }
                     }}
                     disabled={!canEdit}
                     className="h-auto p-3 flex flex-col items-center gap-1"
                   >
                     <span className="font-medium">Spiller for døra</span>
                     <span className="text-xs opacity-70">Andel av inntekt</span>
                   </Button>
                   
                   <Button
                     variant={booking.by_agreement ? "default" : "outline"}
                     size="sm"
                     onClick={async () => {
                       if (!canEdit) return;
                       
                       const updates = {
                         door_deal: false,
                         by_agreement: true,
                         last_modified_by: currentUserId,
                         last_modified_at: new Date().toISOString()
                       };
                       
                       try {
                         await updateBooking(booking.id, updates);
                         if (window.updateBookingInParent) {
                           window.updateBookingInParent(booking.id, updates);
                         }
                         toast({
                           title: "Oppdatert",
                           description: "Betalingstype satt til ved avtale",
                         });
                       } catch (error) {
                         toast({
                           title: "Feil",
                           description: "Kunne ikke oppdatere betalingstype",
                           variant: "destructive"
                         });
                       }
                     }}
                     disabled={!canEdit}
                     className="h-auto p-3 flex flex-col items-center gap-1"
                   >
                     <span className="font-medium">Ved avtale</span>
                     <span className="text-xs opacity-70">Avtales utenfor GIGGEN</span>
                   </Button>
                </div>

                {/* Payment Details */}
                {booking.door_deal && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <EditableField 
                      fieldName="door_percentage" 
                      label="Andel av dørinntekter (%)" 
                      value={booking.door_percentage} 
                      type="number" 
                      placeholder="70" 
                      onPropose={handleFieldUpdate} 
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Artist får {booking.door_percentage || 'X'}% av total dørinntekt
                    </p>
                  </div>
                )}

                {!booking.door_deal && !booking.by_agreement && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                    <EditableField 
                      fieldName="artist_fee" 
                      label="Fast honorar (kr)" 
                      value={booking.artist_fee} 
                      type="number" 
                      placeholder="5000" 
                      onPropose={handleFieldUpdate} 
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Garantert utbetaling uavhengig av billettsalg
                    </p>
                  </div>
                )}

                {booking.by_agreement && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                      Honorar avtales direkte mellom partene
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Detaljer om betaling diskuteres og bestemmes i direkte kontakt
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospitality */}
      

      {/* Documents */}
      <BookingDocumentViewer techSpec={booking.tech_spec} hospitalityRider={booking.hospitality_rider} bookingStatus={booking.status} isVisible={canEdit || booking.status === 'upcoming' || booking.status === 'published'} />

      {!canEdit && <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          💡 Detaljer kan redigeres når bookingen er godkjent og i forhandlingsfase
        </div>}
    </div>;
};