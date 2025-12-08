import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to manage Supabase authentication session state
 * 
 * This hook ONLY manages session state - no navigation or mode switching logic.
 * It provides a single source of truth for the current user and session.
 * 
 * Handles:
 * - Current user state
 * - Session state
 * - Loading state
 * - Auth state change subscriptions (state updates only)
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

    // Subscribe to auth state changes FIRST - this ensures we catch any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        // Update state on any auth change
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If we get any event, we're no longer loading
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      
      // If there's an auth error (like invalid refresh token), clear the session
      if (error) {
        console.warn('Session error, clearing invalid session:', error.message);
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};
