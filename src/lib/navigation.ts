import { NavigateFunction, Location } from 'react-router-dom';

/**
 * Centralized navigation utilities
 * 
 * All navigation logic should go through these functions to ensure
 * consistency and maintainability across the application.
 */

/**
 * Navigate to user dashboard
 * 
 * @param navigate - React Router navigate function
 * @param userId - User ID to navigate to
 * @param section - Optional section (default: 'dashboard')
 * @param replace - Whether to replace history entry (default: false for normal navigation)
 */
export const navigateToDashboard = (
  navigate: NavigateFunction,
  userId: string,
  section: string = 'dashboard',
  replace: boolean = false
): void => {
  const url = `/profile/${userId}?section=${section}`;
  navigate(url, { replace });
};

/**
 * Navigate to profile page
 * 
 * @param navigate - React Router navigate function
 * @param userId - User ID to navigate to
 * @param section - Optional section (default: 'profile')
 * @param replace - Whether to replace history entry (default: false)
 */
export const navigateToProfile = (
  navigate: NavigateFunction,
  userId: string,
  section: string = 'profile',
  replace: boolean = false
): void => {
  const url = `/profile/${userId}?section=${section}`;
  navigate(url, { replace });
};

/**
 * Navigate to auth page
 * 
 * Use replace: true for auth redirects (logout, session expired)
 * Use replace: false for normal navigation to login
 * 
 * @param navigate - React Router navigate function
 * @param replace - Whether to replace history entry (default: true for auth redirects)
 * @param reason - Optional reason for redirect (for logging/debugging)
 */
export const navigateToAuth = (
  navigate: NavigateFunction,
  replace: boolean = true,
  reason?: string
): void => {
  if (reason) {
    console.debug('Navigating to auth:', reason);
  }
  navigate('/auth', { replace });
};

/**
 * Smart back navigation that preserves history
 * 
 * Checks location.state for 'from' property first, then falls back to
 * browser history, then to fallback path.
 * 
 * @param navigate - React Router navigate function
 * @param location - React Router location object (for checking state)
 * @param fallback - Fallback path if no history (default: '/')
 */
export const navigateBack = (
  navigate: NavigateFunction,
  location: Location,
  fallback: string = '/'
): void => {
  // First check if we have navigation state with 'from' property
  const from = (location.state as any)?.from;
  if (from && typeof from === 'string') {
    navigate(from);
    return;
  }
  
  // Check if we have browser history
  const hasHistory = window.history.length > 1;
  if (hasHistory) {
    navigate(-1);
  } else {
    navigate(fallback);
  }
};

/**
 * Determine if navigation should use replace: true
 * 
 * Use replace: true for:
 * - Initial redirects (e.g., / -> /auth or /dashboard)
 * - Auth redirects (logout, session expired)
 * - URL corrections (fixing malformed URLs)
 * 
 * Use replace: false for:
 * - Normal user navigation (clicks, form submissions)
 * - Navigation that should be in history (back button should work)
 * 
 * @param isInitialRedirect - Is this an initial page load redirect?
 * @param isAuthRedirect - Is this an authentication-related redirect?
 * @param isUrlCorrection - Is this fixing a malformed URL?
 * @returns boolean indicating if replace should be true
 */
export const shouldUseReplace = (
  isInitialRedirect: boolean = false,
  isAuthRedirect: boolean = false,
  isUrlCorrection: boolean = false
): boolean => {
  return isInitialRedirect || isAuthRedirect || isUrlCorrection;
};

/**
 * Generate profile URL with section parameter
 * 
 * @param userId - User ID
 * @param section - Section name (default: 'dashboard')
 * @returns Formatted URL string
 */
export const getProfileUrl = (userId: string, section: string = 'dashboard'): string => {
  return `/profile/${userId}?section=${section}`;
};

/**
 * Generate bookings URL with optional tab parameter
 * 
 * Note: This returns a path that should redirect to profile page
 * This function exists for backward compatibility during migration
 * 
 * @param tab - Optional tab name (incoming, sent, ongoing, upcoming)
 * @returns Formatted URL string
 */
export const getBookingsUrl = (tab?: string): string => {
  if (tab) {
    return `/bookings?tab=${tab}`;
  }
  return '/bookings';
};

/**
 * Extract section from current URL
 * 
 * @param location - React Router location object
 * @param defaultSection - Default section if not found (default: 'dashboard')
 * @returns Section name from URL or default
 */
export const getSectionFromUrl = (
  location: Location,
  defaultSection: string = 'dashboard'
): string => {
  const params = new URLSearchParams(location.search);
  return params.get('section') || defaultSection;
};
