import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Settings, 
  FileText,
  Phone,
  AlertTriangle,
  Eye,
  Lock
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

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
  scrolledToBottom: boolean;
}

export const ComprehensiveAgreementReview = ({
  booking,
  isOpen,
  onClose,
  currentUserId,
  onApprovalComplete
}: ComprehensiveAgreementReviewProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set()); // Start with no sections expanded
  const [scrollTracking, setScrollTracking] = useState<Record<string, boolean>>({});
  const [sectionsCompleted, setSectionsCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [hasChangedSinceLastApproval, setHasChangedSinceLastApproval] = useState(false);
  
  const scrollRefs = useRef<Record<string, HTMLDivElement>>({});
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';
  const userApprovalTimestamp = isSender ? 'sender_approved_at' : 'receiver_approved_at';
  const otherUserApprovalTimestamp = isSender ? 'receiver_approved_at' : 'sender_approved_at';

  // Debug component opening
  useEffect(() => {
    if (isOpen && booking) {
      console.log('🔍 ComprehensiveAgreementReview opened for booking:', booking.id);
      console.log('📊 Initial state:', {
        expandedSections: Array.from(expandedSections),
        scrollTracking,
        sectionsCompleted,
        allSectionsCompleted
      });
    }
  }, [isOpen, booking]);
  useEffect(() => {
    if (!booking || !isOpen) return;

    const lastModified = new Date(booking.last_modified_at);
    const userApproval = booking[userApprovalTimestamp] ? new Date(booking[userApprovalTimestamp]) : null;
    const otherUserApproval = booking[otherUserApprovalTimestamp] ? new Date(booking[otherUserApprovalTimestamp]) : null;
    
    // Check if there were changes since any approval
    const hasChanges = (userApproval && lastModified > userApproval) || 
                      (otherUserApproval && lastModified > otherUserApproval);
    
    setHasChangedSinceLastApproval(hasChanges);
  }, [booking, userApprovalTimestamp, otherUserApprovalTimestamp, isOpen]);

  const sections: Section[] = [
    {
      id: 'basic',
      title: 'Grunnleggende informasjon',
      icon: <Eye className="h-5 w-5" />,
      required: true,
      completed: sectionsCompleted.basic || false,
      scrolledToBottom: scrollTracking.basic || false
    },
    {
      id: 'pricing',
      title: 'Publikum og prising',
      icon: <DollarSign className="h-5 w-5" />,
      required: true,
      completed: sectionsCompleted.pricing || false,
      scrolledToBottom: scrollTracking.pricing || false
    },
    {
      id: 'technical',
      title: 'Tekniske spesifikasjoner',
      icon: <Settings className="h-5 w-5" />,
      required: true,
      completed: sectionsCompleted.technical || false,
      scrolledToBottom: scrollTracking.technical || false
    },
    {
      id: 'hospitality',
      title: 'Hospitality og rider',
      icon: <FileText className="h-5 w-5" />,
      required: true,
      completed: sectionsCompleted.hospitality || false,
      scrolledToBottom: scrollTracking.hospitality || false
    },
    {
      id: 'contact',
      title: 'Kontaktinformasjon',
      icon: <Phone className="h-5 w-5" />,
      required: true,
      completed: sectionsCompleted.contact || false,
      scrolledToBottom: scrollTracking.contact || false
    }
  ];

  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.length;
  const allSectionsCompleted = completedSections === totalSections;

  // Handle scroll tracking for each section
  const handleScroll = (sectionId: string) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
      
      console.log(`🔍 Scroll tracking for ${sectionId}:`, {
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtBottom,
        alreadyTracked: scrollTracking[sectionId]
      });
      
      if (isAtBottom && !scrollTracking[sectionId]) {
        console.log(`✅ Section ${sectionId} completed by scrolling!`);
        setScrollTracking(prev => ({ ...prev, [sectionId]: true }));
        
        // Mark section as completed when scrolled to bottom
        if (!sectionsCompleted[sectionId]) {
          setSectionsCompleted(prev => ({ ...prev, [sectionId]: true }));
        }
      }
    };
  };

  const toggleSection = (sectionId: string) => {
    console.log(`🔄 Toggling section ${sectionId}. Currently expanded:`, Array.from(expandedSections));
    
    if (expandedSections.has(sectionId)) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    } else {
      setExpandedSections(prev => new Set([...prev, sectionId]));
    }
  };

  const handleApproval = async () => {
    console.log('🚀 Attempting approval...', {
      allSectionsCompleted,
      completedSections,
      totalSections,
      sectionsCompleted,
      scrollTracking
    });
    
    if (!allSectionsCompleted) {
      toast({
        title: "Gjennomgå alle seksjoner",
        description: "Du må scrolle gjennom alle seksjoner før du kan godkjenne avtalen",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        [userConfirmedField]: true,
      };

      // If there were changes, reset the other user's approval
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

      // Call the completion callback if provided
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

  if (!booking) return null;

  const userAlreadyConfirmed = booking[userConfirmedField];
  const otherUserConfirmed = booking[otherUserConfirmedField];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="space-y-3">
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Godkjenn booking - {booking.title}
            </DialogTitle>
            
            {hasChangedSinceLastApproval && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Avtalen har blitt endret siden siste godkjenning. Vennligst gjennomgå alle endringene nøye.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Obligatorisk gjennomgang:</strong> Du må åpne og scrolle til bunns av alle 5 seksjoner nedenfor før du kan godkjenne avtalen. Dette sikrer at du har lest og forstått alle vilkår.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Fremgang: {completedSections}/{totalSections} seksjoner gjennomgått</span>
                <span className={cn(
                  "font-medium",
                  allSectionsCompleted ? "text-green-600" : "text-orange-600"
                )}>
                  {Math.round((completedSections / totalSections) * 100)}%
                </span>
              </div>
              <Progress value={(completedSections / totalSections) * 100} className="h-2" />
              
              {/* Debug info */}
              <div className="text-xs text-muted-foreground border p-2 rounded">
                <div>Completed: {completedSections}/{totalSections}</div>
                <div>Scroll tracking: {JSON.stringify(scrollTracking)}</div>
                <div>Sections completed: {JSON.stringify(sectionsCompleted)}</div>
                <div>All completed: {allSectionsCompleted ? 'YES' : 'NO'}</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Section Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avtaleoversikt - Alle seksjoner må gjennomgås</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sections.map((section) => (
                    <div 
                      key={section.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                        expandedSections.has(section.id) ? "bg-primary/10" : "hover:bg-muted/50",
                        section.completed && "text-green-600"
                      )}
                      onClick={() => toggleSection(section.id)}
                    >
                      {section.icon}
                      <span className="flex-1 text-sm">{section.title}</span>
                      {section.completed ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        expandedSections.has(section.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Section 1: Basic Information */}
            <Collapsible open={expandedSections.has('basic')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Grunnleggende informasjon
                      {sectionsCompleted.basic && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea 
                      className="h-48 border"
                      onScroll={handleScroll('basic')}
                    >
                      <div className="space-y-4" ref={(el) => { if (el) scrollRefs.current.basic = el; }}>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{booking.title}</h3>
                          {booking.description && (
                            <p className="text-muted-foreground mb-4">{booking.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {booking.event_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
                              {booking.time && <span>kl. {booking.time}</span>}
                            </div>
                          )}
                          
                          {booking.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{booking.venue}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-muted p-4 rounded mt-4">
                          <p className="text-sm text-muted-foreground">
                            Scroll ned for å bekrefte at du har lest all grunnleggende informasjon om arrangementet.
                            Dette inkluderer tittel, beskrivelse, dato, tid og spillested.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 2: Pricing */}
            <Collapsible open={expandedSections.has('pricing')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Publikum og prising
                      {sectionsCompleted.pricing && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea 
                      className="h-48 border"
                      onScroll={handleScroll('pricing')}
                    >
                      <div className="space-y-4" ref={(el) => { if (el) scrollRefs.current.pricing = el; }}>
                        {booking.audience_estimate && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>Forventet publikum: {booking.audience_estimate}</span>
                          </div>
                        )}

                        {booking.ticket_price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span>Billettpris: {booking.ticket_price} kr</span>
                          </div>
                        )}

                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                          <h4 className="font-medium mb-2">Artist honorar</h4>
                          {booking.door_deal ? (
                            <p>Spiller for døra: {booking.door_percentage || 'X'}% av total dørinntekt</p>
                          ) : booking.by_agreement ? (
                            <p>Honorar avtales direkte mellom partene</p>
                          ) : (
                            <p>Fast honorar: {booking.artist_fee || 'Ikke spesifisert'} kr</p>
                          )}
                        </div>

                        <div className="bg-muted p-4 rounded mt-4">
                          <p className="text-sm text-muted-foreground">
                            Scroll ned for å bekrefte at du har lest og forstått alle økonomiske vilkår.
                            Dette inkluderer billetpriser, publikumsestimat og artist honorar.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 3: Technical Specs */}
            <Collapsible open={expandedSections.has('technical')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Tekniske spesifikasjoner
                      {sectionsCompleted.technical && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea 
                      className="h-48 border"
                      onScroll={handleScroll('technical')}
                    >
                      <div className="space-y-4" ref={(el) => { if (el) scrollRefs.current.technical = el; }}>
                        {booking.tech_spec ? (
                          <div>
                            <p className="mb-2">Tech spec dokument:</p>
                            <a 
                              href={booking.tech_spec} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Åpne tekniske spesifikasjoner
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Ingen tekniske spesifikasjoner oppgitt</p>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                          <h4 className="font-medium mb-2">Tekniske krav</h4>
                          <p className="text-sm">
                            Gjennomgå alle tekniske spesifikasjoner nøye. Dette inkluderer lydutstyr, 
                            sceneoppsett, strømforsyning og andre tekniske behov for arrangementet.
                          </p>
                        </div>

                        <div className="bg-muted p-4 rounded mt-4">
                          <p className="text-sm text-muted-foreground">
                            Scroll ned for å bekrefte at du har gjennomgått alle tekniske krav og 
                            forstår hva som kreves for en vellykket gjennomføring.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 4: Hospitality */}
            <Collapsible open={expandedSections.has('hospitality')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Hospitality og rider
                      {sectionsCompleted.hospitality && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea 
                      className="h-48 border"
                      onScroll={handleScroll('hospitality')}
                    >
                      <div className="space-y-4" ref={(el) => { if (el) scrollRefs.current.hospitality = el; }}>
                        {booking.hospitality_rider ? (
                          <div>
                            <p className="mb-2">Hospitality rider dokument:</p>
                            <a 
                              href={booking.hospitality_rider} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Åpne hospitality rider
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Ingen hospitality rider oppgitt</p>
                        )}

                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200 dark:border-green-800">
                          <h4 className="font-medium mb-2">Hospitality forventninger</h4>
                          <p className="text-sm">
                            Hospitality rider inneholder krav til mat, drikke, overnatting og andre 
                            behov artistene har i forbindelse med arrangementet.
                          </p>
                        </div>

                        <div className="bg-muted p-4 rounded mt-4">
                          <p className="text-sm text-muted-foreground">
                            Scroll ned for å bekrefte at du har lest alle hospitality-krav og 
                            forstår hva som må leveres i forbindelse med arrangementet.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Section 5: Contact Information */}
            <Collapsible open={expandedSections.has('contact')}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Kontaktinformasjon
                      {sectionsCompleted.contact && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea 
                      className="h-48 border"
                      onScroll={handleScroll('contact')}
                    >
                      <div className="space-y-4" ref={(el) => { if (el) scrollRefs.current.contact = el; }}>
                        {booking.sender_contact_info && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Kontaktinformasjon (Privat)
                            </h4>
                            <div className="space-y-1 text-sm">
                              {booking.sender_contact_info.email && (
                                <p>E-post: {booking.sender_contact_info.email}</p>
                              )}
                              {booking.sender_contact_info.phone && (
                                <p>Telefon: {booking.sender_contact_info.phone}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.personal_message && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded border border-amber-200 dark:border-amber-800">
                            <h4 className="font-medium mb-2">Personlig melding</h4>
                            <p className="text-sm">{booking.personal_message}</p>
                          </div>
                        )}

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Kontaktinformasjon er privat og deles kun mellom partene i avtalen.
                            Denne informasjonen vil aldri være synlig for andre brukere.
                          </AlertDescription>
                        </Alert>

                        <div className="bg-muted p-4 rounded mt-4">
                          <p className="text-sm text-muted-foreground">
                            Scroll ned for å bekrefte at du har lest all kontaktinformasjon og 
                            personlige meldinger relatert til avtalen.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {!userAlreadyConfirmed ? (
            <>
              <div className="flex-1 text-sm text-muted-foreground">
                {!allSectionsCompleted && 
                  "Gjennomgå alle seksjoner for å aktivere godkjenning"
                }
                {allSectionsCompleted && 
                  "Alle seksjoner gjennomgått - klar for godkjenning"
                }
              </div>
              
              <Button 
                onClick={handleApproval}
                disabled={!allSectionsCompleted || loading}
                className={cn(
                  "ml-auto",
                  !allSectionsCompleted && "cursor-not-allowed opacity-50"
                )}
              >
                <Check className="h-4 w-4 mr-2" />
                {loading ? 'Godkjenner...' : `Godkjenn avtale (${completedSections}/${totalSections})`}
              </Button>
            </>
          ) : (
            <Badge variant="default" className="ml-auto bg-green-600">
              Du har godkjent avtalen
              {!otherUserConfirmed && " - venter på motpart"}
            </Badge>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};