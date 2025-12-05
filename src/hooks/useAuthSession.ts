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

    // Get initial session FIRST before subscribing
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes - ONLY update state, no navigation logic
    // Use a ref to prevent duplicate event handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        // Only update if session actually changed
        setSession(prev => {
          if (prev?.access_token === session?.access_token) return prev;
          return session;
        });
        setUser(prev => {
          if (prev?.id === session?.user?.id) return prev;
          return session?.user ?? null;
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};
