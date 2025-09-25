import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { Button } from '@/components/ui/button';
import { Music, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EventPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const EventPortfolioModal = ({ isOpen, onClose, eventId, eventTitle }: EventPortfolioModalProps) => {
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchMakerProfile();
    }
  }, [isOpen, eventId]);

  const fetchMakerProfile = async () => {
    try {
      setLoading(true);

      // Fetch event details first to get maker info
      const { data: eventData, error: eventError } = await supabase
        .from('events_market')
        .select('created_by')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Fetch maker profile
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_secure_profile_data', { target_user_id: eventData.created_by })
        .maybeSingle();

      if (profileError) throw profileError;
      
      setMakerProfile(profileData);
    } catch (error) {
      console.error('Error fetching maker profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Portefølje for "{eventTitle}"
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster portefølje...</p>
            </div>
          </div>
        ) : makerProfile ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{makerProfile.display_name}</h3>
                <p className="text-sm text-muted-foreground">Artist/Maker</p>
                {makerProfile.bio && (
                  <p className="text-sm mt-1">{makerProfile.bio}</p>
                )}
              </div>
            </div>

            <ProfilePortfolioViewer 
              userId={makerProfile.user_id} 
              isOwnProfile={false}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Kunne ikke laste portefølje</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Lukk</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};