import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthValidator from '@/components/PasswordStrengthValidator';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface SignUpFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const SignUpForm = ({ onSuccess, onSwitchToLogin }: SignUpFormProps) => {
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
  const { toast } = useToast();
  const { t } = useAppTranslation();

  const checkUsername = async (value: string): Promise<boolean> => {
    if (value.length < 3) {
      setUsernameError(t('usernameMinLength') || "Minimum 3 characters");
      setUsernameAvailable(null);
      return false;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(
        'https://hkcdyqghfqyrlwjcsrnx.supabase.co/functions/v1/validate-username',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrY2R5cWdoZnF5cmx3amNzcm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzAxNzcsImV4cCI6MjA3MTMwNjE3N30.zvNq7yhyyMMmbLE9trLxvCqd5HNoJ9JjokHOWGAJwWI`
          },
          body: JSON.stringify({ username: value })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
        
        onSuccess();
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

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
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
        <PasswordStrengthValidator
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          placeholder={t('createStrongPassword')}
        />
      </div>

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

      <Button
        type="submit"
        className="w-full min-h-[48px] text-base md:text-sm"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('working') : t('signUp')}
      </Button>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
          className="min-h-[44px] touch-target text-base md:text-sm"
          type="button"
        >
          {t('alreadyHaveAccount')}
        </Button>
      </div>
    </form>
  );
};
