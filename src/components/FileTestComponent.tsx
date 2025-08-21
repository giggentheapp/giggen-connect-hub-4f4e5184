import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FileTestComponentProps {
  userRole: 'maker' | 'goer';
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const FileTestComponent = ({ userRole }: FileTestComponentProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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

  const runFileTests = async () => {
    if (!user) {
      toast({
        title: "Feil",
        description: "Bruker ikke funnet",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResults([]);

    // Test 1: Portfolio files read access
    try {
      updateTestResult('portfolio_read', 'pending', 'Tester lesing av porteføljefiler...');
      
      const { data, error } = await supabase
        .from('portfolio_files')
        .select('*')
        .limit(5);

      if (error) {
        updateTestResult('portfolio_read', 'error', `Feil ved lesing av porteføljefiler: ${error.message}`);
      } else {
        updateTestResult('portfolio_read', 'success', `Kan lese porteføljefiler (funnet ${data.length})`);
      }
    } catch (error: any) {
      updateTestResult('portfolio_read', 'error', `Uventet feil: ${error.message}`);
    }

    // Test 2: Concept files read access
    try {
      updateTestResult('concept_read', 'pending', 'Tester lesing av konseptfiler...');
      
      const { data, error } = await supabase
        .from('concept_files')
        .select('*')
        .limit(5);

      if (error) {
        updateTestResult('concept_read', 'error', `Feil ved lesing av konseptfiler: ${error.message}`);
      } else {
        updateTestResult('concept_read', 'success', `Kan lese konseptfiler (funnet ${data.length})`);
      }
    } catch (error: any) {
      updateTestResult('concept_read', 'error', `Uventet feil: ${error.message}`);
    }

    // Test 3: Storage buckets access
    try {
      updateTestResult('storage_list', 'pending', 'Tester tilgang til storage buckets...');
      
      const { data: portfolioData, error: portfolioError } = await supabase.storage
        .from('portfolio')
        .list(user.id, { limit: 5 });

      const { data: conceptsData, error: conceptsError } = await supabase.storage
        .from('concepts')
        .list(user.id, { limit: 5 });

      if (portfolioError || conceptsError) {
        const errorMsg = portfolioError?.message || conceptsError?.message || 'Ukjent feil';
        updateTestResult('storage_list', 'error', `Feil ved tilgang til storage: ${errorMsg}`);
      } else {
        updateTestResult('storage_list', 'success', 
          `Kan lese storage (portfolio: ${portfolioData?.length || 0}, concepts: ${conceptsData?.length || 0})`);
      }
    } catch (error: any) {
      updateTestResult('storage_list', 'error', `Uventet feil: ${error.message}`);
    }

    // Test 4: Write access (only for makers)
    if (userRole === 'maker') {
      try {
        updateTestResult('portfolio_write', 'pending', 'Tester opplasting til portefølje...');
        
        // Test portfolio file upload simulation (metadata only)
        const testFileData = {
          user_id: user.id,
          file_type: 'document',
          filename: 'test-file.txt',
          file_path: `${user.id}/test-${Date.now()}.txt`,
          file_size: 100,
          mime_type: 'text/plain',
          is_public: true
        };

        const { data: insertData, error: insertError } = await supabase
          .from('portfolio_files')
          .insert(testFileData)
          .select()
          .single();

        if (insertError) {
          updateTestResult('portfolio_write', 'error', `Kan ikke opprette porteføljefil: ${insertError.message}`);
        } else {
          // Clean up test data
          await supabase
            .from('portfolio_files')
            .delete()
            .eq('id', insertData.id);
          
          updateTestResult('portfolio_write', 'success', 'Kan opprette og slette porteføljefiler');
        }
      } catch (error: any) {
        updateTestResult('portfolio_write', 'error', `Uventet feil: ${error.message}`);
      }
    } else {
      // Test write access denial for goers
      try {
        updateTestResult('portfolio_write_denied', 'pending', 'Tester at Goers ikke kan laste opp...');
        
        const testFileData = {
          user_id: user.id,
          file_type: 'document',
          filename: 'unauthorized-test.txt',
          file_path: `${user.id}/unauthorized-${Date.now()}.txt`,
          file_size: 100,
          mime_type: 'text/plain',
          is_public: true
        };

        const { error: insertError } = await supabase
          .from('portfolio_files')
          .insert(testFileData);

        if (insertError) {
          updateTestResult('portfolio_write_denied', 'success', 'Goers kan ikke laste opp filer (forventet)');
        } else {
          updateTestResult('portfolio_write_denied', 'error', 'Goers kan laste opp filer (SIKKERHETSFEIL!)');
        }
      } catch (error: any) {
        updateTestResult('portfolio_write_denied', 'error', `Uventet feil: ${error.message}`);
      }
    }

    // Test 5: Cross-user access (try to access another user's files)
    try {
      updateTestResult('cross_user_access', 'pending', 'Tester tilgang til andre brukeres filer...');
      
      // Try to get files from other users
      const { data, error } = await supabase
        .from('portfolio_files')
        .select('*')
        .neq('user_id', user.id)
        .eq('is_public', false)
        .limit(1);

      if (error) {
        updateTestResult('cross_user_access', 'error', `Feil ved test: ${error.message}`);
      } else if (data.length === 0) {
        updateTestResult('cross_user_access', 'success', 'Kan ikke se private filer fra andre brukere (korrekt)');
      } else {
        updateTestResult('cross_user_access', 'error', 'Kan se private filer fra andre brukere (SIKKERHETSFEIL!)');
      }
    } catch (error: any) {
      updateTestResult('cross_user_access', 'error', `Uventet feil: ${error.message}`);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">File RLS Test</h3>
          <p className="text-sm text-muted-foreground">
            Tester at filhåndtering fungerer korrekt for {userRole === 'maker' ? 'Makers' : 'Goers'}
          </p>
        </div>
        <Button 
          onClick={runFileTests} 
          disabled={testing || !user}
          variant="outline"
        >
          {testing ? 'Tester...' : 'Kjør tester'}
        </Button>
      </div>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testresultater</CardTitle>
            <CardDescription>
              Resultater av RLS-testing for filhåndtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{result.name}</p>
                    <p className="text-xs text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!testing && testResults.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {testResults.filter(r => r.status === 'success').length} av {testResults.length} tester bestått
          </p>
        </div>
      )}
    </div>
  );
};

export default FileTestComponent;