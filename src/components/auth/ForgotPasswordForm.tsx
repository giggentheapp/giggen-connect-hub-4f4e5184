import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ForgotPasswordForm = ({ onSuccess, onCancel }: ForgotPasswordFormProps) => {
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useAppTranslation();

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
        setResetEmail('');
        onSuccess();
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

  return (
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
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[44px] touch-target text-base md:text-sm"
          type="button"
        >
          Tilbake til innlogging
        </Button>
      </div>
    </form>
  );
};
