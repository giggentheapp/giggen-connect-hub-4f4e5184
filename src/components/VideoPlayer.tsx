import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  publicUrl: string;
  filename: string;
  mimeType?: string | null;
}

export const VideoPlayer = ({ publicUrl, filename, mimeType }: VideoPlayerProps) => {
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <div className="w-full space-y-2">
      {!showPlayer ? (
        // Show thumbnail with play button
        <div 
          className="relative cursor-pointer group"
          onClick={() => setShowPlayer(true)}
        >
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium">{filename}</p>
            </div>
          </div>
        </div>
      ) : (
        // When clicked, show video player
        <div className="w-full space-y-2">
          <video
            controls
            playsInline
            preload="auto"
            className="w-full h-48 rounded-lg object-cover bg-black"
            onLoadStart={() => console.log('Video loading started')}
            onCanPlay={() => console.log('Video can play')}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              console.error('Video error:', {
                error: target.error?.message,
                code: target.error?.code,
                src: target.currentSrc
              });
            }}
          >
            <source src={publicUrl} type={mimeType || 'video/mp4'} />
            Din nettleser støtter ikke videoavspilling.
          </video>
          <Button
            onClick={() => setShowPlayer(false)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Lukk avspiller
          </Button>
        </div>
      )}
    </div>
  );
};

