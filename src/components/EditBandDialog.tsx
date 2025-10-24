import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { Upload, Music, Link as LinkIcon, Users, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  
  // Basic info
  const [name, setName] = useState(band.name);
  const [genre, setGenre] = useState(band.genre || '');
  const [description, setDescription] = useState(band.description || '');
  const [bio, setBio] = useState(band.bio || '');
  const [foundedYear, setFoundedYear] = useState(band.founded_year?.toString() || '');
  
  // Images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(band.image_url);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(band.banner_url);
  
  // Music links
  const [spotify, setSpotify] = useState(band.music_links?.spotify || '');
  const [youtube, setYoutube] = useState(band.music_links?.youtube || '');
  const [soundcloud, setSoundcloud] = useState(band.music_links?.soundcloud || '');
  const [appleMusic, setAppleMusic] = useState(band.music_links?.appleMusic || '');
  const [bandcamp, setBandcamp] = useState(band.music_links?.bandcamp || '');
  
  // Social media
  const [instagram, setInstagram] = useState(band.social_media_links?.instagram || '');
  const [facebook, setFacebook] = useState(band.social_media_links?.facebook || '');
  const [tiktok, setTiktok] = useState(band.social_media_links?.tiktok || '');
  const [twitter, setTwitter] = useState(band.social_media_links?.twitter || '');
  const [website, setWebsite] = useState(band.social_media_links?.website || '');
  
  // Contact
  const [email, setEmail] = useState(band.contact_info?.email || '');
  const [phone, setPhone] = useState(band.contact_info?.phone || '');
  const [bookingEmail, setBookingEmail] = useState(band.contact_info?.booking_email || '');
  
  // Discography
  const [discography, setDiscography] = useState<string[]>(band.discography || []);
  const [newSong, setNewSong] = useState('');
  
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setBannerPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;
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
        title: 'Feil ved opplasting',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addSong = () => {
    if (newSong.trim()) {
      setDiscography([...discography, newSong.trim()]);
      setNewSong('');
    }
  };

  const removeSong = (index: number) => {
    setDiscography(discography.filter((_, i) => i !== index));
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
      let bannerUrl = band.banner_url;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, `${band.id}/logo`);
      }
      
      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, `${band.id}/banner`);
      }

      const { error } = await supabase
        .from('bands')
        .update({
          name: name.trim(),
          genre: genre.trim() || null,
          description: description.trim() || null,
          bio: bio.trim() || null,
          image_url: imageUrl,
          banner_url: bannerUrl,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          music_links: {
            spotify: spotify.trim() || undefined,
            youtube: youtube.trim() || undefined,
            soundcloud: soundcloud.trim() || undefined,
            appleMusic: appleMusic.trim() || undefined,
            bandcamp: bandcamp.trim() || undefined,
          },
          social_media_links: {
            instagram: instagram.trim() || undefined,
            facebook: facebook.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
            twitter: twitter.trim() || undefined,
            website: website.trim() || undefined,
          },
          contact_info: {
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            booking_email: bookingEmail.trim() || undefined,
          },
          discography: discography.length > 0 ? discography : null,
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
        title: 'Feil ved oppdatering',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger {band.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Grunnleggende</TabsTrigger>
              <TabsTrigger value="visual">Visuelt</TabsTrigger>
              <TabsTrigger value="music">Musikk</TabsTrigger>
              <TabsTrigger value="social">Sosiale medier</TabsTrigger>
              <TabsTrigger value="contact">Kontakt</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Bandnavn *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bandets navn"
                  required
                />
              </div>

              <div>
                <Label htmlFor="genre">Sjanger/Musikkstil</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="F.eks. Rock, Jazz, Pop"
                />
              </div>

              <div>
                <Label htmlFor="founded">Dannet år</Label>
                <Input
                  id="founded"
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="F.eks. 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <Label htmlFor="description">Kort beskrivelse</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kort beskrivelse av bandet..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bio">Utvidet bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fortell mer om bandet, historien, hva som gjør dere unike..."
                  rows={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-4 mt-4">
              <div>
                <Label>Bandlogo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                      {name ? name.substring(0, 2).toUpperCase() : 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                      <Upload className="h-4 w-4" />
                      Endre logo
                    </div>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'logo')}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>

              <div>
                <Label>Bannerbilde</Label>
                <div className="mt-2 space-y-2">
                  {bannerPreview && (
                    <div className="w-full h-32 rounded-lg overflow-hidden">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Label htmlFor="banner-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                      <Upload className="h-4 w-4" />
                      {bannerPreview ? 'Endre banner' : 'Last opp banner'}
                    </div>
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'banner')}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="music" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="spotify">Spotify</Label>
                <Input
                  id="spotify"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>

              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@..."
                />
              </div>

              <div>
                <Label htmlFor="soundcloud">SoundCloud</Label>
                <Input
                  id="soundcloud"
                  value={soundcloud}
                  onChange={(e) => setSoundcloud(e.target.value)}
                  placeholder="https://soundcloud.com/..."
                />
              </div>

              <div>
                <Label htmlFor="apple">Apple Music</Label>
                <Input
                  id="apple"
                  value={appleMusic}
                  onChange={(e) => setAppleMusic(e.target.value)}
                  placeholder="https://music.apple.com/..."
                />
              </div>

              <div>
                <Label htmlFor="bandcamp">Bandcamp</Label>
                <Input
                  id="bandcamp"
                  value={bandcamp}
                  onChange={(e) => setBandcamp(e.target.value)}
                  placeholder="https://bandname.bandcamp.com"
                />
              </div>

              <div>
                <Label>Diskografi (låter/album)</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newSong}
                      onChange={(e) => setNewSong(e.target.value)}
                      placeholder="Legg til låt eller album"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSong())}
                    />
                    <Button type="button" onClick={addSong} size="sm">
                      Legg til
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {discography.map((song, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSong(index)}
                      >
                        {song} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <Label htmlFor="website">Nettside</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="band@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+47 123 45 678"
                />
              </div>

              <div>
                <Label htmlFor="booking">Booking e-post</Label>
                <Input
                  id="booking"
                  type="email"
                  value={bookingEmail}
                  onChange={(e) => setBookingEmail(e.target.value)}
                  placeholder="booking@example.com"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end mt-6">
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