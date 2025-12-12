import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw } from 'lucide-react';

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
  width = 380,
  height = 140
}: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready in Dialog
    const timer = setTimeout(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        selection: false,
      });

      // Create and configure brush
      const brush = new PencilBrush(canvas);
      brush.color = '#1a1a2e';
      brush.width = 3;
      canvas.freeDrawingBrush = brush;
      
      // Enable drawing mode
      canvas.isDrawingMode = true;

      // Track when user draws
      canvas.on('path:created', () => {
        setHasDrawn(true);
      });

      fabricCanvasRef.current = canvas;
      setIsReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [width, height]);

  const handleClear = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    setHasDrawn(false);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !hasDrawn) return;
    
    // Export as data URL
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    onSave(dataUrl);
  }, [hasDrawn, onSave]);

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white"
        style={{ width: width + 4, height: height + 4 }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block',
            touchAction: 'none',
            cursor: 'crosshair'
          }} 
        />
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        {isReady ? 'Tegn signaturen din med mus eller finger' : 'Klargjør...'}
      </p>
      
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!hasDrawn || !isReady}
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
          disabled={!hasDrawn || !isReady}
        >
          <Check className="h-3 w-3 mr-1" />
          Bekreft signatur
        </Button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
