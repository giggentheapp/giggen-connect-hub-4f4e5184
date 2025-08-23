import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  is_public: boolean;
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
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  return { files, loading, error, refetch: fetchPortfolio };
};