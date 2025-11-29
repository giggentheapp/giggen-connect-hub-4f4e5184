import { useQuery } from '@tanstack/react-query';
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

  // Handle auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state changed', { event, hasSession: !!session });
      
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refetch();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, refetch]);

  // Redirect to auth if not logged in (but not if we're already on auth page)
  useEffect(() => {
    // Skip all redirect logic if we're on the auth page
    if (window.location.pathname === '/auth') {
      return;
    }
    
    // If loading, wait
    if (isLoading) {
      return;
    }
    
    // Only redirect if no user at all
    if (!data?.user) {
      logger.debug('No user found, redirecting to auth');
      navigate('/auth');
    }
  }, [data?.user, isLoading, navigate]);

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
