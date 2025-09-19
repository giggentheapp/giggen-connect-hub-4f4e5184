import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Users, FileText } from 'lucide-react';

const Privacy = () => {
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
          <div className="text-center mb-12">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Personvernerklæring</h1>
            <p className="text-lg text-muted-foreground">
              Sist oppdatert: 19. september 2024
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8 border-2">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Giggen AS ("vi", "oss", "vår") respekterer ditt personvern og er forpliktet til å 
                beskytte dine personopplysninger. Denne personvernerklæringen forklarer hvordan vi 
                samler inn, bruker, deler og beskytter informasjonen din når du bruker vår tjeneste.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-6 w-6 text-primary mr-3" />
                Hvilke data vi samler inn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Personlig informasjon</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Navn, e-postadresse og telefonnummer</li>
                  <li>Profilinformasjon og portefølje-innhold</li>
                  <li>Geografisk lokasjon (hvis tillatt)</li>
                  <li>Booking-historikk og kommunikasjon</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Teknisk informasjon</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>IP-adresse og enhetsinformasjon</li>
                  <li>Nettlesertype og -versjon</li>
                  <li>Bruksmønstre og preferanser</li>
                  <li>Cookies og lignende teknologier</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="mb-8 border-2 hover:border-accent-green/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 text-accent-green mr-3" />
                Hvordan vi bruker dine data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Levere og forbedre våre tjenester</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Matche musikere med relevante booking-muligheter</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Kommunisere med deg om tjenesten</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Sikre trygg bruk av plattformen</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-accent-green rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span>Overholde juridiske forpliktelser</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8 border-2 hover:border-accent-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 text-accent-orange mr-3" />
                Deling av informasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Vi selger aldri dine personopplysninger. Vi deler kun informasjon i følgende tilfeller:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Med ditt samtykke eller på din instruks</li>
                <li>• Med andre brukere som del av booking-prosessen</li>
                <li>• Med tjenesteleverandører som hjelper oss å drifte plattformen</li>
                <li>• Når det kreves av lov eller for å beskytte rettigheter</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="mb-8 border-2 hover:border-accent-pink/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">Dine rettigheter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Du har rett til å:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Få tilgang til dine data</li>
                    <li>• Rette unøyaktige data</li>
                    <li>• Slette dine data</li>
                    <li>• Begrense behandling</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Du kan også:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Overføre data til andre tjenester</li>
                    <li>• Motsette deg behandling</li>
                    <li>• Trekke tilbake samtykke</li>
                    <li>• Klage til Datatilsynet</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="text-foreground">Sikkerhet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Vi implementerer passende tekniske og organisatoriske tiltak for å beskytte 
                dine personopplysninger mot uautorisert tilgang, endring, avsløring eller 
                ødeleggelse. Dette inkluderer kryptering, tilgangskontroll og regelmessige 
                sikkerhetsgjennomganger.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">Kontakt oss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Har du spørsmål om denne personvernerklæringen eller ønsker å utøve 
                dine rettigheter, kan du kontakte oss:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>E-post:</strong> personvern@giggen.org</p>
                <p><strong>Post:</strong> Giggen AS, Oslo, Norge</p>
                <p><strong>Telefon:</strong> +47 XX XX XX XX</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center space-x-8 mb-4">
            <button 
              onClick={() => navigate('/about')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Om oss
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

export default Privacy;