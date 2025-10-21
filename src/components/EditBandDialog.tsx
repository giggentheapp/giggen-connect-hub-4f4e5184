import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EditBandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  band: Band;
  onSuccess: () => void;
}

export const EditBandDialog = ({
  open,
  onOpenChange,
  band,
  onSuccess,
}: EditBandDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(band.name);
  const [description, setDescription] = useState(band.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(band.image_url);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${band.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('band-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('band-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Feil ved opplasting av bilde',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      let imageUrl = band.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('bands')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', band.id);

      if (error) throw error;

      toast({
        title: 'Band oppdatert!',
        description: 'Endringene har blitt lagret',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Feil ved oppdatering av band',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger band</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {name ? name.substring(0, 2).toUpperCase() : 'B'}
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="edit-image-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                <Upload className="h-4 w-4" />
                Endre bilde
              </div>
              <Input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </Label>
          </div>

          <div>
            <Label htmlFor="edit-name">Bandnavn *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv inn bandnavn"
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Beskrivelse</Label>
            <Textarea
              id="edit-description"
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
              {loading ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
