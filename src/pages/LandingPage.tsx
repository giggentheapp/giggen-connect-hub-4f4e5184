import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, FileText, Music, Calendar, Star } from 'lucide-react';
import { useState } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'no' | 'en'>('no');

  const content = {
    no: {
      nav: {
        about: "Om oss",
        privacy: "Personvern", 
        terms: "Vilkår",
        login: "Logg inn"
      },
      hero: {
        title: "En bro mellom live-musikk og mennesker",
        subtitle: "En plattform som gjør det enklere for musikere og arrangører å finne hverandre, og for publikum å finne lokale arrangementer",
        cta: "Kom i gang"
      },
      features: {
        map: {
          title: "Liste",
          description: "Utforsk musikere og arrangementer i en strukturert liste. Se hvem som er aktive i ditt område og oppdag nye talenter."
        },
        matching: {
          title: "Booking",
          description: "Koble musikere med arrangører basert på sjanger, lokasjon og tilgjengelighet. Trygg 3-stegs booking-prosess."
        },
        profiles: {
          title: "Fullverdige Profiler",
          description: "Detaljerte profiler med portefølje, tilbud, priser og tekniske krav. Alt du trenger for å ta informerte beslutninger."
        }
      },
      forUsers: {
        musicians: {
          title: "For Musikere",
          features: [
            "Vis dine tilbud og konserter",
            "Motta booking-forespørsler",
            "Bygg ditt profesjonelle nettverk",
            "Kontroller din synlighet"
          ]
        },
        organizers: {
          title: "For Arrangører", 
          features: [
            "Søk og filtrer musikere",
            "Se tilgjengelige artister på kart",
            "Trygg booking med godkjenning",
            "Oppdag nye talenter lokalt"
          ]
        },
        audience: {
          title: "For Publikum",
          features: [
            "Oppdag nye arrangementer",
            "Finn konserter i ditt område",
            "Se informasjon om artister",
            "Hold deg oppdatert på lokale event"
          ]
        }
      }
    },
    en: {
      nav: {
        about: "About",
        privacy: "Privacy",
        terms: "Terms", 
        login: "Login"
      },
      hero: {
        title: "A bridge between live music and people",
        subtitle: "A platform that makes it easier for musicians and organizers to find each other, and for audiences to find local events",
        cta: "Get Started"
      },
      features: {
        map: {
          title: "List",
          description: "Explore musicians and events in a structured list. See who's active in your area and discover new talents."
        },
        matching: {
          title: "Booking",
          description: "Connect musicians with organizers based on genre, location and availability. Secure 3-step booking process."
        },
        profiles: {
          title: "Complete Profiles",
          description: "Detailed profiles with portfolio, offers, prices and technical requirements. Everything you need to make informed decisions."
        }
      },
      forUsers: {
        musicians: {
          title: "For Musicians",
          features: [
            "Show your offers and concerts",
            "Receive booking requests",
            "Build your professional network", 
            "Control your visibility"
          ]
        },
        organizers: {
          title: "For Organizers",
          features: [
            "Search and filter musicians",
            "See available artists on map",
            "Secure booking with approval",
            "Discover new local talents"
          ]
        },
        audience: {
          title: "For Audience",
          features: [
            "Discover new events",
            "Find concerts in your area",
            "See information about artists",
            "Stay updated on local events"
          ]
        }
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-glow bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-soft-glow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="relative">
                <img 
                  src="/logo-guitar-lightbulb.png" 
                  alt="GIGGEN Logo" 
                  className="w-10 h-10 object-contain animate-glow profile-glow rounded-lg p-1"
                />
              </div>
              <div className="text-2xl font-bold text-gradient">GIGGEN</div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/about')}
                className="text-foreground hover:text-primary transition-all duration-300 hover:text-glow"
              >
                {t.nav.about}
              </button>
              <button 
                onClick={() => navigate('/privacy')}
                className="text-foreground hover:text-primary transition-all duration-300 hover:text-glow"
              >
                {t.nav.privacy}
              </button>
              <button 
                onClick={() => navigate('/terms')}
                className="text-foreground hover:text-primary transition-all duration-300 hover:text-glow"
              >
                {t.nav.terms}
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'no' | 'en')}
                  className="neon-input bg-input border-glow rounded-md px-3 py-1 text-sm"
                >
                  <option value="no">🇳🇴 Norsk</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <Button onClick={() => navigate('/auth')} className="neon-button">
                {t.nav.login}
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
              {t.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="neon-button text-lg px-8 py-6 animate-glow"
            >
              <Music className="mr-2 h-5 w-5" />
              {t.hero.cta}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Hovedfunksjoner
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t.features.map.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.map.description}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-green/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-accent-green" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t.features.matching.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.matching.description}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-accent-orange" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t.features.profiles.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.features.profiles.description}</p>
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
                  <h3 className="text-2xl font-bold text-foreground">{t.forUsers.musicians.title}</h3>
                </div>
                <ul className="space-y-3">
                  {t.forUsers.musicians.features.map((feature, index) => (
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
                  <h3 className="text-2xl font-bold text-foreground">{t.forUsers.organizers.title}</h3>
                </div>
                <ul className="space-y-3">
                  {t.forUsers.organizers.features.map((feature, index) => (
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
                  <h3 className="text-2xl font-bold text-foreground">{t.forUsers.audience.title}</h3>
                </div>
                <ul className="space-y-3">
                  {t.forUsers.audience.features.map((feature, index) => (
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
              <h4 className="font-semibold text-foreground mb-4">Juridisk</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/privacy')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Personvernerklæring
                </button>
                <button 
                  onClick={() => navigate('/terms')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Vilkår og betingelser
                </button>
                <a 
                  href="#" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Cookie-policy
                </a>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full mt-4"
                >
                  Kom i gang
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