import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
  sensitive_fields: string[];
}

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [envStatus, setEnvStatus] = useState({
    supabaseUrl: false,
    supabaseKey: false,
    stripeKey: false,
  });

  useEffect(() => {
    checkAdminAccess();
    fetchAuditLogs();
    checkEnvironmentStatus();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Du må være logget inn");
      navigate("/auth");
      return;
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      toast.error("Kun administratorer har tilgang");
      navigate("/");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Kunne ikke hente sikkerhetslogger");
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironmentStatus = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    setEnvStatus({
      supabaseUrl: !!supabaseUrl && supabaseUrl.length > 0,
      supabaseKey: !!supabaseKey && supabaseKey.length > 0,
      stripeKey: !!stripeKey && stripeKey.length > 0,
    });
  };

  const getActionBadge = (action: string) => {
    if (action.includes("DENIED") || action.includes("FAILED")) {
      return <Badge variant="destructive">{action}</Badge>;
    }
    if (action.includes("ACCESSED") || action.includes("SUCCESS")) {
      return <Badge variant="default">{action}</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const fileAccessLogs = auditLogs.filter(log => 
    log.action.includes('FILE') || log.table_name === 'storage'
  );

  const deniedAttempts = auditLogs.filter(log => 
    log.action.includes('DENIED') || log.action.includes('UNAUTHORIZED')
  );

  const successfulAccess = auditLogs.filter(log => 
    log.action.includes('READ') || log.action.includes('SELECT')
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Laster sikkerhetsinformasjon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sikkerhets Dashboard</h1>
          <p className="text-muted-foreground">Oversikt over sikkerhet og tilgangskontroll</p>
        </div>
      </div>

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Miljøvariabler Status</CardTitle>
          <CardDescription>Sjekk om alle nødvendige miljøvariabler er konfigurert</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Supabase URL</span>
            {envStatus.supabaseUrl ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Konfigurert
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> Mangler
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Supabase Publishable Key</span>
            {envStatus.supabaseKey ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Konfigurert
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> Mangler
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Stripe Publishable Key</span>
            {envStatus.stripeKey ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Konfigurert
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Mangler
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Siste 100 hendelser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Blokkerte Forsøk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{deniedAttempts.length}</div>
            <p className="text-xs text-muted-foreground">Nektet tilgang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vellykket Tilgang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successfulAccess.length}</div>
            <p className="text-xs text-muted-foreground">Godkjent tilgang</p>
          </CardContent>
        </Card>
      </div>

      {/* File Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Filakses Logger</CardTitle>
          <CardDescription>
            Oversikt over filnedlastninger og tilgangsforsøk ({fileAccessLogs.length} hendelser)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fileAccessLogs.length === 0 ? (
            <Alert>
              <AlertDescription>Ingen filakses registrert ennå</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tidspunkt</TableHead>
                  <TableHead>Bruker</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Ressurs</TableHead>
                  <TableHead>Detaljer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fileAccessLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.created_at).toLocaleString('no-NO')}
                    </TableCell>
                    <TableCell className="text-sm">{log.user_id?.substring(0, 8)}...</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-xs font-mono">{log.record_id}</TableCell>
                    <TableCell className="text-xs">{log.table_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Siste Sikkerhetshendelser</CardTitle>
          <CardDescription>Alle sikkerhetshendelser i systemet</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tidspunkt</TableHead>
                <TableHead>Bruker</TableHead>
                <TableHead>Handling</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ressurs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.slice(0, 30).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.created_at).toLocaleString('no-NO')}
                  </TableCell>
                  <TableCell className="text-sm">{log.user_id?.substring(0, 8)}...</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.table_name}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-xs">{log.record_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
