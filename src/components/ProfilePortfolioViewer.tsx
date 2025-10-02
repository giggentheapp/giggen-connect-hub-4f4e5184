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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Kunne ikke laste portefølje: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!files.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {showControls || isOwnProfile
              ? t('noPortfolioUploaded')
              : "Ingen offentlige porteføljefiler tilgjengelig eller eieren har ikke tillatt visning av portefølje"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('video')) return <Volume2 className="h-4 w-4" />;
    if (fileType.includes('audio')) return <Volume2 className="h-4 w-4" />;
    if (fileType.includes('image')) return <ImageIcon className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('video')) return 'Video';
    if (fileType.includes('audio')) return 'Lyd';
    if (fileType.includes('image')) return 'Bilde';
    return 'Dokument';
  };

  const getPublicUrl = (filePath: string) => {
    if (!filePath) {
      console.error('No file path provided');
      return null;
    }

    const { data } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);
    
    if (!data?.publicUrl) {
      console.error('No public URL generated for:', filePath);
      return null;
    }
    
    return data.publicUrl;
  };

  // Enhanced audio detection function for consistency
  const isAudioFile = (file: typeof files[0]) => {
    if (!file) return false;
    
    return file.file_type === 'audio' || 
           file.file_type?.includes('audio') || 
           file.mime_type?.includes('audio') ||
           /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.filename || '');
  };

  const renderMediaPlayer = (file: typeof files[0]) => {
    try {
      if (!file) {
        console.error('🔴 No file provided to renderMediaPlayer');
        return <div className="text-sm text-destructive">Ingen fil funnet</div>;
      }

      const publicUrl = getPublicUrl(file.file_path);
      
      if (!publicUrl) {
        console.error('🔴 No public URL generated for file:', file.filename);
        return <div className="text-sm text-destructive">Kunne ikke laste fil-URL</div>;
      }


      if (file.file_type?.includes('video')) {
        return <VideoPlayer publicUrl={publicUrl} filename={file.filename} mimeType={file.mime_type} />;
      }

      if (isAudioFile(file)) {
        return (
          <div className="w-full h-32 rounded bg-muted flex flex-col items-center justify-center gap-2 p-3">
            <Volume2 className="h-8 w-8 text-primary" />
            <audio
              controls
              className="w-full"
              preload="metadata"
            >
              <source src={publicUrl} type={file.mime_type} />
              Nettleseren din støtter ikke lydavspilling.
            </audio>
          </div>
        );
      }

      if (file.file_type?.includes('image')) {
        return (
          <img 
            src={publicUrl} 
            alt={file.title || file.filename}
            className="w-full max-h-48 object-cover rounded-lg"
            onError={(e) => {
              console.error('🔴 Image Error for:', file.filename, e);
            }}
          />
        );
      }

      return (
        <div className="flex items-center justify-center p-4 border border-dashed rounded-lg">
          <div className="text-center">
            <File className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{file.filename}</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('🔴 Error rendering media player:', error);
      return <div className="text-sm text-destructive">Kunne ikke vise fil</div>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
          if (!file) {
            console.warn('🔴 Skipping null/undefined file in portfolio');
            return null;
          }
          
          return (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">
                      {file.title || file.filename}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getFileIcon(file.file_type)}
                      <span className="ml-1">{getFileTypeLabel(file.file_type)}</span>
                    </Badge>
                  </div>
                  
                  <ErrorBoundary>
                    {renderMediaPlayer(file)}
                  </ErrorBoundary>
                  
                  {file.description && (
                    <p className="text-xs text-muted-foreground">
                      {file.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{new Date(file.created_at).toLocaleDateString('no-NO')}</span>
                    {file.file_size && (
                      <span>{(file.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ErrorBoundary>
  );
};

export default ProfilePortfolioViewer;