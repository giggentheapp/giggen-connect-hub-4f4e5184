import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface UserDraft {
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
  door_deal?: boolean;
  door_percentage?: number | null;
  price_by_agreement?: boolean;
}

export const useUserDrafts = (userId: string | undefined) => {
  const [drafts, setDrafts] = useState<UserDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    if (!userId) {
      setDrafts([]);
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
        .eq('is_published', false)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDrafts(data || []);
    } catch (err: unknown) {
      logger.error('Failed to fetch user drafts', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [userId]);

  return { drafts, loading, error, refetch: fetchDrafts };
};
