import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Users, X, CreditCard, Music, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';

interface EventData {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date: string;
  time?: string;
  ticket_price?: number;
  expected_audience?: number;
  created_by?: string;
  is_public: boolean;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
}

export const EventModal = ({ isOpen, onClose, eventId }: EventModalProps) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId || !isOpen) {
      setEvent(null);
      return;
    }

    const fetchEventData = async () => {
      try {
        setLoading(true);
        // Fetch event data
        const { data, error } = await supabase
          .from('events_market')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        setEvent(data);

        // Fetch maker profile for portfolio
        if (data.created_by) {
          const { data: profileData, error: profileError } = await supabase
            .rpc('get_secure_profile_data', { target_user_id: data.created_by })
            .maybeSingle();

          if (!profileError && profileData) {
            setMakerProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, isOpen]);

  if (!event) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 text-center">
            {loading ? 'Laster arrangement...' : 'Arrangement ikke funnet'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">Arrangement</Badge>
                {event.is_public && (
                  <Badge variant="outline">Offentlig</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beskrivelse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Arrangementdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dato</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('nb-NO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                {event.time && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Klokkeslett</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Venue */}
              {event.venue && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sted</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}

              {/* Price and Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.ticket_price && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Billettpris</p>
                      <p className="text-sm text-muted-foreground">{event.ticket_price} kr</p>
                    </div>
                  </div>
                )}
                
                {event.expected_audience && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Forventet publikum</p>
                      <p className="text-sm text-muted-foreground">{event.expected_audience} personer</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Portefølje */}
          {makerProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Portefølje - {makerProfile.display_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{makerProfile.display_name}</h3>
                    <p className="text-sm text-muted-foreground">Artist/Maker</p>
                    {makerProfile.bio && (
                      <p className="text-sm mt-1 line-clamp-2">{makerProfile.bio}</p>
                    )}
                  </div>
                </div>
                
                <ProfilePortfolioViewer 
                  userId={makerProfile.user_id} 
                  isOwnProfile={false}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};