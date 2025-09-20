import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapboxConfig {
  accessToken: string | null;
  styleUrl: string;
}

export const useMapboxConfig = (userId?: string) => {
  const [config, setConfig] = useState<MapboxConfig>({
    accessToken: null,
    styleUrl: 'mapbox://styles/mapbox/light-v11'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchMapboxConfig();
  }, [userId]);

  const fetchMapboxConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get user's custom mapbox config first
      const { data: userConfig, error: userError } = await supabase
        .from('profile_settings')
        .select('mapbox_access_token, mapbox_style_url')
        .eq('maker_id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // If user has custom config, use it
      if (userConfig?.mapbox_access_token) {
        setConfig({
          accessToken: userConfig.mapbox_access_token,
          styleUrl: userConfig.mapbox_style_url || 'mapbox://styles/mapbox/light-v11'
        });
        return;
      }

      // Fallback to system-wide token from edge function
      const { data: systemToken, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (tokenError) throw tokenError;

      setConfig({
        accessToken: systemToken.token,
        styleUrl: 'mapbox://styles/mapbox/light-v11'
      });

    } catch (err: any) {
      console.error('Error fetching mapbox config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, error, refetch: fetchMapboxConfig };
};