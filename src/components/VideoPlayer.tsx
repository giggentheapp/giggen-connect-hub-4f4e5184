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
        // When clicked, show iframe player
        <div className="w-full space-y-2">
          <iframe
            src={publicUrl}
            className="w-full h-48 rounded-lg border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            title={filename}
          />
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
