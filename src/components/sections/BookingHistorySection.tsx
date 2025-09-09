import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { BookingDetails } from '@/components/BookingDetails';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, DollarSign, Search, Filter, Eye, Trash2, Clock, Ban } from 'lucide-react';
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

interface BookingHistorySectionProps {
  profile: UserProfile;
}

export const BookingHistorySection = ({ profile }: BookingHistorySectionProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historicalBookings, setHistoricalBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  const { fetchHistorical } = useBookings(profile.user_id);
  const { toast } = useToast();

  // Fetch historical bookings
  useEffect(() => {
    const loadHistoricalBookings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`)
          .in('status', ['cancelled'])
          .order('updated_at', { ascending: false });

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
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Sort bookings
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        break;
      case 'title_asc':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
    }

    setFilteredBookings(filtered);
  }, [historicalBookings, searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rejected': return 'Avvist';
      case 'cancelled': return 'Avlyst';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rejected': return Ban;
      case 'cancelled': return Clock;
      default: return Clock;
    }
  };

  const handlePermanentDelete = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking slettet permanent",
        description: "Bookingen har blitt permanent fjernet fra historikken",
      });
      
      // Remove from local state
      setHistoricalBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const BookingHistoryCard = ({ booking }: { booking: any }) => {
    const StatusIcon = getStatusIcon(booking.status);
    const isSender = booking.sender_id === profile.user_id;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <StatusIcon className="h-5 w-5 text-muted-foreground" />
                {booking.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={isSender ? 'default' : 'secondary'}>
                  {isSender ? 'Sendt av deg' : 'Mottatt av deg'}
                </Badge>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            {booking.description && (
              <p className="text-muted-foreground line-clamp-2">{booking.description}</p>
            )}
            
            {booking.event_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
              </div>
            )}
            
            {booking.venue && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.venue}</span>
              </div>
            )}
            
            {(booking.price_musician || booking.price_ticket) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  {booking.price_musician && `Musiker: ${booking.price_musician}`}
                  {booking.price_musician && booking.price_ticket && ' • '}
                  {booking.price_ticket && `Billett: ${booking.price_ticket}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-4">
                <span>Opprettet: {format(new Date(booking.created_at), 'dd.MM.yyyy')}</span>
                <span>{getStatusText(booking.status)}: {format(new Date(booking.updated_at), 'dd.MM.yyyy')}</span>
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
                  Se detaljer
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
                      <AlertDialogTitle>Slett permanent?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Denne handlingen kan ikke angres. Bookingen vil bli permanent fjernet fra historikken din.
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrering og sortering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Søk</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Søk i tittel, beskrivelse, spillested..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="rejected">Avvist</SelectItem>
                  <SelectItem value="cancelled">Avlyst</SelectItem>
                </SelectContent>
              </Select>
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
            Viser {filteredBookings.length} av {historicalBookings.length} historiske bookinger
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {historicalBookings.length === 0 ? (
                <>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ingen historikk</h3>
                  <p className="text-muted-foreground">Du har ingen avviste eller avlyste bookinger ennå.</p>
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
              <BookingHistoryCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking detaljer (Historikk)</DialogTitle>
            </DialogHeader>
            <BookingDetails 
              bookingId={selectedBooking.id} 
              onClose={() => setDetailsOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};