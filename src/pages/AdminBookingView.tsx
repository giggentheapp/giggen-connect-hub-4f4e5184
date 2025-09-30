import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, FileText, Phone, Mail } from 'lucide-react';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { format } from 'date-fns';

const AdminBookingView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Ikke autentisert',
          description: 'Du må være logget inn for å se dette arrangementet',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);

      // Fetch full booking details - only accessible to sender or receiver
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (bookingError) throw bookingError;

      // Verify user is part of this booking
      if (bookingData.sender_id !== user.id && bookingData.receiver_id !== user.id) {
        toast({
          title: 'Ingen tilgang',
          description: 'Du har ikke tilgang til dette arrangementet',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setBooking(bookingData);

      // Fetch both profiles
      const { data: sender } = await supabase.rpc('get_secure_profile_data', {
        target_user_id: bookingData.sender_id,
      });

      const { data: receiver } = await supabase.rpc('get_secure_profile_data', {
        target_user_id: bookingData.receiver_id,
      });

      if (sender && sender.length > 0) setSenderProfile(sender[0]);
      if (receiver && receiver.length > 0) setReceiverProfile(receiver[0]);

    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke laste arrangement',
        variant: 'destructive',
      });
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Laster arrangement...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Arrangement ikke funnet</p>
          <Button onClick={() => navigate('/bookings')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til bookinger
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === booking.sender_id || currentUserId === booking.receiver_id;
  const isSender = currentUserId === booking.sender_id;
  const otherParty = isSender ? receiverProfile : senderProfile;
  const makerProfile = receiverProfile?.role === 'maker' ? receiverProfile : senderProfile;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'allowed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved_by_sender':
      case 'approved_by_receiver':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'approved_by_both': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'upcoming': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/bookings')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status === 'upcoming' ? 'Publisert' : booking.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Title and Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{booking.title}</CardTitle>
          </CardHeader>
          {booking.description && (
            <CardContent>
              <p className="text-muted-foreground">{booking.description}</p>
            </CardContent>
          )}
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Arrangementdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Dato</p>
                  <p className="text-muted-foreground">
                    {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                  </p>
                </div>
              </div>
            )}

            {booking.time && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Tid</p>
                  <p className="text-muted-foreground">{booking.time}</p>
                </div>
              </div>
            )}

            {booking.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-muted-foreground">{booking.venue}</p>
                  {booking.address && (
                    <p className="text-sm text-muted-foreground mt-1">{booking.address}</p>
                  )}
                </div>
              </div>
            )}

            {booking.audience_estimate && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Forventet publikum</p>
                  <p className="text-muted-foreground">{booking.audience_estimate} personer</p>
                </div>
              </div>
            )}

            {booking.ticket_price && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Billettpris</p>
                  <p className="text-muted-foreground">{booking.ticket_price} kr</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Details - Only for booking parties */}
        {isOwner && (booking.artist_fee || booking.door_deal) && (
          <Card>
            <CardHeader>
              <CardTitle>Økonomiske detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.artist_fee && (
                <div>
                  <p className="font-medium">Artisthonorar</p>
                  <p className="text-2xl font-bold text-primary">{booking.artist_fee} kr</p>
                </div>
              )}

              {booking.door_deal && (
                <div>
                  <Badge variant="secondary">Døravtale</Badge>
                  {booking.door_percentage && (
                    <p className="text-muted-foreground mt-2">
                      {booking.door_percentage}% av billettinntekter
                    </p>
                  )}
                </div>
              )}

              {booking.by_agreement && (
                <Badge variant="outline">Etter avtale</Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information - Only for booking parties */}
        {isOwner && otherParty && (
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">
                  {isSender ? 'Artist' : 'Arrangør'}: {otherParty.display_name}
                </p>
                {otherParty.contact_info && (
                  <div className="space-y-2 text-sm">
                    {otherParty.contact_info.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{otherParty.contact_info.email}</span>
                      </div>
                    )}
                    {otherParty.contact_info.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{otherParty.contact_info.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {makerProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Portefølje</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePortfolioViewer userId={makerProfile.user_id} isOwnProfile={false} />
            </CardContent>
          </Card>
        )}

        {/* Technical Specs - Only for booking parties */}
        {isOwner && booking.tech_spec && (
          <Card>
            <CardHeader>
              <CardTitle>Tekniske krav</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{booking.tech_spec}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hospitality Rider - Only for booking parties */}
        {isOwner && booking.hospitality_rider && (
          <Card>
            <CardHeader>
              <CardTitle>Hospitality Rider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{booking.hospitality_rider}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => navigate(`/booking/${booking.id}/edit`)}
                variant="outline"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Rediger arrangement
              </Button>
              <Button
                onClick={() => navigate(`/booking/${booking.id}/summary`)}
                variant="outline"
                className="w-full"
              >
                Se avtale
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminBookingView;
