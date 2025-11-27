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
  initialImageUrl?: string;
  updateTable?: 'profiles' | 'bands';
  updateField?: string;
  recordId?: string;
  skipDatabaseUpdate?: boolean;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  onAvatarUpdate,
  currentAvatarUrl,
  userId,
  initialImageUrl,
  updateTable = 'profiles',
  updateField = 'avatar_url',
  recordId,
  skipDatabaseUpdate = false
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

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setImageSrc('');
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(undefined);
    }
  }, [isOpen]);

  // Load initial image if provided
  React.useEffect(() => {
    if (initialImageUrl && isOpen) {
      console.log('Loading initial image:', initialImageUrl);
      setImageSrc(initialImageUrl);
    }
  }, [initialImageUrl, isOpen]);

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
      console.log('Starting upload for user:', userId);
      
      // Get cropped image blob
      const croppedBlob = await getCroppedImg();
      
      // Generate unique filename
      const fileName = `${userId}_${Date.now()}.jpg`;
      const avatarPath = `${userId}/avatars/${fileName}`;

      console.log('Uploading to path:', avatarPath);

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          const oldPath = currentAvatarUrl.split('/storage/v1/object/public/filbank/')[1];
          if (oldPath) {
            console.log('Deleting old avatar:', oldPath);
            await supabase.storage
              .from('filbank')
              .remove([oldPath]);
          }
        } catch (err) {
          console.warn('Could not delete old avatar:', err);
        }
      }

      // Upload new avatar to filbank
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('filbank')
        .upload(avatarPath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('filbank')
        .getPublicUrl(avatarPath);

      console.log('Public URL:', publicUrl);

      // Update database only if not skipped
      if (!skipDatabaseUpdate) {
        const idField = updateTable === 'profiles' ? 'user_id' : 'id';
        const idValue = recordId || userId;
        
        const { error: updateError } = await supabase
          .from(updateTable as any)
          .update({ 
            [updateField]: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq(idField, idValue);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw updateError;
        }

        console.log(`${updateTable} updated successfully`);
      } else {
        console.log('Skipping database update (will be handled by form submission)');
      }

      // Call the callback to update UI immediately
      onAvatarUpdate(publicUrl);
      
      toast.success('Profilbilde oppdatert!');
      onClose();
      
      // Reset state
      setImageSrc('');
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(undefined);
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(`Kunne ikke laste opp bilde: ${error.message || 'Prøv igjen'}`);
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto border-gradient shadow-glow">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-gradient text-2xl">
            <Camera className="h-6 w-6 text-primary" />
            Endre profilbilde
          </DialogTitle>
          <DialogDescription className="text-base">
            Last opp og beskjær bildet ditt. Anbefalt format er kvadratisk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-br from-card to-accent/10 hover:border-primary/50 transition-all duration-300">
              <div 
                className="p-10 text-center cursor-pointer hover:bg-accent/20 transition-all duration-300 rounded-xl"
                onClick={() => {
                  console.log('Upload area clicked');
                  fileInputRef.current?.click();
                }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Last opp et bilde</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Støttede formater: JPG, PNG, GIF<br />
                  Maksimal størrelse: 5MB
                </p>
                <Button 
                  variant="default"
                  size="lg"
                  type="button" 
                  className="bg-gradient-primary hover:opacity-90 shadow-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Button clicked');
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Velg fil
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 shadow-primary">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={50}
                  minHeight={50}
                  circularCrop
                  className="bg-gradient-to-br from-muted to-accent/20"
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop me"
                    crossOrigin="anonymous"
                    style={{ maxHeight: '450px', maxWidth: '100%' }}
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gradient-to-br from-accent/30 to-accent/10 rounded-xl border border-primary/10">
                <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetCrop}
                    className="border-primary/30 hover:border-primary hover:bg-primary/5"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tilbakestill
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-primary/30 hover:border-primary hover:bg-primary/5"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Velg nytt
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground text-center sm:text-right">
                  💡 Dra for å flytte • Hjørner for størrelse
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

          <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={uploading}
              className="border-primary/20 hover:border-primary hover:bg-primary/5"
            >
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!completedCrop || uploading}
              className="min-w-[140px] bg-gradient-primary hover:opacity-90 shadow-primary"
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