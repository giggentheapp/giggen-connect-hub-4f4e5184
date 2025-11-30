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

  // Redirect to auth if not logged in - handle race condition for new signups
  useEffect(() => {
    // Don't redirect if we're already on auth page
    if (window.location.pathname === '/auth') {
      return;
    }
    
    // If loading, wait
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
    
    // Only redirect if no user at all (not authenticated)
    if (!data?.user) {
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
