import { useState, useCallback } from 'react';

/**
 * Authentication mode representing different states of the auth flow
 */
export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'feedback';

/**
 * Custom hook to manage authentication mode state
 * 
 * Replaces multiple boolean states with a single mode state for better maintainability.
 * Provides helper functions for easy navigation between different auth modes.
 * 
 * @returns {Object} Auth mode state and navigation functions
 * @returns {AuthMode} authMode - Current authentication mode
 * @returns {Function} setAuthMode - Direct setter for auth mode
 * @returns {Function} goToLogin - Navigate to login mode
 * @returns {Function} goToSignup - Navigate to signup mode
 * @returns {Function} goToForgotPassword - Navigate to forgot password mode
 * @returns {Function} goToResetPassword - Navigate to reset password mode
 * @returns {Function} goToFeedback - Navigate to feedback mode
 */
export const useAuthMode = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const goToLogin = useCallback(() => setAuthMode('login'), []);
  const goToSignup = useCallback(() => setAuthMode('signup'), []);
  const goToForgotPassword = useCallback(() => setAuthMode('forgot-password'), []);
  const goToResetPassword = useCallback(() => setAuthMode('reset-password'), []);
  const goToFeedback = useCallback(() => setAuthMode('feedback'), []);

  return {
    authMode,
    setAuthMode,
    goToLogin,
    goToSignup,
    goToForgotPassword,
    goToResetPassword,
    goToFeedback,
  };
};
