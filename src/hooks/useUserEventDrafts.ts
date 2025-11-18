import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EventDraft {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  date: string;
  time: string | null;
  event_datetime: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  ticket_price: number | null;
  has_paid_tickets: boolean | null;
  expected_audience: number | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
  is_public: boolean | null;
  participants: any;
  portfolio_id: string | null;
}

export const useUserEventDrafts = (userId: string | undefined) => {
  const [drafts, setDrafts] = useState<EventDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events_market')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDrafts(data || []);
      
      if (data?.length === 0) {
        console.warn('No event drafts found for user. Query executed correctly.');
      }
    } catch (err: unknown) {
      logger.error('Failed to fetch event drafts', err);
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
