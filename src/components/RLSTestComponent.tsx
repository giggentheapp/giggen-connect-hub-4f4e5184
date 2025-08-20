import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RLSTestComponentProps {
  userRole: 'maker' | 'goer';
}

interface TestResult {
  test: string;
  expected: 'success' | 'failure';
  actual: 'success' | 'failure' | 'pending';
  message: string;
  error?: string;
}

export const RLSTestComponent = ({ userRole }: RLSTestComponentProps) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runRLSTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests: TestResult[] = [
      {
        test: 'Lese konsepter',
        expected: 'success',
        actual: 'pending',
        message: 'Alle brukere skal kunne lese konsepter'
      },
      {
        test: 'Lese offentlige portefølje-elementer',
        expected: 'success',
        actual: 'pending',
        message: 'Alle brukere skal kunne lese offentlige portefølje-elementer'
      },
      {
        test: 'Lese offentlige arrangementer',
        expected: 'success',
        actual: 'pending',
        message: 'Alle brukere skal kunne lese offentlige arrangementer'
      },
      {
        test: 'Opprette konsept',
        expected: userRole === 'maker' ? 'success' : 'failure',
        actual: 'pending',
        message: userRole === 'maker' 
          ? 'Makers skal kunne opprette konsepter'
          : 'Goers skal IKKE kunne opprette konsepter'
      },
      {
        test: 'Opprette portefølje-element',
        expected: userRole === 'maker' ? 'success' : 'failure',
        actual: 'pending',
        message: userRole === 'maker'
          ? 'Makers skal kunne opprette portefølje-elementer'
          : 'Goers skal IKKE kunne opprette portefølje-elementer'
      },
      {
        test: 'Opprette arrangement',
        expected: userRole === 'maker' ? 'success' : 'failure',
        actual: 'pending',
        message: userRole === 'maker'
          ? 'Makers skal kunne opprette arrangementer'
          : 'Goers skal IKKE kunne opprette arrangementer'
      }
    ];

    let updatedTests = [...tests];
    setTestResults(updatedTests);

    // Test 1: Read concepts
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .limit(1);

      updatedTests[0].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[0].error = error.message;
      }
    } catch (error: any) {
      updatedTests[0].actual = 'failure';
      updatedTests[0].error = error.message;
    }
    setTestResults([...updatedTests]);

    // Test 2: Read public portfolio items
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('is_public', true)
        .limit(1);

      updatedTests[1].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[1].error = error.message;
      }
    } catch (error: any) {
      updatedTests[1].actual = 'failure';
      updatedTests[1].error = error.message;
    }
    setTestResults([...updatedTests]);

    // Test 3: Read public events
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_public', true)
        .limit(1);

      updatedTests[2].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[2].error = error.message;
      }
    } catch (error: any) {
      updatedTests[2].actual = 'failure';
      updatedTests[2].error = error.message;
    }
    setTestResults([...updatedTests]);

    // Test 4: Create concept
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Ikke innlogget');

      const { error } = await supabase
        .from('concepts')
        .insert({
          maker_id: user.user.id,
          title: `Test konsept ${Date.now()}`,
          description: 'Dette er en test for RLS'
        });

      updatedTests[3].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[3].error = error.message;
      }

      // Clean up if successful
      if (!error) {
        await supabase
          .from('concepts')
          .delete()
          .eq('title', `Test konsept ${Date.now()}`);
      }
    } catch (error: any) {
      updatedTests[3].actual = 'failure';
      updatedTests[3].error = error.message;
    }
    setTestResults([...updatedTests]);

    // Test 5: Create portfolio item
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Ikke innlogget');

      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          maker_id: user.user.id,
          title: `Test portefølje ${Date.now()}`,
          description: 'Dette er en test for RLS',
          media_type: 'text'
        });

      updatedTests[4].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[4].error = error.message;
      }

      // Clean up if successful
      if (!error) {
        await supabase
          .from('portfolio_items')
          .delete()
          .eq('title', `Test portefølje ${Date.now()}`);
      }
    } catch (error: any) {
      updatedTests[4].actual = 'failure';
      updatedTests[4].error = error.message;
    }
    setTestResults([...updatedTests]);

    // Test 6: Create event
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Ikke innlogget');

      const { error } = await supabase
        .from('events')
        .insert({
          maker_id: user.user.id,
          title: `Test arrangement ${Date.now()}`,
          description: 'Dette er en test for RLS'
        });

      updatedTests[5].actual = error ? 'failure' : 'success';
      if (error) {
        updatedTests[5].error = error.message;
      }

      // Clean up if successful
      if (!error) {
        await supabase
          .from('events')
          .delete()
          .eq('title', `Test arrangement ${Date.now()}`);
      }
    } catch (error: any) {
      updatedTests[5].actual = 'failure';
      updatedTests[5].error = error.message;
    }
    setTestResults([...updatedTests]);

    setIsRunning(false);

    // Show summary toast
    const passedTests = updatedTests.filter(t => t.actual === t.expected).length;
    const totalTests = updatedTests.length;

    toast({
      title: `RLS Test fullført`,
      description: `${passedTests}/${totalTests} tester passerte`,
      variant: passedTests === totalTests ? "default" : "destructive",
    });
  };

  const getResultIcon = (result: TestResult) => {
    if (result.actual === 'pending') {
      return <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />;
    }
    
    const passed = result.actual === result.expected;
    return passed 
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getResultBadge = (result: TestResult) => {
    if (result.actual === 'pending') {
      return <Badge variant="secondary">Venter...</Badge>;
    }
    
    const passed = result.actual === result.expected;
    return (
      <Badge variant={passed ? "default" : "destructive"}>
        {passed ? 'PASS' : 'FEIL'}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Din rolle: {userRole === 'maker' ? 'GiggenMaker' : 'GiggenGoer'}</span>
        </div>
        <Button 
          onClick={runRLSTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {isRunning ? 'Kjører tester...' : 'Kjør RLS Tester'}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getResultIcon(result)}
                <div>
                  <div className="font-medium">{result.test}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                  {result.error && (
                    <div className="text-xs text-red-600 mt-1">Feil: {result.error}</div>
                  )}
                </div>
              </div>
              {getResultBadge(result)}
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Klikk "Kjør RLS Tester" for å teste sikkerhetspolicyene</p>
        </div>
      )}
    </div>
  );
};