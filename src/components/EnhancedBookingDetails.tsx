import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedBookingDetailsPanel } from './EnhancedBookingDetailsPanel';
import { BookingConfirmation } from './BookingConfirmation';
import { BookingAgreement } from './BookingAgreement';
import { ProfilePortfolioViewer } from './ProfilePortfolioViewer';
import { useToast } from '@/hooks/use-toast';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { AlertTriangle, Check, X, FileText, Eye, Trash2, Save, Calendar, MapPin } from 'lucide-react';
import { canBeEditedByParties, BookingStatus } from '@/lib/bookingStatus';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    updateBookingInParent?: (id: string, updates: any) => void;
  }
}
interface EnhancedBookingDetailsProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}
export const EnhancedBookingDetails = ({
  bookingId,
  isOpen,
  onClose
}: EnhancedBookingDetailsProps) => {
  const [booking, setBooking] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const { toast } = useToast();
  
  // Get maker's data for portfolio, tech specs, and hospitality riders
  const makerId = booking?.receiver_id;
  const { files: techSpecFiles } = useProfileTechSpecs(makerId);
  const { files: hospitalityFiles } = useHospitalityRiders(makerId);
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);
  useEffect(() => {
    const fetchBooking = async () => {
      if (!isOpen || !bookingId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        if (error) throw error;
        setBooking(data);
        
        // Set up callback for immediate updates
        window.updateBookingInParent = (id: string, updates: any) => {
          if (id === bookingId) {
            setBooking(prev => ({
              ...prev,
              ...updates
            }));
          }
        };
      } catch (error: any) {
        toast({
          title: "Feil ved lasting av booking",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
    
    // Cleanup callback on unmount
    return () => {
      delete window.updateBookingInParent;
    };
  }, [bookingId, isOpen, toast]);

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!booking?.id) return;
    const channel = supabase.channel('enhanced-booking-updates').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookings',
      filter: `id=eq.${booking.id}`
    }, payload => {
      console.log('🔄 Real-time booking update received:', payload.new);
      setBooking(payload.new);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id]);
  if (!isOpen) return null;
  if (loading) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster booking...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  if (!booking || !currentUserId) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Booking ikke funnet eller ingen tilgang</p>
          </div>
        </DialogContent>
      </Dialog>;
  }
  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const canEdit = canBeEditedByParties(booking.status as BookingStatus) || booking.status === 'approved_by_both' || booking.status === 'upcoming';
  const isNegotiationPhase = booking.status === 'approved_by_both';
  const isConfirmationPhase = booking.status === 'upcoming';
  const isPublished = booking.status === 'published';
  const bothConfirmed = booking.sender_confirmed && booking.receiver_confirmed;
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Venter på svar'
        };
      case 'approved_by_sender':
        return {
          color: 'bg-orange-100 text-orange-800',
          label: 'Godkjent av avsender'
        };
      case 'approved_by_receiver':
        return {
          color: 'bg-orange-100 text-orange-800',
          label: 'Godkjent av mottaker'
        };
      case 'approved_by_both':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Godkjent - Kan redigeres'
        };
      case 'upcoming':
        return {
          color: 'bg-purple-100 text-purple-800',
          label: 'Klar for publisering'
        };
      case 'published':
        return {
          color: 'bg-green-100 text-green-800',
          label: 'Publisert'
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Gjennomført'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800',
          label: 'Avlyst'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          label: status
        };
    }
  };
  const statusInfo = getStatusInfo(booking.status);
  return <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="bg-slate-200">
                <DialogTitle className="text-xl bg-slate-200">{booking.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                  {isSender && <Badge variant="outline">Du er avsender</Badge>}
                  {isReceiver && <Badge variant="outline">Du er mottaker</Badge>}
                </div>
              </div>
              
              <div className="flex gap-2">
                {/* Buttons removed since main content now shows the agreement */}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-4">
              {/* Agreement Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avtale status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {booking.sender_read_agreement ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>Avsender har lest avtale</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {booking.receiver_read_agreement ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>Mottaker har lest avtale</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Arrangementsdetaljer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{booking.title}</h3>
                    {booking.description && (
                      <p className="text-muted-foreground mb-4">{booking.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {booking.event_date && (
                      <p>{new Date(booking.event_date).toLocaleDateString('no-NO')} {booking.time && booking.time}</p>
                    )}
                    
                    {booking.address && (
                      <p>{booking.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prising</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="text-sm text-muted-foreground">Musiker honorar:</span>
                    <p className="font-medium">
                      {booking.door_deal ? (
                        `${booking.door_percentage}% av dørinntekter`
                      ) : booking.by_agreement ? (
                        'Avtales direkte mellom partene'
                      ) : (
                        booking.artist_fee || booking.price_musician || 'Ikke spesifisert'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              {makerId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Portefølje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfilePortfolioViewer userId={makerId} isOwnProfile={false} />
                  </CardContent>
                </Card>
              )}

              {/* Tech Specs */}
              {techSpecFiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tekniske spesifikasjoner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {techSpecFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.mime_type} • {Math.round((file.file_size || 0) / 1024)} KB
                            </p>
                          </div>
                          <a 
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Last ned
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hospitality Rider */}
              {hospitalityFiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hospitality Rider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hospitalityFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.mime_type} • {Math.round((file.file_size || 0) / 1024)} KB
                            </p>
                          </div>
                          <a 
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Last ned
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legal Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Juridiske vilkår</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded bg-muted/50">
                    <h4 className="font-medium mb-2">Avtalevilkår</h4>
                    <div className="space-y-2 text-sm">
                      <p>• Begge parter er forpliktet til å overholde de avtalevilkår som er spesifisert i denne bookingen.</p>
                      <p>• Eventuell kansellering må skje i rimelig tid og i samsvar med gjeldende lover og regler.</p>
                      <p>• Alle priser er inkludert mva der det er aktuelt.</p>
                      <p>• Tekniske spesifikasjoner og hospitality rider må overholdes av arrangør.</p>
                      <p>• Ved publisering blir arrangementet synlig for allmennheten med offentlig informasjon.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded bg-orange-50/30 dark:bg-orange-950/10">
                    <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">Viktig informasjon</h4>
                    <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                      <p>• Når arrangementet publiseres, vil følgende informasjon bli synlig for allmennheten:</p>
                      <p className="ml-4">- Tittel og beskrivelse</p>
                      <p className="ml-4">- Dato, klokkeslett og sted</p>
                      <p className="ml-4">- Billettpris (hvis satt)</p>
                      <p className="ml-4">- Portefølje og forventet publikum</p>
                      <p>• Sensitiv informasjon som musiker honorar, tech spec og hospitality rider forblir privat.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t mt-6">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="read-agreement"
                    checked={false}
                    onCheckedChange={() => {}}
                  />
                  <span className="text-sm">Jeg har lest alt</span>
                </div>
                <Button variant="outline" onClick={onClose}>
                  Lukk
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};