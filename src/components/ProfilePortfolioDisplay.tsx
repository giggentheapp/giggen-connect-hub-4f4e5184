import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Image, Video, Music } from 'lucide-react';

interface PortfolioFile {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  file_url: string | null;
}

interface ProfilePortfolioDisplayProps {
  userId: string;
}

export const ProfilePortfolioDisplay = ({ userId }: ProfilePortfolioDisplayProps) => {
  const [files, setFiles] = useState<PortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<PortfolioFile | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Get files via file_usage table - only image, video, audio
      const { data, error } = await supabase
        .from('file_usage')
        .select(`
          file_id,
          user_files!inner(
            id,
            filename,
            file_path,
            file_type,
            mime_type,
            file_size
          )
        `)
        .eq('usage_type', 'profile_portfolio')
        .eq('reference_id', userId)
        .in('user_files.file_type', ['image', 'video', 'audio']);

      if (error) throw error;
      
      // Transform and get public URLs
      const fileData = (data?.map(item => item.user_files).flat() || []) as any[];
      const filesWithUrls = await Promise.all(
        fileData.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('filbank')
            .getPublicUrl(file.file_path);
          
          console.log('Portfolio file URL:', { filename: file.filename, type: file.file_type, url: publicUrl });
          
          return {
            ...file,
            file_url: publicUrl
          };
        })
      );
      
      console.log('Portfolio files loaded:', filesWithUrls);
      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching portfolio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(path);
    return data.publicUrl;
  };

  const renderFilePreview = (file: PortfolioFile) => {
    if (file.file_type === 'image' && file.file_url) {
      return (
        <img 
          src={file.file_url} 
          alt={file.filename}
          className="w-full h-full object-cover"
        />
      );
    }
    
    if (file.file_type === 'video' && file.file_url) {
      return (
        <video 
          src={file.file_url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      );
    }
    
    const Icon = file.file_type === 'audio' ? Music : 
                 file.file_type === 'video' ? Video : Image;
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  };

  const renderModalContent = (file: PortfolioFile) => {
    if (file.file_type === 'image' && file.file_url) {
      return (
        <img 
          src={file.file_url} 
          alt={file.filename}
          className="w-full h-auto max-h-[90vh] object-contain"
        />
      );
    }
    
    if (file.file_type === 'video' && file.file_url) {
      return (
        <video 
          src={file.file_url}
          controls
          autoPlay
          className="w-full h-auto max-h-[90vh]"
        />
      );
    }
    
    if (file.file_type === 'audio' && file.file_url) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <Music className="h-24 w-24 mb-8 text-white/50" />
          <p className="text-xl font-medium text-white mb-6">{file.filename}</p>
          <audio 
            src={file.file_url}
            controls
            autoPlay
            className="w-full max-w-md"
            onError={(e) => {
              console.error('Audio playback error:', e);
              console.error('Audio source:', file.file_url);
              console.error('Audio element:', e.currentTarget);
            }}
            onCanPlay={() => console.log('Audio ready to play:', file.filename)}
            onLoadedData={() => console.log('Audio data loaded:', file.filename)}
          />
          <p className="text-xs text-white/50 mt-4">URL: {file.file_url}</p>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => setSelectedFile(file)}
            className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-accent-orange transition-all"
          >
            {renderFilePreview(file)}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <VisuallyHidden>
            <DialogTitle>{selectedFile?.filename}</DialogTitle>
            <DialogDescription>
              Forhåndsvisning av {selectedFile?.file_type === 'image' ? 'bilde' : selectedFile?.file_type === 'video' ? 'video' : 'lydfil'}
            </DialogDescription>
          </VisuallyHidden>
          {selectedFile && renderModalContent(selectedFile)}
        </DialogContent>
      </Dialog>
    </>
  );
};
