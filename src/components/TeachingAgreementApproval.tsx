import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GraduationCap, Clock, MapPin, Banknote, CheckCircle, XCircle, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { navigateToProfile } from '@/lib/navigation';

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

  // Helper to render field items - only show if they have values
  const renderFieldItems = (value: any) => {
    if (!value || !Array.isArray(value)) return null;
    
    const items = value.filter((item: any) => item.enabled && item.value && item.value.trim());
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

  const handlePrint = () => {
    window.print();
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

      navigateToProfile(navigate, currentUserId, 'bookings', false);
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
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mb-6 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Godkjenn undervisningsavtale</h1>
            <p className="text-muted-foreground">
              Les gjennom detaljene og godkjenn avtalen når du er klar
            </p>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut / PDF
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Undervisningsavtale</h1>
        <p className="text-sm text-muted-foreground">
          Generert: {format(new Date(), 'dd.MM.yyyy HH:mm')}
        </p>
      </div>

      {/* Approval Status */}
      <Card className="mb-6 no-print">
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

      {/* Agreement Details - Complete View */}
      <div className="space-y-6 mb-8">
        {/* Basic Info */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-3">Grunnleggende informasjon</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Tittel:</span> {booking.title}
            </div>
            {booking.description && booking.description.trim() && (
              <div>
                <span className="font-medium">Beskrivelse:</span> {booking.description}
              </div>
            )}
            {booking.personal_message && booking.personal_message.trim() && (
              <div>
                <span className="font-medium">Personlig melding:</span> {booking.personal_message}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        {teachingData.schedule && renderFieldItems(teachingData.schedule) && (
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Undervisningstider</h2>
            </div>
            {renderFieldItems(teachingData.schedule)}
          </div>
        )}

        {/* Start Date */}
        {teachingData.start_date && (
          <div className="border-b pb-4">
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
        {teachingData.duration && renderFieldItems(teachingData.duration) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Varighet</h2>
            {renderFieldItems(teachingData.duration)}
          </div>
        )}

        {/* Location */}
        {teachingData.location && renderFieldItems(teachingData.location) && (
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Sted</h2>
            </div>
            {renderFieldItems(teachingData.location)}
          </div>
        )}

        {/* Payment */}
        {teachingData.payment && renderFieldItems(teachingData.payment) && (
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Betaling</h2>
            </div>
            {renderFieldItems(teachingData.payment)}
          </div>
        )}

        {/* Responsibilities */}
        {teachingData.responsibilities && renderFieldItems(teachingData.responsibilities) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Ansvar og forventninger</h2>
            {renderFieldItems(teachingData.responsibilities)}
          </div>
        )}

        {/* Focus */}
        {teachingData.focus && renderFieldItems(teachingData.focus) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Fokus og innhold</h2>
            {renderFieldItems(teachingData.focus)}
          </div>
        )}

        {/* Termination */}
        {teachingData.termination && renderFieldItems(teachingData.termination) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Oppsigelsesvilkår</h2>
            {renderFieldItems(teachingData.termination)}
          </div>
        )}

        {/* Liability */}
        {teachingData.liability && renderFieldItems(teachingData.liability) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Forsikring og ansvar</h2>
            {renderFieldItems(teachingData.liability)}
          </div>
        )}

        {/* Communication */}
        {teachingData.communication && renderFieldItems(teachingData.communication) && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Kommunikasjon og avlysning</h2>
            {renderFieldItems(teachingData.communication)}
          </div>
        )}

        {/* Contact Info - Show all details when agreed */}
        {booking.sender_contact_info && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">Kontaktinformasjon</h2>
            <div className="space-y-2">
              {booking.sender_contact_info.email && (
                <div>
                  <span className="font-medium">E-post:</span> {booking.sender_contact_info.email}
                </div>
              )}
              {booking.sender_contact_info.phone && (
                <div>
                  <span className="font-medium">Telefon:</span> {booking.sender_contact_info.phone}
                </div>
              )}
              {booking.sender_contact_info.website && (
                <div>
                  <span className="font-medium">Nettside:</span> {booking.sender_contact_info.website}
                </div>
              )}
              {booking.sender_contact_info.instagram && (
                <div>
                  <span className="font-medium">Instagram:</span> @{booking.sender_contact_info.instagram.replace('@', '')}
                </div>
              )}
              {booking.sender_contact_info.facebook && (
                <div>
                  <span className="font-medium">Facebook:</span> {booking.sender_contact_info.facebook}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional booking details if present */}
        {booking.venue && booking.venue.trim() && (
          <div className="border-b pb-4">
            <span className="font-medium">Spillested:</span> {booking.venue}
          </div>
        )}
        
        {booking.address && booking.address.trim() && (
          <div className="border-b pb-4">
            <span className="font-medium">Adresse:</span> {booking.address}
          </div>
        )}
      </div>

      {/* Approval Section */}
      {!hasApproved && (
        <Card className="no-print">
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
                onClick={() => navigateToProfile(navigate, currentUserId, 'bookings', false)}
                disabled={loading}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasApproved && (
        <Card className="no-print">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Du har godkjent avtalen</h3>
              <p className="text-muted-foreground mb-4">
                {otherPartyApproved 
                  ? 'Avtalen er nå godkjent av begge parter!' 
                  : 'Venter på at den andre parten godkjenner avtalen.'}
              </p>
              <Button onClick={() => navigateToProfile(navigate, currentUserId, 'bookings', false)}>
                Tilbake til bookinger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
