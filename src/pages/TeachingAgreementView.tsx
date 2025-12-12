import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, ArrowLeft, Clock, MapPin, Banknote, Edit2, Save, X, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function TeachingAgreementView() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [booking, setBooking] = useState<any>(null);
  const [conceptData, setConceptData] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
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

  const isSender = user?.id === booking?.sender_id;
  const isReceiver = user?.id === booking?.receiver_id;
  const currentSignature = isSender ? booking?.sender_signature : booking?.receiver_signature;
  const currentSignedAt = isSender ? booking?.sender_signed_at : booking?.receiver_signed_at;

  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!bookingId || !user) return;

    try {
      const updateData = isSender
        ? { sender_signature: signatureDataUrl, sender_signed_at: new Date().toISOString() }
        : { receiver_signature: signatureDataUrl, receiver_signed_at: new Date().toISOString() };

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Signatur lagret",
        description: "Din digitale signatur er registrert på avtalen"
      });

      setShowSignatureModal(false);

      // Refresh booking data
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (updatedBooking) setBooking(updatedBooking);
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre signaturen",
        variant: "destructive"
      });
    }
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

  // Helper to render field items - only show if they have values (compact for print)
  const renderFieldItems = (value: any) => {
    if (!value || !Array.isArray(value)) return null;
    
    const items = value.filter((item: any) => item.enabled && item.value && item.value.trim());
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-1">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex gap-2 text-sm">
            <span className="font-medium shrink-0">{item.label}:</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 print:p-2 print:max-w-full">
      {/* Print Styles - Compact layout for 2 pages max */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 11px;
            line-height: 1.3;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          h1 { font-size: 16px !important; margin-bottom: 4px !important; }
          h2 { font-size: 12px !important; margin-bottom: 2px !important; }
          .print-compact { padding: 4px 0 !important; margin: 0 !important; }
          .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        }
      `}</style>

      {/* Header - No print */}
      <div className="mb-4 no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tilbake
          </Button>
          <div>
            <h1 className="text-xl font-bold">Undervisningsavtale</h1>
            <p className="text-sm text-muted-foreground">Kompakt utskriftsversjon</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Skriv ut
        </Button>
      </div>

      {/* Print Header - Compact */}
      <div className="hidden print:block mb-2 border-b pb-2">
        <h1 className="text-lg font-bold">Undervisningsavtale</h1>
        <p className="text-xs text-muted-foreground">
          Generert: {format(new Date(), 'dd.MM.yyyy')} | {booking.title}
        </p>
      </div>

      {/* Agreement Details - Compact grid layout */}
      <div className="space-y-2 print:space-y-1">
        {/* Basic Info - Inline */}
        <div className="border-b pb-2 print:pb-1 print-compact">
          <h2 className="text-base font-semibold mb-1 print:text-sm">Grunnleggende</h2>
          <div className="text-sm space-y-0.5">
            {booking.description && booking.description.trim() && (
              <p className="text-muted-foreground">{booking.description}</p>
            )}
            {booking.personal_message && booking.personal_message.trim() && (
              <p className="text-muted-foreground italic text-xs">"{booking.personal_message}"</p>
            )}
          </div>
        </div>

        {/* Two-column grid for compact sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:print-grid">
          {/* Schedule */}
          {teachingData.schedule && renderFieldItems(teachingData.schedule) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Tider
              </h2>
              {renderFieldItems(teachingData.schedule)}
            </div>
          )}

          {/* Start Date + Duration combined */}
          {(teachingData.start_date || (teachingData.duration && renderFieldItems(teachingData.duration))) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1">Varighet</h2>
              <div className="text-sm space-y-0.5">
                {teachingData.start_date && (
                  <div className="flex gap-2">
                    <span className="font-medium shrink-0">Start:</span>
                    <span className="text-muted-foreground">
                      {(() => {
                        try { return format(new Date(teachingData.start_date), 'dd.MM.yyyy'); } 
                        catch { return teachingData.start_date; }
                      })()}
                    </span>
                  </div>
                )}
                {renderFieldItems(teachingData.duration)}
              </div>
            </div>
          )}

          {/* Location */}
          {teachingData.location && renderFieldItems(teachingData.location) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Sted
              </h2>
              {renderFieldItems(teachingData.location)}
            </div>
          )}

          {/* Payment */}
          {teachingData.payment && renderFieldItems(teachingData.payment) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
                <Banknote className="h-3 w-3" /> Betaling
              </h2>
              {renderFieldItems(teachingData.payment)}
            </div>
          )}
        </div>

        {/* Full-width sections for longer content */}
        {teachingData.responsibilities && renderFieldItems(teachingData.responsibilities) && (
          <div className="border-b pb-2 print:pb-1 print-compact">
            <h2 className="text-sm font-semibold mb-1">Ansvar og forventninger</h2>
            {renderFieldItems(teachingData.responsibilities)}
          </div>
        )}

        {teachingData.focus && renderFieldItems(teachingData.focus) && (
          <div className="border-b pb-2 print:pb-1 print-compact">
            <h2 className="text-sm font-semibold mb-1">Fokus og innhold</h2>
            {renderFieldItems(teachingData.focus)}
          </div>
        )}

        {/* Grid for shorter terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:print-grid">
          {teachingData.termination && renderFieldItems(teachingData.termination) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1">Oppsigelse</h2>
              {renderFieldItems(teachingData.termination)}
            </div>
          )}

          {teachingData.liability && renderFieldItems(teachingData.liability) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1">Forsikring/ansvar</h2>
              {renderFieldItems(teachingData.liability)}
            </div>
          )}

          {teachingData.communication && renderFieldItems(teachingData.communication) && (
            <div className="border-b pb-2 print:pb-1 print-compact">
              <h2 className="text-sm font-semibold mb-1">Kommunikasjon</h2>
              {renderFieldItems(teachingData.communication)}
            </div>
          )}
        </div>

        {/* Contact Info - Compact two-column */}
        {(booking.sender_contact_info || booking.receiver_contact_info) && (
          <div className="border-b pb-2 print:pb-1 print-compact">
            <h2 className="text-sm font-semibold mb-1">Kontaktinformasjon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs print:print-grid">
              {booking.sender_contact_info && (
                <div>
                  <span className="font-medium">Lærer:</span>{' '}
                  {booking.sender_contact_info.email && <span>{booking.sender_contact_info.email}</span>}
                  {booking.sender_contact_info.phone && <span className="ml-2">• {booking.sender_contact_info.phone}</span>}
                </div>
              )}
              {booking.receiver_contact_info && (
                <div>
                  <span className="font-medium">Elev:</span>{' '}
                  {booking.receiver_contact_info.email && <span>{booking.receiver_contact_info.email}</span>}
                  {booking.receiver_contact_info.phone && <span className="ml-2">• {booking.receiver_contact_info.phone}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional details inline */}
        {(booking.venue || booking.address) && (
          <div className="text-xs text-muted-foreground">
            {booking.venue && <span><strong>Sted:</strong> {booking.venue}</span>}
            {booking.venue && booking.address && ' • '}
            {booking.address && <span>{booking.address}</span>}
          </div>
        )}

        {/* Party Information - Compact signature section */}
        <div className="border-t pt-3 mt-4 print:pt-2 print:mt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Parter og signaturer</h2>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="no-print text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Rediger
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 no-print">
              <div className="grid grid-cols-2 gap-4">
                {/* Sender Editable */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Lærer</h3>
                  <Input
                    placeholder="Navn"
                    value={editedContacts.sender.name}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      sender: { ...prev.sender, name: e.target.value }
                    }))}
                  />
                  <Input
                    type="email"
                    placeholder="E-post"
                    value={editedContacts.sender.email}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      sender: { ...prev.sender, email: e.target.value }
                    }))}
                  />
                  <Input
                    type="tel"
                    placeholder="Telefon"
                    value={editedContacts.sender.phone}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      sender: { ...prev.sender, phone: e.target.value }
                    }))}
                  />
                </div>

                {/* Receiver Editable */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Elev</h3>
                  <Input
                    placeholder="Navn"
                    value={editedContacts.receiver.name}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      receiver: { ...prev.receiver, name: e.target.value }
                    }))}
                  />
                  <Input
                    type="email"
                    placeholder="E-post"
                    value={editedContacts.receiver.email}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      receiver: { ...prev.receiver, email: e.target.value }
                    }))}
                  />
                  <Input
                    type="tel"
                    placeholder="Telefon"
                    value={editedContacts.receiver.phone}
                    onChange={(e) => setEditedContacts(prev => ({
                      ...prev,
                      receiver: { ...prev.receiver, phone: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveContacts}>
                  <Save className="h-3 w-3 mr-1" />
                  Lagre
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3 mr-1" />
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 print:gap-8">
              {/* Sender Display */}
              <div className="text-sm">
                <h3 className="font-medium mb-1">Lærer</h3>
                <div className="space-y-0.5 text-xs">
                  <div>
                    {senderProfile ? (
                      <Link 
                        to={`/profile/${senderProfile.user_id}`} 
                        className="text-primary hover:underline no-print font-medium"
                      >
                        {editedContacts.sender.name || senderProfile.display_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{editedContacts.sender.name}</span>
                    )}
                    <span className="hidden print:inline font-medium">
                      {editedContacts.sender.name || senderProfile?.display_name}
                    </span>
                  </div>
                  {editedContacts.sender.email && <div>{editedContacts.sender.email}</div>}
                  {editedContacts.sender.phone && <div>{editedContacts.sender.phone}</div>}
                </div>
                {booking.approved_by_sender && booking.sender_approved_at && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Godkjent {format(new Date(booking.sender_approved_at), 'dd.MM.yy')}
                  </div>
                )}
                {/* Digital Signature Display */}
                {booking.sender_signature ? (
                  <div className="mt-2">
                    <img 
                      src={booking.sender_signature} 
                      alt="Lærer signatur" 
                      className="h-12 max-w-full object-contain border-b border-muted"
                    />
                    <div className="text-xs text-muted-foreground">
                      Signert {booking.sender_signed_at && format(new Date(booking.sender_signed_at), 'dd.MM.yy HH:mm')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 print:block">
                    <div className="h-8 border-b border-dashed border-muted-foreground/50 print:h-12" />
                    <div className="text-xs text-muted-foreground">Signatur</div>
                  </div>
                )}
              </div>

              {/* Receiver Display */}
              <div className="text-sm">
                <h3 className="font-medium mb-1">Elev</h3>
                <div className="space-y-0.5 text-xs">
                  <div>
                    {receiverProfile ? (
                      <Link 
                        to={`/profile/${receiverProfile.user_id}`} 
                        className="text-primary hover:underline no-print font-medium"
                      >
                        {editedContacts.receiver.name || receiverProfile.display_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{editedContacts.receiver.name}</span>
                    )}
                    <span className="hidden print:inline font-medium">
                      {editedContacts.receiver.name || receiverProfile?.display_name}
                    </span>
                  </div>
                  {editedContacts.receiver.email && <div>{editedContacts.receiver.email}</div>}
                  {editedContacts.receiver.phone && <div>{editedContacts.receiver.phone}</div>}
                </div>
                {booking.approved_by_receiver && booking.receiver_approved_at && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Godkjent {format(new Date(booking.receiver_approved_at), 'dd.MM.yy')}
                  </div>
                )}
                {/* Digital Signature Display */}
                {booking.receiver_signature ? (
                  <div className="mt-2">
                    <img 
                      src={booking.receiver_signature} 
                      alt="Elev signatur" 
                      className="h-12 max-w-full object-contain border-b border-muted"
                    />
                    <div className="text-xs text-muted-foreground">
                      Signert {booking.receiver_signed_at && format(new Date(booking.receiver_signed_at), 'dd.MM.yy HH:mm')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 print:block">
                    <div className="h-8 border-b border-dashed border-muted-foreground/50 print:h-12" />
                    <div className="text-xs text-muted-foreground">Signatur</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sign Button - only show for party members who haven't signed */}
          {(isSender || isReceiver) && !currentSignature && (
            <div className="mt-4 no-print">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSignatureModal(true)}
              >
                <PenTool className="h-3 w-3 mr-1" />
                Signer avtalen
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Digital signatur</DialogTitle>
            <DialogDescription>
              Tegn signaturen din i feltet under for å signere avtalen digitalt.
            </DialogDescription>
          </DialogHeader>
          <SignatureCanvas 
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
