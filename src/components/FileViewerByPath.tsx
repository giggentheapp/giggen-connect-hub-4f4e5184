import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FileViewer from './FileViewer';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  is_public: boolean;
  created_at: string;
  title?: string;
  description?: string;
}

interface FileViewerByPathProps {
  bucketName: 'portfolio' | 'concepts';
  folderPath: string;
  showControls?: boolean;
}

const FileViewerByPath = ({ bucketName, folderPath, showControls = false }: FileViewerByPathProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        let error: any = null;
        
        // Extract user_id from folderPath for filtering
        const pathParts = folderPath.split('/');
        const userId = pathParts[pathParts.length - 1];
        
        if (bucketName === 'portfolio') {
          const result = await supabase
            .from('profile_portfolio')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          data = result.data || [];
          error = result.error;
        } else {
          const result = await supabase
            .from('concept_files')
            .select('*')
            .eq('creator_id', userId)
            .order('created_at', { ascending: false });
          data = result.data || [];
          error = result.error;
        }

        if (error) throw error;
        setFiles(data);

      } catch (error: any) {
        console.error('Error fetching files:', error);
        toast({
          title: "Feil ved lasting av filer",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [bucketName, folderPath, toast]);

  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  if (loading) {
    return <div className="text-center p-4">Laster filer...</div>;
  }

  return (
    <FileViewer
      files={files}
      bucketName={bucketName}
      canDelete={showControls}
      onFileDeleted={handleFileDeleted}
    />
  );
};

export default FileViewerByPath;