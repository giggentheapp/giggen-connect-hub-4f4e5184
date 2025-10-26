import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, RotateCcw, Check, X } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdate: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
  userId: string;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  onAvatarUpdate,
  currentAvatarUrl,
  userId
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('AvatarCropModal state:', { isOpen, userId, hasImageSrc: !!imageSrc });
  }, [isOpen, userId, imageSrc]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size, file.type);

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Bildet er for stort. Maksimal størrelse er 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      console.log('Image loaded successfully');
      setImageSrc(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast.error('Kunne ikke lese bildet.');
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !imgRef.current) {
        reject(new Error('No crop or image'));
        return;
      }

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to desired output size (300x300 for avatars)
      const outputSize = 300;
      canvas.width = outputSize;
      canvas.height = outputSize;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        outputSize,
        outputSize
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop]);

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Vennligst crop bildet først.');
      return;
    }

    setUploading(true);
    try {
      // Get cropped image blob
      const croppedBlob = await getCroppedImg();
      
      // Generate unique filename
      const fileName = `${userId}_${Date.now()}.jpg`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('filbank')
            .remove([`${userId}/avatars/${oldPath}`]);
        }
      }

      // Upload new avatar to filbank
      const avatarPath = `${userId}/avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('filbank')
        .upload(avatarPath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('filbank')
        .getPublicUrl(avatarPath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast.success('Profilbilde oppdatert!');
      onClose();
      
      // Reset state
      setImageSrc('');
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(undefined);
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Kunne ikke laste opp bilde. Prøv igjen.');
    } finally {
      setUploading(false);
    }
  };

  const resetCrop = () => {
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('Dialog onOpenChange:', open);
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Endre profilbilde
          </DialogTitle>
          <DialogDescription>
            Last opp og beskjær bildet ditt. Anbefalt format er kvadratisk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-border rounded-lg bg-card">
              <div 
                className="p-8 text-center cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => {
                  console.log('Upload area clicked');
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">Last opp et bilde</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Støttede formater: JPG, PNG, GIF<br />
                  Maksimal størrelse: 5MB
                </p>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Button clicked');
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Velg fil
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black/5 rounded-lg overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={50}
                  minHeight={50}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop me"
                    style={{ maxHeight: '400px', maxWidth: '100%' }}
                    onLoad={() => {
                      // Set initial crop to center
                      const { naturalWidth, naturalHeight } = imgRef.current!;
                      const size = Math.min(naturalWidth, naturalHeight) * 0.8;
                      const x = (naturalWidth - size) / 2;
                      const y = (naturalHeight - size) / 2;
                      
                      setCrop({
                        unit: 'px',
                        width: size,
                        height: size,
                        x,
                        y
                      });
                    }}
                  />
                </ReactCrop>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetCrop}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tilbakestill crop
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Velg nytt bilde
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Dra for å flytte • Hjørner for å endre størrelse
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!completedCrop || uploading}
              className="min-w-[120px]"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  Laster opp...
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Lagre bilde
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};