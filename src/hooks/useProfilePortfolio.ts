import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { queryKeys } from '@/lib/queryKeys';

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
  return useQuery({
    queryKey: [...queryKeys.files.profile(userId || ''), 'portfolio'],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error: fetchError } = await supabase
        .from('file_usage')
        .select(`
          file_id,
          user_files!inner(*)
        `)
        .eq('usage_type', 'profile_portfolio')
        .eq('reference_id', userId);

      if (fetchError) {
        logger.error('Failed to fetch portfolio', fetchError);
        throw fetchError;
      }

      // Transform the data - extract user_files from the join
      const files = data?.map(item => item.user_files).flat() || [];
      logger.debug('Portfolio fetched', { userId, count: files.length });
      
      return files as ProfilePortfolioFile[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: [], // Ensure stable array reference
  });
};