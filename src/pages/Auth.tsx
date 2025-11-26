import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { User, Session } from '@supabase/supabase-js';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import FirstLoginFeedback from '@/components/FirstLoginFeedback';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session ? 'has session' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle password recovery - ONLY show reset form
        if (event === 'PASSWORD_RECOVERY') {
          setIsResettingPassword(true);
          setIsForgotPassword(false);
          setIsLogin(false);
          setLoading(false);
          return;
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setIsResettingPassword(false);
          setIsForgotPassword(false);
          setIsLogin(true);
          setLoading(false);
          return;
        }
        
        // Handle successful sign in - Navigate to dashboard
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          // Reset password recovery mode
          setIsResettingPassword(false);
          setIsForgotPassword(false);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', session.user.id)
            .single();
          
          const dashboardUrl = profile ? `/profile/${profile.user_id}?section=dashboard` : '/auth';
          
          // Check if first login
          const feedbackSubmitted = localStorage.getItem('feedback_submitted');
          const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
          
          if (hasSeenOnboarding === 'true' && feedbackSubmitted !== 'true') {
            setShowFeedback(true);
            setLoading(false);
          } else {
            navigate(dashboardUrl, { replace: true });
          }
        } else {
          setLoading(false);
        }
      }
    );

    // Initial session check
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
  }, [navigate]);

  if (loading) {
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
  if (showFeedback) {
    return (
      <FirstLoginFeedback 
        onComplete={async () => {
          setShowFeedback(false);
          
          // Get user profile to navigate to correct URL
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .single();
            
            const dashboardUrl = profile ? `/profile/${profile.user_id}?section=dashboard` : '/auth';
            navigate(dashboardUrl);
          }
        }} 
      />
    );
  }

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
            {isLogin ? t('loginToAccount') : t('createNewAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isResettingPassword ? (
            <PasswordResetForm 
              onSuccess={() => setIsResettingPassword(false)}
            />
          ) : isForgotPassword ? (
            <ForgotPasswordForm 
              onSuccess={() => setIsForgotPassword(false)}
              onCancel={() => setIsForgotPassword(false)}
            />
          ) : isLogin ? (
            <LoginForm 
              onSuccess={() => {}}
              onSwitchToSignup={() => setIsLogin(false)}
              onForgotPassword={() => setIsForgotPassword(true)}
            />
          ) : (
            <SignUpForm 
              onSuccess={() => {}}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
