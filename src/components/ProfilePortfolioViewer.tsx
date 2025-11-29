import React, { useState } from 'react';
import { Volume2, File, Expand, Play, Music } from 'lucide-react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from './ErrorBoundary';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProfilePortfolioViewerProps {
  userId: string;
  showControls?: boolean;
  isOwnProfile?: boolean;
}

export const ProfilePortfolioViewer = ({ userId, showControls = false, isOwnProfile = false }: ProfilePortfolioViewerProps) => {
  const { data: files = [], isLoading: loading, error } = useProfilePortfolio(userId);
  const { t } = useAppTranslation();
  const [selectedFile, setSelectedFile] = useState<typeof files[0] | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive">Kunne ikke laste portefølje</p>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          {showControls || isOwnProfile
            ? t('noPortfolioUploaded')
            : "Ingen offentlige porteføljefiler tilgjengelig"
          }
        </p>
      </div>
    );
  }

  const getPublicUrl = (filePath: string) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const isAudioFile = (file: typeof files[0]) => {
    if (!file) return false;
    return file.file_type === 'audio' || 
           file.file_type?.includes('audio') || 
           file.mime_type?.includes('audio') ||
           /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.filename || '');
  };

  const isVideoFile = (file: typeof files[0]) => {
    if (!file) return false;
    return file.file_type?.includes('video') || file.mime_type?.includes('video');
  };

  const renderGridItem = (file: typeof files[0]) => {
    const publicUrl = getPublicUrl(file.file_path);
    if (!publicUrl) return null;

    // Image - just show the image with expand icon on hover
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

    // Video with thumbnail
    if (isVideoFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <img 
            src={thumbnailUrl} 
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      );
    }

    // Video without thumbnail - show video with play icon
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

    // Audio with thumbnail
    if (isAudioFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <img 
            src={thumbnailUrl} 
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Music className="w-6 h-6 text-accent-orange" />
            </div>
          </div>
        </div>
      );
    }

    // Audio without thumbnail - show audio player with filename
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 border border-border group cursor-pointer flex flex-col items-center justify-center p-4">
          <Volume2 className="w-12 h-12 text-accent-orange mb-2" />
          <p className="text-xs font-medium text-center truncate w-full px-2">{file.title || file.filename}</p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Other files - show file icon
    return (
      <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center">
          <File className="w-16 h-16 text-muted-foreground/60" />
        </div>
      </div>
    );
  };

  const renderModalContent = (file: typeof files[0]) => {
    const publicUrl = getPublicUrl(file.file_path);
    if (!publicUrl) return null;

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
          <source src={publicUrl} type={file.mime_type} />
        </video>
      );
    }

    if (isAudioFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-background to-muted min-h-[300px]">
          <Volume2 className="w-16 h-16 text-accent-orange" />
          <p className="text-lg font-medium text-center">{file.title || file.filename}</p>
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
          if (!file) return null;
          
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

export default ProfilePortfolioViewer;