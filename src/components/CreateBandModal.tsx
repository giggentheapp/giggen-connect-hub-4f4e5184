import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Info, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CreateBandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBandModal = ({ open, onOpenChange, onSuccess }: CreateBandModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

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
    if (!userId) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
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
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { data, error } = await supabase
        .from('bands')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Band opprettet!',
        description: `${name} er nå opprettet`,
      });

      onOpenChange(false);
      setName('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
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
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                <Upload className="h-4 w-4" />
                Last opp bilde
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </Label>
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
  );
};
