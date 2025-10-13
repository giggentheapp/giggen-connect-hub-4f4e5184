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

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'organizer' | 'musician'>('musician');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useAppTranslation();

  useEffect(() => {
    console.log('🔍 Auth.tsx: Setting up auth listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth.tsx: Auth state changed:', event, session ? 'User logged in' : 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          console.log('✅ Auth.tsx: User authenticated, navigating to dashboard');
          navigate('/dashboard');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('🔐 Starting signup with:', { email, displayName, role });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            role: role
          }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        toast({
          title: t('signupError'),
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        
        // Give the database trigger time to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify profile was created
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('⚠️ Profile check error:', profileError);
        } else if (!profile) {
          console.warn('⚠️ Profile not created by trigger, creating manually...');
          
          // Fallback: Create profile manually if trigger failed
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              user_id: data.user.id,
              display_name: displayName || email.split('@')[0],
              role: role as any
            }]);

          if (createError) {
            console.error('❌ Manual profile creation failed:', createError);
          } else {
            console.log('✅ Profile created manually');
          }
        } else {
          console.log('✅ Profile created successfully by trigger');
        }
        
        toast({
          title: t('signupSuccess'),
          description: t('checkEmailConfirm'),
        });
      }
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
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

                <div className="space-y-3">
                  <Label>{t('selectUserType')}</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'organizer' | 'musician')}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="musician" id="musician" />
                      <Label htmlFor="musician" className="font-normal">
                        <div>
                          <div className="font-medium">{t('musicianArtistBand')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('musicianDescription')}
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organizer" id="organizer" />
                      <Label htmlFor="organizer" className="font-normal">
                        <div>
                          <div className="font-medium">{t('organizerVenue')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('organizerDescription')}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;