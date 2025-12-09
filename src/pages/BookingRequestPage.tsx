import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, User, MapPin, Settings, Briefcase, FileText, Lightbulb } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { navigateBack, navigateToAuth, navigateToProfile, getProfileUrl } from '@/lib/navigation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreateBooking } from '@/hooks/useBookingMutations';
import giggenLogo from '@/assets/giggen-logo.png';
import { cn } from '@/lib/utils';

const BookingRequestPage = () => {
  const { makerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppTranslation();
  const isMobile = useIsMobile();
  
  const { user, loading: userLoading } = useCurrentUser();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigateToAuth(navigate, true, 'User not logged in - redirecting from booking request');
    }
  }, [user, userLoading, navigate]);
  const createBookingMutation = useCreateBooking();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    personal_message: ''
  });

  const getNavigationItems = () => {
    if (!user) return [];
    return [
      { id: 'profile', label: t('profile'), icon: User, path: getProfileUrl(user.id, 'profile') },
      { id: 'explore', label: t('explore'), icon: MapPin, path: getProfileUrl(user.id, 'explore') },
      { id: 'admin-files', label: 'Filer', icon: FileText, path: getProfileUrl(user.id, 'admin-files') },
      { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: getProfileUrl(user.id, 'admin-concepts') },
      { id: 'bookings', label: t('bookings'), icon: Briefcase, path: getProfileUrl(user.id, 'bookings') },
      { id: 'settings', label: t('settings'), icon: Settings, path: getProfileUrl(user.id, 'settings') }
    ];
  };

  const navItems = getNavigationItems();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !makerId) {
      setError('Missing user or maker information');
      return;
    }

    try {
      // Combine date and time if both are provided
      let eventDate = null;
      if (formData.date) {
        eventDate = formData.time 
          ? new Date(`${formData.date}T${formData.time}:00`).toISOString()
          : new Date(`${formData.date}T00:00:00`).toISOString();
      }

      await createBookingMutation.mutateAsync({
        senderId: user.id,
        receiverId: makerId,
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        eventDate: eventDate,
        time: formData.time,
        personalMessage: formData.personal_message,
        conceptIds: [],
        selectedConceptId: null,
        contactInfo: {},
      });

      // Navigate back to bookings
      if (user) {
        navigateToProfile(navigate, user.id, 'bookings', false);
      }
      
    } catch (err) {
      console.error('Booking request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send booking request';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={giggenLogo} alt="Giggen Logo" className="h-8" />
              {!isMobile && <span className="text-xl font-semibold">Giggen</span>}
            </div>
            
            {!isMobile && (
              <nav className="flex items-center gap-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex items-center gap-2",
                        item.id === 'bookings' && "bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            )}
            
            <Button 
              onClick={() => user ? navigateToProfile(navigate, user.id, 'dashboard', false) : navigateToAuth(navigate, false)} 
              variant="outline" 
              size="sm"
            >
              Gå til dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigateBack(navigate, location, user ? `/profile/${user.id}?section=dashboard` : '/auth')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Send bookingforespørsel</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="venue">Spillested</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Dato</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Tid</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="personal_message">Personlig melding</Label>
                <Textarea
                  id="personal_message"
                  value={formData.personal_message}
                  onChange={(e) => handleChange('personal_message', e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? (
                  <>Sender...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send forespørsel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingRequestPage;
