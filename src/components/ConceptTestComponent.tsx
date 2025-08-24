import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ConceptWizard } from './ConceptWizard';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const ConceptTestComponent = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Check authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        results.push({
          name: 'Authentication',
          status: 'success',
          message: `Authenticated as ${user.email}`
        });
        setUserId(user.id);
      } else {
        results.push({
          name: 'Authentication',
          status: 'error',
          message: 'Not authenticated'
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Authentication',
        status: 'error',
        message: error.message
      });
    }

    // Test 2: Check concepts bucket access
    try {
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = new Blob(['test content'], { type: 'text/plain' });
      
      const { error: uploadError } = await supabase.storage
        .from('concepts')
        .upload(`${userId}/${testFileName}`, testContent);
        
      if (uploadError) throw uploadError;

      // Clean up test file
      await supabase.storage
        .from('concepts')
        .remove([`${userId}/${testFileName}`]);

      results.push({
        name: 'Storage Upload',
        status: 'success',
        message: 'Can upload to concepts bucket'
      });
    } catch (error: any) {
      results.push({
        name: 'Storage Upload',
        status: 'error',
        message: `Storage error: ${error.message}`
      });
    }

    // Test 3: Check concepts table access
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      
      results.push({
        name: 'Concepts Table Access',
        status: 'success',
        message: 'Can access concepts table'
      });
    } catch (error: any) {
      results.push({
        name: 'Concepts Table Access',
        status: 'error',
        message: `Database error: ${error.message}`
      });
    }

    // Test 4: Check concept_files table access
    try {
      const { data, error } = await supabase
        .from('concept_files')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      
      results.push({
        name: 'Concept Files Table Access',
        status: 'success',
        message: 'Can access concept_files table'
      });
    } catch (error: any) {
      results.push({
        name: 'Concept Files Table Access',
        status: 'error',
        message: `Database error: ${error.message}`
      });
    }

    // Test 5: Check profile_tech_specs for tech specs
    try {
      const { data, error } = await supabase
        .from('profile_tech_specs')
        .select('id, filename')
        .eq('profile_id', userId)
        .limit(5);
        
      if (error) throw error;
      
      results.push({
        name: 'Tech Spec Files',
        status: data && data.length > 0 ? 'success' : 'warning',
        message: data && data.length > 0 
          ? `Found ${data.length} tech spec files` 
          : 'No tech spec files found'
      });
    } catch (error: any) {
      results.push({
        name: 'Tech Spec Files',
        status: 'error',
        message: `Error loading tech specs: ${error.message}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Konsept Funksjonalitet Test</CardTitle>
          <CardDescription>
            Test konseptopprettelse, filopplasting og RLS-policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isRunning}>
              {isRunning ? 'Kjører tester...' : 'Kjør tester'}
            </Button>
            <Button 
              onClick={() => setIsWizardOpen(true)} 
              variant="outline"
              disabled={!userId}
            >
              Åpne konseptveiviser
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Testresultater:</h3>
              {testResults.map((result, index) => (
                <Alert key={index} className={
                  result.status === 'error' ? 'border-red-200' : 
                  result.status === 'warning' ? 'border-yellow-200' : 
                  'border-green-200'
                }>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <AlertDescription>
                      <strong>{result.name}:</strong> {result.message}
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isWizardOpen && userId && (
        <ConceptWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            console.log('Concept created successfully!');
            setIsWizardOpen(false);
            // Re-run tests to verify everything still works
            runTests();
          }}
          userId={userId}
        />
      )}
    </div>
  );
};

export default ConceptTestComponent;