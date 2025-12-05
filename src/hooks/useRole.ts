import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export type UserRole = 'musician' | 'organizer' | 'artist' | 'audience';

export const useRoleData = () => {
  const queryClient = useQueryClient();
  
  const { data: role, isLoading: loading, error } = useQuery({
    queryKey: queryKeys.profiles.role,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      return (profile?.role as UserRole) || 'musician';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profiles.role });
  };

  return { 
    role: role ?? null, 
    loading, 
    error: error instanceof Error ? error.message : null, 
    isOrganizer: role === 'organizer',
    isMusician: role === 'musician',
    refresh,
  };
};
