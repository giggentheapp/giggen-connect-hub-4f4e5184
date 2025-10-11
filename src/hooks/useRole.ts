import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type UserRole = 'organizer' | 'musician';

export const useRoleData = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error('Failed to fetch user profile', profileError);
        throw profileError;
      }

      setRole(profile?.role as UserRole || 'musician');
      logger.debug('User role loaded', { userId: user.id, role: profile?.role });
    } catch (err: unknown) {
      logger.error('Error fetching user role', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchRole();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { 
    role, 
    loading, 
    error, 
    isOrganizer: role === 'organizer',
    isMusician: role === 'musician',
    refresh: fetchRole 
  };
};