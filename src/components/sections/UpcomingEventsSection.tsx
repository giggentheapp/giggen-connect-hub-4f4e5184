import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { useToast } from '@/hooks/use-toast';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { Calendar, MapPin, Banknote, Users, Eye, User, Phone, Mail, Globe, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { UserProfile } from '@/types/auth';

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
}

export const UpcomingEventsSection = ({ profile }: UpcomingEventsSectionProps) => {
  const navigate = useNavigate();
  const { events, loading, error: fetchError } = useUpcomingEvents(profile.user_id);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Kunne ikke laste arrangementer: {fetchError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Kommende arrangementer</h1>
        <p className="text-muted-foreground">
          Arrangementer fra bookingflyten og admin-opprettede events
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Ingen kommende arrangementer</h3>
            <p className="text-muted-foreground mb-6">
              Publiserte bookinger og events vil vises her
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard?section=bookings')}>
                Gå til bookinger
              </Button>
              <Button variant="outline" onClick={() => navigate('/create-event')}>
                Opprett nytt arrangement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/arrangement/${event.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </CardTitle>
                  {event.has_paid_tickets && (
                    <Badge variant="secondary" className="shrink-0">
                      Betalt
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2">
                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium">
                        {format(new Date(event.event_date), 'dd. MMMM yyyy', { locale: nb })}
                      </span>
                    </div>
                  )}

                  {event.time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{event.time}</span>
                    </div>
                  )}

                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">{event.venue}</span>
                    </div>
                  )}

                  {event.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 opacity-0" />
                      <span className="text-xs text-muted-foreground truncate">{event.address}</span>
                    </div>
                  )}

                  {event.audience_estimate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {event.audience_estimate} forventet publikum
                      </span>
                    </div>
                  )}

                  {event.ticket_price && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{event.ticket_price} kr</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {event.is_sender && 'Du er sender'}
                      {event.is_receiver && 'Du er mottaker'}
                      {!event.is_sender && !event.is_receiver && 'Admin-opprettet'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {event.status === 'upcoming' ? 'Kommende' : event.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
    console.log('🚨 UpcomingEventsSection: Event card clicked', { eventId: event.id, isAdminView });
    
    // For admin view, always show detailed dialog with all available info
    if (isAdminView) {
      console.log('🚨 Admin view: Opening detailed event dialog');
      setSelectedEvent(event);
      
      // For admin view, try to fetch additional profile data if needed
      if (event.sender_id && event.receiver_id) {
        try {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, contact_info, bio, avatar_url')
            .eq('user_id', event.sender_id)
            .maybeSingle();
            
          const { data: receiverProfile } = await supabase
            .from('profiles')
            .select('display_name, contact_info, bio, avatar_url')
            .eq('user_id', event.receiver_id)
            .maybeSingle();
            
          // Enhance event with profile data
          const enhancedEvent = {
            ...event,
            sender_profile: senderProfile,
            receiver_profile: receiverProfile
          };
          setSelectedEvent(enhancedEvent);
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Use event as-is if profile fetch fails
          setSelectedEvent(event);
        }
      }
      
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
            title: "Feil ved lasting av tilbudsdetaljer",
            description: "Kunne ikke laste tilbudsinformasjon",
            variant: "destructive",
          });
        }
      }
      
      setDetailsOpen(true);
    } else {
      // For public events, navigate to public event view
      console.log('🚨 Public view: Navigating to public event page');
      navigate(`/arrangement/${event.id}`);
    }
  };

  // Transform event data for UpcomingEventCard
  const transformEventForCard = (event: any) => {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      event_date: event.event_date || event.event_datetime || event.date,
      time: event.time,
      venue: event.venue,
      address: event.address,
      ticket_price: event.price_ticket || event.ticket_price,
      audience_estimate: event.expected_audience || event.audience_estimate,
      status: 'upcoming' as const,
      is_sender: event.sender_id === profile.user_id,
      is_receiver: event.receiver_id === profile.user_id,
      is_public_after_approval: event.is_public_after_approval,
      created_at: event.created_at || new Date().toISOString()
    };
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
      {/* Privacy Information */}
      {isAdminView ? (
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Personvern:</strong> Kun offentlig arrangementinfo vises til andre brukere. 
            Sensitive detaljer som honorar og kontaktinfo er kun synlig for deg og samarbeidspartneren.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Viser kun offentlig arrangementinfo. Sensitive detaljer er ikke tilgjengelig.
          </p>
        </div>
      )}

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
        <div className="space-y-3 md:space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} onClick={() => isAdminView && openEventDetails(event)}>
              <UpcomingEventCard event={transformEventForCard(event)} />
            </div>
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
                      {(selectedEvent.price_ticket || selectedEvent.ticket_price) && isAdminView && (
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
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
                          <Banknote className="h-4 w-4" />
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

              {/* Event Description */}
              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold mb-2">Beskrivelse</h3>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              {/* Portfolio Section */}
              {portfolioUserId && (
                <div>
                  <h3 className="font-semibold mb-2">Konseptmateriale</h3>
                  <ProfilePortfolioViewer userId={portfolioUserId} isOwnProfile={false} />
                </div>
              )}

              {/* Tech Specs and Hospitality Riders for Admin View */}
              {isAdminView && (techSpecFiles.length > 0 || hospitalityFiles.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tech Specs */}
                  {techSpecFiles.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tekniske spesifikasjoner</h3>
                      <div className="space-y-2">
                        {techSpecFiles.map((file) => (
                          <div key={file.id} className="p-2 border rounded-lg">
                            <a 
                              href={file.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {file.filename}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hospitality Riders */}
                  {hospitalityFiles.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Hospitality rider</h3>
                      <div className="space-y-2">
                        {hospitalityFiles.map((file) => (
                          <div key={file.id} className="p-2 border rounded-lg">
                            <a 
                              href={file.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {file.filename}
                            </a>
                          </div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};