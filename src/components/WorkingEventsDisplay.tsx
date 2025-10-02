import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, Users, Eye, Music } from 'lucide-react';
import { format } from 'date-fns';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useBookings } from '@/hooks/useBookings';
import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  showSensitiveInfo: boolean; // true for own profile, false for others
  currentUserId?: string; // Add current user ID to determine ownership
  viewerRole?: 'artist' | 'audience'; // Add viewer role to determine data source
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo, currentUserId, viewerRole }: WorkingEventsDisplayProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const [eventFiles, setEventFiles] = useState<Record<string, any[]>>({});
  
  // Determine which data source to use based on viewer role and ownership
  const isOwnProfile = currentUserId === profile.user_id;
  const isAudienceViewing = viewerRole === 'audience' && !isOwnProfile;
  
  // Use different data sources based on the viewing context
  const { bookings, loading: bookingsLoading } = useBookings(isAudienceViewing ? undefined : profile.user_id);
  const { events: publicEvents, loading: publicLoading } = usePublicEvents(isAudienceViewing ? profile.user_id : '');
  
  // Select the appropriate data source
  const loading = isAudienceViewing ? publicLoading : bookingsLoading;
  const eventsData = isAudienceViewing ? publicEvents : bookings.filter(b => b.status === 'upcoming');

  // Fetch portfolio files for events with selected concepts
  useEffect(() => {
    const fetchEventFiles = async () => {
      if (!eventsData || eventsData.length === 0) return;
      
      const filesMap: Record<string, any[]> = {};
      for (const event of eventsData) {
        const conceptId = (event as any).selected_concept_id;
        if (conceptId) {
          const { data: filesData } = await supabase
            .from('concept_files')
            .select('*')
            .eq('concept_id', conceptId)
            .order('created_at', { ascending: false });
          filesMap[event.id] = filesData || [];
        }
      }
      setEventFiles(filesMap);
    };
    
    fetchEventFiles();
  }, [eventsData]);

  console.log('🎭 WorkingEventsDisplay render:', {
    isOwnProfile,
    isAudienceViewing,
    viewerRole,
    eventsCount: eventsData.length,
    loading
  });

  const handleEventClick = (bookingId: string) => {
    console.log('Event clicked - navigating to public view:', bookingId);
    navigate(`/arrangement/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Laster arrangementer...</p>
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isAudienceViewing 
            ? 'Ingen publiserte arrangementer for øyeblikket'
            : (isOwnProfile ? 'Du har ingen publiserte arrangementer' : 'Ingen publiserte arrangementer')
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {eventsData.map((event) => {
          const files = eventFiles[event.id] || [];
          return (
            <Card 
              key={event.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEventClick(event.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {event.event_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {event.venue && event.venue !== 'Ved avtale' && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </div>
                  )}
                  {event.ticket_price && (
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="h-4 w-4" />
                      {event.ticket_price} kr
                    </div>
                  )}
                  {event.audience_estimate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      {event.audience_estimate} personer
                    </div>
                  )}
                  {event.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </div>
                  )}

                  {/* Portfolio files preview */}
                  {files.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Portefølje ({files.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {files.slice(0, 3).map((file) => {
                          const fileUrl = file.file_url || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`;
                          return (
                            <div key={file.id} className="aspect-square rounded overflow-hidden bg-muted">
                              {file.file_type === 'image' && (
                                <img src={fileUrl} alt={file.title || file.filename} className="w-full h-full object-cover" />
                              )}
                              {file.file_type === 'video' && (
                                <video src={fileUrl} className="w-full h-full object-cover" muted />
                              )}
                              {file.file_type === 'audio' && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 bg-muted">
                                  <Music className="h-8 w-8 text-primary" />
                                  <audio
                                    controls
                                    className="w-full"
                                    preload="metadata"
                                  >
                                    <source src={fileUrl} type={file.mime_type || 'audio/mpeg'} />
                                    Nettleseren din støtter ikke lydavspilling.
                                  </audio>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {files.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-2">+{files.length - 3} til</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Publisert
                  </Badge>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Se detaljer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};