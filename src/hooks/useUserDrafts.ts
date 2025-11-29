import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { UserConcept } from '@/types/concept';

export const useUserDrafts = (userId: string | undefined) => {
  const [drafts, setDrafts] = useState<UserConcept[]>([]);
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
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDrafts((data || []) as UserConcept[]);
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
