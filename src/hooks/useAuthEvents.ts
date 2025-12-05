import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Callbacks for different auth state change events
 */
interface AuthEventCallbacks {
  onPasswordRecovery: () => void;
  onSignOut: () => void;
  onSignIn: (userId: string) => Promise<void>;
}

/**
 * Custom hook to handle Supabase authentication state change events
 * 
 * Consolidates all auth event handling in a single subscription to avoid
 * duplicate listeners and race conditions. Provides callbacks for different
 * auth events.
 * 
 * @param {AuthEventCallbacks} callbacks - Callback functions for auth events
 * @param {Function} callbacks.onPasswordRecovery - Called when PASSWORD_RECOVERY event fires
 * @param {Function} callbacks.onSignOut - Called when SIGNED_OUT event fires
 * @param {Function} callbacks.onSignIn - Called when SIGNED_IN or INITIAL_SESSION event fires
 */
export const useAuthEvents = (callbacks: AuthEventCallbacks) => {
  const { onPasswordRecovery, onSignOut, onSignIn } = callbacks;
  const lastProcessedEventRef = useRef<{ event: string; userId?: string; timestamp: number } | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Guard against duplicate events with debouncing
        const now = Date.now();
        const lastEvent = lastProcessedEventRef.current;
        
        // Skip if same event type and user within 2 seconds
        if (
          lastEvent &&
          lastEvent.event === event &&
          lastEvent.userId === session?.user?.id &&
          now - lastEvent.timestamp < 2000
        ) {
          return;
        }

        // Handle password recovery - show reset form
        if (event === 'PASSWORD_RECOVERY') {
          lastProcessedEventRef.current = { event, userId: undefined, timestamp: now };
          onPasswordRecovery();
          return;
        }

        // Handle sign out - return to login
        if (event === 'SIGNED_OUT') {
          lastProcessedEventRef.current = { event, userId: undefined, timestamp: now };
          onSignOut();
          return;
        }

        // Handle successful sign in - navigate to dashboard (only SIGNED_IN, not INITIAL_SESSION)
        if (session?.user && event === 'SIGNED_IN') {
          lastProcessedEventRef.current = {
            event,
            userId: session.user.id,
            timestamp: now
          };
          await onSignIn(session.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onPasswordRecovery, onSignOut, onSignIn]);
};
