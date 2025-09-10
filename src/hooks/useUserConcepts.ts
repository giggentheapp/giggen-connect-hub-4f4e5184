import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserConcept {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  expected_audience: number | null;
  tech_spec: string | null;
  tech_spec_reference: string | null;
  hospitality_rider_reference: string | null;
  available_dates: any;
  is_published: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
  maker_id: string;
}

export const useUserConcepts = (userId: string | undefined) => {
  const [concepts, setConcepts] = useState<UserConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcepts = async () => {
    if (!userId) {
      setConcepts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('concepts')
        .select('*')
        .eq('maker_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConcepts(data || []);
    } catch (err: any) {
      console.error('Error fetching concepts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcepts();
  }, [userId]);

  return { concepts, loading, error, refetch: fetchConcepts };
};