import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Banknote, ArrowLeft, Clock, Image, Video, Music, File } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface PublicEventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  ticket_price: number | null;
  audience_estimate: number | null;
  sender_id: string;
  receiver_id: string;
  selected_concept_id: string | null;
  is_public_after_approval: boolean | null;
}

const PublicEventView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEventData | null>(null);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [portfolioAttachments, setPortfolioAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPublicEventData();
    }
  }, [id]);

  const fetchPublicEventData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch event data - allow access if user is a party OR if event is public
      const { data: eventData, error: eventError } = await supabase
        .from('bookings')
        .select('id, title, description, event_date, time, venue, address, ticket_price, audience_estimate, sender_id, receiver_id, selected_concept_id, is_public_after_approval')
        .eq('id', id)
        .eq('status', 'upcoming')
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData) {
        toast({
          title: "Ikke funnet",
          description: "Dette arrangementet eksisterer ikke",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      // Check if user has access (is a party OR event is public)
      const isParty = user && (eventData.sender_id === user.id || eventData.receiver_id === user.id);
      const isPublic = eventData.is_public_after_approval;

      if (!isParty && !isPublic) {
        toast({
          title: "Ikke tilgang",
          description: "Dette arrangementet er ikke offentlig tilgjengelig",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setEvent(eventData);

      // Fetch maker profile (receiver is usually the artist/maker)
      const { data: profileData } = await supabase
        .rpc('get_public_profile', { target_user_id: eventData.receiver_id })
        .maybeSingle();
      
      setMakerProfile(profileData);

      // Fetch portfolio attachments from booking_portfolio_attachments
      const { data: attachmentsData } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_type,
            file_url,
            mime_type,
            title,
            description
          )
        `)
        .eq('booking_id', id)
        .order('created_at', { ascending: false });
      
      setPortfolioAttachments(attachmentsData || []);

    } catch (error: any) {
      console.error('Error fetching public event:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste arrangementdetaljer",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster arrangement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Arrangement ikke funnet</p>
            <Button onClick={() => navigate('/dashboard?section=bookings&tab=upcoming')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard?section=bookings&tab=upcoming')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold">{event.title}</h1>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white">
              Offentlig arrangement
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-lg text-muted-foreground mt-4">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {event.event_date && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Dato</p>
                <p className="text-muted-foreground">
                  {format(new Date(event.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                </p>
              </div>
            </div>
          )}

          {event.time && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Tid</p>
                <p className="text-muted-foreground">{event.time}</p>
              </div>
            </div>
          )}

          {event.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Spillested</p>
                <p className="text-muted-foreground">{event.venue}</p>
              </div>
            </div>
          )}

          {event.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">{event.address}</p>
              </div>
            </div>
          )}

          {event.audience_estimate && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Forventet publikum</p>
                <p className="text-muted-foreground">{event.audience_estimate} personer</p>
              </div>
            </div>
          )}

          {event.ticket_price && (
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Billettpris</p>
                <p className="text-muted-foreground">{event.ticket_price} kr</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Gallery */}
        {portfolioAttachments.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold">Portefølje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolioAttachments.map((attachment) => {
                const file = attachment.portfolio_file;
                if (!file) return null;
                
                const publicUrl = file.file_url || supabase.storage.from('portfolio').getPublicUrl(file.file_path).data.publicUrl;
                
                return (
                  <Card key={attachment.id}>
                    <CardContent className="p-4 space-y-3">
                      {/* File Preview */}
                      {file.mime_type?.startsWith('video/') && (
                        <VideoPlayer
                          publicUrl={publicUrl}
                          filename={file.title || file.filename}
                          mimeType={file.mime_type}
                        />
                      )}
                      
                      {file.mime_type?.startsWith('audio/') && (
                        <div className="w-full rounded bg-muted flex flex-col items-center justify-center gap-2 p-4">
                          <Music className="h-8 w-8 text-primary" />
                          <audio controls className="w-full" preload="metadata">
                            <source src={publicUrl} type={file.mime_type} />
                            Nettleseren din støtter ikke lydavspilling.
                          </audio>
                        </div>
                      )}
                      
                      {file.mime_type?.startsWith('image/') && (
                        <img
                          src={publicUrl}
                          alt={file.title || file.filename}
                          className="w-full rounded object-cover max-h-96"
                        />
                      )}
                      
                      {!file.mime_type?.startsWith('video/') && 
                       !file.mime_type?.startsWith('audio/') && 
                       !file.mime_type?.startsWith('image/') && (
                        <div className="w-full h-32 rounded bg-muted flex items-center justify-center">
                          <File className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* File Info */}
                      <div className="space-y-1">
                        <p className="font-medium">
                          {file.title || file.filename}
                        </p>
                        {file.description && (
                          <p className="text-sm text-muted-foreground">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEventView;
