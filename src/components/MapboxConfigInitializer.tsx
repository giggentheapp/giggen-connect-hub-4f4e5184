import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapboxConfigInitializerProps {
  accessToken: string;
  styleUrl: string;
  userId: string;
}

export const MapboxConfigInitializer = ({ accessToken, styleUrl, userId }: MapboxConfigInitializerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeConfig = async () => {
      if (isInitialized || isInitializing) return;
      
      try {
        setIsInitializing(true);
        console.log('🔧 Initializing Mapbox configuration...');
        
        // Save both access token and style URL to profile_settings
        const { error } = await supabase
          .from('profile_settings')
          .upsert({
            maker_id: userId,
            mapbox_access_token: accessToken,
            mapbox_style_url: styleUrl,
            // Keep existing settings or use defaults
            show_about: false,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false,
            show_on_map: false,
          });

        if (error) throw error;
        
        setIsInitialized(true);
        toast({
          title: "Mapbox konfigurert!",
          description: "Din access token og style URL er lagret og aktivert",
        });

        console.log('✅ Mapbox configuration saved successfully');
        
        // Force refresh after a short delay to load new configuration
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error: any) {
        console.error('❌ Error initializing Mapbox config:', error);
        toast({
          title: "Feil ved Mapbox-konfigurering",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConfig();
  }, [accessToken, styleUrl, userId, isInitialized, isInitializing, toast]);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center p-6 bg-card rounded-lg border shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="font-semibold mb-2">Konfigurerer Mapbox</h3>
          <p className="text-sm text-muted-foreground">Lagrer din access token og style URL...</p>
        </div>
      </div>
    );
  }

  return null;
};
