import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Map from '@/components/Map';

const MapVisualTestComponent = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshMap = () => {
    setRefreshKey(prev => prev + 1);
  };

  const testScenarios = [
    {
      name: "Refresh test",
      description: "Klikk for å simulere refresh/reload",
      action: handleRefreshMap,
      variant: "outline" as const
    },
    {
      name: "Navigation test", 
      description: "Gå til /map og tilbake",
      action: () => {
        window.location.href = '/map';
      },
      variant: "outline" as const
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visuell Kart Test</CardTitle>
          <CardDescription>
            Test at markører vises korrekt med profilbilder og navn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {testScenarios.map((scenario, index) => (
                <Button
                  key={index}
                  variant={scenario.variant}
                  size="sm"
                  onClick={scenario.action}
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">✅ Forventet oppførsel:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Sirkulære markører med profilbilder</li>
                  <li>• Navn vises under hver markør</li>
                  <li>• Markører forsvinner ikke ved navigasjon</li>
                  <li>• Hover-effekter fungerer</li>
                  <li>• Popup med profil-info</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">❌ Problemer å se etter:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Pin-ikoner istedenfor profilbilder</li>
                  <li>• Navn kun i popup, ikke ved siden av markør</li>
                  <li>• Markører forsvinner ved refresh/navigasjon</li>
                  <li>• Dupliserte eller feil posisjonerte markører</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <Badge variant="secondary">Test Status</Badge>
              <span className="text-sm text-muted-foreground">
                Refresh count: {refreshKey}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Kart</CardTitle>
          <CardDescription>
            Kartet under viser ekte data fra databasen
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div key={refreshKey}>
            <Map className="w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapVisualTestComponent;