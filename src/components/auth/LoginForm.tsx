import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignup, onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        let errorTitle = t('loginError');
        
        // Check for email confirmation issues
        if (error.message.toLowerCase().includes('email not confirmed') || 
            error.message.toLowerCase().includes('email verification')) {
          errorTitle = "E-post ikke bekreftet";
          errorMessage = "Vennligst bekreft e-postadressen din ved å klikke på lenken i e-posten vi sendte deg. Hvis du ikke finner den, kan du bruke 'Glemt passord' for å logge inn direkte.";
        }
        // Check for invalid credentials
        else if (error.message.toLowerCase().includes('invalid login credentials')) {
          errorMessage = "Feil e-post eller passord. Hvis du er usikker på passordet ditt, kan du bruke 'Glemt passord' for å få tilsendt en innloggingslenke.";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        onSuccess();
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

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
      </div>

      <div className="text-right">
        <Button
          variant="link"
          onClick={onForgotPassword}
          disabled={isSubmitting}
          className="text-sm p-0 h-auto"
          type="button"
        >
          Glemt passord?
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full min-h-[48px] text-base md:text-sm"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('working') : t('signIn')}
      </Button>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignup}
          disabled={isSubmitting}
          className="min-h-[44px] touch-target text-base md:text-sm"
          type="button"
        >
          {t('dontHaveAccount')}
        </Button>
      </div>
    </form>
  );
};
