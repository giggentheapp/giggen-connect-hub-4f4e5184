import { useParams, useNavigate } from 'react-router-dom';
import { BookingPublishPreviewModal } from '@/components/BookingPublishPreviewModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const BookingPublishPreview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const { user, loading } = useCurrentUser();
  const currentUserId = user?.id || '';

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
