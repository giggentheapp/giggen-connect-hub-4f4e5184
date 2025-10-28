import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { X, FolderOpen, Info, Disc, Share2, Mail, Settings, Beer, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserFiles } from '@/hooks/useUserFiles';
import { FilebankSelectionModal } from './FilebankSelectionModal';
import { AvatarCropModal } from './AvatarCropModal';
import BandTechSpecManager from './BandTechSpecManager';
import BandHospitalityManager from './BandHospitalityManager';
import { SocialMusicLinksManager } from './SocialMusicLinksManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

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
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [fileModalType, setFileModalType] = useState<'logo' | 'banner'>('logo');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

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
    try {
      // Get public URL of the selected file
      const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
      
      if (fileModalType === 'logo') {
        // For logo, use crop modal
        setSelectedImageForCrop(publicUrl);
        setShowFilebankModal(false);
        setShowAvatarCrop(true);
      } else {
        // For banner, set directly
        setBannerPreview(publicUrl);
        setShowFilebankModal(false);
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
    } catch (error: any) {
      console.error('Error selecting file:', error);
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
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

  const handleDeleteBand = async () => {
    if (deleteConfirmation !== 'SLETT') {
      toast({
        title: 'Ugyldig bekreftelse',
        description: 'Du må skrive SLETT for å bekrefte slettingen',
        variant: 'destructive',
      });
      return;
    }

    setDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Du må være innlogget for å slette band');
      }
      
      const { error } = await supabase.rpc('delete_band_permanently', {
        band_uuid: band.id,
        requesting_user_id: user.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Band slettet',
        description: 'Bandet og alle tilknyttede data har blitt permanent slettet',
      });

      onClose();
      navigate('/dashboard?section=bands');
      window.location.reload();
    } catch (error: any) {
      console.error('Delete band error full:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      toast({
        title: 'Feil ved sletting',
        description: error.message || 'Kunne ikke slette bandet',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmation('');
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
                        setShowFilebankModal(true);
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
                        setShowFilebankModal(true);
                      }}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Velg fra Filbank
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="music" className="space-y-4 mt-4">
                <SocialMusicLinksManager
                  title="Musikklenker"
                  platforms={[
                    {
                      id: "spotify",
                      name: "Spotify",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
                          />
                        </svg>
                      ),
                      placeholder: "https://open.spotify.com/artist/...",
                    },
                    {
                      id: "youtube",
                      name: "YouTube",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                          />
                        </svg>
                      ),
                      placeholder: "https://youtube.com/@...",
                    },
                    {
                      id: "soundcloud",
                      name: "SoundCloud",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.05 0-.09.04-.099.099l-.178 1.327.178 1.303c.009.058.049.099.099.099.05 0 .09-.04.099-.099l.196-1.303-.196-1.327c-.009-.059-.05-.099-.099-.099m1.778-.899c-.06 0-.106.046-.114.106L1.72 13.58l.22 2.303c.008.06.053.106.114.106.061 0 .106-.046.114-.106l.241-2.303-.241-2.32c-.008-.06-.053-.106-.114-.106m.899-.44c-.064 0-.115.05-.124.116l-.207 2.76.207 2.672c.009.066.06.115.124.115.064 0 .115-.05.124-.115l.23-2.672-.23-2.76c-.009-.066-.06-.115-.124-.115m.899-.501c-.069 0-.124.055-.133.125l-.182 3.2.182 3.105c.009.07.064.125.133.125.07 0 .125-.055.134-.125l.202-3.105-.202-3.2c-.009-.07-.064-.125-.134-.125m.899-.424c-.075 0-.136.06-.145.137l-.153 3.625.153 3.512c.009.077.07.137.145.137.074 0 .135-.06.145-.137l.17-3.512-.17-3.625c-.01-.077-.071-.137-.145-.137m.899-.318c-.08 0-.144.063-.153.144l-.134 3.943.134 3.791c.009.08.073.144.153.144.08 0 .145-.064.154-.144l.149-3.791-.149-3.943c-.009-.081-.074-.144-.154-.144m.899-.248c-.085 0-.154.068-.163.156l-.115 4.191.115 4.07c.009.088.078.156.163.156.086 0 .155-.068.164-.156l.128-4.07-.128-4.191c-.009-.088-.078-.156-.164-.156m.902-.105c-.09 0-.163.073-.172.165l-.097 4.296.097 4.349c.009.092.082.164.172.164.09 0 .163-.072.172-.164l.106-4.349-.106-4.296c-.009-.092-.082-.165-.172-.165m.901.001c-.096 0-.173.078-.182.177l-.078 4.295.078 4.629c.009.099.086.177.182.177.095 0 .172-.078.181-.177l.089-4.629-.089-4.295c-.009-.099-.086-.177-.181-.177m.896.098c-.1 0-.181.081-.19.183l-.059 4.197.059 4.908c.009.102.09.184.19.184.1 0 .181-.082.19-.184l.067-4.908-.067-4.197c-.009-.102-.09-.183-.19-.183m.9.183c-.105 0-.19.086-.2.192l-.04 4.015.04 5.138c.01.105.095.191.2.191.104 0 .19-.086.199-.191l.048-5.138-.048-4.015c-.009-.105-.095-.192-.199-.192m.899.281c-.11 0-.199.09-.209.202l-.02 3.734.02 5.304c.01.112.099.202.209.202.11 0 .199-.09.209-.202l.029-5.304-.029-3.734c-.01-.112-.099-.202-.209-.202m.898.365c-.115 0-.209.095-.218.212v.001l-.001 3.369.001 5.469c.009.117.103.211.218.211.115 0 .209-.095.218-.211l.011-5.469-.011-3.37c-.009-.117-.103-.212-.218-.212m.899.466c-.12 0-.218.099-.227.221l.001 2.903v5.634c.009.122.107.221.226.221.12 0 .218-.099.227-.221v-5.634l-.001-2.903c-.009-.122-.107-.221-.226-.221m.899.568c-.125 0-.227.103-.236.231l.001 2.335v5.798c.009.128.111.232.236.232.125 0 .227-.104.236-.232v-5.798l-.001-2.335c-.009-.128-.111-.231-.236-.231m.899.685c-.13 0-.236.107-.245.241l.001 1.65v5.962c.009.134.115.241.244.241.13 0 .236-.107.245-.241v-5.962l-.001-1.65c-.009-.134-.115-.241-.244-.241m.898.786c-.135 0-.244.111-.253.253l.001.863v6.126c.009.142.118.253.252.253.135 0 .244-.111.253-.253v-6.126l-.001-.863c-.009-.142-.118-.253-.252-.253"
                          />
                        </svg>
                      ),
                      placeholder: "https://soundcloud.com/...",
                    },
                    {
                      id: "appleMusic",
                      name: "Apple Music",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.258 1.466-2.795 2.787-.244.602-.383 1.23-.476 1.87-.059.41-.085.822-.124 1.233-.004.04-.01.083-.013.124v11.679c.01.152.017.303.026.455.05.841.121 1.683.36 2.48.439 1.461 1.359 2.526 2.745 3.197.85.41 1.777.599 2.73.686.327.038.656.054.985.08h12.062c.152-.01.303-.017.455-.026.841-.05 1.683-.121 2.48-.36 1.461-.439 2.526-1.359 3.197-2.745.41-.85.599-1.777.686-2.73.038-.327.054-.656.08-.985V6.142c-.003-.007-.007-.01-.01-.018zM17.732 3.005h.137c.385.015.77.027 1.155.075.495.061.976.16 1.427.398.518.273.865.694 1.05 1.243.12.355.177.723.213 1.095.03.312.051.626.051.939v12.033a9.84 9.84 0 0 1-.092 1.292c-.09.643-.254 1.26-.656 1.78-.31.4-.714.655-1.193.805a4.75 4.75 0 0 1-1.442.263c-.36.024-.722.039-1.083.039H6.261c-.38 0-.76-.013-1.14-.039-.535-.036-1.065-.104-1.57-.32-.655-.28-1.101-.772-1.357-1.422-.184-.467-.258-.96-.298-1.46-.024-.302-.043-.606-.043-.909V6.783c0-.38.013-.76.039-1.14.036-.535.104-1.065.32-1.57.28-.655.772-1.101 1.422-1.357.467-.184.96-.258 1.46-.298.302-.024.606-.043.909-.043h10.929c.152 0 .303-.001.455 0zm-5.726 12.8c0 .34-.002.68.001 1.02.003.274-.108.489-.346.618-.258.14-.532.223-.818.254-.373.04-.743.012-1.108-.073-.53-.123-1.001-.359-1.388-.764-.39-.408-.643-.893-.77-1.444-.115-.502-.147-1.01-.092-1.522.063-.586.25-1.13.609-1.61.4-.533.916-.907 1.54-1.13.424-.152.863-.246 1.318-.284.36-.03.718-.006 1.074.057.455.08.88.247 1.253.536.25.193.447.428.58.712.182.39.227.796.134 1.218-.107.48-.358.886-.751 1.206-.437.355-.956.57-1.52.67-.39.068-.781.084-1.174.03a2.997 2.997 0 0 1-1.155-.382c-.193-.119-.36-.267-.5-.445-.13-.165-.13-.165-.003-.334.14-.187.282-.373.426-.559.068-.088.134-.178.207-.26.088-.099.185-.099.292-.012.235.189.49.343.78.442.398.137.805.158 1.218.088.292-.05.57-.148.828-.293.255-.144.452-.34.577-.595.114-.234.144-.48.104-.733-.047-.29-.187-.527-.426-.697-.31-.219-.666-.337-1.038-.394-.392-.06-.787-.08-1.183-.053-.51.035-.998.14-1.465.342-.576.248-1.066.617-1.458 1.122-.383.495-.617 1.051-.711 1.667-.083.549-.06 1.095.07 1.632.158.652.457 1.235.92 1.723.39.412.853.71 1.372.924.538.22 1.098.333 1.673.378.425.033.85.026 1.273-.042.58-.093 1.133-.262 1.647-.544.373-.204.703-.464.984-.782.267-.303.473-.64.616-1.018.122-.322.19-.655.222-.995.037-.395.035-.79.035-1.185V3.417c0-.26.105-.364.366-.364h1.622c.26 0 .365.105.365.365v10.325c0 .21-.002.42.001.629.003.271-.104.489-.34.616-.258.139-.532.221-.818.252a2.88 2.88 0 0 1-1.108-.073c-.53-.123-1.001-.359-1.388-.764-.39-.408-.643-.893-.77-1.444-.115-.502-.147-1.01-.092-1.522.063-.586.25-1.13.609-1.61.4-.533.916-.907 1.54-1.13.424-.152.863-.246 1.318-.284.36-.03.718-.006 1.074.057.455.08.88.247 1.253.536.25.193.447.428.58.712.182.39.227.796.134 1.218-.107.48-.358.886-.751 1.206-.437.355-.956.57-1.52.67-.39.068-.781.084-1.174.03a2.997 2.997 0 0 1-1.155-.382c-.193-.119-.36-.267-.5-.445-.13-.165-.13-.165-.003-.334.14-.187.282-.373.426-.559.068-.088.134-.178.207-.26.088-.099.185-.099.292-.012.235.189.49.343.78.442.398.137.805.158 1.218.088.292-.05.57-.148.828-.293.255-.144.452-.34.577-.595.114-.234.144-.48.104-.733-.047-.29-.187-.527-.426-.697-.31-.219-.666-.337-1.038-.394-.392-.06-.787-.08-1.183-.053-.51.035-.998.14-1.465.342-.576.248-1.066.617-1.458 1.122-.383.495-.617 1.051-.711 1.667-.083.549-.06 1.095.07 1.632.158.652.457 1.235.92 1.723.39.412.853.71 1.372.924.538.22 1.098.333 1.673.378.425.033.85.026 1.273-.042.58-.093 1.133-.262 1.647-.544.373-.204.703-.464.984-.782.267-.303.473-.64.616-1.018.122-.322.19-.655.222-.995.037-.395.035-.79.035-1.185V3.417c0-.26.105-.364.366-.364h1.622c.26 0 .365.105.365.365v10.325z"
                          />
                        </svg>
                      ),
                      placeholder: "https://music.apple.com/...",
                    },
                    {
                      id: "bandcamp",
                      name: "Bandcamp",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M0 18.75l7.437-13.5h16.563l-7.438 13.5z"
                          />
                        </svg>
                      ),
                      placeholder: "https://bandname.bandcamp.com",
                    },
                  ]}
                  links={{
                    spotify: spotify || "",
                    youtube: youtube || "",
                    soundcloud: soundcloud || "",
                    appleMusic: appleMusic || "",
                    bandcamp: bandcamp || "",
                  }}
                  onChange={(musicLinks) => {
                    setSpotify(musicLinks.spotify || "");
                    setYoutube(musicLinks.youtube || "");
                    setSoundcloud(musicLinks.soundcloud || "");
                    setAppleMusic(musicLinks.appleMusic || "");
                    setBandcamp(musicLinks.bandcamp || "");
                  }}
                />

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
                <SocialMusicLinksManager
                  title="Sosiale medier"
                  platforms={[
                    {
                      id: "instagram",
                      name: "Instagram",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
                          />
                        </svg>
                      ),
                      placeholder: "https://instagram.com/...",
                    },
                    {
                      id: "facebook",
                      name: "Facebook",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        </svg>
                      ),
                      placeholder: "https://facebook.com/...",
                    },
                    {
                      id: "tiktok",
                      name: "TikTok",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                          />
                        </svg>
                      ),
                      placeholder: "https://www.tiktok.com/@...",
                    },
                    {
                      id: "twitter",
                      name: "X (Twitter)",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                          />
                        </svg>
                      ),
                      placeholder: "https://twitter.com/...",
                    },
                    {
                      id: "website",
                      name: "Nettside",
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12S0 18.623 0 12 5.377 0 12 0zm0 2.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S17.302 2.4 12 2.4zm6.617 2.995a7.26 7.26 0 0 1 1.564 4.486c-.298-.05-.654-.091-1.051-.122-.12-1.518-.44-2.953-.923-4.187.133-.067.273-.128.41-.177zm-13.234 0c.137.049.277.11.41.177-.482 1.234-.804 2.669-.923 4.187-.397.031-.753.072-1.051.122A7.26 7.26 0 0 1 5.383 5.395zM12 4.8c.508 0 1.021.457 1.449 1.342.35.725.627 1.592.818 2.577a25.778 25.778 0 0 0-4.534 0c.191-.985.468-1.852.818-2.577C10.979 5.257 11.492 4.8 12 4.8zm-2.386.901c-.315.709-.563 1.507-.736 2.384a23.9 23.9 0 0 0-3.299.397c.465-1.089 1.180-2.063 2.101-2.876.625.03 1.25.063 1.934.095zm4.772 0c.684-.032 1.309-.065 1.934-.095.921.813 1.636 1.787 2.101 2.876a23.9 23.9 0 0 0-3.299-.397c-.173-.877-.421-1.675-.736-2.384zM12 9.6c.86 0 1.555 1.075 1.555 2.4S12.86 14.4 12 14.4 10.445 13.325 10.445 12 11.14 9.6 12 9.6z"
                          />
                        </svg>
                      ),
                      placeholder: "https://yourwebsite.com",
                    },
                  ]}
                  links={{
                    instagram: instagram || "",
                    facebook: facebook || "",
                    tiktok: tiktok || "",
                    twitter: twitter || "",
                    website: website || "",
                  }}
                  onChange={(socialLinks) => {
                    setInstagram(socialLinks.instagram || "");
                    setFacebook(socialLinks.facebook || "");
                    setTiktok(socialLinks.tiktok || "");
                    setTwitter(socialLinks.twitter || "");
                    setWebsite(socialLinks.website || "");
                  }}
                />
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

            <div className="flex gap-2 justify-between mt-6 pt-6 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett band permanent
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Denne handlingen kan ikke angres. Alle bandets data, inkludert medlemmer, portfolio,
                      tech specs og hospitality riders vil bli permanent slettet.
                      <br />
                      <br />
                      Skriv <strong>SLETT</strong> for å bekrefte at du vil slette bandet permanent.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Skriv SLETT her"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBand}
                      disabled={deleting || deleteConfirmation !== 'SLETT'}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? 'Sletter...' : 'Slett band permanent'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? 'Lagrer...' : 'Lagre endringer'}
                </Button>
              </div>
            </div>
          </form>

          {/* Avatar Crop Modal for Logo */}
          <AvatarCropModal
            key={`band-logo-${band?.id || 'new'}`}
            isOpen={showAvatarCrop}
            onClose={() => {
              setShowAvatarCrop(false);
              setSelectedImageForCrop(null);
            }}
            onAvatarUpdate={(avatarUrl) => {
              setImagePreview(avatarUrl);
              setShowAvatarCrop(false);
              setSelectedImageForCrop(null);
            }}
            currentAvatarUrl={imagePreview}
            userId={userId || ''}
            initialImageUrl={selectedImageForCrop || undefined}
            updateTable="bands"
            updateField="image_url"
            recordId={band?.id}
          />

          {/* Filebank Selection Modal */}
          <FilebankSelectionModal
            isOpen={showFilebankModal}
            onClose={() => setShowFilebankModal(false)}
            onSelect={handleFileFromBank}
            userId={userId || ''}
            fileTypes={fileModalType === 'logo' ? ['image'] : ['image']}
            title={fileModalType === 'logo' ? 'Velg bandlogo fra Filbank' : 'Velg bannerbilde fra Filbank'}
            description={fileModalType === 'logo' ? 'Velg et bilde fra din filbank for å bruke som bandlogo' : 'Velg et bilde fra din filbank for å bruke som banner'}
          />
        </div>
      </div>
    </div>
  );
};
