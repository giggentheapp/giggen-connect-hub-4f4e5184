import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Maker {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio: string | null;
  role: string;
  avatar_url: string | null;
  address: string | null;
  privacy_settings: any;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  is_address_public?: boolean;
  instruments?: Array<{ instrument: string; details: string }>;
}

export const useExploreMakers = (roleFilter?: 'musician' | 'organizer') => {
  const [makers, setMakers] = useState<Maker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMakers();
  }, [roleFilter]);

  const fetchMakers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the optimized database function instead of client-side filtering
      const { data, error: fetchError } = await supabase
        .rpc('get_public_artists_for_explore');

      if (fetchError) {
        console.error('Error fetching makers:', fetchError);
        setError(fetchError.message);
        return;
      }

      let filteredData = data || [];
      
      // Apply role filter if specified
      if (roleFilter) {
        filteredData = filteredData.filter((maker: Maker) => maker.role === roleFilter);
      }

      setMakers(filteredData);
    } catch (err) {
      console.error('Unexpected error fetching makers:', err);
      setError('Failed to load makers');
    } finally {
      setLoading(false);
    }
  };

  return { makers, loading, error, refetch: fetchMakers };
};
