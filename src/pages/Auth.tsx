import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';
import { Eye, EyeOff } from 'lucide-react';
import PasswordStrengthValidator from '@/components/PasswordStrengthValidator';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import FirstLoginFeedback from '@/components/FirstLoginFeedback';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'MUSIKER' | 'ARRANGØR'>('MUSIKER');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useAppTranslation();

  useEffect(() => {
    console.log('🔍 Auth.tsx: Setting up auth listener...');
    console.log('🔍 Auth.tsx: Current URL:', window.location.href);
    console.log('🔍 Auth.tsx: URL hash:', window.location.hash);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth.tsx: Auth state changed:', event, session ? 'User logged in' : 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 Auth.tsx: Password recovery detected');
          setIsResettingPassword(true);
          setIsForgotPassword(false);
          setIsLogin(true);
          return;
        }
        
        if (session?.user && event === 'SIGNED_IN') {
          console.log('✅ Auth.tsx: User authenticated');
          
          // Reset form states on successful login
          setIsForgotPassword(false);
          setIsResettingPassword(false);
          
          // Check if this is first login and feedback not yet submitted
          const feedbackSubmitted = localStorage.getItem('feedback_submitted');
          const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
          
          if (hasSeenOnboarding === 'true' && feedbackSubmitted !== 'true') {
            console.log('🎯 Auth.tsx: First login detected, showing feedback');
            setShowFeedback(true);
          } else {
            console.log('✅ Auth.tsx: Navigating to dashboard');
            navigate('/dashboard');
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 Auth.tsx: Existing session check:', session ? 'Found session' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        console.log('✅ Auth.tsx: Found existing session, navigating to dashboard');
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: t('loginError'),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('loginError'),
        description: t('unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkUsername = async (value: string): Promise<boolean> => {
    if (value.length < 3) {
      setUsernameError(t('usernameMinLength') || "Minimum 3 characters");
      setUsernameAvailable(null);
      return false;
    }

    setCheckingUsername(true);
    try {
      const response = await supabase.functions.invoke('validate-username', {
        body: { username: value }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setUsernameAvailable(data.available);
      setUsernameError(data.error || "");
      return data.available;
    } catch (error: any) {
      console.error('Username check error:', error);
      setUsernameError(t('usernameCheckFailed') || "Could not check availability");
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: resetEmail }
      });

      if (error) {
        toast({
          title: "Feil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-post sendt",
          description: "Sjekk e-posten din for å tilbakestille passordet",
        });
        setIsForgotPassword(false);
        setResetEmail('');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende tilbakestillings-e-post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Feil',
        description: 'Passordene matcher ikke',
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Feil',
        description: 'Passordet må være minst 6 tegn',
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Suksess!',
        description: 'Passordet ditt har blitt oppdatert',
      });

      setIsResettingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message || 'Kunne ikke oppdatere passord',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username before submission
    if (username.length < 3) {
      setUsernameError(t('usernameMinLength') || "Minimum 3 characters");
      toast({
        title: t('signupError'),
        description: t('usernameMinLength') || "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === false) {
      setUsernameError(t('usernameNotAvailable') || "Username not available");
      toast({
        title: t('signupError'),
        description: t('usernameNotAvailable') || "Username is already taken",
        variant: "destructive",
      });
      return;
    }

    // If username hasn't been checked yet, check it now
    if (usernameAvailable === null) {
      const isAvailable = await checkUsername(username);
      if (!isAvailable) {
        toast({
          title: t('signupError'),
          description: usernameError || t('usernameNotAvailable') || "Username is not available",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('🔐 Starting signup with:', { email, displayName, role, username });
      
      // Map Norwegian roles to English database values
      const roleMapping = {
        'MUSIKER': 'musician',
        'ARRANGØR': 'organizer'
      } as const;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            role: roleMapping[role],
            username: username.toLowerCase()
          }
        }
      });

      if (error) {
        toast({
          title: t('signupError'),
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase
            .from('profiles')
            .insert([{
              user_id: data.user.id,
              display_name: displayName || email.split('@')[0],
              role: roleMapping[role] as any,
              username: username.toLowerCase(),
              username_changed: false
            }]);
        }
        
        toast({
          title: t('signupSuccess'),
          description: t('checkEmailConfirm'),
        });
      }
    } catch (error) {
      toast({
        title: t('signupError'),
        description: t('unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        onComplete={() => {
          setShowFeedback(false);
          navigate('/dashboard');
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
            // Reset password form
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nytt passord</Label>
                <PasswordStrengthValidator
                  password={newPassword}
                  onPasswordChange={setNewPassword}
                  showPassword={showPassword}
                  onToggleShowPassword={() => setShowPassword(!showPassword)}
                  placeholder="Skriv inn nytt passord"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Skriv inn passordet på nytt"
                />
              </div>

              <Button
                type="submit"
                className="w-full min-h-[48px] text-base md:text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('working') : 'Oppdater passord'}
              </Button>
            </form>
          ) : isForgotPassword ? (
            // Forgot password form
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">{t('email')}</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder={t('enterYourEmail') || 'Skriv inn e-posten din'}
                />
              </div>

              <Button
                type="submit"
                className="w-full min-h-[48px] text-base md:text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('working') : 'Send tilbakestillingslenke'}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setIsForgotPassword(false)}
                  disabled={isSubmitting}
                  className="min-h-[44px] touch-target text-base md:text-sm"
                >
                  Tilbake til innlogging
                </Button>
              </div>
            </form>
          ) : (
            // Normal login/signup form
            <>
              <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  {isLogin ? (
                    // Simple password input for login
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-muted/50"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    // Enhanced password validation for signup
                    <PasswordStrengthValidator
                      password={password}
                      onPasswordChange={setPassword}
                      showPassword={showPassword}
                      onToggleShowPassword={() => setShowPassword(!showPassword)}
                      placeholder={t('createStrongPassword')}
                    />
                  )}
                </div>

                {isLogin && (
                  <div className="text-right">
                    <Button
                      variant="link"
                      onClick={() => setIsForgotPassword(true)}
                      disabled={isSubmitting}
                      className="text-sm p-0 h-auto"
                    >
                      Glemt passord?
                    </Button>
                  </div>
                )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('displayName')}</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder={t('yourName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t('chooseUsername') || 'Choose @username'}</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        setUsername(value);
                        if (value.length >= 3) {
                          checkUsername(value);
                        } else {
                          setUsernameAvailable(null);
                          setUsernameError(value.length > 0 ? (t('usernameMinLength') || "Minimum 3 characters") : "");
                        }
                      }}
                      placeholder="@brukernavn"
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-sm text-destructive">{usernameError}</p>
                  )}
                  {usernameAvailable === true && !checkingUsername && (
                    <p className="text-sm text-green-600">✓ {t('usernameAvailable') || 'Available'}</p>
                  )}
                  {usernameAvailable === false && !usernameError && !checkingUsername && (
                    <p className="text-sm text-destructive">✗ {t('usernameTaken') || 'Taken'}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>{t('selectUserType')}</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'MUSIKER' | 'ARRANGØR')}
                    disabled={isSubmitting}
                    className="space-y-2"
                  >
                    <div 
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        role === 'MUSIKER' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setRole('MUSIKER')}
                    >
                      <RadioGroupItem value="MUSIKER" id="musiker" className="mt-1" />
                      <Label htmlFor="musiker" className="font-normal cursor-pointer flex-1">
                        <div>
                          <div className="font-bold mb-1">🎵 {t('musiker')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('musikerDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div 
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        role === 'ARRANGØR' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setRole('ARRANGØR')}
                    >
                      <RadioGroupItem value="ARRANGØR" id="arrangør" className="mt-1" />
                      <Label htmlFor="arrangør" className="font-normal cursor-pointer flex-1">
                        <div>
                          <div className="font-bold mb-1">📅 {t('arrangør')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('arrangørDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full min-h-[48px] text-base md:text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('working') : (isLogin ? t('signIn') : t('signUp'))}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
              className="min-h-[44px] touch-target text-base md:text-sm"
            >
              {isLogin 
                ? t('dontHaveAccount')
                : t('alreadyHaveAccount')
              }
            </Button>
          </div>
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;