import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, FileText, Music, Calendar, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/LanguageSelector';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const content = {
    features: {
      map: {
        title: t('language') === 'no' ? "Liste" : "List",
        description: t('language') === 'no' 
          ? "Utforsk musikere og arrangementer i en strukturert liste. Se hvem som er aktive i ditt område og oppdag nye talenter."
          : "Explore musicians and events in a structured list. See who's active in your area and discover new talents."
      },
      matching: {
        title: t('language') === 'no' ? "Booking" : "Booking",
        description: t('language') === 'no'
          ? "Koble musikere med arrangører basert på sjanger, lokasjon og tilgjengelighet. Trygg 3-stegs booking-prosess."
          : "Connect musicians with organizers based on genre, location and availability. Secure 3-step booking process."
      },
      profiles: {
        title: t('language') === 'no' ? "Fullverdige Profiler" : "Complete Profiles",
        description: t('language') === 'no'
          ? "Detaljerte profiler med portefølje, tilbud, priser og tekniske krav. Alt du trenger for å ta informerte beslutninger."
          : "Detailed profiles with portfolio, offers, prices and technical requirements. Everything you need to make informed decisions."
      }
    },
    forUsers: {
      musicians: {
        title: t('language') === 'no' ? "For Musikere" : "For Musicians",
        features: t('language') === 'no' ? [
          "Vis dine tilbud og konserter",
          "Motta booking-forespørsler",
          "Bygg ditt profesjonelle nettverk",
          "Kontroller din synlighet"
        ] : [
          "Show your offers and concerts",
          "Receive booking requests",
          "Build your professional network", 
          "Control your visibility"
        ]
      },
      organizers: {
        title: t('language') === 'no' ? "For Arrangører" : "For Organizers",
        features: t('language') === 'no' ? [
          "Søk og filtrer musikere",
          "Se tilgjengelige artister på kart",
          "Trygg booking med godkjenning",
          "Oppdag nye talenter lokalt"
        ] : [
          "Search and filter musicians",
          "See available artists on map",
          "Secure booking with approval",
          "Discover new local talents"
        ]
      },
      audience: {
        title: t('language') === 'no' ? "For Publikum" : "For Audience",
        features: t('language') === 'no' ? [
          "Oppdag nye arrangementer",
          "Finn konserter i ditt område",
          "Se informasjon om artister",
          "Hold deg oppdatert på lokale event"
        ] : [
          "Discover new events",
          "Find concerts in your area",
          "See information about artists",
          "Stay updated on local events"
        ]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/about')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('about')}
              </button>
              <button 
                onClick={() => navigate('/privacy')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('privacy')}
              </button>
              <button 
                onClick={() => navigate('/terms')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('terms')}
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <LanguageSelector variant="compact" />
              <Button onClick={() => navigate('/auth')} variant="outline">
                {t('login')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent-orange to-accent-pink bg-clip-text text-transparent leading-tight">
              {t('language') === 'no' ? "En bro mellom live-musikk og mennesker" : "A bridge between live music and people"}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {t('language') === 'no' 
                ? "En plattform som gjør det enklere for musikere og arrangører å finne hverandre, og for publikum å finne lokale arrangementer"
                : "A platform that makes it easier for musicians and organizers to find each other, and for audiences to find local events"
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all transform hover:scale-105"
            >
              <Music className="mr-2 h-5 w-5" />
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            {t('language') === 'no' ? "Hovedfunksjoner" : "Key Features"}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{content.features.map.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{content.features.map.description}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-green/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-accent-green" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{content.features.matching.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{content.features.matching.description}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-accent-orange" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{content.features.profiles.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{content.features.profiles.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Users Split Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mr-4">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{content.forUsers.musicians.title}</h3>
                </div>
                <ul className="space-y-3">
                  {content.forUsers.musicians.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 hover:border-accent-green/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-lg mr-4">
                    <Calendar className="h-8 w-8 text-accent-green" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{content.forUsers.organizers.title}</h3>
                </div>
                <ul className="space-y-3">
                  {content.forUsers.organizers.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <div className="w-2 h-2 bg-accent-green rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 hover:border-accent-blue/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-accent-blue/10 to-accent-blue/20 rounded-lg mr-4">
                    <Users className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{content.forUsers.audience.title}</h3>
                </div>
                <ul className="space-y-3">
                  {content.forUsers.audience.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <div className="w-2 h-2 bg-accent-blue rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">GIGGEN</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>giggen.main@gmail.com</p>
                <p>Oslo, Norge</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                {t('language') === 'no' ? "Juridisk" : "Legal"}
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/privacy')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('language') === 'no' ? "Personvernerklæring" : "Privacy Policy"}
                </button>
                <button 
                  onClick={() => navigate('/terms')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('language') === 'no' ? "Vilkår og betingelser" : "Terms and Conditions"}
                </button>
                <a 
                  href="#" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('language') === 'no' ? "Cookie-policy" : "Cookie Policy"}
                </a>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full mt-4"
                >
                  {t('getStarted')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;