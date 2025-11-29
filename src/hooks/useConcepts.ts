import { useQuery } from '@tanstack/react-query';
import { conceptService } from '@/services/conceptService';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';

export const useConcepts = (userId: string | undefined, includeDrafts: boolean = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.concepts.user(userId || ''), includeDrafts],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const concepts = await conceptService.getUserConcepts(userId, includeDrafts);
        
        logger.debug('Concepts fetched', {
          userId,
          total: concepts.length,
          published: concepts.filter(c => c.is_published).length,
          unpublished: concepts.filter(c => !c.is_published).length,
        });
        
        return concepts;
      } catch (err) {
        logger.error('Failed to fetch concepts', { userId, error: err });
        throw err;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    concepts: data || [],
    loading: isLoading,
    error,
    refetch,
  };
};
