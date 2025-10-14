import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, User, MapPin, Settings, Briefcase, FileText, Lightbulb } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import { cn } from '@/lib/utils';

const BookingRequestPage = () => {
  const { makerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppTranslation();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    personal_message: ''
  });

  const getNavigationItems = () => {
    return [
      { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
      { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
      { id: 'admin-files', label: 'Filer', icon: FileText, path: '/dashboard?section=admin-files' },
      { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: '/dashboard?section=admin-concepts' },
      { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/dashboard?section=bookings' },
      { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
    ];
  };

  const navItems = getNavigationItems();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Combine date and time if both are provided
      let eventDate = null;
      if (formData.date) {
        eventDate = formData.time 
          ? new Date(`${formData.date}T${formData.time}:00`).toISOString()
          : new Date(`${formData.date}T00:00:00`).toISOString();
      }

      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          title: formData.title,
          description: formData.description,
          venue: formData.venue,
          event_date: eventDate,
          time: formData.time,
          personal_message: formData.personal_message,
          sender_id: user.id,
          receiver_id: makerId,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: 'Booking request sent',
        description: 'Your booking request has been sent successfully.',
      });

      // Navigate back to bookings
      navigate('/bookings');
      
    } catch (err) {
      console.error('Booking request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send booking request';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed top-0 left-0 z-50 h-full">
          <div className="h-full w-16 bg-card border-r border-border shadow-lg overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-center">
                <img 
                  src={giggenLogo} 
                  alt="GIGGEN Logo" 
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => navigate(item.path)} 
                      className={cn(
                        'w-full flex items-center justify-center p-3 rounded-lg transition-colors',
                        'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                      )}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1", !isMobile ? 'ml-16' : '', isMobile ? 'pb-20' : 'pb-6')}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard?section=explore')}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Send Booking Request</h1>
                <p className="text-muted-foreground">Create a new booking request for this artist</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Concert at..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description *</Label>
                    <Textarea
                      id="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the event, audience, atmosphere, etc..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({...formData, venue: e.target.value})}
                      placeholder="Event location"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Event Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time">Event Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal_message">Personal Message</Label>
                    <Textarea
                      id="personal_message"
                      rows={3}
                      value={formData.personal_message}
                      onChange={(e) => setFormData({...formData, personal_message: e.target.value})}
                      placeholder="Add a personal message to the artist..."
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard?section=explore')}
                      className="flex-1 sm:flex-none sm:min-w-[120px]"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={loading || !formData.title || !formData.description}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button 
                  key={item.id} 
                  onClick={() => navigate(item.path)} 
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                    'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default BookingRequestPage;