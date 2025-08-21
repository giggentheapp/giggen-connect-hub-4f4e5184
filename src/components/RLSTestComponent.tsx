import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import FileTestComponent from './FileTestComponent';

interface RLSTestComponentProps {
  userRole: 'maker' | 'goer';
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export const RLSTestComponent = ({ userRole }: RLSTestComponentProps) => {
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

  const runRLSTests = async () => {
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

    // Test database access
    updateTestResult('concepts_read', 'pending', 'Tester lesing av konsepter...');
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .limit(1);

      if (error) {
        updateTestResult('concepts_read', 'error', `Feil ved lesing: ${error.message}`);
      } else {
        updateTestResult('concepts_read', 'success', 'Kan lese konsepter');
      }
    } catch (error: any) {
      updateTestResult('concepts_read', 'error', `Uventet feil: ${error.message}`);
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
    <Tabs defaultValue="database" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="database">Database RLS</TabsTrigger>
        <TabsTrigger value="files">File System RLS</TabsTrigger>
      </TabsList>

      <TabsContent value="database" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Database RLS Test</h3>
            <p className="text-sm text-muted-foreground">
              Tester at Row Level Security fungerer korrekt for {userRole === 'maker' ? 'Makers' : 'Goers'}
            </p>
          </div>
          <Button 
            onClick={runRLSTests} 
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
                Resultater av RLS-testing for {userRole}
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
      </TabsContent>

      <TabsContent value="files" className="space-y-4">
        <FileTestComponent userRole={userRole} />
      </TabsContent>
    </Tabs>
  );
};