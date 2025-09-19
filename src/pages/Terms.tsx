import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react';

const Terms = () => {
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
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Vilkår og betingelser</h1>
            <p className="text-lg text-muted-foreground">
              Sist oppdatert: 19. september 2024
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8 border-2">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Velkommen til Giggen! Disse vilkårene og betingelsene ("Vilkår") regulerer din bruk 
                av Giggen-plattformen ("Tjenesten") som drives av Giggen AS ("vi", "oss", "vår"). 
                Ved å bruke vår tjeneste godtar du disse vilkårene.
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 text-primary mr-3" />
                Brukeransvar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Som bruker forplikter du deg til å:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Oppgi korrekt og oppdatert informasjon</li>
                  <li>• Holde din konto sikker og konfidentiell</li>
                  <li>• Ikke misbruke eller skade tjenesten</li>
                  <li>• Respektere andre brukeres rettigheter</li>
                  <li>• Ikke publisere upassende eller ulovlig innhold</li>
                  <li>• Følge alle relevante lover og reguleringer</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Forbudt bruk:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Spam eller uønsket kommunikasjon</li>
                  <li>• Falske profiler eller villedende informasjon</li>
                  <li>• Krenkelse av opphavsrett eller andre rettigheter</li>
                  <li>• Virus, malware eller skadelig kode</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Booking Process */}
          <Card className="mb-8 border-2 hover:border-accent-green/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-6 w-6 text-accent-green mr-3" />
                Booking-prosess og ansvar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">3-stegs booking-prosess:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Arrangør sender booking-forespørsel til musiker</li>
                  <li>Musiker godkjenner eller avslår forespørselen</li>
                  <li>Ved godkjenning inngås bindende avtale mellom partene</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Ansvar og forpliktelser:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Giggen er kun en formidlingsplattform</li>
                  <li>• Avtaler inngås direkte mellom musiker og arrangør</li>
                  <li>• Begge parter er ansvarlige for å overholde inngåtte avtaler</li>
                  <li>• Giggen er ikke ansvarlig for kvalitet eller utførelse</li>
                  <li>• Avbestilling må følge partenes avtale</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-8 border-2 hover:border-accent-orange/50 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-6 w-6 text-accent-orange mr-3" />
                Betalingsvilkår
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Tjenesten er for øyeblikket gratis, men:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Vi forbeholder oss retten til å innføre avgifter</li>
                  <li>• Minst 30 dagers varsel vil bli gitt før endringer</li>
                  <li>• Eksisterende brukere vil få informasjon om nye priser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Fremtidige betalingstjenester:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Vi kan tilby integrerte betalingsløsninger</li>
                  <li>• Standardavgifter kan påløpe for transaksjoner</li>
                  <li>• Alle avgifter vil være tydelig kommunisert</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-8 border-2 hover:border-accent-pink/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">Opphavsrett og immaterielle rettigheter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Ditt innhold:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Du beholder alle rettigheter til innholdet du laster opp</li>
                  <li>• Du gir oss lisens til å vise og distribuere innholdet på plattformen</li>
                  <li>• Du er ansvarlig for at du har nødvendige rettigheter</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Vår plattform:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Giggen-plattformen og dens innhold er beskyttet av opphavsrett</li>
                  <li>• Du kan ikke kopiere, reprodusere eller distribuere vår kode</li>
                  <li>• Handelsnavn og logoer er våre registrerte varemerker</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="mb-8 border-2 hover:border-destructive/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-3" />
                Ansvarsfraskrivelse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Giggen er ikke ansvarlig for:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Kvaliteten på musikere eller arrangementer</li>
                  <li>• Kontraktbrudd mellom brukere</li>
                  <li>• Direkte eller indirekte tap som følge av bruk av tjenesten</li>
                  <li>• Tjenesteavbrudd eller tekniske problemer</li>
                  <li>• Innhold eller oppførsel fra andre brukere</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                Tjenesten leveres "som den er" uten garantier av noe slag. Din bruk av 
                tjenesten skjer på egen risiko.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="text-foreground">Oppsigelse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Du kan:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Slette din konto når som helst</li>
                  <li>• Slutte å bruke tjenesten uten varsel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Vi kan:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Suspendere eller slette kontoer som bryter vilkårene</li>
                  <li>• Avslutte tjenesten med 30 dagers varsel</li>
                  <li>• Endre vilkårene med rimelig forhåndsvarsel</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">Kontakt og gjeldende lov</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Spørsmål om vilkårene?</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>E-post:</strong> juridisk@giggen.org</p>
                  <p><strong>Post:</strong> Giggen AS, Oslo, Norge</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Gjeldende lov</h4>
                <p className="text-muted-foreground">
                  Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal løses 
                  ved norske domstoler med Oslo som verneting.
                </p>
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
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Personvern
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

export default Terms;