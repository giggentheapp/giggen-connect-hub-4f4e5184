import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthValidator from '@/components/PasswordStrengthValidator';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { z } from 'zod';

// Input validation schemas
const emailSchema = z.string().email().max(255);
const displayNameSchema = z.string().trim().min(1).max(100);
const usernameSchema = z.string().regex(/^[a-z0-9_-]+$/).min(3).max(50);

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'"]/g, '');
};

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
    // Validate format first
    try {
      usernameSchema.parse(value);
    } catch {
      setUsernameError(t('usernameMinLength') || "3-50 characters, lowercase letters, numbers, _ and - only");
      setUsernameAvailable(null);
      return false;
    }

    setCheckingUsername(true);
    try {
      // Use supabase.functions.invoke() instead of fetch() to avoid CSP issues
      // Edge Functions can be called with anon key without authentication
      const { data, error } = await supabase.functions.invoke('validate-username', {
        body: { username: value }
      });

      if (error) {
        console.error('Username check error:', error);
        setUsernameError(t('usernameCheckFailed') || "Could not check availability");
        return false;
      }

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
    setIsSubmitting(true);

    try {
      // Validate all inputs
      const validationErrors: string[] = [];

      try {
        emailSchema.parse(email);
      } catch {
        validationErrors.push('Ugyldig e-postadresse');
      }

      try {
        displayNameSchema.parse(displayName);
      } catch {
        validationErrors.push('Navn må være 1-100 tegn');
      }

      try {
        usernameSchema.parse(username);
      } catch {
        validationErrors.push('Ugyldig brukernavn format');
      }

      if (usernameAvailable === false) {
        validationErrors.push('Brukernavn er allerede tatt');
      }

      if (validationErrors.length > 0) {
        toast({
          title: t('signupError'),
          description: validationErrors.join('. '),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // If username hasn't been checked yet, check it now
      if (usernameAvailable === null) {
        const isAvailable = await checkUsername(username);
        if (!isAvailable) {
          toast({
            title: t('signupError'),
            description: usernameError || 'Brukernavn er ikke tilgjengelig',
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Sanitize inputs
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedDisplayName = sanitizeInput(displayName);
      const sanitizedUsername = username.toLowerCase().trim();

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Map Norwegian roles to English database values
      const roleMapping = {
        'MUSIKER': 'musician',
        'ARRANGØR': 'organizer'
      } as const;

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: sanitizedDisplayName,
            role: roleMapping[role],
            username: sanitizedUsername
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
        // Wait for database trigger to create profile (usually instant)
        let profile = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (!profile && retries < maxRetries) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          if (profileData) {
            profile = profileData;
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 400));
          retries++;
        }
        
        if (!profile) {
          // Sign out if profile was never created
          await supabase.auth.signOut();
          toast({
            title: t('signupError'),
            description: 'Kunne ikke opprette brukerprofil. Vennligst prøv igjen.',
            variant: "destructive",
          });
          return;
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
          maxLength={255}
          required
          disabled={isSubmitting}
          autoComplete="email"
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
          onChange={(e) => setDisplayName(sanitizeInput(e.target.value))}
          maxLength={100}
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
              if (value.length >= 3 && value.length <= 50) {
                checkUsername(value);
              } else {
                setUsernameAvailable(null);
                setUsernameError(value.length > 0 ? (t('usernameMinLength') || "3-50 tegn") : "");
              }
            }}
            placeholder="@brukernavn"
            maxLength={50}
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
