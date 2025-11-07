import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, User, Handshake, Zap, ChevronRight, X } from 'lucide-react';
import giggenLogo from '@/assets/giggen-logo.png';

interface OnboardingProps {
  mode?: 'first-time' | 'menu';
}

const Onboarding = ({ mode = 'first-time' }: OnboardingProps) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if user has already seen onboarding (only for first-time mode)
    if (mode === 'first-time') {
      const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
      if (hasSeenOnboarding === 'true') {
        navigate('/');
      }
    }
  }, [navigate, mode]);

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Mark onboarding as seen and navigate to auth (only for first-time mode)
      if (mode === 'first-time') {
        localStorage.setItem('has_seen_onboarding', 'true');
        navigate('/auth');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleSkip = () => {
    if (mode === 'first-time') {
      localStorage.setItem('has_seen_onboarding', 'true');
      navigate('/auth');
    } else {
      navigate('/dashboard');
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  const slides = [
    {
      title: '🎶 Velkommen til GIGGEN',
      content: [
        'En plattform for musikere, arrangører og publikum.',
        'Ett sted for alt – synlighet, tilbud, booking og samarbeid.',
        'Bli din egen manager i dag.'
      ],
      icon: Music,
      gradient: 'from-[#FF914D] to-[#FF3D81]',
      buttonText: 'Neste'
    },
    {
      title: 'Lag profil og portefølje',
      content: [
        'Opprett profil som musiker eller arrangør.',
        'Vis hvem du er og hva du tilbyr.',
        'Legg til bilder, videoer og prosjekter – bygg din egen portefølje.'
      ],
      icon: User,
      gradient: 'from-[#FF914D]/80 to-[#FF3D81]/80',
      buttonText: 'Neste'
    },
    {
      title: '🎸 Lag tilbud og book samarbeid',
      content: [
        'Lag tilbud på gigs, kurs eller prosjekter.',
        'Send og motta forespørsler – avtal, godkjenn og spill.',
        'Alt du trenger for å jobbe profesjonelt med musikk.'
      ],
      icon: Handshake,
      gradient: 'from-[#FF914D] via-[#FF3D81] to-[#FF914D]/60',
      buttonText: 'Neste'
    },
    {
      title: '🌍 Publiser når du er klar',
      content: [
        'Bestem selv hva som er synlig – og når.',
        'Hold interne avtaler og kurs privat, eller publiser konserter når tiden er inne.',
        'Ta initiativ. Kom i gang nå.'
      ],
      icon: Zap,
      gradient: 'from-[#2B2B2B] via-[#FF914D] to-[#FF3D81]',
      buttonText: 'Kom i gang'
    }
  ];

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
          Hopp over
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
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-700">
        {/* Logo - only on first slide */}
        {currentSlide === 0 && (
          <div className="mb-8">
            <img 
              src={giggenLogo} 
              alt="GIGGEN" 
              className="h-24 w-auto mx-auto drop-shadow-2xl"
            />
          </div>
        )}

        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">
          {currentSlideData.title}
        </h1>

        {/* Content */}
        <div className="space-y-4 text-lg md:text-xl text-white/95 font-medium max-w-xl mx-auto">
          {currentSlideData.content.map((text, index) => (
            <p key={index} className="leading-relaxed">
              {text}
            </p>
          ))}
        </div>

        {/* Button */}
        <div className="pt-8">
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-white text-[#FF914D] hover:bg-white/90 text-lg font-bold px-8 py-6 h-auto rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            {currentSlideData.buttonText}
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
