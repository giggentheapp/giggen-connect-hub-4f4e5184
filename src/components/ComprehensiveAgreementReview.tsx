import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, Calendar, MapPin, Banknote, Users, Settings, FileText, Phone, Eye, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BookingPortfolioAttachments } from '@/components/BookingPortfolioAttachments';
interface ComprehensiveAgreementReviewProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onApprovalComplete?: () => void;
}
const SECTIONS = [{
  id: 'basic',
  title: 'Grunnleggende informasjon',
  icon: Eye
}, {
  id: 'pricing',
  title: 'Publikum og prising',
  icon: Banknote
}];
export const ComprehensiveAgreementReview = ({
  booking: initialBooking,
  isOpen,
  onClose,
  currentUserId,
  onApprovalComplete
}: ComprehensiveAgreementReviewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [canProceed, setCanProceed] = useState(false);
  const [hasReadConfirmation, setHasReadConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChangedSinceLastApproval, setHasChangedSinceLastApproval] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    updateBooking
  } = useBookings();
  const {
    toast
  } = useToast();
  const isSender = currentUserId === booking?.sender_id;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';
  const userApprovalTimestamp = isSender ? 'sender_approved_at' : 'receiver_approved_at';
  const otherUserApprovalTimestamp = isSender ? 'receiver_approved_at' : 'sender_approved_at';
  const currentSection = SECTIONS[currentStep];
  const isLastStep = currentStep === SECTIONS.length - 1;
  const allSectionsCompleted = completedSections.size === SECTIONS.length;
  useEffect(() => {
    if (!booking || !isOpen) return;
    const lastModified = new Date(booking.last_modified_at);
    const userApproval = booking[userApprovalTimestamp] ? new Date(booking[userApprovalTimestamp]) : null;
    const otherUserApproval = booking[otherUserApprovalTimestamp] ? new Date(booking[otherUserApprovalTimestamp]) : null;
    const hasChanges = userApproval && lastModified > userApproval || otherUserApproval && lastModified > otherUserApproval;
    setHasChangedSinceLastApproval(hasChanges);
  }, [booking, userApprovalTimestamp, otherUserApprovalTimestamp, isOpen]);

  // Fetch fresh booking data when dialog opens
  useEffect(() => {
    const fetchFreshBookingData = async () => {
      if (!isOpen || !initialBooking?.id) return;
      setFetchingFreshData(true);
      try {
        console.log('🔄 Fetching fresh booking data for approval...');
        const {
          data,
          error
        } = await supabase.from('bookings').select('*').eq('id', initialBooking.id).single();
        if (error) throw error;
        console.log('✅ Fresh booking data loaded:', {
          id: data.id,
          last_modified_at: data.last_modified_at,
          event_date: data.event_date,
          time: data.time
        });
        setBooking(data);
      } catch (error) {
        console.error('❌ Error fetching fresh booking data:', error);
        toast({
          title: "Feil ved lasting av ferske data",
          description: "Bruker cached data. Kontakt support hvis problemet vedvarer.",
          variant: "destructive"
        });
        setBooking(initialBooking);
      } finally {
        setFetchingFreshData(false);
      }
    };
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSections(new Set());
      setCanProceed(false);
      setHasReadConfirmation(false);
      fetchFreshBookingData();
    }
  }, [isOpen, initialBooking?.id, toast]);
  const handleNext = () => {
    console.log('🔄 handleNext called:', {
      canProceed,
      hasReadConfirmation,
      currentSection: currentSection.id,
      isLastStep,
      completedSections: Array.from(completedSections)
    });
    if (!canProceed && !hasReadConfirmation) return;

    // Mark current section as completed
    const newCompleted = new Set([...completedSections, currentSection.id]);
    setCompletedSections(newCompleted);
    console.log('✅ Section completed:', currentSection.id, 'All completed sections:', Array.from(newCompleted));
    if (isLastStep) {
      // All sections completed, can now approve
      console.log('🎯 Last step completed, approval should be available');
      return;
    }

    // Move to next section
    setCurrentStep(prev => prev + 1);
    setCanProceed(false);
    setHasReadConfirmation(false);
  };
  const handleApproval = async () => {
    if (!allSectionsCompleted) {
      toast({
        title: "Gjennomgå alle seksjoner",
        description: "Du må gå gjennom alle seksjoner før du kan godkjenne avtalen",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const updates: any = {
        [userConfirmedField]: true
      };
      if (hasChangedSinceLastApproval && booking[otherUserConfirmedField]) {
        updates[otherUserConfirmedField] = false;
        updates[otherUserApprovalTimestamp] = null;
        toast({
          title: "Motpartens godkjenning nullstilt",
          description: "På grunn av endringer må motparten godkjenne avtalen på nytt",
          variant: "default"
        });
      }
      await updateBooking(booking.id, updates);
      toast({
        title: "Avtale godkjent! ✅",
        description: hasChangedSinceLastApproval ? "Du har godkjent den oppdaterte avtalen" : "Du har godkjent avtalen"
      });
      onApprovalComplete?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Feil ved godkjenning",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const renderSectionContent = () => {
    const sectionId = currentSection.id;
    switch (sectionId) {
      case 'basic':
        return <div className="space-y-4">
            {/* Prominent Date/Time Section */}
            {(booking.event_date || booking.time) && <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Dato og tid for arrangementet
                </h4>
                <div className="text-2xl font-bold text-primary">
                  {booking.event_date && <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span>
                        {format(new Date(booking.event_date), 'EEEE dd. MMMM yyyy', {
                    locale: nb
                  })}
                      </span>
                      {booking.time && <>
                          <Clock className="h-5 w-5 mx-2 hidden sm:block" />
                          <span>kl. {booking.time}</span>
                        </>}
                    </div>}
                  {!booking.event_date && booking.time && <span>Kl. {booking.time}</span>}
                </div>
              </div>}

            <div>
              <h3 className="font-semibold text-xl mb-2">{booking.title}</h3>
              {booking.description && <p className="text-muted-foreground mb-4">{booking.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.venue && <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">{booking.venue}</span>
                </div>}
            </div>

            {booking.personal_message && <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Personlig melding</h4>
                <p className="text-sm">{booking.personal_message}</p>
              </div>}

            {/* Contact Info - Show both parties */}
            {(booking.sender_contact_info || booking.receiver_contact_info) && <div className="bg-muted p-4 rounded-lg space-y-4">
                <h4 className="font-medium">Kontaktinformasjon</h4>
                
                {/* Sender contact info - visible to receiver */}
                {!isSender && booking.sender_contact_info && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Fra arrangør:</h5>
                    {booking.sender_contact_info.email && <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">E-post:</span>
                        <a href={`mailto:${booking.sender_contact_info.email}`} className="text-sm text-primary hover:underline">
                          {booking.sender_contact_info.email}
                        </a>
                      </div>}
                    {booking.sender_contact_info.phone && <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Telefon:</span>
                        <a href={`tel:${booking.sender_contact_info.phone}`} className="text-sm text-primary hover:underline">
                          {booking.sender_contact_info.phone}
                        </a>
                      </div>}
                  </div>
                )}
                
                {/* Receiver contact info - visible to sender */}
                {isSender && booking.receiver_contact_info && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Fra musiker:</h5>
                    {booking.receiver_contact_info.email && <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">E-post:</span>
                        <a href={`mailto:${booking.receiver_contact_info.email}`} className="text-sm text-primary hover:underline">
                          {booking.receiver_contact_info.email}
                        </a>
                      </div>}
                    {booking.receiver_contact_info.phone && <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Telefon:</span>
                        <a href={`tel:${booking.receiver_contact_info.phone}`} className="text-sm text-primary hover:underline">
                          {booking.receiver_contact_info.phone}
                        </a>
                      </div>}
                  </div>
                )}
              </div>}

            {/* Portfolio Attachments */}
            {booking.id && currentUserId && (
              <BookingPortfolioAttachments
                bookingId={booking.id}
                currentUserId={currentUserId}
                canEdit={false}
              />
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                Dette er grunnleggende informasjon om arrangementet. Les gjennom alle detaljer nøye før du fortsetter.
              </p>
            </div>
          </div>;
      case 'pricing':
        const audienceEstimate = booking.audience_estimate || 0;
        const ticketPrice = booking.ticket_price || 0;
        const totalRevenue = audienceEstimate * ticketPrice;
        const hasRevenueData = audienceEstimate > 0 && ticketPrice > 0;
        let artistEarnings = 0;
        if (booking.door_deal && booking.door_percentage) {
          artistEarnings = Math.round(totalRevenue * (booking.door_percentage / 100));
        } else if (booking.artist_fee) {
          artistEarnings = booking.artist_fee;
        }
        return <div className="space-y-4">
            {/* Revenue Calculation - Always show if we have data */}
            {hasRevenueData && <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <h4 className="font-semibold text-lg mb-3">Forventet inntekt</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Publikum:</span>
                    <span className="font-semibold">{audienceEstimate} personer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Billettpris:</span>
                    <span className="font-semibold">{ticketPrice} kr</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total brutto inntekt:</span>
                      <span className="text-xl font-bold text-primary">{totalRevenue.toLocaleString('no-NO')} kr</span>
                    </div>
                  </div>
                </div>
              </div>}

            {booking.audience_estimate && <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Forventet publikum: <strong>{booking.audience_estimate}</strong></span>
              </div>}

            {booking.ticket_price && <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                <span>Billettpris: <strong>{booking.ticket_price} kr</strong></span>
              </div>}

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-lg mb-3">Artist honorar</h4>
              {booking.door_deal ? (
                <div className="space-y-2">
                  <p className="font-medium text-blue-700 dark:text-blue-400">Spiller for døra (andel av inngang)</p>
                  <p className="text-sm text-muted-foreground">
                    Partene har valgt en døravtale. Honoraret er avhengig av billettsalg og avklares mellom partene utenfor GIGGEN.
                  </p>
                  <p className="text-lg mt-2">Prosentandel: <strong>{booking.door_percentage || 'X'}%</strong> av total dørinntekt</p>
                  {hasRevenueData && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Artist får ({booking.door_percentage}%):</span>
                        <span className="text-xl font-bold text-green-700 dark:text-green-400">
                          {artistEarnings.toLocaleString('no-NO')} kr
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : booking.by_agreement ? (
                <div className="space-y-2">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Avtale utenfor GIGGEN</p>
                  <p className="text-sm text-muted-foreground">
                    Partene har valgt å avtale økonomi utenfor GIGGEN. Ingen honorar eller betalingsvilkår er registrert i appen.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    GIGGEN er kun en ikke-bindende avtalemal og er ikke part i økonomisk oppgjør.
                  </p>
                  {hasRevenueData && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 text-sm text-muted-foreground">
                      <p>Estimert total inntekt: <strong>{totalRevenue.toLocaleString('no-NO')} kr</strong></p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-green-700 dark:text-green-400">Fast honorar (garantert beløp)</p>
                  <p className="text-sm text-muted-foreground">
                    Partene har angitt et fast honorar som felles utgangspunkt. Utbetaling håndteres utenfor GIGGEN.
                  </p>
                  <p className="text-lg mt-2">Beløp: <strong>{booking.artist_fee || 'Ikke spesifisert'} kr</strong></p>
                  {hasRevenueData && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 text-sm text-muted-foreground">
                      <p>Estimert total inntekt: <strong>{totalRevenue.toLocaleString('no-NO')} kr</strong></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/50 rounded-md border border-muted">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <span>
                  GIGGEN håndterer per i dag ikke betaling eller juridisk bindende kontrakter.
                  Avtalen brukes som et felles utgangspunkt og forventningsavklaring.
                </span>
              </p>
            </div>
          </div>;
      default:
        return <div>Ukjent seksjon</div>;
    }
  };
  if (!booking) return null;
  const Icon = currentSection.icon;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none p-0 overflow-y-auto flex flex-col">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center justify-between">
            <span>Gjennomgå avtale før godkjenning</span>
            <div className="flex items-center gap-3 text-sm font-normal text-muted-foreground">
              {fetchingFreshData && <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Oppdaterer...</span>
                </div>}
              <span>Steg {currentStep + 1} av {SECTIONS.length}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Progress indicators */}
          <div className="flex items-center gap-2 mb-6">
            {SECTIONS.map((section, index) => <div key={section.id} className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium", index < currentStep ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : index === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {index < currentStep ? <Check className="h-3 w-3" /> : <section.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{section.title}</span>
              </div>)}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                
                {currentSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)] pr-4" ref={scrollRef}>
                <div ref={contentRef}>
                  {renderSectionContent()}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="shrink-0 border-t px-6 py-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={hasReadConfirmation} onChange={e => {
                const checked = e.target.checked;
                console.log('📋 Checkbox changed:', {
                  checked,
                  currentSection: currentSection.id,
                  step: currentStep + 1,
                  isLastStep
                });
                setHasReadConfirmation(checked);
                setCanProceed(checked);

                // If this is the last step and checkbox is checked, mark section as completed
                if (isLastStep && checked) {
                  const newCompleted = new Set([...completedSections, currentSection.id]);
                  setCompletedSections(newCompleted);
                }
              }} className="rounded" />
                <span>Jeg har lest og forstått denne delen</span>
              </label>
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && <Button variant="outline" onClick={() => {
              setCurrentStep(prev => prev - 1);
              setCanProceed(false);
              setHasReadConfirmation(false);
            }}>
                  Tilbake
                </Button>}
              
              {!isLastStep ? <Button onClick={handleNext} disabled={!canProceed} className="min-w-20">
                  Neste
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button> : <Button onClick={() => {
              console.log('🚀 Approval button clicked:', {
                canProceed,
                allSectionsCompleted,
                loading,
                completedSections: Array.from(completedSections),
                sectionsLength: SECTIONS.length
              });
              handleApproval();
            }} disabled={!canProceed || !allSectionsCompleted || loading} className="min-w-32">
                  {loading ? "Godkjenner..." : "Godkjenn avtale"}
                </Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};