import React, { useState, useEffect } from 'react';
import { Volume2, File, Expand, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from './ErrorBoundary';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ConceptPortfolioGalleryProps {
  conceptId: string;
}

interface ConceptFile {
  id: string;
  filename: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  mime_type: string | null;
  title?: string;
}

export const ConceptPortfolioGallery = ({ conceptId }: ConceptPortfolioGalleryProps) => {
  const [files, setFiles] = useState<ConceptFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ConceptFile | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('concept_files')
          .select('*')
          .eq('concept_id', conceptId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching concept files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [conceptId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!files.length) {
    return null;
  }

  const getPublicUrl = (file: ConceptFile) => {
    return file.file_url || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`;
  };

  const isAudioFile = (file: ConceptFile) => {
    return file.file_type === 'audio' || 
           file.file_type?.includes('audio') || 
           file.mime_type?.includes('audio') ||
           /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.filename || '');
  };

  const isVideoFile = (file: ConceptFile) => {
    return file.file_type?.includes('video') || file.mime_type?.includes('video');
  };

  const renderGridItem = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file);

    // Image
    if (file.file_type?.includes('image')) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <img 
            src={publicUrl} 
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="relative w-full aspect-square overflow-hidden bg-white border border-border group cursor-pointer flex flex-col items-center justify-center p-2 md:p-3 gap-1 md:gap-2">
          <Volume2 className="w-8 h-8 md:w-12 md:h-12 text-primary" />
          <p className="text-[10px] md:text-xs font-medium text-center truncate w-full px-1 md:px-2">{file.title || file.filename}</p>
          <audio 
            controls 
            className="w-full mt-auto scale-75 md:scale-100"
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
          >
            <source src={publicUrl} type={file.mime_type || 'audio/mpeg'} />
          </audio>
        </div>
      );
    }

    // Other files
    return (
      <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center">
          <File className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/60" />
        </div>
      </div>
    );
  };

  const renderModalContent = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file);

    if (file.file_type?.includes('image')) {
      return (
        <img 
          src={publicUrl} 
          alt={file.title || file.filename}
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
          <source src={publicUrl} type={file.mime_type || 'video/mp4'} />
        </video>
      );
    }

    return null;
  };

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-3 gap-1">
        {files.map((file) => {
          const shouldOpenModal = !isAudioFile(file);
          
          return (
            <div 
              key={file.id} 
              onClick={() => shouldOpenModal && setSelectedFile(file)}
            >
              {renderGridItem(file)}
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          {selectedFile && renderModalContent(selectedFile)}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default ConceptPortfolioGallery;
