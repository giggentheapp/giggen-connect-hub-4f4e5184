import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';

interface FirstLoginFeedbackProps {
  onComplete: () => void;
}

const FirstLoginFeedback = ({ onComplete }: FirstLoginFeedbackProps) => {
  const { t, language } = useAppTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSourceSelect = async (source: string) => {
    setIsSubmitting(true);
    
    try {
      // Get the role from onboarding if stored
      const storedRole = localStorage.getItem('onboarding_role') || 'ikke valgt';
      
      // Send feedback data to edge function
      const { error } = await supabase.functions.invoke('send-onboarding-email', {
        body: {
          language: language,
          role: storedRole,
          source: source,
          timestamp: new Date().toISOString(),
          context: 'first_login'
        }
      });

      if (error) {
        console.error('Error sending feedback email:', error);
        // Don't block user flow
      }
    } catch (error) {
      console.error('Error in feedback submission:', error);
      // Don't block user flow
    } finally {
      // Mark feedback as submitted
      localStorage.setItem('feedback_submitted', 'true');
      setIsSubmitting(false);
      onComplete();
    }
  };

  const sources = [
    { id: 'instagram', label: t('onboarding.heardAbout.instagram') },
    { id: 'tiktok', label: t('onboarding.heardAbout.tiktok') },
    { id: 'friend', label: t('onboarding.heardAbout.friend') },
    { id: 'festival', label: t('onboarding.heardAbout.festival') },
    { id: 'other', label: t('onboarding.heardAbout.other') }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FF914D] to-[#FF3D81] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
          {t('onboarding.heardAbout.title')}
        </h1>
        
        <p className="text-xl text-white/90">
          {t('onboarding.heardAbout.subtitle')}
        </p>

        {/* Source Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto pt-8">
          {sources.map((source) => (
            <Card
              key={source.id}
              className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-sm border-0 shadow-2xl"
              onClick={() => handleSourceSelect(source.id)}
            >
              <CardContent className="p-6 text-center">
                <Button
                  disabled={isSubmitting}
                  variant="ghost"
                  className="text-lg font-bold w-full h-auto py-4 hover:bg-transparent"
                >
                  {source.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FirstLoginFeedback;
