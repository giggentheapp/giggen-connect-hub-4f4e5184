import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Users, Music, Calendar, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EventFormData, EventParticipant, BandParticipant } from '@/hooks/useCreateEvent';
import { useUserBands } from '@/hooks/useBands';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EventCreateModalBProps {
  onNext: () => void;
  onBack: () => void;
  eventData: EventFormData;
  setEventData: (data: EventFormData) => void;
  userId: string;
}

export const EventCreateModalB = ({
  onNext,
  onBack,
  eventData,
  setEventData,
  userId,
}: EventCreateModalBProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [musicians, setMusicians] = useState<EventParticipant[]>([]);
  const [organizers, setOrganizers] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const { bands: allBands } = useUserBands(userId);
  
  // Only show public bands in event participant selection
  const bands = allBands.filter(band => band.is_public);

  useEffect(() => {
    fetchMusicians();
    fetchOrganizers();
  }, [searchTerm]);

  const fetchMusicians = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .eq('role', 'musician')
        .not('avatar_url', 'is', null)
        .not('bio', 'is', null)
        .neq('display_name', '')
        .neq('bio', '');

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      
      // Filter by profile_settings.show_public_profile
      const profileIds = data?.map(p => p.user_id) || [];
      if (profileIds.length > 0) {
        const { data: settings } = await supabase
          .from('profile_settings')
          .select('maker_id')
          .in('maker_id', profileIds)
          .eq('show_public_profile', true);
        
        const visibleIds = new Set(settings?.map(s => s.maker_id));
        const visibleProfiles = data?.filter(p => visibleIds.has(p.user_id)) || [];
        setMusicians(visibleProfiles);
      } else {
        setMusicians([]);
      }
    } catch (error) {
      console.error('Error fetching musicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .eq('role', 'organizer')
        .not('avatar_url', 'is', null)
        .not('bio', 'is', null)
        .neq('display_name', '')
        .neq('bio', '');

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, role')
          .eq('user_id', user.id)
          .single();
        
        if (currentUserProfile) {
          const { data, error } = await query.limit(19);
          if (error) throw error;
          
          // Filter by visibility settings
          const profileIds = data?.map(p => p.user_id) || [];
          const { data: settings } = await supabase
            .from('profile_settings')
            .select('maker_id')
            .in('maker_id', profileIds)
            .eq('show_public_profile', true);
          
          const visibleIds = new Set(settings?.map(s => s.maker_id));
          const visibleProfiles = data?.filter(p => visibleIds.has(p.user_id)) || [];
          
          // Only add current user if they are an organizer
          const allOrganizers = currentUserProfile.role === 'organizer' 
            ? [currentUserProfile, ...visibleProfiles]
            : visibleProfiles;
          const uniqueOrganizers = allOrganizers.filter((org, index, self) =>
            index === self.findIndex((t) => t.user_id === org.user_id)
          );
          setOrganizers(uniqueOrganizers);
          return;
        }
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setOrganizers(data || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  };

  const toggleMusician = (musician: EventParticipant) => {
    const isSelected = eventData.participants.musicians.some(m => m.user_id === musician.user_id);
    if (isSelected) {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          musicians: eventData.participants.musicians.filter(m => m.user_id !== musician.user_id),
        },
      });
    } else {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          musicians: [...eventData.participants.musicians, musician],
        },
      });
    }
  };

  const toggleBand = (band: any) => {
    const isSelected = eventData.participants.bands.some(b => b.band_id === band.id);
    const bandParticipant: BandParticipant = {
      band_id: band.id,
      name: band.name,
      image_url: band.image_url,
    };

    if (isSelected) {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          bands: eventData.participants.bands.filter(b => b.band_id !== band.id),
        },
      });
    } else {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          bands: [...eventData.participants.bands, bandParticipant],
        },
      });
    }
  };

  const toggleOrganizer = (organizer: EventParticipant) => {
    const isSelected = eventData.participants.organizers.some(o => o.user_id === organizer.user_id);
    if (isSelected) {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          organizers: eventData.participants.organizers.filter(o => o.user_id !== organizer.user_id),
        },
      });
    } else {
      setEventData({
        ...eventData,
        participants: {
          ...eventData.participants,
          organizers: [...eventData.participants.organizers, organizer],
        },
      });
    }
  };

  const ParticipantCard = ({ participant, type, onToggle }: { 
    participant: EventParticipant | BandParticipant; 
    type: 'musician' | 'band' | 'organizer';
    onToggle: () => void;
  }) => {
    const isSelected = type === 'band'
      ? eventData.participants.bands.some(b => b.band_id === (participant as BandParticipant).band_id)
      : type === 'musician'
      ? eventData.participants.musicians.some(m => m.user_id === (participant as EventParticipant).user_id)
      : eventData.participants.organizers.some(o => o.user_id === (participant as EventParticipant).user_id);

    return (
      <Card
        className={`p-4 transition-all hover:border-primary/50 ${
          isSelected ? 'border-primary bg-primary/5' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Avatar>
              <AvatarImage src={
                type === 'band' 
                  ? (participant as BandParticipant).image_url || undefined 
                  : (participant as EventParticipant).avatar_url || undefined
              } />
              <AvatarFallback>
                {type === 'band' 
                  ? (participant as BandParticipant).name.charAt(0).toUpperCase()
                  : (participant as EventParticipant).display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">
                {type === 'band' 
                  ? (participant as BandParticipant).name 
                  : (participant as EventParticipant).display_name}
              </p>
              {type !== 'band' && (
                <p className="text-sm text-muted-foreground">
                  @{(participant as EventParticipant).username}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={onToggle}
            variant={isSelected ? "default" : "outline"}
            size="sm"
          >
            {isSelected ? 'Fjern' : 'Velg'}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selected Participants Summary */}
      {(eventData.participants.musicians.length > 0 || 
        eventData.participants.bands.length > 0 || 
        eventData.participants.organizers.length > 0) && (
        <div className="space-y-3 py-4 border-b">
          <Label className="text-base font-semibold">Valgte deltakere</Label>
            <div className="flex flex-wrap gap-2">
              {eventData.participants.musicians.map((musician) => (
                <Badge key={musician.user_id} variant="secondary" className="gap-1">
                  <Music className="h-3 w-3" />
                  {musician.display_name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMusician(musician);
                    }}
                  />
                </Badge>
              ))}
              {eventData.participants.bands.map((band) => (
                <Badge key={band.band_id} variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {band.name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBand(band);
                    }}
                  />
                </Badge>
              ))}
              {eventData.participants.organizers.map((organizer) => (
                <Badge key={organizer.user_id} variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {organizer.display_name}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrganizer(organizer);
                    }}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative py-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter navn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="musicians" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="musicians">
              Musikere ({eventData.participants.musicians.length})
            </TabsTrigger>
            <TabsTrigger value="bands">
              Band ({eventData.participants.bands.length})
            </TabsTrigger>
            <TabsTrigger value="organizers">
              Arrangører ({eventData.participants.organizers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="musicians" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="space-y-2">
                {musicians.map((musician) => (
                  <ParticipantCard
                    key={musician.user_id}
                    participant={musician}
                    type="musician"
                    onToggle={() => toggleMusician(musician)}
                  />
                ))}
                {musicians.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen musikere funnet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bands" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="space-y-2">
                {bands.map((band) => (
                  <ParticipantCard
                    key={band.id}
                    participant={{
                      band_id: band.id,
                      name: band.name,
                      image_url: band.image_url,
                    }}
                    type="band"
                    onToggle={() => toggleBand(band)}
                  />
                ))}
                {bands.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen band funnet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="organizers" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="space-y-2">
                {organizers.map((organizer) => (
                  <ParticipantCard
                    key={organizer.user_id}
                    participant={organizer}
                    type="organizer"
                    onToggle={() => toggleOrganizer(organizer)}
                  />
                ))}
                {organizers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen arrangører funnet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Tilbake
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-accent-orange to-accent-pink hover:opacity-90"
        >
          Neste
        </Button>
      </div>
    </div>
  );
};
