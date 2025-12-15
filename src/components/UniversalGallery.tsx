import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, File, Expand, Play, Music, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface GalleryFile {
  id: string;
  filename: string;
  file_path?: string;
  file_url?: string | null;
  file_type: string;
  mime_type?: string | null;
  title?: string;
  thumbnail_path?: string | null;
}

interface UniversalGalleryProps {
  files: GalleryFile[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  gridCols?: string;
  gap?: string;
  aspectRatio?: string;
  showEmptyMessage?: boolean;
  className?: string;
}

const SUPABASE_URL = 'https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank';

export const UniversalGallery = ({
  files,
  loading = false,
  error = null,
  emptyMessage = "Ingen filer tilgjengelig",
  gridCols = "grid-cols-3",
  gap = "gap-1",
  aspectRatio = "aspect-square",
  showEmptyMessage = true,
  className = ""
}: UniversalGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedFile = selectedIndex !== null ? files[selectedIndex] : null;

  const goToPrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  const goToNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < files.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, files.length]);

  const closeModal = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, goToPrevious, goToNext, closeModal]);

  const getPublicUrl = (file: GalleryFile): string => {
    if (file.file_url) {
      return file.file_url;
    }
    if (file.file_path) {
      if (file.file_path.startsWith('http')) {
        return file.file_path;
      }
      return `${SUPABASE_URL}/${file.file_path}`;
    }
    return '';
  };

  const getThumbnailUrl = (thumbnailPath: string): string => {
    if (thumbnailPath.startsWith('http')) {
      return thumbnailPath;
    }
    return `${SUPABASE_URL}/${thumbnailPath}`;
  };

  const isAudioFile = (file: GalleryFile): boolean => {
    return file.file_type === 'audio' ||
           file.file_type?.includes('audio') ||
           file.mime_type?.includes('audio') ||
           /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(file.filename || '');
  };

  const isVideoFile = (file: GalleryFile): boolean => {
    return file.file_type === 'video' ||
           file.file_type?.includes('video') ||
           file.mime_type?.includes('video');
  };

  const isImageFile = (file: GalleryFile): boolean => {
    return file.file_type === 'image' ||
           file.file_type?.includes('image') ||
           file.mime_type?.includes('image');
  };

  const renderGridItem = (file: GalleryFile) => {
    const publicUrl = getPublicUrl(file);

    // Image
    if (isImageFile(file)) {
      return (
        <div className="relative w-full h-full group">
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
      const thumbnailUrl = getThumbnailUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
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

    // Video without thumbnail
    if (isVideoFile(file)) {
      return (
        <div className="relative w-full h-full group">
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
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      );
    }

    // Audio with thumbnail
    if (isAudioFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getThumbnailUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
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

    // Audio without thumbnail
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 group flex flex-col items-center justify-center p-4">
          <Volume2 className="w-12 h-12 text-accent-orange mb-2" />
          <p className="text-xs font-medium text-center truncate w-full px-2">
            {file.title || file.filename}
          </p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
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

    // Other files
    return (
      <div className="relative w-full h-full bg-muted group flex items-center justify-center">
        <File className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/60" />
      </div>
    );
  };

  const renderModalContent = (file: GalleryFile) => {
    const publicUrl = getPublicUrl(file);

    if (isImageFile(file)) {
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
          key={file.id}
          src={publicUrl}
          controls
          autoPlay
          className="w-full h-auto max-h-[80vh]"
        >
          <source src={publicUrl} type={file.mime_type || 'video/mp4'} />
        </video>
      );
    }

    if (isAudioFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-background to-muted min-h-[300px]">
          <Volume2 className="w-16 h-16 text-accent-orange" />
          <p className="text-lg font-medium text-center">{file.title || file.filename}</p>
          <audio
            key={file.id}
            controls
            autoPlay
            className="w-full max-w-md"
            preload="metadata"
          >
            <source src={publicUrl} type={file.mime_type || 'audio/mpeg'} />
          </audio>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive">Kunne ikke laste filer</p>
      </div>
    );
  }

  if (!files.length) {
    if (!showEmptyMessage) return null;
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const hasPrevious = selectedIndex !== null && selectedIndex > 0;
  const hasNext = selectedIndex !== null && selectedIndex < files.length - 1;

  return (
    <ErrorBoundary>
      <div className={`grid ${gridCols} ${gap} ${className}`}>
        {files.map((file, index) => (
          <div
            key={file.id}
            onClick={() => setSelectedIndex(index)}
            className={`${aspectRatio} rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-accent-orange transition-all`}
          >
            {renderGridItem(file)}
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none [&>button:first-child]:hidden">
          {/* Navigation overlay - wrapped in div to avoid being hidden by [&>button]:hidden */}
          <div className="absolute inset-0 z-[60] pointer-events-none">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Counter */}
            {files.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm font-medium">
                {(selectedIndex ?? 0) + 1} / {files.length}
              </div>
            )}

            {/* Previous button */}
            {hasPrevious && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Next button */}
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex items-center justify-center min-h-[300px]">
            {selectedFile && renderModalContent(selectedFile)}
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default UniversalGallery;
