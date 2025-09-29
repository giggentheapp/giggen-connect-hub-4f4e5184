import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Volume2, Image as ImageIcon, File, Download } from 'lucide-react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';
import { ErrorBoundary } from './ErrorBoundary';

interface ProfilePortfolioViewerProps {
  userId: string;
  showControls?: boolean;
  isOwnProfile?: boolean;
}

export const ProfilePortfolioViewer = ({ userId, showControls = false, isOwnProfile = false }: ProfilePortfolioViewerProps) => {
  const { files, loading, error } = useProfilePortfolio(userId);
  const { t } = useAppTranslation();

  // Test function to verify Supabase connectivity
  const testAudioConnectivity = async (filePath: string) => {
    try {
      console.log('🧪 Testing audio connectivity for:', filePath);
      
      // Test 1: Generate signed URL as fallback
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('portfolio')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (signedUrlError) {
        console.error('🚫 Signed URL error:', signedUrlError);
      } else {
        console.log('✅ Signed URL generated:', signedUrlData.signedUrl);
      }
      
      // Test 2: Check file existence
      const { data: fileData, error: fileError } = await supabase.storage
        .from('portfolio')
        .list(filePath.split('/')[0], { search: filePath.split('/')[1] });
      
      if (fileError) {
        console.error('🚫 File list error:', fileError);
      } else {
        console.log('📁 File exists:', fileData);
      }
      
      return signedUrlData?.signedUrl;
    } catch (err) {
      console.error('🚫 Connectivity test failed:', err);
      return null;
    }
  };

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

  const getPublicUrl = (filePath: string) => {
    console.log('📁 Original file_path from DB:', filePath);
    
    // Check if filePath already includes user ID or is malformed
    if (!filePath) {
      console.error('❌ Empty file_path!');
      return '';
    }
    
    const { data } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);
    
    console.log('🔗 Generated public URL:', data.publicUrl);
    
    // Test if URL is actually accessible
    fetch(data.publicUrl, { method: 'HEAD' })
      .then(response => {
        console.log('🌐 URL Response:', response.status, response.statusText);
        if (response.status === 404) {
          console.error('❌ File not found at URL!');
          console.error('Expected path:', filePath);
          console.error('Full URL:', data.publicUrl);
        }
      })
      .catch(error => console.error('❌ Fetch failed:', error));
    
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

      // Test connectivity for audio files on mount
      React.useEffect(() => {
        if (isAudioFile(file)) {
          testAudioConnectivity(file.file_path).catch(console.error);
        }
      }, [file.file_path]);

      if (file.file_type?.includes('video')) {
        return (
          <video 
            controls 
            className="w-full max-h-48 rounded-lg"
            onError={(e) => {
              console.error('🔴 Video Error for:', file.filename, e);
            }}
          >
            <source src={publicUrl} type={file.mime_type || 'video/mp4'} />
            Videoen kan ikke vises i nettleseren din.
          </video>
        );
      }

      if (isAudioFile(file)) {
        console.log('🎵 Rendering audio player for:', file.filename, {
          file_type: file.file_type,
          mime_type: file.mime_type,
          publicUrl: publicUrl
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
              crossOrigin="anonymous"
              controlsList="nodownload"
              onError={(e) => {
                const target = e.target as HTMLAudioElement;
                console.error('🔴 Audio Error:', {
                  error: target.error,
                  code: target.error?.code,
                  message: target.error?.message,
                  src: publicUrl,
                  filename: file.filename,
                  networkState: target.networkState,
                  readyState: target.readyState
                });
              }}
              onLoadStart={() => {
                console.log('▶️ Audio loading started for:', file.filename);
              }}
              onLoadedMetadata={() => {
                console.log('📊 Audio metadata loaded for:', file.filename);
              }}
              onCanPlay={() => {
                console.log('✅ Audio ready to play:', file.filename);
              }}
              onPlay={() => {
                console.log('🎵 Audio playback started for:', file.filename);
              }}
              onPause={() => {
                console.log('⏸️ Audio playback paused for:', file.filename);
              }}
            >
              <source src={publicUrl} type={file.mime_type || 'audio/mpeg'} />
              {file.mime_type !== 'audio/mpeg' && <source src={publicUrl} type="audio/mpeg" />}
              {file.mime_type !== 'audio/wav' && <source src={publicUrl} type="audio/wav" />}
              {file.mime_type !== 'audio/mp4' && <source src={publicUrl} type="audio/mp4" />}
              <p className="text-sm text-muted-foreground mt-2">
                Lyden kan ikke spilles i nettleseren din. <br />
                <a href={publicUrl} download className="text-primary hover:underline">
                  Last ned filen direkte
                </a>
              </p>
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
                  
                  {/* Show download button only for non-audio files */}
                  {!isAudioFile(file) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = getPublicUrl(file.file_path);
                        if (url) {
                          window.open(url, '_blank');
                        } else {
                          console.error('🔴 Cannot download - no URL available');
                        }
                      }}
                      className="w-full h-7 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Last ned
                    </Button>
                  )}
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