import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Info, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FilebankSelectionModal } from './FilebankSelectionModal';
import { AvatarCropModal } from './AvatarCropModal';
import { useUserFiles } from '@/hooks/useUserFiles';

interface CreateBandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBandModal = ({ open, onOpenChange, onSuccess }: CreateBandModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);
  const { files } = useUserFiles(userId || undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const handleFileFromBank = async (file: any) => {
    try {
      // Get public URL of the selected file
      const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
      
      // For logo, use crop modal
      setSelectedImageForCrop(publicUrl);
      setSelectedFileId(file.id);
      setShowFilebankModal(false);
      setShowAvatarCrop(true);
    } catch (error: any) {
      console.error('Error selecting file:', error);
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCroppedImage = (croppedImageUrl: string) => {
    setImagePreview(croppedImageUrl);
    setShowAvatarCrop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke hente brukerinformasjon',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Mangler bandnavn',
        description: 'Vennligst fyll inn et bandnavn',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('bands')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imagePreview,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Register file usage if an image was selected
      if (selectedFileId && data) {
        try {
          await supabase
            .from('file_usage')
            .insert({
              file_id: selectedFileId,
              usage_type: 'band_logo',
              reference_id: data.id
            });
        } catch (error) {
          console.log('File usage already registered or error:', error);
        }
      }

      toast({
        title: 'Band opprettet!',
        description: `${name} er nå opprettet`,
      });

      onOpenChange(false);
      setName('');
      setDescription('');
      setImagePreview(null);
      setSelectedFileId(null);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Feil ved oppretting av band',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opprett nytt band</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Band Completeness Guide */}
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-semibold mb-2">Tips: Bli synlig i Utforsk</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>For at bandet skal vises i Utforsk trenger du:</p>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${imagePreview ? 'text-green-600' : 'text-muted-foreground/40'}`} />
                  <span className={imagePreview ? 'text-foreground' : 'text-muted-foreground'}>
                    Bandlogo/bilde
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${description && description.length > 0 ? 'text-green-600' : 'text-muted-foreground/40'}`} />
                  <span className={description && description.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    Beskrivelse
                  </span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {name ? name.substring(0, 2).toUpperCase() : 'B'}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilebankModal(true)}
              className="flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Velg fra filbank
            </Button>
          </div>

          <div>
            <Label htmlFor="name">Bandnavn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv inn bandnavn"
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fortell om bandet..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Oppretter...' : 'Opprett band'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Filebank Selection Modal - Rendered with Portal */}
    {userId && showFilebankModal && createPortal(
      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={handleFileFromBank}
        userId={userId}
        fileTypes={['image']}
      />,
      document.body
    )}

    {/* Avatar Crop Modal - Rendered with Portal */}
    {selectedImageForCrop && userId && showAvatarCrop && createPortal(
      <AvatarCropModal
        isOpen={showAvatarCrop}
        onClose={() => {
          setShowAvatarCrop(false);
          setSelectedImageForCrop(null);
        }}
        initialImageUrl={selectedImageForCrop}
        onAvatarUpdate={handleCroppedImage}
        userId={userId}
      />,
      document.body
    )}
  </>
  );
};
