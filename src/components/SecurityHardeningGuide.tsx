import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface SecurityItem {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'fixed' | 'requires_action' | 'pending';
  description: string;
  action?: string;
  link?: string;
}

const SecurityHardeningGuide: React.FC = () => {
  const securityItems: SecurityItem[] = [
    {
      title: 'RLS Policies - Data Exposure Fixed',
      severity: 'critical',
      status: 'fixed',
      description: 'Oppdaterte Row Level Security policies for å beskytte sensitiv brukerinformasjon og booking-data.',
    },
    {
      title: 'Edge Function Authentication',
      severity: 'high',  
      status: 'fixed',
      description: 'La til JWT-validering og audit logging for Mapbox token tilgang.',
    },
    {
      title: 'Password Strength Validation',
      severity: 'medium',
      status: 'fixed',
      description: 'Implementerte klient-side passordstyrke validering med kompleksitetskrav.',
    },
    {
      title: 'OTP Expiry Configuration',
      severity: 'medium',
      status: 'requires_action',
      description: 'OTP utløpstid overstiger anbefalt terskel. Bør konfigureres i Supabase Dashboard.',
      action: 'Gå til Supabase Dashboard → Authentication → Settings og sett kortere OTP expiry.',
      link: 'https://supabase.com/docs/guides/platform/going-into-prod#security'
    },
    {
      title: 'Leaked Password Protection',
      severity: 'medium',
      status: 'requires_action',
      description: 'Lekket passord beskyttelse er deaktivert.',
      action: 'Gå til Supabase Dashboard → Authentication → Settings og aktiver "Breach Protection".',
      link: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
    },
    {
      title: 'PostgreSQL Version Update',
      severity: 'low',
      status: 'requires_action',
      description: 'Nåværende PostgreSQL versjon har tilgjengelige sikkerhetsoppdateringer.',
      action: 'Oppgrader PostgreSQL database i Supabase Dashboard → Settings → Database.',
      link: 'https://supabase.com/docs/guides/platform/upgrading'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'requires_action': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'pending': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const fixedItems = securityItems.filter(item => item.status === 'fixed');
  const actionItems = securityItems.filter(item => item.status === 'requires_action');

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Sikkerhetsherdning</h1>
        </div>
        <p className="text-muted-foreground">
          Oversikt over sikkerhetstiltak implementert og gjenstående oppgaver
        </p>
      </div>

      {/* Security Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-success">Løst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{fixedItems.length}</div>
            <p className="text-xs text-muted-foreground">Sikkerhetsproblemer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-warning">Krever handling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{actionItems.length}</div>
            <p className="text-xs text-muted-foreground">Gjenstående oppgaver</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">Total sikkerhetsscore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round((fixedItems.length / securityItems.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Fullført</p>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            Løste sikkerhetsproblemer
          </CardTitle>
          <CardDescription>
            Disse sikkerhetstiltakene har blitt implementert automatisk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fixedItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              {getStatusIcon(item.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <Badge variant="secondary" className={getSeverityColor(item.severity)}>
                    {item.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Required */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Krever handling
            </CardTitle>
            <CardDescription>
              Disse innstillingene må konfigureres manuelt i Supabase Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionItems.map((item, index) => (
              <Alert key={index} className="border-warning/20 bg-warning/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {item.title}
                  <Badge variant="secondary" className={getSeverityColor(item.severity)}>
                    {item.severity.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{item.description}</p>
                  {item.action && (
                    <p className="font-medium text-foreground">{item.action}</p>
                  )}
                  {item.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(item.link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Se dokumentasjon
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Neste steg</CardTitle>
          <CardDescription>
            Anbefalt sikkerhetspraksis for produksjon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">1. Fullfør Supabase konfigurasjoner</h4>
            <p className="text-sm text-muted-foreground">
              Implementer de gjenstående konfigurasjonene listet ovenfor.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">2. Aktiver Multi-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Vurder å implementere MFA for sensitive kontoer.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">3. Regelmessig sikkerhetssøning</h4>
            <p className="text-sm text-muted-foreground">
              Kjør sikkerhetsskanning månedlig eller etter større oppdateringer.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">4. Monitor audit logs</h4>
            <p className="text-sm text-muted-foreground">
              Overvåk audit_logs tabellen for mistenkelig aktivitet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityHardeningGuide;