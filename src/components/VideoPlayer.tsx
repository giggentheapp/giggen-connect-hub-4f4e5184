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
        // Show video thumbnail with play overlay
        <div 
          className="relative cursor-pointer group"
          onClick={() => setShowPlayer(true)}
        >
          <video
            className="w-full h-48 rounded-lg object-cover"
            preload="metadata"
            muted
          >
            <source src={publicUrl + '#t=0.5'} type={mimeType || 'video/quicktime'} />
          </video>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
            <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      ) : (
        // When clicked, show video player
        <div className="w-full space-y-2">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full h-48 rounded-lg object-cover bg-black"
            onLoadStart={() => console.log('🎬 Video loading started:', filename)}
            onLoadedMetadata={() => console.log('📊 Video metadata loaded')}
            onLoadedData={() => console.log('📈 Video data loaded')}
            onCanPlay={() => console.log('✅ Video can play')}
            onCanPlayThrough={() => console.log('🚀 Video can play through')}
            onStalled={() => console.log('⚠️ Video stalled')}
            onSuspend={() => console.log('⏸️ Video suspended')}
            onWaiting={() => console.log('⏳ Video waiting')}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              const error = target.error;
              console.error('🔴 Video error details:', {
                error: error?.message || 'Unknown error',
                code: error?.code,
                MEDIA_ERR_ABORTED: error?.code === 1,
                MEDIA_ERR_NETWORK: error?.code === 2,
                MEDIA_ERR_DECODE: error?.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
                src: target.currentSrc || publicUrl,
                networkState: target.networkState,
                readyState: target.readyState,
                filename: filename
              });
            }}
          >
            {/* Try multiple source formats for MOV files */}
            <source src={publicUrl} type={mimeType || 'video/quicktime'} />
            <source src={publicUrl} type="video/mp4" />
            <source src={publicUrl} type="video/quicktime" />
            Din nettleser støtter ikke videoavspilling. <a href={publicUrl} download>Last ned video</a>
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

