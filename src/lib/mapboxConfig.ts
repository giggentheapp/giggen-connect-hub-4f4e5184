import { supabase } from '@/integrations/supabase/client';

export const updateMapboxConfig = async (styleUrl: string) => {
  const { data, error } = await supabase.functions.invoke('update-mapbox-config', {
    body: { styleUrl }
  });

  if (error) {
    throw new Error(error.message || 'Failed to update Mapbox configuration');
  }

  return data;
};