import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useAuthMode } from '@/hooks/useAuthMode';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import giggenLogo from '@/assets/giggen-logo.png';
import FirstLoginFeedback from '@/components/FirstLoginFeedback';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

const Auth = () => {
  const { t } = useAppTranslation();
  const { authMode, goToLogin, goToSignup, goToForgotPassword, goToResetPassword, goToFeedback } = useAuthMode();
  const { user, session, loading } = useAuthSession();
  const { navigateToDashboard, completeFeedbackAndNavigate } = useAuthNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle auth state changes and mode transitions
  useEffect(() => {
    if (!session) return;

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Handle password recovery - show reset form
        if (event === 'PASSWORD_RECOVERY') {
          goToResetPassword();
          return;
        }

        // Handle sign out - return to login
        if (event === 'SIGNED_OUT') {
          goToLogin();
          return;
        }

        // Handle successful sign in - navigate to dashboard
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          goToLogin(); // Reset any password recovery state
          setIsNavigating(true);
          
          const shouldShowFeedback = await navigateToDashboard(session.user.id);
          
          if (shouldShowFeedback && mounted) {
            goToFeedback();
          }
          
          setIsNavigating(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [session, goToLogin, goToResetPassword, goToFeedback, navigateToDashboard]);

  // Loading state
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
        onComplete={async () => {
          await completeFeedbackAndNavigate();
        }} 
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
