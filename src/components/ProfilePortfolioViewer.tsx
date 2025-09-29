import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Volume2, Image as ImageIcon, File, Download } from 'lucide-react';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { supabase } from '@/integrations/supabase/client';

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
    const { data } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);
    
    console.log('🔗 Generated public URL for:', filePath, '→', data.publicUrl);
    
    // Add timestamp to prevent caching issues
    const urlWithCache = `${data.publicUrl}?t=${Date.now()}`;
    console.log('🔗 Final URL with cache busting:', urlWithCache);
    
    return urlWithCache;
  };

  // Enhanced audio detection function for consistency
  const isAudioFile = (file: typeof files[0]) => {
    return file.file_type === 'audio' || 
           file.file_type.includes('audio') || 
           file.mime_type?.includes('audio') ||
           /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.filename);
  };

  const renderMediaPlayer = (file: typeof files[0]) => {
    const publicUrl = getPublicUrl(file.file_path);
    
    // Test connectivity for audio files on mount
    React.useEffect(() => {
      if (isAudioFile(file)) {
        testAudioConnectivity(file.file_path).catch(console.error);
      }
    }, [file.file_path]);

    if (file.file_type.includes('video')) {
      return (
        <video 
          controls 
          className="w-full max-h-48 rounded-lg"
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
              const audioElement = e.currentTarget;
              console.error('🚫 Audio playback error for:', file.filename);
              console.error('Error details:', {
                error: audioElement.error,
                errorCode: audioElement.error?.code,
                errorMessage: audioElement.error?.message,
                url: publicUrl,
                mimeType: file.mime_type,
                fileType: file.file_type,
                networkState: audioElement.networkState,
                readyState: audioElement.readyState
              });
              
              // Try to fetch the URL directly to check for network issues
              fetch(publicUrl, { method: 'HEAD' })
                .then(response => {
                  console.log('🌐 Direct fetch test:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                  });
                })
                .catch(fetchError => {
                  console.error('🚫 Direct fetch failed:', fetchError);
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

    if (file.file_type.includes('image')) {
      return (
        <img 
          src={publicUrl} 
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
                  onClick={() => window.open(getPublicUrl(file.file_path), '_blank')}
                  className="w-full h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Last ned
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfilePortfolioViewer;