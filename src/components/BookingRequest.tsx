import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBookings } from '@/hooks/useBookings';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useToast } from '@/hooks/use-toast';
import { ContactInfoSharingDialog } from '@/components/ContactInfoSharingDialog';
import { Send } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';

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
  const [hasShownContactDialog, setHasShownContactDialog] = useState(false);

  const { createBooking } = useBookings();
  const { toast } = useToast();
  const { t } = useAppTranslation();

  // Get current user's concepts
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { concepts } = useUserConcepts(currentUserId);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalMessage.trim() || !selectedConcept) {
      toast({
        title: t('missingInformation'),
        description: t('personalMessageAndOfferRequired'),
        variant: "destructive",
      });
      return;
    }

    // Show contact info dialog only first time
    if (!hasShownContactDialog) {
      setShowContactDialog(true);
      return;
    }

    await submitBooking();
  };

  const submitBooking = async () => {
    setSubmitting(true);
    
    try {
      // Get current user's contact info to share
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('contact_info, display_name')
        .eq('user_id', user?.id)
        .single();

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
          .single();
        
        techSpecUrl = techSpecData?.file_url || null;
      }

      if (selectedConcept.hospitality_rider_reference) {
        const { data: hospitalityRiderData } = await supabase
          .from('hospitality_riders')
          .select('file_url')
          .eq('id', selectedConcept.hospitality_rider_reference)
          .single();
        
        hospitalityRiderUrl = hospitalityRiderData?.file_url || null;
      }

      const bookingData = {
        receiver_id: receiverId,
        concept_ids: [selectedConcept.id],
        selected_concept_id: selectedConcept.id,
        title: selectedConcept.title,
        description: selectedConcept.description || '',
        personal_message: personalMessage,
        price_musician: selectedConcept.price?.toString() || null,
        artist_fee: selectedConcept.door_deal ? null : (selectedConcept.price || null),
        door_deal: selectedConcept.door_deal || false,
        door_percentage: selectedConcept.door_percentage || null,
        event_date: null,
        time: "Ved avtale",
        venue: "Ved avtale",
        audience_estimate: selectedConcept.expected_audience || null,
        ticket_price: null,
        status: 'pending' as const,
        sender_contact_info: contactInfoToShare,
        tech_spec: techSpecUrl || "Ikke lagt ved dokument",
        hospitality_rider: hospitalityRiderUrl || "Ikke lagt ved dokument"
      };

      await createBooking(bookingData);

      // Reset form
      setSelectedConcept(null);
      setPersonalMessage('');
      setOpen(false);
      
      toast({
        title: t('requestSent'),
        description: t('bookingRequestSent'),
      });
      
      onSuccess?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactDialogConfirm = () => {
    setHasShownContactDialog(true);
    setShowContactDialog(false);
    submitBooking();
  };

  const handleContactDialogCancel = () => {
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
          {t('sendRequest')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto mobile-modal mobile-optimized">
        <div className="mobile-modal-content">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-base">{t('sendBookingRequest')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Concept Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('selectOffer')}
            </Label>
            {concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('mustCreateOffersFirst')}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {concepts.filter(concept => concept && concept.id).map((concept) => (
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
                          "mt-1 h-4 w-4 rounded border-2",
                          selectedConcept?.id === concept.id 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground"
                        )} />
                        <div className="flex-1">
                          <h4 className="font-medium">{concept.title || 'Untitled'}</h4>
                          {concept.description && (
                            <p className="text-sm text-muted-foreground mt-1">
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
                  className="min-h-[120px] text-base md:text-sm"
                  required
                />
              </div>

              {/* Next Steps Information */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t('whatHappensNext')}
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>• {t('receiverGetsNotification')}</p>
                  <p>• {t('canSeeOfferDetails')}</p>
                  <p>• {t('canAllowRequest')}</p>
                  <p>• {t('getContactAccess')}</p>
                  <p>• {t('negotiationsCanStart')}</p>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !selectedConcept || !personalMessage.trim()}
              className="min-h-[48px] touch-target"
            >
              {submitting ? t('sending') : t('sendRequest')}
            </Button>
          </div>
        </form>

        <ContactInfoSharingDialog
          isOpen={showContactDialog}
          onConfirm={handleContactDialogConfirm}
          onCancel={handleContactDialogCancel}
        />
        </div>
      </DialogContent>
    </Dialog>
  );
};