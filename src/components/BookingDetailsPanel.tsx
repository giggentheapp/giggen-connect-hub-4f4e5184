import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Check, X, Edit3, Clock, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
export const BookingDetailsPanel = ({
  booking,
  currentUserId,
  canEdit
}: BookingDetailsPanelProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const {
    proposeChange
  } = useBookings();
  const {
    toast
  } = useToast();
  const handleProposeChange = async (fieldName: string, oldValue: any, newValue: any) => {
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
    await proposeChange(booking.id, fieldName, String(oldValue || ''), String(newValue || ''));
    setEditingField(null);
    setTempValues({});
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
    const tempValue = tempValues[fieldName] ?? value;
    useEffect(() => {
      if (isEditing) {
        if (type === 'textarea' && textareaRef.current) {
          textareaRef.current.focus();
        } else if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [isEditing, type]);
    const startEditing = () => {
      setEditingField(fieldName);
      setTempValues({
        [fieldName]: value
      });
    };
    const cancelEditing = () => {
      setEditingField(null);
      setTempValues({});
    };
    const confirmEdit = () => {
      onPropose(fieldName, value, tempValue);
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
                  <Calendar mode="single" selected={tempValue ? new Date(tempValue) : undefined} onSelect={date => setTempValues(prev => ({
                ...prev,
                [fieldName]: date?.toISOString()
              }))} disabled={date => date < new Date()} initialFocus />
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
            {type === 'textarea' ? <Textarea ref={textareaRef} value={tempValue || ''} onChange={e => setTempValues(prev => ({
          ...prev,
          [fieldName]: e.target.value
        }))} placeholder={placeholder} rows={3} /> : <Input ref={inputRef} type={type} value={tempValue || ''} onChange={e => setTempValues(prev => ({
          ...prev,
          [fieldName]: e.target.value
        }))} placeholder={placeholder} />}
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
          <EditableField fieldName="title" label="Tittel" value={booking.title} placeholder="Navn på arrangementet" onPropose={handleProposeChange} />
          
          <EditableField fieldName="description" label="Beskrivelse" value={booking.description} type="textarea" placeholder="Beskriv arrangementet..." onPropose={handleProposeChange} />
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
            <EditableField fieldName="event_date" label="Dato" value={booking.event_date} type="date" placeholder="Velg dato" onPropose={handleProposeChange} />
            
            <EditableField fieldName="time" label="Klokkeslett" value={booking.time} type="time" placeholder="19:00" onPropose={handleProposeChange} />
          </div>

          <EditableField fieldName="venue" label="Spillested" value={booking.venue} placeholder="F.eks. Rockefeller Music Hall" onPropose={handleProposeChange} />
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
        <CardContent className="space-y-4">
          <EditableField fieldName="audience_estimate" label="Estimert publikum" value={booking.audience_estimate} type="number" placeholder="100" onPropose={handleProposeChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField fieldName="ticket_price" label="Billettpris (kr)" value={booking.ticket_price} type="number" placeholder="200" onPropose={handleProposeChange} />
            
            <EditableField fieldName="artist_fee" label="Artist honorar (kr)" value={booking.artist_fee} type="number" placeholder="5000" onPropose={handleProposeChange} />
          </div>
        </CardContent>
      </Card>

      {/* Hospitality */}
      

      {/* Documents */}
      <BookingDocumentViewer techSpec={booking.tech_spec} hospitalityRider={booking.hospitality_rider} bookingStatus={booking.status} isVisible={booking.status === 'allowed' || booking.status === 'both_parties_approved' || booking.status === 'upcoming'} />

      {!canEdit && <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          💡 Endringer kan kun foreslås når booking er i forhandlingsfase
        </div>}
    </div>;
};