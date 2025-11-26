import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthValidator from '@/components/PasswordStrengthValidator';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface PasswordResetFormProps {
  onSuccess: () => void;
}

export const PasswordResetForm = ({ onSuccess }: PasswordResetFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation();
  const navigate = useNavigate();

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
        description: 'Passordet ditt har blitt oppdatert. Logger inn...',
      });

      setNewPassword('');
      setConfirmPassword('');
      
      // Get user profile to navigate to correct URL
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        const dashboardUrl = profile ? `/profile/${profile.user_id}?section=dashboard` : '/auth';
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate(dashboardUrl, { replace: true });
        }, 100);
      }
      
      onSuccess();
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

  return (
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
  );
};
