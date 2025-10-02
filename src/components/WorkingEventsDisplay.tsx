import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, Users, Eye, Music, Play } from 'lucide-react';
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
                      <div className="grid grid-cols-3 gap-1">
                        {files.map((file) => {
                          const fileUrl = file.file_url || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`;
                          const isAudio = file.file_type === 'audio' || file.mime_type?.includes('audio');
                          const isVideo = file.file_type === 'video' || file.mime_type?.includes('video');
                          
                          return (
                            <div key={file.id} className="aspect-square overflow-hidden bg-muted group cursor-pointer relative">
                              {file.file_type === 'image' && (
                                <>
                                  <img 
                                    src={fileUrl} 
                                    alt="" 
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                                  />
                                  <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                      <Eye className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                    </div>
                                  </div>
                                </>
                              )}
                              {isVideo && (
                                <>
                                  <video 
                                    src={fileUrl} 
                                    className="w-full h-full object-cover" 
                                    preload="metadata"
                                  />
                                  <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                      <Eye className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center">
                                      <div className="w-0 h-0 border-l-[12px] md:border-l-[16px] border-l-black border-t-[8px] md:border-t-[10px] border-t-transparent border-b-[8px] md:border-b-[10px] border-b-transparent ml-1" />
                                    </div>
                                  </div>
                                </>
                              )}
                              {isAudio && (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-3 bg-white border border-border">
                                  <Music className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                  <p className="text-[10px] md:text-xs font-medium text-center truncate w-full px-1">{file.title || file.filename}</p>
                                  <audio
                                    controls
                                    className="w-full mt-auto scale-75 md:scale-100"
                                    preload="metadata"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <source src={fileUrl} type={file.mime_type || 'audio/mpeg'} />
                                  </audio>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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