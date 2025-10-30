import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Clock, MapPin, Banknote, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TeachingAgreementView() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [conceptData, setConceptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;

      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        if (bookingData.selected_concept_id) {
          const { data: conceptDataRes, error: conceptError } = await supabase
            .from('concepts')
            .select('*')
            .eq('id', bookingData.selected_concept_id)
            .single();

          if (conceptError) throw conceptError;
          setConceptData(conceptDataRes);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Feil ved lasting",
          description: "Kunne ikke laste avtaledata",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, toast]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laster avtale...</div>
      </div>
    );
  }

  if (!booking || !conceptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Fant ikke avtale</div>
      </div>
    );
  }

  const teachingData = conceptData.teaching_data || {};

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

      {/* Header - No print */}
      <div className="mb-6 no-print flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Undervisningsavtale</h1>
            <p className="text-muted-foreground">Fullstendig oversikt</p>
          </div>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Skriv ut / PDF
        </Button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Undervisningsavtale</h1>
        <p className="text-sm text-muted-foreground">
          Generert: {format(new Date(), 'dd.MM.yyyy HH:mm')}
        </p>
      </div>

      {/* Agreement Details */}
      <div className="space-y-6">
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

        {/* Contact Info */}
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

        {/* Additional booking details */}
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

        {/* Approval Status */}
        {(booking.approved_by_sender || booking.approved_by_receiver) && (
          <div className="border-t pt-4 mt-6">
            <h2 className="text-lg font-semibold mb-3">Godkjenningsstatus</h2>
            <div className="space-y-2">
              {booking.approved_by_sender && booking.sender_approved_at && (
                <div>
                  <span className="font-medium">Avsender godkjent:</span> {format(new Date(booking.sender_approved_at), 'dd.MM.yyyy HH:mm')}
                </div>
              )}
              {booking.approved_by_receiver && booking.receiver_approved_at && (
                <div>
                  <span className="font-medium">Mottaker godkjent:</span> {format(new Date(booking.receiver_approved_at), 'dd.MM.yyyy HH:mm')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
