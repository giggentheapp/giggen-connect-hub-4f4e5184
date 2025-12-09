import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, User, Handshake, Zap, ChevronRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import giggenLogo from '@/assets/giggen-logo.png';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { navigateToDashboard, navigateToAuth } from '@/lib/navigation';

interface OnboardingProps {
  mode?: 'first-time' | 'menu';
}

type OnboardingScreen = 'role' | 'slides';

const Onboarding = ({ mode = 'first-time' }: OnboardingProps) => {
  const navigate = useNavigate();
  const { t, language } = useAppTranslation();
  const { user } = useCurrentUser();
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(mode === 'menu' ? 'slides' : 'role');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already seen onboarding (only for first-time mode)
    if (mode === 'first-time') {
      const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
      if (hasSeenOnboarding === 'true') {
        navigate('/');
      }
    }
  }, [navigate, mode]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setCurrentScreen('slides');
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // After last slide, save onboarding completion and navigate
      if (mode === 'first-time') {
        localStorage.setItem('has_seen_onboarding', 'true');
        // Store the selected role for later feedback
        localStorage.setItem('onboarding_role', selectedRole);
        navigateToAuth(navigate, false);
      } else {
        // Menu mode - navigate to dashboard with user context
        if (user) {
          navigateToDashboard(navigate, user.id, 'dashboard', false);
        } else {
          navigateToAuth(navigate, false);
        }
      }
    }
  };

  const handleSkip = () => {
    if (mode === 'first-time') {
      localStorage.setItem('has_seen_onboarding', 'true');
      navigateToAuth(navigate, false);
    } else {
      // Menu mode - navigate to dashboard with user context
      if (user) {
        navigateToDashboard(navigate, user.id, 'dashboard', false);
      } else {
        navigateToAuth(navigate, false);
      }
    }
  };

  const handleClose = () => {
    if (user) {
      navigateToDashboard(navigate, user.id, 'dashboard', false);
    } else {
      navigateToAuth(navigate, false);
    }
  };

  const slides = [
    {
      title: t('onboarding.slides.welcome.title'),
      content: [
        t('onboarding.slides.welcome.content1'),
        t('onboarding.slides.welcome.content2'),
        t('onboarding.slides.welcome.content3')
      ],
      icon: Music,
      gradient: 'from-[#FF914D] to-[#FF3D81]'
    },
    {
      title: t('onboarding.slides.profile.title'),
      content: [
        t('onboarding.slides.profile.content1'),
        t('onboarding.slides.profile.content2'),
        t('onboarding.slides.profile.content3')
      ],
      icon: User,
      gradient: 'from-[#FF914D]/80 to-[#FF3D81]/80'
    },
    {
      title: t('onboarding.slides.booking.title'),
      content: [
        t('onboarding.slides.booking.content1'),
        t('onboarding.slides.booking.content2'),
        t('onboarding.slides.booking.content3')
      ],
      icon: Handshake,
      gradient: 'from-[#FF914D] via-[#FF3D81] to-[#FF914D]/60'
    },
    {
      title: t('onboarding.slides.publish.title'),
      content: [
        t('onboarding.slides.publish.content1'),
        t('onboarding.slides.publish.content2'),
        t('onboarding.slides.publish.content3')
      ],
      icon: Zap,
      gradient: 'from-[#2B2B2B] via-[#FF914D] to-[#FF3D81]'
    }
  ];

  // Role Selection Screen
  if (currentScreen === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF914D] to-[#FF3D81] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Skip/Close button */}
        {mode === 'first-time' ? (
          <button 
            onClick={handleSkip}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors text-sm font-medium z-10"
          >
            {t('onboarding.buttons.skip')}
          </button>
        ) : (
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10 bg-white/10 backdrop-blur-sm rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-700">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src={giggenLogo} 
              alt="GIGGEN" 
              className="h-24 w-auto mx-auto drop-shadow-2xl"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            {t('onboarding.roleSelection.title')}
          </h1>
          
          <p className="text-xl text-white/90">
            {t('onboarding.roleSelection.subtitle')}
          </p>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto pt-8">
            <Card 
              className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-sm border-0 shadow-2xl"
              onClick={() => handleRoleSelect('musician')}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FF914D] to-[#FF3D81] rounded-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {t('onboarding.roleSelection.musician')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('onboarding.roleSelection.musicianDescription')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-sm border-0 shadow-2xl"
              onClick={() => handleRoleSelect('organizer')}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FF914D] to-[#FF3D81] rounded-full flex items-center justify-center">
                  <Handshake className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {t('onboarding.roleSelection.organizer')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('onboarding.roleSelection.organizerDescription')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Slides Screen
  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentSlideData.gradient} flex flex-col items-center justify-center p-6 relative overflow-hidden`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      {/* Skip/Close button */}
      {mode === 'first-time' ? (
        <button 
          onClick={handleSkip}
          className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors text-sm font-medium z-10"
        >
          {t('onboarding.buttons.skip')}
        </button>
      ) : (
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10 bg-white/10 backdrop-blur-sm rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Slide indicators */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <div 
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8 bg-white' 
                : 'w-1 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        {/* Content area with flexible height */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700 py-8">
          {/* Logo - only on first slide */}
          {currentSlide === 0 && (
            <div className="mb-4">
              <img 
                src={giggenLogo} 
                alt="GIGGEN" 
                className="h-24 w-auto mx-auto drop-shadow-2xl"
              />
            </div>
          )}

          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
            <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight px-4">
            {currentSlideData.title}
          </h1>

          {/* Content with min height to prevent jumping */}
          <div className="space-y-4 text-lg md:text-xl text-white/95 font-medium max-w-xl mx-auto min-h-[12rem] flex flex-col justify-center px-4">
            {currentSlideData.content.map((text, index) => (
              <p key={index} className="leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        </div>

        {/* Button - fixed at bottom */}
        <div className="pb-8">
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-white text-[#FF914D] hover:bg-white/90 text-lg font-bold px-8 py-6 h-auto rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            {currentSlide < 3 ? t('onboarding.buttons.next') : t('onboarding.buttons.getStarted')}
            {currentSlide < 3 && (
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium z-10">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

export default Onboarding;
