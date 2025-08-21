import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

const MapTestComponent = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: 'pending' | 'success' | 'error', message: string) => {
    setTests(prev => {
      const existing = prev.findIndex(t => t.name === name);
      const newTest = { name, status, message };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newTest;
        return updated;
      } else {
        return [...prev, newTest];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Test 1: Get current user
      updateTest('Bruker-autentisering', 'pending', 'Sjekker innlogget bruker...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        updateTest('Bruker-autentisering', 'error', 'Ingen bruker innlogget');
        return;
      }
      
      updateTest('Bruker-autentisering', 'success', `Innlogget som: ${user.email}`);

      // Test 2: Get user profile
      updateTest('Profil-tilgang', 'pending', 'Henter brukerprofil...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        updateTest('Profil-tilgang', 'error', `Feil ved henting av profil: ${profileError.message}`);
        return;
      }

      updateTest('Profil-tilgang', 'success', `Profil funnet: ${profile.display_name} (${profile.role})`);

      // Test 3: Test address update (if maker)
      if (profile.role === 'maker') {
        updateTest('Adresse-oppdatering', 'pending', 'Tester adresseoppdatering...');
        
        const testAddress = 'Karl Johans gate 1, Oslo';
        const { error: addressError } = await supabase
          .from('profiles')
          .update({ address: testAddress })
          .eq('user_id', user.id);

        if (addressError) {
          updateTest('Adresse-oppdatering', 'error', `Feil ved adresseoppdatering: ${addressError.message}`);
        } else {
          updateTest('Adresse-oppdatering', 'success', 'Adresse oppdatert');
        }

        // Test 4: Test profile settings access
        updateTest('Innstillinger-tilgang', 'pending', 'Tester tilgang til profilinnstillinger...');
        
        const { data: settings, error: settingsError } = await supabase
          .from('profile_settings')
          .select('*')
          .eq('maker_id', user.id)
          .maybeSingle();

        if (settingsError) {
          updateTest('Innstillinger-tilgang', 'error', `Feil ved henting av innstillinger: ${settingsError.message}`);
        } else if (!settings) {
          // Try to create settings
          const { error: createError } = await supabase
            .from('profile_settings')
            .upsert({ 
              maker_id: user.id, 
              show_on_map: true 
            });
          
          if (createError) {
            updateTest('Innstillinger-tilgang', 'error', `Feil ved opprettelse av innstillinger: ${createError.message}`);
          } else {
            updateTest('Innstillinger-tilgang', 'success', 'Profilinnstillinger opprettet og oppdatert');
          }
        } else {
          updateTest('Innstillinger-tilgang', 'success', `Innstillinger funnet - Kart synlig: ${settings.show_on_map ? 'Ja' : 'Nei'}`);
        }

        // Test 5: Test geocoding function
        updateTest('Geokoding-tjeneste', 'pending', 'Tester adresseoppslag...');
        
        try {
          const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
            body: { address: 'Oslo rådhus' }
          });

          if (geocodeError) {
            updateTest('Geokoding-tjeneste', 'error', `Geokoding feilet: ${geocodeError.message}`);
          } else if (geocodeData && geocodeData.latitude && geocodeData.longitude) {
            updateTest('Geokoding-tjeneste', 'success', `Koordinater funnet: ${geocodeData.latitude.toFixed(4)}, ${geocodeData.longitude.toFixed(4)}`);
          } else {
            updateTest('Geokoding-tjeneste', 'error', 'Ingen koordinater returnert');
          }
        } catch (error: any) {
          updateTest('Geokoding-tjeneste', 'error', `Geokoding feil: ${error.message}`);
        }

        // Test 6: Test map visibility query
        updateTest('Kart-synlighet', 'pending', 'Tester kartsøk...');
        
        const { data: mapMakers, error: mapError } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            latitude,
            longitude,
            profile_settings!inner(show_on_map)
          `)
          .eq('role', 'maker')
          .eq('profile_settings.show_on_map', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (mapError) {
          updateTest('Kart-synlighet', 'error', `Feil ved kartsøk: ${mapError.message}`);
        } else {
          updateTest('Kart-synlighet', 'success', `${mapMakers?.length || 0} synlige makere på kart`);
        }

      } else {
        // Test for Goer - check they can't edit maker profiles
        updateTest('Tilgangskontroll-Goer', 'pending', 'Tester Goer-tilgangsbegrensninger...');
        
        const { data: makers, error: makersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'maker')
          .limit(1);

        if (makersError) {
          updateTest('Tilgangskontroll-Goer', 'error', `Feil ved søk etter makere: ${makersError.message}`);
        } else if (makers && makers.length > 0) {
          // Try to update a maker profile (should fail)
          const { error: updateError } = await supabase
            .from('profile_settings')
            .update({ show_on_map: false })
            .eq('maker_id', makers[0].id);

          if (updateError) {
            updateTest('Tilgangskontroll-Goer', 'success', 'Goer kan ikke redigere Maker-profiler (korrekt)');
          } else {
            updateTest('Tilgangskontroll-Goer', 'error', 'Goer kunne redigere Maker-profil (sikkerhetsproblem!)');
          }
        } else {
          updateTest('Tilgangskontroll-Goer', 'success', 'Ingen makere å teste med');
        }
      }

    } catch (error: any) {
      updateTest('Generell-feil', 'error', `Uventet feil: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Kart-funksjonalitet Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Denne testen sjekker kart-funksjonalitet, adresseoppslag, og tilgangskontroll.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Kjører tester...' : 'Start kartfunksjonalitet-test'}
          </Button>

          {tests.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Testresultater:</h3>
              {tests.map((test) => (
                <div key={test.name} className="flex items-center gap-2 p-2 rounded border">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}:</span>
                  <span className="text-sm text-muted-foreground">{test.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapTestComponent;