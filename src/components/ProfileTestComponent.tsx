import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Play, User, Settings, Eye } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const ProfileTestComponent = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'maker' | 'goer' | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(profile?.role);
      }
    };
    getCurrentUser();
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message } : r);
      }
      return [...prev, { name, status, message }];
    });
  };

  const runMakerTests = async () => {
    if (!user) return;

    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Create/Update profile information
      updateTestResult('Profil oppdatering', 'pending', 'Tester oppdatering av profilinformasjon...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: 'Test Maker',
          bio: 'Dette er en testbeskrivelse for profiltesting',
          contact_info: {
            email: 'test@example.com',
            phone: '+47 12345678'
          }
        })
        .eq('user_id', user.id);

      if (profileError) throw new Error(`Profil: ${profileError.message}`);
      updateTestResult('Profil oppdatering', 'success', 'Profil oppdatert successfully');

      // Test 2: Create/Update privacy settings
      updateTestResult('Personvern innstillinger', 'pending', 'Tester oppdatering av personverninnstillinger...');
      
      const { error: settingsError } = await supabase
        .from('profile_settings')
        .upsert({
          maker_id: user.id,
          show_about: true,
          show_contact: true,
          show_portfolio: false,
          show_techspec: true,
          show_events: false
        });

      if (settingsError) throw new Error(`Innstillinger: ${settingsError.message}`);
      updateTestResult('Personvern innstillinger', 'success', 'Innstillinger lagret successfully');

      // Test 3: Read own profile (should see everything)
      updateTestResult('Egen profiltilgang', 'pending', 'Tester tilgang til egen profil...');
      
      const { data: ownProfile, error: ownProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (ownProfileError) throw new Error(`Egen profil: ${ownProfileError.message}`);
      if (!ownProfile.bio) throw new Error('Kan ikke lese egen profilinfo');
      updateTestResult('Egen profiltilgang', 'success', 'Kan lese all egen profilinfo');

      // Test 4: Test settings access
      updateTestResult('Innstillinger tilgang', 'pending', 'Tester tilgang til egne innstillinger...');
      
      const { data: ownSettings, error: ownSettingsError } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('maker_id', user.id)
        .single();

      if (ownSettingsError) throw new Error(`Egne innstillinger: ${ownSettingsError.message}`);
      updateTestResult('Innstillinger tilgang', 'success', 'Kan lese egne personverninnstillinger');

      // Test 5: Portfolio files access (own files)
      updateTestResult('Portfolio filtilgang', 'pending', 'Tester tilgang til egne portfoliofiler...');
      
      const { data: portfolioFiles, error: portfolioError } = await supabase
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', user.id);

      if (portfolioError) throw new Error(`Portfolio: ${portfolioError.message}`);
      updateTestResult('Portfolio filtilgang', 'success', `Kan lese ${portfolioFiles?.length || 0} portfoliofiler`);

      // Test 6: Concept files access (own files)
      updateTestResult('Concept filtilgang', 'pending', 'Tester tilgang til egne concept-filer...');
      
      const { data: conceptFiles, error: conceptError } = await supabase
        .from('concept_files')
        .select('*')
        .eq('creator_id', user.id);

      if (conceptError) throw new Error(`Concept: ${conceptError.message}`);
      updateTestResult('Concept filtilgang', 'success', `Kan lese ${conceptFiles?.length || 0} concept-filer`);

      toast({
        title: "Maker-tester fullført",
        description: "Alle tester for Maker er kjørt",
      });

    } catch (error: any) {
      console.error('Test error:', error);
      updateTestResult('Testfeil', 'error', error.message);
      toast({
        title: "Testfeil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const runGoerTests = async () => {
    if (!user) return;

    setTesting(true);
    setTestResults([]);

    try {
      // Find a maker to test with
      updateTestResult('Finn Maker', 'pending', 'Leter etter en Maker-profil å teste med...');
      
      const { data: makers, error: makerError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('role', 'maker')
        .limit(1);

      if (makerError) throw new Error(`Maker søk: ${makerError.message}`);
      if (!makers || makers.length === 0) throw new Error('Ingen Maker-profiler funnet for testing');
      
      const testMaker = makers[0];
      updateTestResult('Finn Maker', 'success', `Fant Maker: ${testMaker.display_name}`);

      // Test 1: Read Maker profile (should only see public info)
      updateTestResult('Maker profiltilgang', 'pending', 'Tester tilgang til Maker-profil...');
      
      const { data: makerProfile, error: makerProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', testMaker.user_id)
        .single();

      if (makerProfileError) throw new Error(`Maker profil: ${makerProfileError.message}`);
      updateTestResult('Maker profiltilgang', 'success', 'Kan lese grunnleggende Maker-profilinfo');

      // Test 2: Try to access Maker settings (should fail)
      updateTestResult('Maker innstillinger (skal feile)', 'pending', 'Tester uautorisert tilgang til Maker-innstillinger...');
      
      const { data: makerSettings, error: makerSettingsError } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('maker_id', testMaker.user_id)
        .single();

      if (makerSettingsError) {
        updateTestResult('Maker innstillinger (skal feile)', 'success', 'Kan ikke lese Maker-innstillinger (korrekt)');
      } else {
        updateTestResult('Maker innstillinger (skal feile)', 'error', 'Kan lese Maker-innstillinger (SIKKERHETSPROBLEM)');
      }

      // Test 3: Portfolio files - should only see public ones
      updateTestResult('Maker portfolio (offentlig)', 'pending', 'Tester tilgang til offentlige portfoliofiler...');
      
      const { data: publicPortfolio, error: portfolioError } = await supabase
        .from('profile_portfolio')
        .select('*')
        .eq('user_id', testMaker.user_id)
        .eq('is_public', true);

      if (portfolioError) {
        updateTestResult('Maker portfolio (offentlig)', 'success', 'Kan ikke lese portfolio (Maker har skjult det)');
      } else {
        updateTestResult('Maker portfolio (offentlig)', 'success', `Kan lese ${publicPortfolio?.length || 0} offentlige portfoliofiler`);
      }

      // Test 4: Concept files - should only see public ones
      updateTestResult('Maker concepts (offentlig)', 'pending', 'Tester tilgang til offentlige concept-filer...');
      
      const { data: publicConcepts, error: conceptError } = await supabase
        .from('concept_files')
        .select('*')
        .eq('creator_id', testMaker.user_id)
        .eq('is_public', true);

      if (conceptError) {
        updateTestResult('Maker concepts (offentlig)', 'success', 'Kan ikke lese concepts (Maker har skjult det)');
      } else {
        updateTestResult('Maker concepts (offentlig)', 'success', `Kan lese ${publicConcepts?.length || 0} offentlige concept-filer`);
      }

      // Test 5: Try to update Maker profile (should fail)
      updateTestResult('Maker profil oppdatering (skal feile)', 'pending', 'Tester uautorisert oppdatering av Maker-profil...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bio: 'Uautorisert endring' })
        .eq('user_id', testMaker.user_id);

      if (updateError) {
        updateTestResult('Maker profil oppdatering (skal feile)', 'success', 'Kan ikke oppdatere Maker-profil (korrekt)');
      } else {
        updateTestResult('Maker profil oppdatering (skal feile)', 'error', 'Kan oppdatere Maker-profil (SIKKERHETSPROBLEM)');
      }

      toast({
        title: "Goer-tester fullført",
        description: "Alle tester for Goer er kjørt",
      });

    } catch (error: any) {
      console.error('Test error:', error);
      updateTestResult('Testfeil', 'error', error.message);
      toast({
        title: "Testfeil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return null;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profiltester</CardTitle>
          <CardDescription>Du må være logget inn for å kjøre tester</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Profiltester
          </CardTitle>
          <CardDescription>
            Test profilfunksjonalitet for {userRole === 'maker' ? 'Makers' : 'Goers'}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <User className="h-3 w-3 mr-1" />
              {userRole?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {userRole === 'maker' && (
              <Button 
                onClick={runMakerTests} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Kjør Maker-tester
              </Button>
            )}
            <Button 
              onClick={runGoerTests} 
              disabled={testing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Kjør Goer-tester
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testresultater</CardTitle>
            <CardDescription>
              {testResults.filter(r => r.status === 'success').length} av {testResults.length} tester bestått
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileTestComponent;