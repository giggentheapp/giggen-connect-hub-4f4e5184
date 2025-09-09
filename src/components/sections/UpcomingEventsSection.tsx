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
import { EventModal } from '@/components/EventModal';

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingEvents();
  }, [profile.user_id, isAdminView]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch from events_market for public view, bookings for admin view
      let query;
      
      if (isAdminView) {
        // Admin view: get from bookings table with full profile info
        query = supabase
          .from('bookings')
          .select(`
            *,
            sender_profile:profiles!bookings_sender_id_fkey(
              user_id,
              display_name, 
              contact_info,
              avatar_url,
              bio
            ),
            receiver_profile:profiles!bookings_receiver_id_fkey(
              user_id,
              display_name, 
              contact_info,
              avatar_url,
              bio
            )
          `)
          .eq('status', 'published')
          .not('event_date', 'is', null)
          .gte('event_date', new Date().toISOString())
          .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`)
          .order('event_date', { ascending: true });
      } else {
        // Public view: get from events_market table
        query = supabase
          .from('events_market')
          .select('*')
          .eq('is_public', true)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      
      if (isAdminView) {
        // Filter out events with missing profile relationships for admin view
        const validEvents = (data || []).filter(event => 
          event.sender_profile && event.receiver_profile
        );
        
        if (validEvents.length !== (data || []).length) {
          console.warn(`Filtered out ${(data || []).length - validEvents.length} events with missing profile relations`);
        }
        
        setUpcomingEvents(validEvents);
      } else {
        // For public view, data comes from events_market - no filtering needed
        setUpcomingEvents(data || []);
      }
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
    console.log('UpcomingEventsSection: Event card clicked', { eventId: event.id, isAdminView });
    
    // For admin view with bookings, keep existing detailed dialog
    if (isAdminView && (event.sender_profile || event.receiver_profile)) {
      // Validate that required profile relationships exist
      if (!event.sender_profile || !event.receiver_profile) {
        toast({
          title: "Manglende profildata",
          description: "Kan ikke vise arrangementdetaljer på grunn av manglende profil-relasjoner",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedEvent(event);
      
      // For both admin and public view, fetch concept details if available
      const conceptId = event.selected_concept_id || event.portfolio_id;
      if (conceptId) {
        try {
          // Get concept creator (maker) for portfolio
          const { data: conceptData } = await supabase
            .from('concepts')
            .select('maker_id')
            .eq('id', conceptId)
            .single();

          if (conceptData) {
            setPortfolioUserId(conceptData.maker_id);

            // For admin view, also fetch tech specs and hospitality riders
            if (isAdminView) {
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
          }
        } catch (error) {
          console.error('Error fetching concept details:', error);
          toast({
            title: "Feil ved lasting av konseptdetaljer",
            description: "Kunne ikke laste konseptinformasjon",
            variant: "destructive",
          });
        }
      }
      
      setDetailsOpen(true);
    } else {
      // For public events from events_market, use EventModal
      setSelectedEventId(event.id);
      setIsEventModalOpen(true);
    }
  };

  const handleEventModalClose = () => {
    console.log('UpcomingEventsSection: Event modal closed');
    setIsEventModalOpen(false);
    setSelectedEventId(null);
  };

  const EventCard = ({ event }: { event: any }) => {
    // Handle different data structures for admin vs public view
    const eventDate = event.event_date || event.event_datetime || event.date;
    const eventTime = event.time;
    const ticketPrice = event.price_ticket || event.ticket_price;
    
    // Format date display
    const displayDate = eventDate ? (
      eventTime && !eventDate.includes('T') ? 
        `${format(new Date(eventDate), 'dd.MM.yyyy')} ${eventTime.slice(0, 5)}` :
        format(new Date(eventDate), 'dd.MM.yyyy HH:mm')
    ) : 'Dato ikke satt';

    return (
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
              <span>{displayDate}</span>
            </div>
            
            {event.venue && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
              </div>
            )}
            
            {ticketPrice && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Billett: {ticketPrice}</span>
              </div>
            )}

            {event.expected_audience && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Forventet publikum: {event.expected_audience}</span>
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
                      `Med: ${event.receiver_profile?.display_name || 'Ukjent bruker'}` : 
                      `Med: ${event.sender_profile?.display_name || 'Ukjent bruker'}`
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
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Laster arrangementer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

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
                      {(() => {
                        const eventDate = selectedEvent.event_date || selectedEvent.event_datetime || selectedEvent.date;
                        const eventTime = selectedEvent.time;
                        const displayDate = eventDate ? (
                          eventTime && !eventDate.includes('T') ? 
                            `${format(new Date(eventDate), 'dd.MM.yyyy')} ${eventTime.slice(0, 5)}` :
                            format(new Date(eventDate), 'dd.MM.yyyy HH:mm')
                        ) : 'Dato ikke satt';
                        
                        return (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{displayDate}</span>
                          </div>
                        );
                      })()}
                      {selectedEvent.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedEvent.venue}</span>
                        </div>
                      )}
                      {(selectedEvent.price_ticket || selectedEvent.ticket_price) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Billettpris: {selectedEvent.price_ticket || selectedEvent.ticket_price}</span>
                        </div>
                      )}
                      {selectedEvent.expected_audience && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Forventet publikum: {selectedEvent.expected_audience}</span>
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

                {/* Contact Info and Profile Info for Admin View */}
                {isAdminView && (
                  <div>
                    <h3 className="font-semibold mb-2">Deltakerinformasjon</h3>
                    <div className="space-y-4">
                      {/* Sender info */}
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm mb-2">
                          Avsender: {selectedEvent.sender_profile?.display_name || 'Ukjent bruker'}
                          {selectedEvent.sender_id === profile.user_id && ' (Deg)'}
                        </h4>
                        {selectedEvent.sender_profile?.bio && (
                          <p className="text-xs text-muted-foreground mb-2">{selectedEvent.sender_profile.bio}</p>
                        )}
                        {(() => {
                          const contactInfo = selectedEvent.sender_profile?.contact_info;
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
                      
                      {/* Receiver info */}
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm mb-2">
                          Mottaker: {selectedEvent.receiver_profile?.display_name || 'Ukjent bruker'}
                          {selectedEvent.receiver_id === profile.user_id && ' (Deg)'}
                        </h4>
                        {selectedEvent.receiver_profile?.bio && (
                          <p className="text-xs text-muted-foreground mb-2">{selectedEvent.receiver_profile.bio}</p>
                        )}
                        {(() => {
                          const contactInfo = selectedEvent.receiver_profile?.contact_info;
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

              {/* Portfolio - always show for all views */}
              {portfolioUserId && (
                <div>
                  <h3 className="font-semibold mb-2">Portefølje</h3>
                  <ProfilePortfolioViewer userId={portfolioUserId} isOwnProfile={false} />
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

      <EventModal 
        isOpen={isEventModalOpen}
        onClose={handleEventModalClose}
        eventId={selectedEventId}
      />
    </div>
  );
};
