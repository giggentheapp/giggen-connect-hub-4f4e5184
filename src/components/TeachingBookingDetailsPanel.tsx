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
          {teachingData.schedule && (
            <div>
              <Label>Ukentlig timeplan</Label>
              <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
                {teachingData.schedule}
              </div>
            </div>
          )}
          
          {teachingData.start_date && (
            <div>
              <Label>Startdato</Label>
              <div className="p-3 border rounded bg-muted/30 text-sm">
                {format(new Date(teachingData.start_date), 'dd.MM.yyyy')}
              </div>
            </div>
          )}
          
          {teachingData.duration && (
            <div>
              <Label>Varighet</Label>
              <div className="p-3 border rounded bg-muted/30 text-sm">
                {teachingData.duration}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      {teachingData.location && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm">
              {teachingData.location}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment */}
      {teachingData.payment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Betaling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.payment}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsibilities */}
      {teachingData.responsibilities && (
        <Card>
          <CardHeader>
            <CardTitle>Ansvar og forventninger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.responsibilities}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Focus */}
      {teachingData.focus && (
        <Card>
          <CardHeader>
            <CardTitle>Fokus og innhold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.focus}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Termination */}
      {teachingData.termination && (
        <Card>
          <CardHeader>
            <CardTitle>Oppsigelsesvilkår</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.termination}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liability */}
      {teachingData.liability && (
        <Card>
          <CardHeader>
            <CardTitle>Forsikring og ansvar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.liability}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communication */}
      {teachingData.communication && (
        <Card>
          <CardHeader>
            <CardTitle>Kommunikasjon og avlysning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 border rounded bg-muted/30 text-sm whitespace-pre-wrap">
              {teachingData.communication}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
        💡 Dette er et undervisningstilbud. Feltene vises basert på avtalen.
      </div>
    </div>
  );
};
