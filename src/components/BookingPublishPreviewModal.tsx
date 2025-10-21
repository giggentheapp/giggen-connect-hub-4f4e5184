import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Check, Info, ArrowLeft, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/hooks/useBookings';
import { BookingPortfolioGallery } from '@/components/BookingPortfolioGallery';

interface BookingPublishPreviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingPublishPreviewModal = ({ 
  bookingId,
  isOpen, 
  onClose,
  currentUserId
}: BookingPublishPreviewModalProps) => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [portfolioAttachments, setPortfolioAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const { updateBooking } = useBookings();

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchFreshData();
    }
  }, [isOpen, bookingId]);

  const fetchFreshData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching fresh data for booking:', bookingId);

      // Fetch fresh booking data
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      
      console.log('📋 Booking data:', {
        id: bookingData.id,
        title: bookingData.title,
        status: bookingData.status,
        updated_at: bookingData.updated_at
      });
      
      setBooking(bookingData);

      // Fetch maker profile
      if (bookingData.receiver_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio')
          .eq('user_id', bookingData.receiver_id)
          .maybeSingle();
        
        if (profileData) {
          setMakerProfile(profileData);
        }
      }

      // Fetch ONLY portfolio attachments from booking_portfolio_attachments table
      // This ensures we only show files explicitly attached during negotiations
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          booking_id,
          portfolio_file_id,
          attached_by,
          created_at,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_type,
            file_url,
            mime_type,
            title,
            description,
            user_id
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (attachmentsError) {
        console.error('❌ Error fetching attachments:', attachmentsError);
      } else {
        console.log('📎 Portfolio attachments:', {
          count: attachmentsData?.length || 0,
          files: attachmentsData?.map(a => a.portfolio_file?.title || a.portfolio_file?.filename)
        });
        setPortfolioAttachments(attachmentsData || []);
      }

    } catch (error) {
      console.error('❌ Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handlePublishEvent = async () => {
    if (!booking) return;
    
    try {
      setIsPublishing(true);

      // Get current user's email to check whitelist
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;

      // Check if user is in admin whitelist
      let hasPaidTickets = false;
      if (userEmail) {
        const { data: whitelistData } = await supabase
          .from('admin_whitelist')
          .select('email')
          .eq('email', userEmail)
          .single();
        
        hasPaidTickets = !!whitelistData;
      }

      // Update booking status to published
      await updateBooking(booking.id, { status: 'upcoming' });

      // Create event in events_market with fresh booking data
      const eventDate = booking.event_date ? new Date(booking.event_date) : new Date();
      const eventData = {
        title: booking.title,
        description: booking.description,
        portfolio_id: booking.selected_concept_id,
        ticket_price: booking.ticket_price || null,
        venue: booking.venue,
        date: eventDate.toISOString().split('T')[0],
        time: booking.time || eventDate.toTimeString().split(' ')[0],
        event_datetime: eventDate.toISOString(),
        expected_audience: booking.audience_estimate || null,
        created_by: currentUserId,
        is_public: true,
        has_paid_tickets: hasPaidTickets
      };

      const { error: eventError } = await supabase
        .from("events_market")
        .insert([eventData]);

      if (eventError) {
        console.error('Error creating event in market:', eventError);
        toast({
          title: "Arrangement publisert",
          description: "Arrangementet er publisert, men kunne ikke legges til i markedet automatisk",
        });
      } else {
        toast({
          title: "Arrangement publisert! 🎉",
          description: "Arrangementet er nå synlig for alle i Goer-appen",
        });
      }

      navigate('/dashboard?section=bookings&tab=upcoming');
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Feil ved publisering",
        description: "Kunne ikke publisere arrangementet",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };


  if (!isOpen) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laster forhåndsvisning...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          
          <Button 
            onClick={handlePublishEvent}
            disabled={isPublishing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publiserer...' : 'Publiser arrangement'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Slik vises arrangementet til publikum når det publiseres
          </AlertDescription>
        </Alert>

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-bold flex-1">{booking.title}</h1>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white whitespace-nowrap">
              Arrangement
            </Badge>
          </div>

          {makerProfile?.display_name && (
            <p className="text-xl text-muted-foreground">
              med {makerProfile.display_name}
            </p>
          )}

          {booking.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {booking.description}
            </p>
          )}
        </div>

        {/* Event Information List */}
        <div className="space-y-4">
          {booking.ticket_price && (
            <div className="flex items-start gap-3">
              <Banknote className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Pris</p>
                <p className="text-muted-foreground">{booking.ticket_price} kr</p>
              </div>
            </div>
          )}

          {booking.event_date && (
            <div className="flex items-start gap-3">
              <Calendar className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Dato og tid</p>
                <p className="text-muted-foreground">
                  {format(new Date(booking.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                  {booking.time && ` kl. ${booking.time}`}
                </p>
              </div>
            </div>
          )}

          {(booking.venue || booking.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Sted</p>
                {booking.venue && <p className="text-muted-foreground">{booking.venue}</p>}
                {booking.address && <p className="text-sm text-muted-foreground">{booking.address}</p>}
              </div>
            </div>
          )}

          {booking.audience_estimate && (
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Forventet publikum</p>
                <p className="text-muted-foreground">{booking.audience_estimate} personer</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Attachments */}
        {portfolioAttachments.length > 0 && (
          <div className="space-y-4 pt-4">
            <BookingPortfolioGallery portfolioAttachments={portfolioAttachments} />
          </div>
        )}

        {/* Artist Bio */}
        {makerProfile?.bio && (
          <div className="pt-8 border-t border-border">
            <h2 className="text-2xl font-semibold mb-4">Om artisten</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {makerProfile.bio}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
