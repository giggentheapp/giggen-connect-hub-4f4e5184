import { useEffect, useState } from 'react';
import { updateMapboxConfig } from '@/lib/mapboxConfig';
import { useToast } from '@/hooks/use-toast';

interface MapboxConfigUpdaterProps {
  styleUrl: string;
}

export const MapboxConfigUpdater = ({ styleUrl }: MapboxConfigUpdaterProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updateConfig = async () => {
      if (isUpdated || isUpdating) return;
      
      try {
        setIsUpdating(true);
        console.log('🗺️ Updating Mapbox style URL:', styleUrl);
        
        await updateMapboxConfig(styleUrl);
        
        setIsUpdated(true);
        toast({
          title: "Mapbox konfigurert!",
          description: "Din custom style URL er lagret og aktivert på alle kart",
        });

        // Force a page refresh to load new map styles
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (error: any) {
        console.error('❌ Error updating Mapbox config:', error);
        toast({
          title: "Feil ved konfigurering",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsUpdating(false);
      }
    };

    updateConfig();
  }, [styleUrl, isUpdated, isUpdating, toast]);

  if (isUpdating) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="font-semibold mb-2">Konfigurerer Mapbox</h3>
          <p className="text-sm text-muted-foreground">Lagrer din custom style URL...</p>
        </div>
      </div>
    );
  }

  return null;
};