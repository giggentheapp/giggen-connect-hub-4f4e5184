import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ProfilePortfolioFile {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  title?: string;
  description?: string;
  is_public?: boolean;
  bucket_name?: string;
  category?: string;
  thumbnail_path?: string | null;
}

export const useProfilePortfolio = (userId: string | undefined) => {
  const [files, setFiles] = useState<ProfilePortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    if (!userId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .ilike('file_path', 'portfolio/%')
        .order('created_at', { ascending: false });

      if (fetchError) {
        logger.error('Failed to fetch portfolio', fetchError);
        throw fetchError;
      }

      logger.debug('Portfolio fetched', { userId, count: data?.length || 0 });
      setFiles(data || []);
    } catch (err: unknown) {
      logger.error('Error fetching portfolio', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  return { files, loading, error, refetch: fetchPortfolio };
};