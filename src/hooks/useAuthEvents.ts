import { useEffect } from 'react';
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

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth event:', event, session ? 'has session' : 'no session');

        // Handle password recovery - show reset form
        if (event === 'PASSWORD_RECOVERY') {
          onPasswordRecovery();
          return;
        }

        // Handle sign out - return to login
        if (event === 'SIGNED_OUT') {
          onSignOut();
          return;
        }

        // Handle successful sign in - navigate to dashboard
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
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
