import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, ArrowLeft, Clock, MapPin, Banknote, GraduationCap, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TeachingAgreementView() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [conceptData, setConceptData] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContacts, setEditedContacts] = useState({
    sender: { name: '', email: '', phone: '' },
    receiver: { name: '', email: '', phone: '' }
  });

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

        // Fetch sender and receiver profiles
        const { data: sender } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', bookingData.sender_id)
          .single();
        
        const { data: receiver } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', bookingData.receiver_id)
          .single();

        setSenderProfile(sender);
        setReceiverProfile(receiver);

        // Initialize edited contacts with profile data
        const senderContactInfo = sender?.contact_info as { email?: string; phone?: string } | null;
        const receiverContactInfo = receiver?.contact_info as { email?: string; phone?: string } | null;

        setEditedContacts({
          sender: {
            name: sender?.display_name || '',
            email: senderContactInfo?.email || '',
            phone: senderContactInfo?.phone || ''
          },
          receiver: {
            name: receiver?.display_name || '',
            email: receiverContactInfo?.email || '',
            phone: receiverContactInfo?.phone || ''
          }
        });
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

  const handleSaveContacts = async () => {
    try {
      // Save the edited contact info to the booking
      const { error } = await supabase
        .from('bookings')
        .update({
          sender_contact_info: {
            ...booking.sender_contact_info,
            name: editedContacts.sender.name,
            email: editedContacts.sender.email,
            phone: editedContacts.sender.phone
          }
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Kontaktinfo lagret",
        description: "Kontaktinformasjonen er oppdatert"
      });

      setIsEditing(false);
      
      // Refresh booking data
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (updatedBooking) setBooking(updatedBooking);
    } catch (error) {
      console.error('Error saving contacts:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre kontaktinformasjon",
        variant: "destructive"
      });
    }
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
          <Button variant="outline" onClick={() => navigate(-1)}>
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

        {/* Party Information */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parter</h2>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="no-print"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rediger
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-6 no-print">
              {/* Sender Editable */}
              <div className="space-y-3">
                <h3 className="font-medium">Avsender (Lærer)</h3>
                <div className="grid gap-3">
                  <div>
                    <Label>Fullt navn</Label>
                    <Input
                      value={editedContacts.sender.name}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        sender: { ...prev.sender, name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>E-post</Label>
                    <Input
                      type="email"
                      value={editedContacts.sender.email}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        sender: { ...prev.sender, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input
                      type="tel"
                      value={editedContacts.sender.phone}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        sender: { ...prev.sender, phone: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Editable */}
              <div className="space-y-3">
                <h3 className="font-medium">Mottaker (Elev)</h3>
                <div className="grid gap-3">
                  <div>
                    <Label>Fullt navn</Label>
                    <Input
                      value={editedContacts.receiver.name}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        receiver: { ...prev.receiver, name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>E-post</Label>
                    <Input
                      type="email"
                      value={editedContacts.receiver.email}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        receiver: { ...prev.receiver, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input
                      type="tel"
                      value={editedContacts.receiver.phone}
                      onChange={(e) => setEditedContacts(prev => ({
                        ...prev,
                        receiver: { ...prev.receiver, phone: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveContacts}>
                  <Save className="h-4 w-4 mr-2" />
                  Lagre
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sender Display */}
              <div className="space-y-2">
                <h3 className="font-medium">Avsender (Lærer)</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Navn:</span>{' '}
                    {senderProfile ? (
                      <Link 
                        to={`/profile/${senderProfile.user_id}`} 
                        className="text-primary hover:underline no-print"
                      >
                        {editedContacts.sender.name || senderProfile.display_name}
                      </Link>
                    ) : (
                      editedContacts.sender.name
                    )}
                    <span className="hidden print:inline">
                      {editedContacts.sender.name || senderProfile?.display_name}
                    </span>
                  </div>
                  {editedContacts.sender.email && (
                    <div>
                      <span className="font-medium">E-post:</span> {editedContacts.sender.email}
                    </div>
                  )}
                  {editedContacts.sender.phone && (
                    <div>
                      <span className="font-medium">Telefon:</span> {editedContacts.sender.phone}
                    </div>
                  )}
                </div>
                {booking.approved_by_sender && booking.sender_approved_at && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Godkjent: {format(new Date(booking.sender_approved_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                )}
              </div>

              {/* Receiver Display */}
              <div className="space-y-2">
                <h3 className="font-medium">Mottaker (Elev)</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Navn:</span>{' '}
                    {receiverProfile ? (
                      <Link 
                        to={`/profile/${receiverProfile.user_id}`} 
                        className="text-primary hover:underline no-print"
                      >
                        {editedContacts.receiver.name || receiverProfile.display_name}
                      </Link>
                    ) : (
                      editedContacts.receiver.name
                    )}
                    <span className="hidden print:inline">
                      {editedContacts.receiver.name || receiverProfile?.display_name}
                    </span>
                  </div>
                  {editedContacts.receiver.email && (
                    <div>
                      <span className="font-medium">E-post:</span> {editedContacts.receiver.email}
                    </div>
                  )}
                  {editedContacts.receiver.phone && (
                    <div>
                      <span className="font-medium">Telefon:</span> {editedContacts.receiver.phone}
                    </div>
                  )}
                </div>
                {booking.approved_by_receiver && booking.receiver_approved_at && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Godkjent: {format(new Date(booking.receiver_approved_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
