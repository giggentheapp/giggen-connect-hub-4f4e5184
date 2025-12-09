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

/**
 * Valid section names for profile pages
 */
export const VALID_SECTIONS = [
  'dashboard',
  'profile',
  'explore',
  'bookings',
  'tickets',
  'upcoming-events',
  'history',
  'admin-files',
  'filbank',
  'admin-concepts',
  'admin-bands',
  'admin-events',
  'settings'
] as const;

export type ProfileSection = typeof VALID_SECTIONS[number];

/**
 * Validate if a section name is valid
 * 
 * @param section - Section name to validate
 * @returns boolean indicating if section is valid
 */
export const isValidSection = (section: string | null | undefined): section is ProfileSection => {
  if (!section) return false;
  return VALID_SECTIONS.includes(section as ProfileSection);
};

/**
 * Get valid section from URL or return default
 * 
 * @param location - React Router location object
 * @param defaultSection - Default section if not found or invalid (default: 'dashboard')
 * @returns Valid section name
 */
export const getValidSectionFromUrl = (
  location: Location,
  defaultSection: ProfileSection = 'dashboard'
): ProfileSection => {
  const section = getSectionFromUrl(location, defaultSection);
  return isValidSection(section) ? section : defaultSection;
};

/**
 * Check if user should be redirected to auth
 * 
 * Standardized pattern for checking auth state before redirecting
 * 
 * @param session - Current session from useAuthSession
 * @param sessionLoading - Loading state from useAuthSession
 * @param user - Current user from useCurrentUser (optional, for additional check)
 * @param userLoading - Loading state from useCurrentUser (optional)
 * @returns boolean indicating if redirect should happen
 */
export const shouldRedirectToAuth = (
  session: any,
  sessionLoading: boolean,
  user?: any,
  userLoading?: boolean
): boolean => {
  // Wait for loading to complete
  if (sessionLoading || (userLoading !== undefined && userLoading)) {
    return false; // Still loading, don't redirect yet
  }
  
  // If no session, definitely redirect
  if (!session) {
    return true;
  }
  
  // If session exists but user query failed after loading, consider redirect
  if (user === undefined) {
    return false; // User check not provided, rely on session only
  }
  
  if (session && !user && !userLoading) {
    // Session exists but user query returned null - wait a bit before redirecting
    // This handles race conditions during login
    return false; // Don't redirect immediately, let component handle retry
  }
  
  return false; // User is authenticated
};
