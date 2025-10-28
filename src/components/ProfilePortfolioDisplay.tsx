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
  thumbnail_path?: string | null;
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
      
      console.log('Fetching portfolio for userId:', userId);
      
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
            file_size,
            thumbnail_path,
            is_public
          )
        `)
        .eq('usage_type', 'profile_portfolio')
        .eq('reference_id', userId)
        .in('user_files.file_type', ['image', 'video', 'audio']);

      console.log('Portfolio query result:', { data, error, count: data?.length || 0 });
      
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

  const renderFilePreview = (file: PortfolioFile & { thumbnail_path?: string }) => {
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
    
    // Audio with thumbnail
    if (file.file_type === 'audio' && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full">
          <img 
            src={thumbnailUrl} 
            alt={file.filename}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Music className="w-6 h-6 text-accent-orange" />
            </div>
          </div>
        </div>
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
        <div className="p-8 flex flex-col items-center justify-center gap-6">
          <p className="text-lg font-medium text-foreground">{file.filename}</p>
          <audio 
            src={file.file_url}
            controls
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            className="w-full max-w-md"
            onError={(e) => {
              console.error('Audio playback error:', e);
              console.error('Audio source:', file.file_url);
              const audioEl = e.currentTarget;
              if (audioEl.error) {
                console.error('Error code:', audioEl.error.code);
                console.error('Error message:', audioEl.error.message);
              }
            }}
            onCanPlay={() => console.log('Audio ready to play:', file.filename)}
            onLoadedData={() => console.log('Audio data loaded:', file.filename)}
          >
            <source src={file.file_url} type={file.mime_type || 'audio/mpeg'} />
            Din nettleser støtter ikke dette lydformatet.
          </audio>
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
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
