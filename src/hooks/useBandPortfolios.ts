import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetch portfolios for multiple bands in one query
 * Used by BandExploreTab for batch fetching
 */
export const useBandPortfolios = (bandIds: string[]) => {
  return useQuery({
    queryKey: queryKeys.bands.portfolios(bandIds),
    queryFn: async () => {
      if (bandIds.length === 0) return {};

      const { data, error } = await supabase
        .from('band_portfolio')
        .select('*')
        .in('band_id', bandIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by band_id
      const grouped = (data || []).reduce((acc, portfolio) => {
        const bandId = portfolio.band_id;
        if (!acc[bandId]) {
          acc[bandId] = [];
        }
        acc[bandId].push(portfolio);
        return acc;
      }, {} as Record<string, any[]>);

      return grouped;
    },
    enabled: bandIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
