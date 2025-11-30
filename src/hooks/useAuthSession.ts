import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to manage Supabase authentication session state
 * 
 * Handles:
 * - Current user state
 * - Session state
 * - Loading state
 * - Auth state change subscriptions
 * 
 * @returns {Object} Auth session state
 * @returns {User | null} user - Current authenticated user
 * @returns {Session | null} session - Current session
 * @returns {boolean} loading - Whether auth state is being loaded
 */
export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session ? 'has session' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};
