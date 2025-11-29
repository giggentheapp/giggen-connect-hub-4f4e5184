import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BookingEditModal } from '@/components/BookingEditModal';
import { useToast } from '@/hooks/use-toast';
import { getBookingNavigationTargetWithUser } from '@/lib/bookingNavigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useBooking } from '@/hooks/useBooking';

const BookingEdit = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: userLoading } = useCurrentUser();
  const { booking, loading: bookingLoading } = useBooking(bookingId);

  const loading = userLoading || bookingLoading;
  const currentUserId = user?.id || '';

  const handleSaved = () => {
    toast({
      title: 'Lagret',
      description: 'Endringene har blitt lagret',
    });
    if (booking) {
      const target = getBookingNavigationTargetWithUser(booking, currentUserId);
      navigate(target);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Booking ikke funnet</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                const target = getBookingNavigationTargetWithUser(booking, currentUserId);
                navigate(target);
              }}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-lg font-semibold">Rediger booking</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <BookingEditModal
            booking={booking}
            currentUserId={currentUserId}
            onSaved={handleSaved}
          />
        </div>
      </main>
    </div>
  );
};

export default BookingEdit;
