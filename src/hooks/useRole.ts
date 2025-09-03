import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'maker' | 'goer';

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
        .single();

      if (profileError) throw profileError;

      setRole(profile?.role as UserRole || 'goer');
    } catch (err: any) {
      console.error('Error fetching user role:', err);
      setError(err.message);
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
    ismaker: role === 'maker',
    isGoer: role === 'goer',
    refresh: fetchRole 
  };
};