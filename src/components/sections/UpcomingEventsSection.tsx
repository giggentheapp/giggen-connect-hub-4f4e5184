import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, DollarSign, Users, Eye, User, Phone, Mail, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface UpcomingEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  price_ticket: string | null;
  price_musician: string | null;
  sender_id: string;
  receiver_id: string;
  selected_concept_id: string | null;
  sender_profile?: {
    display_name: string;
    contact_info: any;
  };
  receiver_profile?: {
    display_name: string;
    contact_info: any;
  };
}

interface UpcomingEventsSectionProps {
  profile: UserProfile;
  isAdminView?: boolean;
}

export const UpcomingEventsSection = ({ profile, isAdminView = false }: UpcomingEventsSectionProps) => {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [portfolioUserId, setPortfolioUserId] = useState<string | null>(null);
  const [techSpecFiles, setTechSpecFiles] = useState<any[]>([]);
  const [hospitalityFiles, setHospitalityFiles] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingEvents();
  }, [profile.user_id, isAdminView]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          sender_profile:profiles!bookings_sender_id_fkey(display_name, contact_info),
          receiver_profile:profiles!bookings_receiver_id_fkey(display_name, contact_info)
        `)
        .eq('status', 'published')
        .not('event_date', 'is', null)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      // For admin view, only show events where user is involved
      if (isAdminView) {
        query = query.or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Feil ved lasting av arrangementer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEventDetails = async (event: any) => {
    setSelectedEvent(event);
    
    if (isAdminView && event.selected_concept_id) {
      // Fetch concept details for admin view
      try {
        // Get concept creator (maker) for portfolio
        const { data: conceptData } = await supabase
          .from('concepts')
          .select('maker_id')
          .eq('id', event.selected_concept_id)
          .single();

        if (conceptData) {
          setPortfolioUserId(conceptData.maker_id);

          // Fetch tech spec files
          const { data: techSpecs } = await supabase
            .from('profile_tech_specs')
            .select('*')
            .eq('profile_id', conceptData.maker_id);

          // Fetch hospitality rider files
          const { data: hospitalityRiders } = await supabase
            .from('hospitality_riders')
            .select('*')
            .eq('user_id', conceptData.maker_id);

          setTechSpecFiles(techSpecs || []);
          setHospitalityFiles(hospitalityRiders || []);
        }
      } catch (error) {
        console.error('Error fetching concept details:', error);
      }
    }
    
    setDetailsOpen(true);
  };

  const EventCard = ({ event }: { event: any }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => openEventDetails(event)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription>
              {event.description && (
                <span className="block text-sm">{event.description}</span>
              )}
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Kommende
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.event_date), 'dd.MM.yyyy HH:mm')}</span>
          </div>
          
          {event.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.venue}</span>
            </div>
          )}
          
          {event.price_ticket && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Billett: {event.price_ticket}</span>
            </div>
          )}

          {isAdminView && (
            <>
              {event.price_musician && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Musiker: {event.price_musician}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {event.sender_id === profile.user_id ? 
                    `Med: ${event.receiver_profile?.display_name}` : 
                    `Med: ${event.sender_profile?.display_name}`
                  }
                </span>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4 mr-1" />
              Se detaljer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdminView ? 'Mine kommende arrangementer' : 'Kommende arrangementer'}
          </h1>
          <p className="text-muted-foreground">
            {isAdminView ? 
              'Administrer dine bekreftede arrangementer' : 
              'Se alle publiserte arrangementer'
            }
          </p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isAdminView ? 'Mine kommende arrangementer' : 'Kommende arrangementer'}
        </h1>
        <p className="text-muted-foreground">
          {isAdminView ? 
            'Administrer dine bekreftede arrangementer' : 
            'Se alle publiserte arrangementer'
          }
        </p>
      </div>

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isAdminView ? 
                'Du har ingen kommende arrangementer' : 
                'Ingen kommende arrangementer for øyeblikket'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Event Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Arrangementsinformasjon</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedEvent.event_date), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                    {selectedEvent.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEvent.venue}</span>
                      </div>
                    )}
                    {selectedEvent.price_ticket && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Billettpris: {selectedEvent.price_ticket}</span>
                      </div>
                    )}
                    {isAdminView && selectedEvent.price_musician && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Musiker honorar: {selectedEvent.price_musician}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info for Admin View */}
                {isAdminView && (
                  <div>
                    <h3 className="font-semibold mb-2">Kontaktinformasjon</h3>
                    <div className="space-y-3">
                      {/* Other party contact */}
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm mb-1">
                          {selectedEvent.sender_id === profile.user_id ? 
                            selectedEvent.receiver_profile?.display_name : 
                            selectedEvent.sender_profile?.display_name
                          }
                        </h4>
                        {(() => {
                          const contactInfo = selectedEvent.sender_id === profile.user_id ? 
                            selectedEvent.receiver_profile?.contact_info : 
                            selectedEvent.sender_profile?.contact_info;
                          
                          if (!contactInfo) return <p className="text-xs text-muted-foreground">Ingen kontaktinfo tilgjengelig</p>;
                          
                          return (
                            <div className="space-y-1 text-xs">
                              {contactInfo.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{contactInfo.phone}</span>
                                </div>
                              )}
                              {contactInfo.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{contactInfo.email}</span>
                                </div>
                              )}
                              {contactInfo.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-3 w-3" />
                                  <span>{contactInfo.website}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold mb-2">Beskrivelse</h3>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              {/* Portfolio for public/admin view */}
              {portfolioUserId && (
                <div>
                  <h3 className="font-semibold mb-2">Portefølje</h3>
                  <ProfilePortfolioViewer userId={portfolioUserId} />
                </div>
              )}

              {/* Tech Specs and Hospitality Rider for Admin View */}
              {isAdminView && (techSpecFiles.length > 0 || hospitalityFiles.length > 0) && (
                <div>
                  <h3 className="font-semibold mb-2">Vedlegg</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {techSpecFiles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Tech Spec</h4>
                        <div className="space-y-2">
                          {techSpecFiles.map((file) => (
                            <div key={file.id} className="p-2 border rounded text-sm">
                              <a 
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {file.filename}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hospitalityFiles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Hospitality Rider</h4>
                        <div className="space-y-2">
                          {hospitalityFiles.map((file) => (
                            <div key={file.id} className="p-2 border rounded text-sm">
                              <a 
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {file.filename}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
