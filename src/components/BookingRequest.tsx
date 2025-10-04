import { useState, useEffect, useRef } from 'react';
import { CreateBookingRequest, ContactInfo } from '@/types/booking';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useBookings } from '@/hooks/useBookings';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useToast } from '@/hooks/use-toast';
import { ContactInfoSharingDialog } from '@/components/ContactInfoSharingDialog';
import { Send } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface BookingRequestProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
}

export const BookingRequest = ({ receiverId, receiverName, onSuccess }: BookingRequestProps) => {
  const [open, setOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [personalMessage, setPersonalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const { createBooking } = useBookings();
  const { toast } = useToast();
  const { t } = useAppTranslation();
  
  // Safeguards
  const isSubmittingRef = useRef(false);
  const submissionTimeoutRef = useRef<NodeJS.Timeout>();
  const renderCountRef = useRef(0);

  // Get current user's concepts
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { concepts } = useUserConcepts(currentUserId);
  
  useEffect(() => {
    renderCountRef.current += 1;
    logger.debug(`BookingRequest render #${renderCountRef.current}`, { open, showContactDialog, submitting });
    
    if (renderCountRef.current > 10) {
      logger.warn('⚠️ Too many renders in BookingRequest');
    }
  }, [open, showContactDialog, submitting]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmittingRef.current) {
      logger.warn('Submission already in progress, ignoring duplicate request');
      return;
    }
    
    logger.info('BookingRequest handleSubmit called', { 
      hasMessage: !!personalMessage.trim(), 
      hasConcept: !!selectedConcept,
      receiverId,
      receiverName 
    });
    
    // Validate inputs
    if (!personalMessage.trim()) {
      logger.warn('Missing personal message');
      toast({
        title: t('missingInformation'),
        description: 'Vennligst skriv en personlig melding',
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedConcept) {
      logger.warn('No concept selected');
      toast({
        title: t('missingInformation'),
        description: 'Vennligst velg et tilbud',
        variant: "destructive",
      });
      return;
    }

    logger.info('✅ Validation passed - proceeding to submitBooking');
    await submitBooking();
  };

  const submitBooking = async () => {
    // Double-check safeguard
    if (isSubmittingRef.current) {
      logger.warn('submitBooking called but already in progress');
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    // Set timeout protection (30 seconds)
    submissionTimeoutRef.current = setTimeout(() => {
      if (isSubmittingRef.current) {
        logger.error('Submission timeout reached');
        isSubmittingRef.current = false;
        setSubmitting(false);
        toast({
          title: 'Timeout',
          description: 'Forespørselen tok for lang tid. Vennligst prøv igjen.',
          variant: 'destructive',
        });
      }
    }, 30000);
    
    try {
      logger.info('submitBooking started', { receiverId, selectedConcept: selectedConcept?.id });
      
      // Get current user's contact info to share
      const { data: { user } } = await supabase.auth.getUser();
      logger.debug('Current user fetched', { userId: user?.id });
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('contact_info, display_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      logger.debug('Profile fetched', { hasProfile: !!profile });

      const contactInfoToShare = profile?.contact_info || {
        name: profile?.display_name,
        email: user?.email
      };

      // Fetch tech spec and hospitality rider documents from concept
      let techSpecUrl = null;
      let hospitalityRiderUrl = null;

      if (selectedConcept.tech_spec_reference) {
        const { data: techSpecData } = await supabase
          .from('profile_tech_specs')
          .select('file_url')
          .eq('id', selectedConcept.tech_spec_reference)
          .maybeSingle();
        
        techSpecUrl = techSpecData?.file_url || null;
      }

      if (selectedConcept.hospitality_rider_reference) {
        const { data: hospitalityRiderData } = await supabase
          .from('hospitality_riders')
          .select('file_url')
          .eq('id', selectedConcept.hospitality_rider_reference)
          .maybeSingle();
        
        hospitalityRiderUrl = hospitalityRiderData?.file_url || null;
      }

      const bookingData: CreateBookingRequest = {
        receiverId: receiverId,
        conceptIds: [selectedConcept.id],
        selectedConceptId: selectedConcept.id,
        title: selectedConcept.title,
        description: selectedConcept.description || '',
        personalMessage: personalMessage,
        contactInfo: contactInfoToShare as ContactInfo,
      };

      logger.debug('Booking data prepared', { bookingDataKeys: Object.keys(bookingData) });
      logger.info('Calling createBooking...');
      
      await createBooking(bookingData);

      logger.info('✅ Booking created successfully');

      // Clear timeout
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }

      // Reset form
      setSelectedConcept(null);
      setPersonalMessage('');
      setOpen(false);
      
      // Show success toast
      toast({
        title: t('requestSent'),
        description: t('bookingRequestSent'),
      });
      
      // Show contact info dialog as confirmation
      logger.info('Showing contact dialog after successful booking');
      setShowContactDialog(true);
      
      onSuccess?.();
    } catch (error) {
      logger.error('Error in submitBooking', error);
      
      // Clear timeout
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
      
      toast({
        title: 'Feil',
        description: error instanceof Error ? error.message : 'En ukjent feil oppstod',
        variant: 'destructive',
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleContactDialogClose = () => {
    logger.info('Contact dialog closed');
    setShowContactDialog(false);
  };

  const selectConcept = (concept: any) => {
    setSelectedConcept(concept);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          {t('bookNow')}
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none m-0 rounded-none border-0 sm:relative sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border flex flex-col p-0 overflow-y-auto">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl">{t('sendBookingRequest')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('selectOfferAndSendMessage')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
            {/* Concept Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t('selectOffer')}
              </Label>
              {concepts.filter(c => c.is_published).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('mustCreateOffersFirst')}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {concepts.filter(concept => concept && concept.id && concept.is_published).map((concept) => (
                    <Card 
                      key={concept.id} 
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedConcept?.id === concept.id 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-muted-foreground"
                      )}
                      onClick={() => selectConcept(concept)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-1 h-4 w-4 rounded border-2 shrink-0",
                            selectedConcept?.id === concept.id 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{concept.title || 'Untitled'}</h4>
                            {concept.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                {concept.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {selectedConcept && (
              <>
                {/* Selected Concept Info */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">{t('selectedOffer')}</Label>
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <h4 className="font-medium">{selectedConcept.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedConcept.description || t('noDescription')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Message */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="message" className="text-base font-medium">
                      {t('personalMessage')} *
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('personalMessageNote')}
                    </p>
                  </div>
                  <Textarea
                    id="message"
                    placeholder={t('personalMessagePlaceholder')}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="min-h-[120px] text-base resize-none"
                    required
                  />
                </div>

                {/* Next Steps Information */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {t('whatHappensNext')}
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• {t('receiverGetsNotification')}</p>
                    <p>• {t('canSeeOfferDetails')}</p>
                    <p>• {t('canAllowRequest')}</p>
                    <p>• {t('getContactAccess')}</p>
                    <p>• {t('negotiationsCanStart')}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit Button - Always visible at bottom */}
          <div className="border-t px-4 sm:px-6 py-3 sm:py-4 bg-background shrink-0 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="min-h-[44px]"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !selectedConcept || !personalMessage.trim()}
              className="min-h-[44px]"
            >
              {submitting ? t('sending') : t('sendRequest')}
            </Button>
          </div>
        </form>
      </DialogContent>

      <ContactInfoSharingDialog
        isOpen={showContactDialog}
        onConfirm={handleContactDialogClose}
        onCancel={handleContactDialogClose}
      />
    </Dialog>
  );
};