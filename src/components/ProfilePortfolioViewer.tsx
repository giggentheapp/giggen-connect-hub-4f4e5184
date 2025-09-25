import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, Image as ImageIcon, File } from 'lucide-react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';

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
    if (fileType.includes('video')) return <Play className="h-4 w-4" />;
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

  const renderMediaPlayer = (file: typeof files[0]) => {
    if (!file.file_url) return null;

    if (file.file_type.includes('video')) {
      return (
        <video 
          controls 
          className="w-full max-h-48 rounded-lg"
        >
          <source src={file.file_url} type={file.mime_type || 'video/mp4'} />
          Videoen kan ikke vises i nettleseren din.
        </video>
      );
    }

    // Enhanced audio detection - check file type, mime type, and file extension
    const isAudioFile = file.file_type.includes('audio') || 
                        file.mime_type?.includes('audio') ||
                        /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.filename);

    if (isAudioFile) {
      console.log('🎵 Rendering audio player for:', file.filename, {
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_url: file.file_url
      });
      
      return (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{file.filename}</span>
          </div>
          <audio 
            controls 
            className="w-full rounded-md"
            preload="metadata"
            onError={(e) => {
              console.error('Audio playback error:', e);
              console.error('Audio file URL:', file.file_url);
              console.error('Audio mime type:', file.mime_type);
            }}
            onLoadStart={() => {
              console.log('Audio loading started for:', file.filename);
            }}
          >
            <source src={file.file_url} type={file.mime_type || 'audio/mpeg'} />
            {file.mime_type?.includes('wav') && (
              <source src={file.file_url} type="audio/wav" />
            )}
            Lyden kan ikke spilles i nettleseren din.
          </audio>
        </div>
      );
    }

    if (file.file_type.includes('image')) {
      return (
        <img 
          src={file.file_url} 
          alt={file.title || file.filename}
          className="w-full max-h-48 object-cover rounded-lg"
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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
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
              
              {renderMediaPlayer(file)}
              
              {file.description && (
                <p className="text-xs text-muted-foreground">
                  {file.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(file.created_at).toLocaleDateString('no-NO')}</span>
                {file.file_size && (
                  <span>{(file.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfilePortfolioViewer;