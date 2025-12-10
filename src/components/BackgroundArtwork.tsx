import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundArtworkProps {
  imagePaths?: string[] | null;
  intensity?: number;
}

export const BackgroundArtwork = ({ 
  imagePaths, 
  intensity = 0.25,
}: BackgroundArtworkProps) => {
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedImage = imagePaths && imagePaths.length > 0 ? imagePaths[0] : null;

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl;
  };

  useEffect(() => {
    if (!selectedImage) {
      setLoadedImage(null);
      setIsLoaded(false);
      return;
    }

    const url = getPublicUrl(selectedImage);
    const img = new Image();
    
    img.onload = () => {
      setLoadedImage(url);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setLoadedImage(null);
      setIsLoaded(false);
    };
    
    img.src = url;
  }, [selectedImage]);

  if (!selectedImage || !loadedImage || !isLoaded) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: intensity }}
      >
        <img
          src={loadedImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/20 pointer-events-none" />
    </div>
  );
};
