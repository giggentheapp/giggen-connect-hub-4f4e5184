import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Settings, 
  FileText,
  Phone,
  Eye,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ComprehensiveAgreementReviewProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onApprovalComplete?: () => void;
}

const SECTIONS = [
  {
    id: 'basic',
    title: 'Grunnleggende informasjon',
    icon: Eye,
  },
  {
    id: 'pricing',
    title: 'Publikum og prising',
    icon: DollarSign,
  }
];

export const ComprehensiveAgreementReview = ({
  booking,
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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

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
    
    const hasChanges = (userApproval && lastModified > userApproval) || 
                      (otherUserApproval && lastModified > otherUserApproval);
    
    setHasChangedSinceLastApproval(hasChanges);
  }, [booking, userApprovalTimestamp, otherUserApprovalTimestamp, isOpen]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSections(new Set());
      setCanProceed(false);
      setHasReadConfirmation(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (!canProceed && !hasReadConfirmation) return;

    // Mark current section as completed
    setCompletedSections(prev => new Set([...prev, currentSection.id]));
    
    if (isLastStep) {
      // All sections completed, can now approve
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
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        [userConfirmedField]: true,
      };

      if (hasChangedSinceLastApproval && booking[otherUserConfirmedField]) {
        updates[otherUserConfirmedField] = false;
        updates[otherUserApprovalTimestamp] = null;
        
        toast({
          title: "Motpartens godkjenning nullstilt",
          description: "På grunn av endringer må motparten godkjenne avtalen på nytt",
          variant: "default",
        });
      }

      await updateBooking(booking.id, updates);

      toast({
        title: "Avtale godkjent! ✅",
        description: hasChangedSinceLastApproval ? 
          "Du har godkjent den oppdaterte avtalen" : 
          "Du har godkjent avtalen",
      });

      onApprovalComplete?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Feil ved godkjenning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSectionContent = () => {
    const sectionId = currentSection.id;
    
    switch (sectionId) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-xl mb-2">{booking.title}</h3>
              {booking.description && (
                <p className="text-muted-foreground mb-4">{booking.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                    {booking.time && ` kl. ${booking.time}`}
                  </span>
                </div>
              )}
              
              {booking.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">{booking.venue}</span>
                </div>
              )}
            </div>

            {booking.personal_message && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Personlig melding</h4>
                <p className="text-sm">{booking.personal_message}</p>
              </div>
            )}

            {booking.sender_contact_info && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Kontaktinformasjon</h4>
                <div className="space-y-2">
                  {booking.sender_contact_info.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">E-post:</span>
                      <span className="text-sm">{booking.sender_contact_info.email}</span>
                    </div>
                  )}
                  {booking.sender_contact_info.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Telefon:</span>
                      <span className="text-sm">{booking.sender_contact_info.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                Dette er grunnleggende informasjon om arrangementet. Les gjennom alle detaljer nøye før du fortsetter.
              </p>
            </div>
          </div>
        );

      case 'pricing':
        const audienceEstimate = booking.audience_estimate || 0;
        const ticketPrice = booking.ticket_price || 0;
        const totalRevenue = audienceEstimate * ticketPrice;
        
        const showCalculations = !booking.by_agreement && audienceEstimate > 0 && ticketPrice > 0;
        
        let artistEarnings = 0;
        if (booking.door_deal && booking.door_percentage) {
          artistEarnings = Math.round(totalRevenue * (booking.door_percentage / 100));
        } else if (booking.artist_fee) {
          artistEarnings = booking.artist_fee;
        }

        return (
          <div className="space-y-4">
            {booking.audience_estimate && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Forventet publikum: <strong>{booking.audience_estimate}</strong></span>
              </div>
            )}

            {booking.ticket_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>Billettpris: <strong>{booking.ticket_price} kr</strong></span>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-lg mb-3">Artist honorar</h4>
              {booking.door_deal ? (
                <p className="text-lg">Spiller for døra: <strong>{booking.door_percentage || 'X'}%</strong> av total dørinntekt</p>
              ) : booking.by_agreement ? (
                <p className="text-lg">Honorar avtales direkte mellom partene</p>
              ) : (
                <p className="text-lg">Fast honorar: <strong>{booking.artist_fee || 'Ikke spesifisert'} kr</strong></p>
              )}
              
              {showCalculations && (
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                  {booking.door_deal ? (
                    <div className="space-y-2">
                      <p className="text-base">
                        Total inntekt: <strong>{totalRevenue.toLocaleString('nb-NO')} kr</strong>
                      </p>
                      <p className="text-base">
                        Artist får: <strong>{artistEarnings.toLocaleString('nb-NO')} kr</strong> ({booking.door_percentage}%)
                      </p>
                    </div>
                  ) : (
                    <p className="text-base">
                      Estimert total inntekt: <strong>{totalRevenue.toLocaleString('nb-NO')} kr</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                Økonomiske vilkår er bindende. Sørg for at du forstår og godtar alle priser og honorarordninger.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Ukjent seksjon</div>;
    }
  };

  if (!booking) return null;

  const Icon = currentSection.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Gjennomgå avtale før godkjenning</span>
            <span className="text-sm font-normal text-muted-foreground">
              Steg {currentStep + 1} av {SECTIONS.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicators */}
        <div className="flex items-center gap-2 mb-6">
          {SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                index < currentStep ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                index === currentStep ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <Check className="h-3 w-3" />
              ) : (
                <section.icon className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{section.title}</span>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {currentSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea 
              className="h-64 pr-4" 
              ref={scrollRef}
            >
              <div ref={contentRef}>
                {renderSectionContent()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadConfirmation}
                onChange={(e) => {
                  setHasReadConfirmation(e.target.checked);
                  setCanProceed(e.target.checked);
                }}
                className="rounded"
              />
              <span>Jeg har lest og forstått denne delen</span>
            </label>
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep(prev => prev - 1);
                  setCanProceed(false);
                  setHasReadConfirmation(false);
                }}
              >
                Tilbake
              </Button>
            )}
            
            {!isLastStep ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed}
                className="min-w-20"
              >
                Neste
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleApproval}
                disabled={!canProceed || !allSectionsCompleted || loading}
                className="min-w-32"
              >
                {loading ? "Godkjenner..." : "Godkjenn avtale"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};