import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useAuthMode } from '@/hooks/useAuthMode';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useAuthEvents } from '@/hooks/useAuthEvents';
import giggenLogo from '@/assets/giggen-logo.png';
import FirstLoginFeedback from '@/components/FirstLoginFeedback';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

const Auth = () => {
  const { t } = useAppTranslation();
  const { authMode, goToLogin, goToSignup, goToForgotPassword, goToResetPassword, goToFeedback } = useAuthMode();
  const { session, loading } = useAuthSession();
  const { navigateToDashboard, completeFeedbackAndNavigate, isNavigating } = useAuthNavigation();

  // Check for password reset token in URL hash
  const checkPasswordResetToken = useCallback(() => {
    const hash = window.location.hash;
    if (hash) {
      // Supabase password reset links have format: #access_token=...&type=recovery&...
      const params = new URLSearchParams(hash.substring(1)); // Remove #
      const type = params.get('type');
      const accessToken = params.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        return true;
      }
    }
    return false;
  }, []);

  // Handle password reset token on mount
  useEffect(() => {
    if (checkPasswordResetToken()) {
      goToResetPassword();
    }
  }, [checkPasswordResetToken, goToResetPassword]);

  // Handle all auth state changes in one place
  useAuthEvents({
    onPasswordRecovery: () => {
      goToResetPassword();
    },
    onSignOut: () => {
      goToLogin();
    },
    onSignIn: async (userId: string) => {
      // Don't redirect if this is a password reset flow
      if (checkPasswordResetToken()) {
        goToResetPassword();
        return;
      }
      const shouldShowFeedback = await navigateToDashboard(userId);
      if (shouldShowFeedback) {
        goToFeedback();
      }
    }
  });

  // If already logged in when visiting /auth, redirect to dashboard
  // BUT: Don't redirect if there's a password reset token in the URL
  useEffect(() => {
    if (loading || isNavigating) return;
    
    // Don't redirect if there's a password reset token
    if (checkPasswordResetToken()) {
      return; // Let the password reset form show
    }
    
    // Only redirect to dashboard if user is logged in and no password reset token
    if (session?.user) {
      navigateToDashboard(session.user.id);
    }
  }, [loading, session, navigateToDashboard, isNavigating, checkPasswordResetToken]);

  // Show loading state while checking auth or navigating
  if (loading || isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show feedback form after first login
  if (authMode === 'feedback') {
    return (
      <FirstLoginFeedback 
        onComplete={completeFeedbackAndNavigate} 
      />
    );
  }

  // Render appropriate form based on auth mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mobile-optimized">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={giggenLogo} 
              alt="GIGGEN" 
              className="h-32 w-auto md:h-28 drop-shadow-2xl"
            />
          </div>
          <CardDescription className="text-base md:text-sm">
            {authMode === 'login' ? t('loginToAccount') : t('createNewAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authMode === 'reset-password' ? (
            <PasswordResetForm 
              onSuccess={goToLogin}
            />
          ) : authMode === 'forgot-password' ? (
            <ForgotPasswordForm 
              onSuccess={goToLogin}
              onCancel={goToLogin}
            />
          ) : authMode === 'login' ? (
            <LoginForm 
              onSuccess={() => {}}
              onSwitchToSignup={goToSignup}
              onForgotPassword={goToForgotPassword}
            />
          ) : (
            <SignUpForm 
              onSuccess={() => {}}
              onSwitchToLogin={goToLogin}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
