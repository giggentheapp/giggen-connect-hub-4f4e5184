import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useCurrentUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.profiles.current,
    queryFn: async () => {
      try {
        return await profileService.getCurrentUser();
      } catch (err) {
        logger.error('Failed to fetch current user', err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle auth state changes - use ref to prevent duplicate subscriptions
  useEffect(() => {
    let isSubscribed = true;
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;
      
      // Only log once per event type
      if (event === 'SIGNED_OUT') {
        queryClient.removeQueries({ queryKey: queryKeys.profiles.current });
        navigate('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        // Only refetch on token refresh, not on every event
        refetch();
      }
    });

    return () => {
      isSubscribed = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate, queryClient]); // Remove refetch from deps to prevent re-subscription

  // Note: Redirect logic removed from this hook - each page handles its own redirects
  // This prevents race conditions during login where the query hasn't finished loading yet

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Feil ved lasting av profil',
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    loading: isLoading,
    error,
    refetch,
  };
};
