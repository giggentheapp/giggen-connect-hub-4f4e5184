import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface ConceptFile {
  id: string;
  concept_id: string;
  creator_id: string;
  filename: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const ConceptPortfolioTest = () => {
  const [files, setFiles] = useState<ConceptFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [testConceptId, setTestConceptId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('concept_files')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading concept files:', error);
      toast({
        title: "Feil ved lasting av filer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = async (fileData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a test concept first if we don't have one
      let conceptId = testConceptId;
      if (!conceptId) {
        const { data: conceptData, error: conceptError } = await supabase
          .from('concepts')
          .insert({
            maker_id: user.id,
            title: 'Test Konsept for Portfolio',
            description: 'Test konsept for å teste portfolio funksjonalitet',
            price: 1000,
            expected_audience: 50,
            is_published: false,
            status: 'draft'
          })
          .select('id')
          .single();

        if (conceptError) throw conceptError;
        conceptId = conceptData.id;
        setTestConceptId(conceptId);
      }

      // Save file to concept_files table
      const { data, error } = await supabase
        .from('concept_files')
        .insert({
          creator_id: user.id,
          concept_id: conceptId,
          filename: fileData.filename,
          file_path: fileData.file_path,
          file_type: fileData.file_type,
          file_url: fileData.publicUrl,
          mime_type: fileData.mime_type,
          file_size: fileData.file_size,
          title: fileData.filename,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Fil lagret!",
        description: `${fileData.filename} ble lagret til concept_files tabellen`,
      });

      loadFiles();
    } catch (error: any) {
      console.error('Error saving concept file:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (file: ConceptFile) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('concept_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('concepts')
        .remove([file.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      toast({
        title: "Fil slettet",
        description: `${file.filename} ble slettet`,
      });

      loadFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Konsept Portfolio Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test opplasting og visning av filer til concept_files tabellen
            </p>
            
            <FileUpload
              bucketName="concepts"
              folderPath=""
              onFileUploaded={handleFileUploaded}
              acceptedTypes=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx"
            />

            {testConceptId && (
              <p className="text-sm text-green-600">
                Test konsept ID: {testConceptId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lagrede filer ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Laster...</p>
          ) : files.length === 0 ? (
            <p className="text-muted-foreground">Ingen filer funnet</p>
          ) : (
            <div className="grid gap-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{file.title || file.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {file.file_type} | MIME: {file.mime_type} | 
                      Størrelse: {file.file_size ? (file.file_size / (1024 * 1024)).toFixed(2) + 'MB' : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Concept ID: {file.concept_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.file_url || '', '_blank')}
                    >
                      Vis
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConceptPortfolioTest;