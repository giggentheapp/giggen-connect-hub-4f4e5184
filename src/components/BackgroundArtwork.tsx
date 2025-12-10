import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundArtworkProps {
  imagePaths?: string[] | null;
  intensity?: number;
  randomize?: boolean;
}

export const BackgroundArtwork = ({ 
  imagePaths, 
  intensity = 0.12,
  randomize = false 
}: BackgroundArtworkProps) => {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Select 1-2 images from the array
  const selectedImages = useMemo(() => {
    if (!imagePaths || imagePaths.length === 0) return [];
    
    if (randomize) {
      // Shuffle and pick 1-2 random images
      const shuffled = [...imagePaths].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(2, shuffled.length));
    } else {
      // Take first 1-2 images
      return imagePaths.slice(0, Math.min(2, imagePaths.length));
    }
  }, [imagePaths, randomize]);

  // Convert file_path to public URL
  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Preload images
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

  // Don't render if no images or not loaded
  if (!imagePaths || imagePaths.length === 0 || loadedImages.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -10 }}
    >
      {/* Images container */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ opacity: isLoaded ? intensity : 0 }}
      >
        {loadedImages.map((url, index) => (
          <div
            key={url}
            className="absolute"
            style={{
              // Position images in corners or scattered
              top: index === 0 ? '-10%' : 'auto',
              bottom: index === 1 ? '-10%' : 'auto',
              left: index === 0 ? '-5%' : 'auto',
              right: index === 1 ? '-5%' : 'auto',
              width: '70%',
              height: '70%',
            }}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover blur-[12px]"
              style={{
                transform: index === 1 ? 'rotate(180deg)' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay for text contrast */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90"
      />
    </div>
  );
};
