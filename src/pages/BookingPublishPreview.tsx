import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookingPublishPreviewModal } from '@/components/BookingPublishPreviewModal';

const BookingPublishPreview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        toast({
          title: 'Ikke autentisert',
          description: 'Du må være logget inn',
          variant: 'destructive'
        });
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke laste brukerdata',
        variant: 'destructive'
      });
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/dashboard?section=bookings&tab=ongoing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bookingId || !currentUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Ugyldig booking eller bruker</p>
      </div>
    );
  }

  return (
    <BookingPublishPreviewModal
      bookingId={bookingId}
      isOpen={true}
      onClose={handleClose}
      currentUserId={currentUserId}
    />
  );
};

export default BookingPublishPreview;
