import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Users, MapPin, Target, Heart } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Logg inn
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent-orange to-accent-pink bg-clip-text text-transparent">
              Om Giggen
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Giggen er Norges ledende plattform for musikk-booking og networking. 
              Vi kobler musikere med arrangører gjennom innovative teknologier som 
              interaktive kart og smart matching.
            </p>
          </div>

          {/* Vision */}
          <Card className="mb-12 border-2 hover:border-primary/50 transition-all">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mr-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Vår Visjon</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Vi ønsker å gjøre det enklere for musikere å nå sitt publikum og for 
                arrangører å finne den perfekte artisten til deres arrangement. Gjennom 
                teknologi og innovasjon bygger vi broer i musikkmiljøet og skaper nye 
                muligheter for alle parter.
              </p>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-blue/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-blue/10 to-accent-blue/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-accent-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Geografisk Oppdagelse</h3>
                <p className="text-muted-foreground">
                  Vårt interaktive kart gjør det enkelt å finne og oppdage musikere 
                  og arrangementer i ditt område.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-green/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-accent-green" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Smart Matching</h3>
                <p className="text-muted-foreground">
                  Vår algoritme matcher musikere og arrangører basert på 
                  kompatibilitet, preferanser og tilgjengelighet.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-orange/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-orange/10 to-accent-orange/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Music className="h-8 w-8 text-accent-orange" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Profesjonelle Profiler</h3>
                <p className="text-muted-foreground">
                  Detaljerte profiler med portefølje, priser og tekniske 
                  spesifikasjoner for informerte beslutninger.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mission */}
          <Card className="mb-12 border-2 hover:border-accent-pink/50 transition-all">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-accent-pink/10 to-accent-pink/20 rounded-lg mr-4">
                  <Heart className="h-8 w-8 text-accent-pink" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Vårt Oppdrag</h2>
              </div>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Musikk har kraft til å forene mennesker og skape minner som varer livet ut. 
                  Hos Giggen tror vi på at alle musikere fortjener en plattform hvor de kan 
                  vise frem sitt talent og nå sitt publikum.
                </p>
                <p>
                  Samtidig ønsker vi å gjøre det enklere for arrangører å finne akkurat den 
                  musikken som passer til deres arrangement, enten det er et intimt bryllup 
                  eller en stor festival.
                </p>
                <p>
                  Gjennom innovativ teknologi og et sterkt fokus på brukervennlighet bygger 
                  vi fremtidens musikk-økosystem i Norge.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Bli med på reisen</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Enten du er musiker eller arrangør, vi inviterer deg til å bli del av Giggen-fellesskapet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
              >
                Registrer deg som Musiker
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                size="lg"
                className="border-2 hover:bg-primary hover:text-primary-foreground"
              >
                Registrer deg som Arrangør
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center space-x-8 mb-4">
            <button 
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Personvern
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Vilkår
            </button>
            <a 
              href="mailto:info@giggen.org"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Kontakt
            </a>
          </div>
          <p className="text-muted-foreground">&copy; 2024 Giggen AS. Alle rettigheter forbeholdt.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;