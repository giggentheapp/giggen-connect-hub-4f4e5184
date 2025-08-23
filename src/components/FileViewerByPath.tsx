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
        const tableName = bucketName === 'portfolio' ? 'profile_portfolio' : 'concept_files';
        
        // Extract user_id from folderPath for filtering
        const pathParts = folderPath.split('/');
        const userId = pathParts[pathParts.length - 1];
        
        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        // Filter by user_id for portfolio files or by folder path for concept files
        if (bucketName === 'portfolio') {
          query = query.eq('user_id', userId);
        } else {
          // For concept files, we might need different logic depending on the folder structure
          query = query.eq('creator_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setFiles(data || []);

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