import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'maker' | 'goer';

export const useRoleData = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    try {
      console.log('🔍 useRole: Starting role fetch...');
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 useRole: Got user:', user ? user.id : 'None');
      
      if (!user) {
        console.log('❌ useRole: No user found, setting role to null');
        setRole(null);
        return;
      }

      console.log('📋 useRole: Fetching profile for user:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ useRole: Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('✅ useRole: Profile fetched:', profile);
      setRole(profile?.role as UserRole || 'goer');
    } catch (err: any) {
      console.error('❌ useRole: Error fetching user role:', err);
      setError(err.message);
      setRole(null);
    } finally {
      console.log('🏁 useRole: Fetch complete, setting loading to false');
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