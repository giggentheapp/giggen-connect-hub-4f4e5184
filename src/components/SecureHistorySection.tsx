import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Search, Filter, Eye, Trash2, Clock, Ban, AlertTriangle } from 'lucide-react';
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

interface SecureHistorySectionProps {
  profile: UserProfile;
}

export const SecureHistorySection = ({ profile }: SecureHistorySectionProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historicalBookings, setHistoricalBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  const { toast } = useToast();

  // Fetch historical bookings with metadata only
  useEffect(() => {
    const loadHistoricalBookings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            title,
            status,
            created_at,
            updated_at,
            deleted_at,
            deletion_reason,
            sender_id,
            receiver_id
          `)
          .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`)
          .eq('status', 'deleted')
          .order('deleted_at', { ascending: false });

        if (error) throw error;
        
        setHistoricalBookings(data || []);
      } catch (error: any) {
        toast({
          title: "Feil ved lasting av historikk",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalBookings();
  }, [profile.user_id, toast]);

  // Filter and sort bookings
  useEffect(() => {
    let filtered = [...historicalBookings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort bookings
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.deleted_at || b.updated_at).getTime() - new Date(a.deleted_at || a.updated_at).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.deleted_at || a.updated_at).getTime() - new Date(b.deleted_at || b.updated_at).getTime());
        break;
      case 'title_asc':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
    }

    setFilteredBookings(filtered);
  }, [historicalBookings, searchTerm, sortBy]);

  const handlePermanentDelete = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking permanent slettet",
        description: "Bookingen har blitt permanent fjernet fra historikken",
      });
      
      // Remove from local state
      setHistoricalBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: any) {
      toast({
        title: "Feil ved permanent sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const HistoryCard = ({ booking }: { booking: any }) => {
    const isSender = booking.sender_id === profile.user_id;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-muted-foreground" />
                {booking.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={isSender ? 'default' : 'secondary'}>
                  {isSender ? 'Sendt av deg' : 'Mottatt av deg'}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  Slettet
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-4">
                <span>Opprettet: {format(new Date(booking.created_at), 'dd.MM.yyyy')}</span>
                <span>Slettet: {format(new Date(booking.deleted_at || booking.updated_at), 'dd.MM.yyyy')}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setDetailsOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Se metadata
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slett permanent
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Permanent sletting</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dette vil permanent fjerne alle spor av denne bookingen. 
                        Denne handlingen kan ikke angres.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handlePermanentDelete(booking.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Slett permanent
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
        <p>Laster historikk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5" />
            Sikker historikk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Sensitiv data som kontaktinformasjon, priser og personlige meldinger er automatisk 
            fjernet fra slettede bookinger for å beskytte personvernet. Kun metadata vises her.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrering og sortering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Søk</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Søk i tittel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sorter etter</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Nyeste først</SelectItem>
                  <SelectItem value="date_asc">Eldste først</SelectItem>
                  <SelectItem value="title_asc">Tittel A-Å</SelectItem>
                  <SelectItem value="title_desc">Tittel Å-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Viser {filteredBookings.length} av {historicalBookings.length} slettede bookinger
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {historicalBookings.length === 0 ? (
                <>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ingen historikk</h3>
                  <p className="text-muted-foreground">Du har ingen slettede bookinger ennå.</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ingen resultater</h3>
                  <p className="text-muted-foreground">Ingen bookinger matcher dine søkekriterier.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <HistoryCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Metadata Dialog */}
      {selectedBooking && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking metadata (Historikk)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Tittel</h3>
                <p>{selectedBooking.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <Badge variant="outline">Slettet</Badge>
                </div>
                <div>
                  <h3 className="font-semibold">Din rolle</h3>
                  <p>{selectedBooking.sender_id === profile.user_id ? 'Avsender' : 'Mottaker'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Opprettet</h3>
                  <p>{format(new Date(selectedBooking.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Slettet</h3>
                  <p>{format(new Date(selectedBooking.deleted_at || selectedBooking.updated_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>

              {selectedBooking.deletion_reason && (
                <div>
                  <h3 className="font-semibold">Slettingsårsak</h3>
                  <p>{selectedBooking.deletion_reason}</p>
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded">
                <p className="text-sm text-muted-foreground">
                  Sensitiv informasjon som kontaktdetaljer, priser og meldinger har blitt 
                  permanent fjernet for å beskytte personvernet.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};