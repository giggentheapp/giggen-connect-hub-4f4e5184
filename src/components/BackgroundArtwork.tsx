import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundArtworkProps {
  imagePaths?: string[] | null;
  intensity?: number;
  randomize?: boolean;
}

export const BackgroundArtwork = ({ 
  imagePaths, 
  intensity = 0.5,
  randomize = false 
}: BackgroundArtworkProps) => {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedImages = useMemo(() => {
    if (!imagePaths || imagePaths.length === 0) return [];
    
    if (randomize) {
      const shuffled = [...imagePaths].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(2, shuffled.length));
    } else {
      return imagePaths.slice(0, Math.min(2, imagePaths.length));
    }
  }, [imagePaths, randomize]);

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  useEffect(() => {
    if (selectedImages.length === 0) {
      setLoadedImages([]);
      setIsLoaded(false);
      return;
    }

    const urls = selectedImages.map(getPublicUrl);
    let loadedCount = 0;
    const successfulUrls: string[] = [];

    urls.forEach((url, index) => {
      const img = new Image();
      img.onload = () => {
        successfulUrls[index] = url;
        loadedCount++;
        if (loadedCount === urls.length) {
          setLoadedImages(successfulUrls.filter(Boolean));
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === urls.length) {
          setLoadedImages(successfulUrls.filter(Boolean));
          setIsLoaded(true);
        }
      };
      img.src = url;
    });
  }, [selectedImages]);

  if (!imagePaths || imagePaths.length === 0 || loadedImages.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: isLoaded ? intensity : 0 }}
      >
        {loadedImages.map((url, index) => (
          <div
            key={url}
            className="absolute"
            style={{
              top: index === 0 ? '10%' : 'auto',
              bottom: index === 1 ? '10%' : 'auto',
              left: index === 0 ? '5%' : 'auto',
              right: index === 1 ? '5%' : 'auto',
              width: index === 0 ? '50%' : '45%',
              height: index === 0 ? '60%' : '55%',
              transform: `rotate(${index === 0 ? '3deg' : '-3deg'}) scale(1.05)`,
            }}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover rounded-lg"
              style={{
                filter: 'blur(6px)',
                userSelect: 'none',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>

      <div 
        className="absolute inset-0 bg-gradient-to-t from-background/15 via-transparent to-background/10 pointer-events-none"
      />
    </div>
  );
};
