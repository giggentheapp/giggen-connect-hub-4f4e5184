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

  // Redirect to auth if not logged in - handle race condition for new signups
  useEffect(() => {
    // Don't redirect if we're on auth, onboarding, or root
    const pathname = window.location.pathname;
    if (pathname === '/auth' || pathname === '/onboarding' || pathname === '/') {
      return;
    }
    
    // If loading, wait - don't redirect prematurely
    if (isLoading) {
      return;
    }
    
    // If user exists but profile doesn't, wait and retry (for new signups)
    // Database trigger might need time to create profile
    if (data?.user && !data?.profile) {
      logger.debug('User exists but profile missing, waiting for trigger...');
      // Wait 2 seconds and retry once for new signups
      const retryTimer = setTimeout(() => {
        logger.debug('Retrying profile fetch after delay');
        refetch();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
    
    // Only redirect if no user at all (not authenticated) AND we're done loading
    if (!data?.user && !isLoading) {
      logger.debug('No user found, redirecting to auth');
      navigate('/auth');
    }
  }, [data?.user, data?.profile, isLoading, navigate, refetch]);

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
