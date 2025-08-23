import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export const SystemTestComponent = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (name: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => {
      const existing = prev.findIndex(test => test.name === name);
      const newResult = { name, status, message };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      }
      return [...prev, newResult];
    });
  };

  const runFullSystemTest = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Authentication
    updateTestResult('auth', 'pending', 'Tester autentisering...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updateTestResult('auth', 'success', `Bruker logget inn: ${user.email}`);
      } else {
        updateTestResult('auth', 'error', 'Ingen bruker funnet');
        setTesting(false);
        return;
      }

      // Test 2: Profile access
      updateTestResult('profile', 'pending', 'Tester profiltilgang...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        updateTestResult('profile', 'error', `Profilfeil: ${profileError.message}`);
      } else {
        updateTestResult('profile', 'success', `Profil funnet: ${profile.display_name} (${profile.role})`);
      }

      // Test 3: Profile settings
      updateTestResult('settings', 'pending', 'Tester profilinnstillinger...');
      const { data: settings, error: settingsError } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('maker_id', user.id)
        .single();

      if (settingsError) {
        updateTestResult('settings', 'error', `Innstillingsfeil: ${settingsError.message}`);
      } else {
        updateTestResult('settings', 'success', 'Profilinnstillinger funnet og tilgjengelig');
      }

      // Test 4: Map data access
      updateTestResult('map_data', 'pending', 'Tester karttilgang...');
      const { data: makers, error: mapError } = await supabase
        .from('profiles')
        .select('id, display_name, latitude, longitude, address, is_address_public')
        .eq('role', 'maker')
        .eq('is_address_public', true);

      if (mapError) {
        updateTestResult('map_data', 'error', `Kartfeil: ${mapError.message}`);
      } else {
        updateTestResult('map_data', 'success', `Kartdata: ${makers?.length || 0} offentlige makere`);
      }

      // Test 5: Concepts access
      updateTestResult('concepts', 'pending', 'Tester konsepttilgang...');
      const { data: concepts, error: conceptError } = await supabase
        .from('concepts')
        .select('*')
        .limit(1);

      if (conceptError) {
        updateTestResult('concepts', 'error', `Konseptfeil: ${conceptError.message}`);
      } else {
        updateTestResult('concepts', 'success', `Konsepter: ${concepts?.length || 0} tilgjengelige`);
      }

      // Test 6: Portfolio access
      updateTestResult('portfolio', 'pending', 'Tester portefølje...');
      const { data: portfolio, error: portfolioError } = await supabase
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', user.id);

      if (portfolioError) {
        updateTestResult('portfolio', 'error', `Porteføljefeil: ${portfolioError.message}`);
      } else {
        updateTestResult('portfolio', 'success', `Porteføljedata: ${portfolio?.length || 0} elementer`);
      }

      toast({
        title: "Systemtest fullført",
        description: "Alle tester har blitt kjørt",
      });

    } catch (error: any) {
      updateTestResult('system', 'error', `Systemfeil: ${error.message}`);
      toast({
        title: "Systemtest feil",
        description: error.message,
        variant: "destructive",
      });
    }

    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Full System Test</CardTitle>
        <CardDescription>
          Tester alle hovedfunksjoner i systemet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runFullSystemTest} 
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Kjører systemtest...' : 'Kjør full systemtest'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Testresultater:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">{result.name}</p>
                    <p className="text-xs text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};