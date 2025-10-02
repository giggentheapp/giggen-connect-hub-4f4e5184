import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, Calendar, MapPin, Banknote, Users, Eye, ChevronRight, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BookingPortfolioAttachments } from '@/components/BookingPortfolioAttachments';

const SECTIONS = [
  {
    id: 'basic',
    title: 'Grunnleggende informasjon',
    icon: Eye
  },
  {
    id: 'pricing',
    title: 'Publikum og prising',
    icon: Banknote
  }
];

const BookingAgreementReview = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [canProceed, setCanProceed] = useState(false);
  const [hasReadConfirmation, setHasReadConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChangedSinceLastApproval, setHasChangedSinceLastApproval] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) return;
      
      setFetchingFreshData(true);
      try {
        console.log('🔄 Fetching fresh booking data for approval...');
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: 'Ikke funnet',
            description: 'Fant ikke bookingen',
            variant: 'destructive'
          });
          navigate('/dashboard?section=bookings');
          return;
        }

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
          title: "Feil ved lasting",
          description: "Kunne ikke laste bookingdata",
          variant: "destructive"
        });
        navigate('/dashboard?section=bookings');
      } finally {
        setFetchingFreshData(false);
      }
    };

    fetchBookingData();
  }, [bookingId, toast, navigate]);

  const isSender = currentUserId === booking?.sender_id;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';
  const userApprovalTimestamp = isSender ? 'sender_approved_at' : 'receiver_approved_at';
  const otherUserApprovalTimestamp = isSender ? 'receiver_approved_at' : 'sender_approved_at';

  const currentSection = SECTIONS[currentStep];
  const isLastStep = currentStep === SECTIONS.length - 1;
  const allSectionsCompleted = completedSections.size === SECTIONS.length;

  useEffect(() => {
    if (!booking) return;

    const lastModified = new Date(booking.last_modified_at);
    const userApproval = booking[userApprovalTimestamp] ? new Date(booking[userApprovalTimestamp]) : null;
    const otherUserApproval = booking[otherUserApprovalTimestamp] ? new Date(booking[otherUserApprovalTimestamp]) : null;

    const hasChanges = (userApproval && lastModified > userApproval) || 
                       (otherUserApproval && lastModified > otherUserApproval);
    
    setHasChangedSinceLastApproval(hasChanges);
  }, [booking, userApprovalTimestamp, otherUserApprovalTimestamp]);

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
        description: hasChangedSinceLastApproval 
          ? "Du har godkjent den oppdaterte avtalen" 
          : "Du har godkjent avtalen"
      });

      navigate('/bookings');
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
    if (!booking) return null;

    const sectionId = currentSection.id;

    switch (sectionId) {
      case 'basic':
        return (
          <div className="space-y-4">
            {/* Prominent Date/Time Section */}
            {(booking.event_date || booking.time) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Dato og tid for arrangementet
                </h4>
                <div className="text-2xl font-bold text-primary">
                  {booking.event_date && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span>
                        {format(new Date(booking.event_date), 'EEEE dd. MMMM yyyy', { locale: nb })}
                      </span>
                      {booking.time && (
                        <>
                          <Clock className="h-5 w-5 mx-2 hidden sm:block" />
                          <span>kl. {booking.time}</span>
                        </>
                      )}
                    </div>
                  )}
                  {!booking.event_date && booking.time && (
                    <span>Kl. {booking.time}</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-xl mb-2">{booking.title}</h3>
              {booking.description && (
                <p className="text-muted-foreground mb-4">{booking.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        );

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

        return (
          <div className="space-y-4">
            {/* Revenue Calculation - Always show if we have data */}
            {hasRevenueData && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <h4 className="font-semibold text-lg mb-3">Forventet inntekt</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Basert på forventet publikum × billettpris
                </p>
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
                      <span className="text-xl font-bold text-primary">
                        {totalRevenue.toLocaleString('no-NO')} kr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {booking.audience_estimate && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Forventet publikum: <strong>{booking.audience_estimate}</strong></span>
              </div>
            )}

            {booking.ticket_price && (
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                <span>Billettpris: <strong>{booking.ticket_price} kr</strong></span>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-lg mb-3">Artist honorar</h4>
              {booking.door_deal ? (
                <>
                  <p className="text-lg mb-2">
                    Spiller for døra: <strong>{booking.door_percentage || 'X'}%</strong> av total dørinntekt
                  </p>
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
                </>
              ) : booking.by_agreement ? (
                <>
                  <p className="text-lg">Honorar avtales direkte mellom partene</p>
                </>
              ) : (
                <>
                  <p className="text-lg mb-2">
                    Fast honorar: <strong>{booking.artist_fee || 'Ikke spesifisert'} kr</strong>
                  </p>
                </>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                Sørg for at du forstår og godtar alle priser og honorarordninger.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Ukjent seksjon</div>;
    }
  };

  if (!booking || !currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  const Icon = currentSection.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bookings')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
            {fetchingFreshData && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Oppdaterer...</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">Gjennomgå avtale før godkjenning</h1>
          <p className="text-sm text-muted-foreground">
            Steg {currentStep + 1} av {SECTIONS.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Progress indicators */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {SECTIONS.map((section, index) => (
              <div
                key={section.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                  index < currentStep
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
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

          {/* Section Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary" />
              {currentSection.title}
            </h2>
          </div>

          {/* Section Content - Full width, no card */}
          <div className="pb-8">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-6 py-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReadConfirmation}
                  onChange={(e) => {
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
                  }}
                  className="rounded"
                />
                <span>Jeg har lest og forstått denne delen</span>
              </label>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(prev => prev - 1);
                    setCanProceed(false);
                    setHasReadConfirmation(false);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Tilbake
                </Button>
              )}
              
              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="min-w-20 flex-1 sm:flex-none"
                >
                  Neste
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    console.log('🚀 Approval button clicked:', {
                      canProceed,
                      allSectionsCompleted,
                      loading,
                      completedSections: Array.from(completedSections),
                      sectionsLength: SECTIONS.length
                    });
                    handleApproval();
                  }}
                  disabled={!canProceed || !allSectionsCompleted || loading}
                  className="min-w-32 flex-1 sm:flex-none"
                >
                  {loading ? "Godkjenner..." : "Godkjenn avtale"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAgreementReview;
