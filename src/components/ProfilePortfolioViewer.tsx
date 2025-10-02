import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, Image as ImageIcon, File } from 'lucide-react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from './ErrorBoundary';
import { VideoPlayer } from './VideoPlayer';

interface ProfilePortfolioViewerProps {
  userId: string;
  showControls?: boolean;
  isOwnProfile?: boolean;
}

export const ProfilePortfolioViewer = ({ userId, showControls = false, isOwnProfile = false }: ProfilePortfolioViewerProps) => {
  const { files, loading, error } = useProfilePortfolio(userId);
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
        <p className="text-sm text-destructive">Kunne ikke laste portefølje: {error}</p>
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
    const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
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

    // Image - just show the image
    if (file.file_type?.includes('image')) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <img 
            src={publicUrl} 
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      );
    }

    // Video - show video with small play icon overlay
    if (isVideoFile(file)) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-muted group cursor-pointer">
          <video 
            src={publicUrl}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[16px] border-l-black border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
            </div>
          </div>
        </div>
      );
    }

    // Audio - show audio icon overlay
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 group cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center">
            <Volume2 className="w-16 h-16 text-primary/60" />
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

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-3 gap-1">
        {files.map((file) => {
          if (!file) return null;
          return (
            <div key={file.id} onClick={() => setSelectedFile(file)}>
              {renderGridItem(file)}
            </div>
          );
        })}
      </div>
    </ErrorBoundary>
  );
};

export default ProfilePortfolioViewer;