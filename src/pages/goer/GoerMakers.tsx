import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { useProfilePortfolio } from "@/hooks/useProfilePortfolio";
import { useUserConcepts } from "@/hooks/useUserConcepts";

interface MakerProfile {
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
  created_at: string;
  updated_at: string;
  default_mode?: string;
  current_mode?: string;
}

interface BookingEvent {
  id: string;
  title: string;
  event_date: string;
  venue: string | null;
  status: string;
}

const GoerMakers = () => {
  const [makers, setMakers] = useState<MakerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaker, setSelectedMaker] = useState<MakerProfile | null>(null);
  const [makerEvents, setMakerEvents] = useState<BookingEvent[]>([]);

  const { files: portfolioFiles, loading: portfolioLoading } = useProfilePortfolio(selectedMaker?.user_id);
  const { concepts, loading: conceptsLoading } = useUserConcepts(selectedMaker?.user_id);

  useEffect(() => {
    loadMakers();
  }, []);

  useEffect(() => {
    if (selectedMaker) {
      loadMakerEvents(selectedMaker.user_id);
    }
  }, [selectedMaker]);

  const loadMakers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "maker")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setMakers(data || []);
    } catch (err: any) {
      console.error("Error loading makers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMakerEvents = async (makerId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("id, title, event_date, venue, status")
        .eq("receiver_id", makerId)
        .eq("status", "accepted")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);

      if (fetchError) throw fetchError;
      setMakerEvents(data || []);
    } catch (err: any) {
      console.error("Error loading maker events:", err);
      setMakerEvents([]);
    }
  };

  const openMakerModal = (maker: MakerProfile) => {
    setSelectedMaker(maker);
  };

  const closeMakerModal = () => {
    setSelectedMaker(null);
    setMakerEvents([]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Makers</h1>
          <p className="text-muted-foreground">Utforsk alle makers på plattformen</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster makers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Makers</h1>
          <p className="text-muted-foreground">Utforsk alle makers på plattformen</p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">Feil ved lasting av makers: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Makers</h1>
        <p className="text-muted-foreground">Utforsk alle makers på plattformen</p>
      </div>

      {makers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Ingen makers funnet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {makers.map((maker) => (
            <Card 
              key={maker.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => openMakerModal(maker)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {maker.avatar_url ? (
                    <img 
                      src={maker.avatar_url} 
                      alt={maker.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      {maker.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{maker.display_name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Maker
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {maker.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {maker.bio}
                  </p>
                )}

                {maker.address && maker.is_address_public && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{maker.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Maker Details Modal */}
      <Dialog open={!!selectedMaker} onOpenChange={closeMakerModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedMaker?.avatar_url ? (
                <img 
                  src={selectedMaker.avatar_url} 
                  alt={selectedMaker.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {selectedMaker?.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              {selectedMaker?.display_name}
            </DialogTitle>
          </DialogHeader>

          {selectedMaker && (
            <div className="space-y-6">
              {/* Bio */}
              {selectedMaker.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Om meg</h3>
                  <p className="text-sm text-muted-foreground">{selectedMaker.bio}</p>
                </div>
              )}

              {/* Contact Info */}
              {selectedMaker.contact_info && (
                <div>
                  <h3 className="font-semibold mb-2">Kontaktinformasjon</h3>
                  <div className="space-y-2">
                    {selectedMaker.contact_info.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMaker.contact_info.email}</span>
                      </div>
                    )}
                    {selectedMaker.contact_info.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMaker.contact_info.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {!portfolioLoading && portfolioFiles.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Portefølje</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {portfolioFiles.slice(0, 4).map((file) => (
                      <div key={file.id} className="text-sm p-2 border rounded">
                        <p className="font-medium line-clamp-1">{file.title || file.filename}</p>
                        {file.description && (
                          <p className="text-muted-foreground text-xs line-clamp-2">{file.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {portfolioFiles.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ...og {portfolioFiles.length - 4} flere filer
                    </p>
                  )}
                </div>
              )}

              {/* Concepts */}
              {!conceptsLoading && concepts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Konsepter</h3>
                  <div className="space-y-2">
                    {concepts.slice(0, 3).map((concept) => (
                      <div key={concept.id} className="text-sm p-2 border rounded">
                        <p className="font-medium">{concept.title}</p>
                        {concept.description && (
                          <p className="text-muted-foreground text-xs line-clamp-2">{concept.description}</p>
                        )}
                        {concept.price && (
                          <p className="text-xs font-semibold">Fra {concept.price} kr</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {concepts.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ...og {concepts.length - 3} flere konsepter
                    </p>
                  )}
                </div>
              )}

              {/* Upcoming Events */}
              {makerEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Kommende arrangementer</h3>
                  <div className="space-y-2">
                    {makerEvents.map((event) => (
                      <div key={event.id} className="text-sm p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.title}</span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{event.venue}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.event_date).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address */}
              {selectedMaker.address && selectedMaker.is_address_public && (
                <div>
                  <h3 className="font-semibold mb-2">Lokasjon</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedMaker.address}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoerMakers;