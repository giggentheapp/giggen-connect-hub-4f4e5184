import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, Image as ImageIcon, File } from 'lucide-react';
import { useConceptFiles } from '@/hooks/useConceptFiles';

interface ConceptPortfolioGalleryProps {
  conceptId: string;
}

export const ConceptPortfolioGallery = ({ conceptId }: ConceptPortfolioGalleryProps) => {
  const { files, loading, error } = useConceptFiles(conceptId);

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
          <p className="text-sm text-destructive">Kunne ikke laste konseptfiler: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!files.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Ingen filer lastet opp for dette konseptet</p>
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
          className="w-full max-h-64 rounded-lg"
          poster={file.file_url.replace(/\.[^/.]+$/, '_thumb.jpg')} // Optional thumbnail
        >
          <source src={file.file_url} type={file.mime_type || 'video/mp4'} />
          Videoen kan ikke vises i nettleseren din.
        </video>
      );
    }

    if (file.file_type.includes('audio')) {
      return (
        <audio 
          controls 
          className="w-full"
        >
          <source src={file.file_url} type={file.mime_type || 'audio/mpeg'} />
          Lyden kan ikke spilles i nettleseren din.
        </audio>
      );
    }

    if (file.file_type.includes('image')) {
      return (
        <img 
          src={file.file_url} 
          alt={file.title || file.filename}
          className="w-full max-h-64 object-cover rounded-lg"
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Konsept Portefølje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.id} className="space-y-3">
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConceptPortfolioGallery;