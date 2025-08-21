import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';

const MapTestButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const enableMapVisibility = async () => {
    setIsUpdating(true);
    try {
      console.log('[MAPBOX-ERROR] Enabling map visibility for current user...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Feil",
          description: "Du må være innlogget for å aktivere kartsynlighet",
          variant: "destructive",
        });
        return;
      }

      // Update or create profile settings
      const { error } = await supabase
        .from('profile_settings')
        .upsert({ 
          maker_id: user.id, 
          show_on_map: true 
        }, { onConflict: 'maker_id' });

      if (error) {
        console.error('[MAPBOX-ERROR] Failed to update map visibility:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke aktivere kartsynlighet",
          variant: "destructive",
        });
      } else {
        console.log('[MAPBOX-ERROR] Map visibility enabled successfully');
        toast({
          title: "Aktivert!",
          description: "Du er nå synlig på kartet. Oppdater siden for å se endringene.",
        });
      }
    } catch (error: any) {
      console.error('[MAPBOX-ERROR] Error enabling map visibility:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke aktivere kartsynlighet",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button 
      onClick={enableMapVisibility} 
      disabled={isUpdating}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      <MapPin className="h-4 w-4 mr-2" />
      {isUpdating ? 'Aktiverer...' : 'Aktiver kartsynlighet (test)'}
    </Button>
  );
};

export default MapTestButton;