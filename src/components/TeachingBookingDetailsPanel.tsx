import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { GraduationCap, Clock, MapPin, Banknote } from 'lucide-react';
import { format } from 'date-fns';

interface TeachingBookingDetailsPanelProps {
  booking: any;
  conceptData: any;
}

export const TeachingBookingDetailsPanel = ({ booking, conceptData }: TeachingBookingDetailsPanelProps) => {
  const teachingData = conceptData?.teaching_data || {};
  
  // Helper function to render field items with labels
  const renderFieldItems = (value: any) => {
    if (!value) return null;
    
    // Handle arrays (form field data with label/value structure)
    if (Array.isArray(value)) {
      const items = value.filter((item: any) => item.enabled && item.value);
      
      if (items.length === 0) return null;
      
      return (
        <div className="space-y-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="p-3 border rounded bg-muted/30">
              <div className="font-medium text-sm mb-1">{item.label}</div>
              <div className="text-sm whitespace-pre-wrap">{item.value}</div>
            </div>
          ))}
        </div>
      );
    }
    
    // Handle simple string values
    if (typeof value === 'string' && value.trim()) {
      return (
        <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
          {value}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Grunnleggende informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tittel</Label>
            <div className="p-3 border rounded bg-muted/30 text-sm">
              {booking.title}
            </div>
          </div>
          
          {booking.description && (
            <div>
              <Label>Beskrivelse</Label>
              <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
                {booking.description}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Undervisningstider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teachingData.schedule && renderFieldItems(teachingData.schedule)}
          
          {teachingData.start_date && (
            <div>
              <Label>Startdato</Label>
              <div className="p-3 border rounded bg-muted/30 text-sm">
                {(() => {
                  try {
                    return format(new Date(teachingData.start_date), 'dd.MM.yyyy');
                  } catch (error) {
                    return teachingData.start_date;
                  }
                })()}
              </div>
            </div>
          )}
          
          {teachingData.duration && renderFieldItems(teachingData.duration)}
        </CardContent>
      </Card>

      {/* Location */}
      {teachingData.location && renderFieldItems(teachingData.location) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.location)}
          </CardContent>
        </Card>
      )}

      {/* Payment */}
      {teachingData.payment && renderFieldItems(teachingData.payment) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Betaling
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.payment)}
          </CardContent>
        </Card>
      )}

      {/* Responsibilities */}
      {teachingData.responsibilities && renderFieldItems(teachingData.responsibilities) && (
        <Card>
          <CardHeader>
            <CardTitle>Ansvar og forventninger</CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.responsibilities)}
          </CardContent>
        </Card>
      )}

      {/* Focus */}
      {teachingData.focus && renderFieldItems(teachingData.focus) && (
        <Card>
          <CardHeader>
            <CardTitle>Fokus og innhold</CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.focus)}
          </CardContent>
        </Card>
      )}

      {/* Termination */}
      {teachingData.termination && renderFieldItems(teachingData.termination) && (
        <Card>
          <CardHeader>
            <CardTitle>Oppsigelsesvilkår</CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.termination)}
          </CardContent>
        </Card>
      )}

      {/* Liability */}
      {teachingData.liability && renderFieldItems(teachingData.liability) && (
        <Card>
          <CardHeader>
            <CardTitle>Forsikring og ansvar</CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.liability)}
          </CardContent>
        </Card>
      )}

      {/* Communication */}
      {teachingData.communication && renderFieldItems(teachingData.communication) && (
        <Card>
          <CardHeader>
            <CardTitle>Kommunikasjon og avlysning</CardTitle>
          </CardHeader>
          <CardContent>
            {renderFieldItems(teachingData.communication)}
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
        💡 Dette er et undervisningstilbud. Feltene vises basert på avtalen.
      </div>
    </div>
  );
};
