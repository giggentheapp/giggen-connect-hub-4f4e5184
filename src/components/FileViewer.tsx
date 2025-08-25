import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, File, Image, Video, Music, Download, Eye } from 'lucide-react';

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
  publicUrl?: string;
}

interface FileViewerProps {
  files: FileItem[];
  bucketName: 'portfolio' | 'concepts';
  canDelete?: boolean;
  onFileDeleted?: (fileId: string) => void;
}

const FileViewer = ({ files, bucketName, canDelete = false, onFileDeleted }: FileViewerProps) => {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDelete = async (file: FileItem) => {
    setDeletingFiles(prev => new Set([...prev, file.id]));

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const tableName = bucketName === 'portfolio' ? 'profile_portfolio' : 'concept_files';
      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Fil slettet",
        description: `${file.filename} ble slettet`,
      });

      if (onFileDeleted) {
        onFileDeleted(file.id);
      }

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const renderFilePreview = (file: FileItem) => {
    const publicUrl = getPublicUrl(file.file_path);
    
    switch (file.file_type) {
      case 'image':
        return (
          <img 
            src={publicUrl} 
            alt={file.title || file.filename}
            className="w-full h-32 object-cover rounded"
          />
        );
      case 'video':
        return (
          <video 
            src={publicUrl} 
            controls
            className="w-full h-32 rounded"
          />
        );
      case 'audio':
        return (
          <audio 
            src={publicUrl} 
            controls
            className="w-full"
          />
        );
      default:
        return (
          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
            {getFileIcon(file.file_type)}
            <span className="ml-2 text-sm text-muted-foreground">{file.filename}</span>
          </div>
        );
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Ingen filer funnet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.isArray(files) ? files.filter(file => file && file.id).map((file) => (
        <Card key={file.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getFileIcon(file.file_type)}
                <span className="truncate">{file.title || file.filename}</span>
              </div>
              {!file.is_public && (
                <div className="h-4 w-4 text-muted-foreground" title="Private fil">
                  <Eye className="h-4 w-4" />
                </div>
              )}
            </CardTitle>
            {file.description && (
              <CardDescription className="text-xs mt-1">
                {file.description}
              </CardDescription>
            )}
            <CardDescription className="text-xs">
              {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('no-NO')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderFilePreview(file)}
            <div className="flex justify-between items-center mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getPublicUrl(file.file_path), '_blank')}
              >
                <Download className="h-3 w-3 mr-1" />
                Last ned
              </Button>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(file)}
                  disabled={deletingFiles.has(file.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {deletingFiles.has(file.id) ? 'Sletter...' : 'Slett'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )) : <></>}
    </div>
  );
};

export default FileViewer;