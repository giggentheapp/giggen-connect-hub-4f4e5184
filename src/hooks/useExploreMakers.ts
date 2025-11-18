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
  instruments?: any; // jsonb from Supabase
  contact_info?: any;
  social_media_links?: any;
  updated_at?: string;
  username_changed?: boolean;
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

      // Fetch all profiles with the specified role that have complete profiles
      // A complete profile requires: avatar_url, display_name, and bio to be filled
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', roleFilter || 'musician')
        .not('avatar_url', 'is', null)
        .not('bio', 'is', null)
        .neq('display_name', '')
        .neq('bio', '')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching makers:', fetchError);
        setError(fetchError.message);
        return;
      }

      setMakers((data || []) as Maker[]);
    } catch (err) {
      console.error('Unexpected error fetching makers:', err);
      setError('Failed to load makers');
    } finally {
      setLoading(false);
    }
  };

  return { makers, loading, error, refetch: fetchMakers };
};
