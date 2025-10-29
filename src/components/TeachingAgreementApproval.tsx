import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GraduationCap, Clock, MapPin, Banknote, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TeachingAgreementApprovalProps {
  booking: any;
  conceptData: any;
  currentUserId: string;
}

export const TeachingAgreementApproval = ({ 
  booking, 
  conceptData, 
  currentUserId 
}: TeachingAgreementApprovalProps) => {
  const teachingData = conceptData?.teaching_data || {};
  const [loading, setLoading] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const hasApproved = isSender ? booking.approved_by_sender : booking.approved_by_receiver;
  const otherPartyApproved = isSender ? booking.approved_by_receiver : booking.approved_by_sender;
  const bothApproved = booking.approved_by_sender && booking.approved_by_receiver;

  // Helper to render field items
  const renderFieldItems = (value: any) => {
    if (!value || !Array.isArray(value)) return null;
    
    const items = value.filter((item: any) => item.enabled && item.value);
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={index}>
            <div className="font-medium text-sm mb-1">{item.label}</div>
            <div className="text-sm whitespace-pre-wrap text-muted-foreground">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const handleApprove = async () => {
    if (!hasRead) {
      toast({
        title: "Les avtalen",
        description: "Du må bekrefte at du har lest avtalen før du godkjenner",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        status: 'approved_by_both'
      };

      if (isSender) {
        updateData.approved_by_sender = true;
        updateData.sender_approved_at = new Date().toISOString();
      } else {
        updateData.approved_by_receiver = true;
        updateData.receiver_approved_at = new Date().toISOString();
      }

      // If both have now approved, set final approval
      if ((isSender && otherPartyApproved) || (isReceiver && booking.approved_by_sender)) {
        updateData.both_parties_approved = true;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Avtale godkjent",
        description: bothApproved 
          ? "Begge parter har godkjent avtalen!" 
          : "Din godkjenning er registrert. Venter på den andre parten.",
      });

      navigate('/bookings');
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: "Feil ved godkjenning",
        description: "Kunne ikke godkjenne avtalen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Godkjenn undervisningsavtale</h1>
        <p className="text-muted-foreground">
          Les gjennom detaljene og godkjenn avtalen når du er klar
        </p>
      </div>

      {/* Approval Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Godkjenningsstatus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {hasApproved ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <span>Din godkjenning: {hasApproved ? 'Godkjent' : 'Venter'}</span>
          </div>
          <div className="flex items-center gap-3">
            {otherPartyApproved ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <span>Motpart: {otherPartyApproved ? 'Godkjent' : 'Venter'}</span>
          </div>
          {bothApproved && (
            <Badge className="mt-2">Begge parter har godkjent</Badge>
          )}
        </CardContent>
      </Card>

      {/* Agreement Details */}
      <div className="space-y-6 mb-8">
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Grunnleggende informasjon</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Tittel:</span> {booking.title}
            </div>
            {booking.description && (
              <div>
                <span className="font-medium">Beskrivelse:</span> {booking.description}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        {teachingData.schedule && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Undervisningstider</h2>
            </div>
            {renderFieldItems(teachingData.schedule)}
          </div>
        )}

        {/* Start Date */}
        {teachingData.start_date && (
          <div>
            <span className="font-medium">Startdato:</span> {
              (() => {
                try {
                  return format(new Date(teachingData.start_date), 'dd.MM.yyyy');
                } catch (error) {
                  return teachingData.start_date;
                }
              })()
            }
          </div>
        )}

        {/* Duration */}
        {teachingData.duration && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Varighet</h2>
            {renderFieldItems(teachingData.duration)}
          </div>
        )}

        {/* Location */}
        {teachingData.location && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Sted</h2>
            </div>
            {renderFieldItems(teachingData.location)}
          </div>
        )}

        {/* Payment */}
        {teachingData.payment && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Betaling</h2>
            </div>
            {renderFieldItems(teachingData.payment)}
          </div>
        )}

        {/* Responsibilities */}
        {teachingData.responsibilities && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Ansvar og forventninger</h2>
            {renderFieldItems(teachingData.responsibilities)}
          </div>
        )}

        {/* Focus */}
        {teachingData.focus && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Fokus og innhold</h2>
            {renderFieldItems(teachingData.focus)}
          </div>
        )}

        {/* Termination */}
        {teachingData.termination && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Oppsigelsesvilkår</h2>
            {renderFieldItems(teachingData.termination)}
          </div>
        )}

        {/* Liability */}
        {teachingData.liability && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Forsikring og ansvar</h2>
            {renderFieldItems(teachingData.liability)}
          </div>
        )}

        {/* Communication */}
        {teachingData.communication && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Kommunikasjon og avlysning</h2>
            {renderFieldItems(teachingData.communication)}
          </div>
        )}
      </div>

      {/* Approval Section */}
      {!hasApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Godkjenn avtalen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="read-agreement" 
                checked={hasRead}
                onCheckedChange={(checked) => setHasRead(checked as boolean)}
              />
              <Label htmlFor="read-agreement" className="cursor-pointer">
                Jeg har lest og forstått alle detaljer i avtalen
              </Label>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleApprove} 
                disabled={!hasRead || loading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? 'Godkjenner...' : 'Godkjenn avtale'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/bookings')}
                disabled={loading}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasApproved && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Du har godkjent avtalen</h3>
              <p className="text-muted-foreground mb-4">
                {otherPartyApproved 
                  ? 'Avtalen er nå godkjent av begge parter!' 
                  : 'Venter på at den andre parten godkjenner avtalen.'}
              </p>
              <Button onClick={() => navigate('/bookings')}>
                Tilbake til bookinger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
