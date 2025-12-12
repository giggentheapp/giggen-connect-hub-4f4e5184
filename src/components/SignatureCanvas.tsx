import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { Button } from '@/components/ui/button';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel?: () => void;
  existingSignature?: string | null;
  width?: number;
  height?: number;
}

export const SignatureCanvas = ({
  onSave,
  onCancel,
  existingSignature,
  width = 400,
  height = 150
}: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    // Configure drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = '#1a1a2e';
      canvas.freeDrawingBrush.width = 2;
    }

    // Track when user draws
    canvas.on('path:created', () => {
      setHasDrawn(true);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  const handleClear = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setHasDrawn(false);
  }, [fabricCanvas]);

  const handleSave = useCallback(() => {
    if (!fabricCanvas || !hasDrawn) return;
    
    // Export as data URL
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // Higher resolution
    });
    
    onSave(dataUrl);
  }, [fabricCanvas, hasDrawn, onSave]);

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} className="touch-none" />
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Tegn signaturen din med mus eller finger
      </p>
      
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!hasDrawn}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Nullstill
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Avbryt
          </Button>
        )}
        
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!hasDrawn}
        >
          <Check className="h-3 w-3 mr-1" />
          Bekreft signatur
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
