import { useState } from "react";
import { useUserRoles, useAddRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Shield, Users, User } from "lucide-react";

export default function AdminSetup() {
  const { data: roles, isLoading } = useUserRoles();
  const { mutate: addRole, isPending } = useAddRole();
  const [showSuccess, setShowSuccess] = useState(false);

  const hasAdmin = roles?.some(r => r.role === 'admin');
  const hasOrganizer = roles?.some(r => r.role === 'organizer');

  const handleAddRole = (role: 'admin' | 'organizer') => {
    addRole({ role }, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Setup</h1>
          <p className="text-muted-foreground">
            Gi deg selv admin- eller arrangør-rettigheter for å få tilgang til billettystemet
          </p>
        </div>

        {showSuccess && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Rolle lagt til! Du har nå tilgang til nye funksjoner.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Dine roller
            </CardTitle>
            <CardDescription>
              Oversikt over dine nåværende tilgangsroller
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles && roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role.id} variant="secondary" className="text-sm">
                    {role.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {role.role === 'organizer' && <Users className="h-3 w-3 mr-1" />}
                    {role.role === 'user' && <User className="h-3 w-3 mr-1" />}
                    {role.role}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Du har ingen spesielle roller ennå
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legg til admin-rolle</CardTitle>
            <CardDescription>
              Som admin kan du:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Opprette og administrere arrangementer</li>
                <li>Sjekke inn billetter med QR-scanner</li>
                <li>Se alle transaksjoner</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleAddRole('admin')}
              disabled={isPending || hasAdmin}
              className="w-full"
              variant={hasAdmin ? "outline" : "default"}
            >
              {hasAdmin ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Du er allerede admin
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Gi meg admin-rettigheter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legg til arrangør-rolle</CardTitle>
            <CardDescription>
              Som arrangør kan du:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Opprette arrangementer</li>
                <li>Sjekke inn billetter</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleAddRole('organizer')}
              disabled={isPending || hasOrganizer}
              className="w-full"
              variant={hasOrganizer ? "outline" : "default"}
            >
              {hasOrganizer ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Du er allerede arrangør
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Gi meg arrangør-rettigheter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            <strong>Viktig:</strong> I et produksjonsmiljø må roller administreres av en superadmin.
            Denne siden er kun for testing og utvikling.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
