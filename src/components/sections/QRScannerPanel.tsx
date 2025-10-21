import { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsQR from 'jsqr';

interface QRScannerPanelProps {
  onClose: () => void;
  onScan?: (result: any) => void;
}

export const QRScannerPanel = ({ onClose, onScan }: QRScannerPanelProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError(err.message || 'Kunne ikke få tilgang til kamera');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [scanning]);

  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRDetected(code.data);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [scanning]);

  const handleQRDetected = async (qrCode: string) => {
    setScanning(false);

    try {
      // Sjekk at QR-koden er en gyldig billett-ID (UUID-format)
      if (!isValidUUID(qrCode)) {
        setError('Ugyldig billett-kode');
        setTimeout(() => {
          setError(null);
          setScanning(true);
        }, 3000);
        return;
      }

      // Finn billetten i databasen
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('*, events_market(title, venue)')
        .eq('id', qrCode)
        .maybeSingle();

      if (fetchError || !ticket) {
        setError('Billetten ble ikke funnet');
        setTimeout(() => {
          setError(null);
          setScanning(true);
        }, 3000);
        return;
      }

      // Sjekk at billetten ikke allerede er brukt
      if (ticket.status === 'used') {
        setError('Billetten er allerede brukt');
        setTimeout(() => {
          setError(null);
          setScanning(true);
        }, 3000);
        return;
      }

      // Oppdater billetten som brukt
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          scanned_at: new Date().toISOString(),
          scanned_by: user?.id
        })
        .eq('id', qrCode);

      if (updateError) {
        setError('Kunne ikke oppdatere billetten');
        setTimeout(() => {
          setError(null);
          setScanning(true);
        }, 3000);
        return;
      }

      // Vis suksess
      const eventTitle = ticket.events_market?.title || 'Arrangement';
      setResult({
        success: true,
        ticket: ticket,
        message: `✅ ${eventTitle} - Innsjekket!`
      });

      // Tilbakestill etter 3 sekunder
      setTimeout(() => {
        setResult(null);
        setScanning(true);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'En feil oppstod');
      setTimeout(() => {
        setError(null);
        setScanning(true);
      }, 3000);
    }
  };

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-md w-full max-h-[500px] flex flex-col border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Skann billetter</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium text-foreground">{error}</p>
            </div>
          ) : result?.success ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-foreground">{result.message}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-sm text-muted-foreground mt-2">Pek kamera mot QR-koden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
