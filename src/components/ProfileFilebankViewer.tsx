import React, { useState, useEffect } from 'react';
import { Volume2, File, Expand, Play, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from './ErrorBoundary';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FilebankFile {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  category?: string;
  bucket_name: string;
  user_id: string;
  is_public: boolean;
}

interface ProfileFilebankViewerProps {
  userId: string;
}

export const ProfileFilebankViewer = ({ userId }: ProfileFilebankViewerProps) => {
  const [files, setFiles] = useState<FilebankFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FilebankFile | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .ilike('file_path', 'portfolio/%')
        .in('file_type', ['image', 'video', 'audio'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (file: FilebankFile, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('filbank')
        .remove([file.file_path]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id);
      
      if (dbError) throw dbError;
      
      toast.success('Fil fjernet fra portfolio');
      fetchFiles();
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Kunne ikke fjerne fil');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Ingen mediafiler i filbanken
        </p>
      </div>
    );
  }

  const getPublicUrl = (filePath: string) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const isAudioFile = (file: FilebankFile) => {
    return file.file_type === 'audio' || file.mime_type?.includes('audio');
  };

  const isVideoFile = (file: FilebankFile) => {
    return file.file_type === 'video' || file.mime_type?.includes('video');
  };

  const renderGridItem = (file: FilebankFile) => {
    const publicUrl = getPublicUrl(file.file_path);
    if (!publicUrl) return null;

    // Image
    if (file.file_type === 'image') {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <img 
            src={publicUrl} 
            alt={file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="destructive"
              className="w-8 h-8 rounded-full"
              onClick={(e) => handleRemoveFile(file, e)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Video
    if (isVideoFile(file)) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <video 
            src={publicUrl}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="destructive"
              className="w-8 h-8 rounded-full"
              onClick={(e) => handleRemoveFile(file, e)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      );
    }

    // Audio
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 border border-border group cursor-pointer flex flex-col items-center justify-center p-4">
          <Volume2 className="w-12 h-12 text-accent-orange mb-2" />
          <p className="text-xs font-medium text-center truncate w-full px-2">{file.filename}</p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="destructive"
              className="w-8 h-8 rounded-full"
              onClick={(e) => handleRemoveFile(file, e)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderModalContent = (file: FilebankFile) => {
    const publicUrl = getPublicUrl(file.file_path);
    if (!publicUrl) return null;

    if (file.file_type === 'image') {
      return (
        <img 
          src={publicUrl} 
          alt={file.filename}
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      );
    }

    if (isVideoFile(file)) {
      return (
        <video 
          src={publicUrl}
          controls
          autoPlay
          className="w-full h-auto max-h-[80vh]"
        >
          <source src={publicUrl} type={file.mime_type} />
        </video>
      );
    }

    if (isAudioFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-background to-muted min-h-[300px]">
          <Volume2 className="w-16 h-16 text-accent-orange" />
          <p className="text-lg font-medium text-center">{file.filename}</p>
          <audio 
            controls 
            autoPlay
            className="w-full max-w-md"
            preload="metadata"
          >
            <source src={publicUrl} type={file.mime_type} />
          </audio>
        </div>
      );
    }

    return null;
  };

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-3 gap-1">
        {files.map((file) => {
          return (
            <div 
              key={file.id} 
              onClick={() => setSelectedFile(file)}
            >
              {renderGridItem(file)}
            </div>
          );
        })}
      </div>

      {/* Modal for expanded view */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          {selectedFile && renderModalContent(selectedFile)}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default ProfileFilebankViewer;
