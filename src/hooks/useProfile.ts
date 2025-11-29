import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';

export const useProfile = (userId: string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.profiles.detail(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      try {
        return await profileService.getProfile(userId);
      } catch (err) {
        logger.error('Failed to fetch profile', { userId, error: err });
        throw err;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    profile: data,
    loading: isLoading,
    error,
    refetch,
  };
};
