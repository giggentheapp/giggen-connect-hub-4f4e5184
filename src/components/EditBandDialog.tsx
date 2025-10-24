import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { X, FolderOpen, Info, Disc, Share2, Mail, Settings, Beer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserFiles } from '@/hooks/useUserFiles';
import { FileSelectionModal } from './FileSelectionModal';
import BandTechSpecManager from './BandTechSpecManager';
import BandHospitalityManager from './BandHospitalityManager';

interface EditBandDialogProps {
  open: boolean;
  onClose: () => void;
  band: Band;
  onSuccess: () => void;
}

export const EditBandDialog = ({
  open,
  onClose,
  band,
  onSuccess,
}: EditBandDialogProps) => {
  const [userId, setUserId] = useState<string | undefined>();
  const { files } = useUserFiles(userId);
  const [loading, setLoading] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalType, setFileModalType] = useState<'logo' | 'banner'>('logo');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);
  
  // Basic info
  const [name, setName] = useState(band.name);
  const [genre, setGenre] = useState(band.genre || '');
  const [description, setDescription] = useState(band.description || '');
  const [bio, setBio] = useState(band.bio || '');
  const [foundedYear, setFoundedYear] = useState(band.founded_year?.toString() || '');
  
  // Images
  const [imagePreview, setImagePreview] = useState<string | null>(band.image_url);
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

  const handleFileFromBank = async (file: any) => {
    const bucket = file.file_path.split('/')[0];
    const path = file.file_path.substring(file.file_path.indexOf('/') + 1);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    if (fileModalType === 'logo') {
      setImagePreview(data.publicUrl);
    } else {
      setBannerPreview(data.publicUrl);
    }

    // Register usage in file_usage table
    try {
      const usageType = fileModalType === 'logo' ? 'band_logo' : 'band_banner';
      await supabase
        .from('file_usage')
        .insert({
          file_id: file.id,
          usage_type: usageType,
          reference_id: band.id
        });
    } catch (error) {
      // Ignore if already exists (unique constraint)
      console.log('File usage already registered or error:', error);
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
      const imageUrl = imagePreview || band.image_url;
      const bannerUrl = bannerPreview || band.banner_url;

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

      onSuccess();
      onClose();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="fixed top-2 right-2 md:top-4 md:right-4 z-10"
        >
          <X className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 pr-10">Rediger {band.name}</h1>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-6 h-auto">
                <TabsTrigger value="basic" className="flex-col gap-1 py-2">
                  <Info className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Grunnleggende</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="flex-col gap-1 py-2">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Portfolio</span>
                </TabsTrigger>
                <TabsTrigger value="music" className="flex-col gap-1 py-2">
                  <Disc className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Musikk</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex-col gap-1 py-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Sosiale medier</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex-col gap-1 py-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Kontakt</span>
                </TabsTrigger>
                <TabsTrigger value="techspecs" className="flex-col gap-1 py-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Tech Specs</span>
                </TabsTrigger>
                <TabsTrigger value="hospitality" className="flex-col gap-1 py-2">
                  <Beer className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Hospitality</span>
                </TabsTrigger>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFileModalType('logo');
                        setShowFileModal(true);
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Velg fra Filbank
                    </Button>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFileModalType('banner');
                        setShowFileModal(true);
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Velg fra Filbank
                    </Button>
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

              <TabsContent value="techspecs" className="space-y-4 mt-4">
                {userId && (
                  <BandTechSpecManager
                    userId={userId}
                    bandId={band.id}
                    title=""
                    description=""
                  />
                )}
              </TabsContent>

              <TabsContent value="hospitality" className="space-y-4 mt-4">
                {userId && (
                  <BandHospitalityManager
                    userId={userId}
                    bandId={band.id}
                    title=""
                    description=""
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Lagrer...' : 'Lagre endringer'}
              </Button>
            </div>
          </form>

          <FileSelectionModal
            open={showFileModal}
            onOpenChange={setShowFileModal}
            files={files}
            allowedTypes={['image']}
            onFileSelected={handleFileFromBank}
            title={`Velg ${fileModalType === 'logo' ? 'logo' : 'banner'} fra Filbank`}
          />
        </div>
      </div>
    </div>
  );
};
