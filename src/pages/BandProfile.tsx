import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandViewModal } from '@/components/BandViewModal';
import { BandInvites } from '@/components/BandInvites';
import { BandHeader } from '@/components/band/BandHeader';
import { BandMembersSection } from '@/components/band/BandMembersSection';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { useBandData } from '@/hooks/useBandData';
import { useBandPermissions } from '@/hooks/useBandPermissions';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserFiles } from '@/hooks/useUserFiles';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import BandTechSpecManager from '@/components/BandTechSpecManager';
import BandHospitalityManager from '@/components/BandHospitalityManager';
import BandPortfolioManager from '@/components/BandPortfolioManager';
import { SocialMusicLinksManager } from '@/components/SocialMusicLinksManager';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { ArrowLeft, FolderOpen, Info, Disc, Share2, Mail, Settings, Beer, Trash2, CheckCircle2 } from 'lucide-react';

const BandProfile = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getParam } = useQueryParams();
  const { toast } = useToast();
  
  const isCreateMode = bandId === 'new';
  const { band, members, loading, refetch } = useBandData(isCreateMode ? undefined : bandId);
  const { currentUserRole, isAdmin, isMember, currentUserId } = useBandPermissions(bandId, members);
  
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPublicView, setShowPublicView] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const { files } = useUserFiles(userId || undefined);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [fileModalType, setFileModalType] = useState<'logo' | 'banner'>('logo');
  const [selectedLogoFileId, setSelectedLogoFileId] = useState<string | null>(null);
  const [selectedBannerFileId, setSelectedBannerFileId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [spotify, setSpotify] = useState('');
  const [youtube, setYoutube] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [appleMusic, setAppleMusic] = useState('');
  const [bandcamp, setBandcamp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [discography, setDiscography] = useState<string[]>([]);
  const [newSong, setNewSong] = useState('');

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (band && !isCreateMode) {
      setName(band.name || '');
      setGenre(band.genre || '');
      setDescription(band.description || '');
      setBio(band.bio || '');
      setFoundedYear(band.founded_year?.toString() || '');
      setImagePreview(band.image_url || null);
      setBannerPreview(band.banner_url || null);
      setSpotify(band.music_links?.spotify || '');
      setYoutube(band.music_links?.youtube || '');
      setSoundcloud(band.music_links?.soundcloud || '');
      setAppleMusic(band.music_links?.appleMusic || '');
      setBandcamp(band.music_links?.bandcamp || '');
      setInstagram(band.social_media_links?.instagram || '');
      setFacebook(band.social_media_links?.facebook || '');
      setTiktok(band.social_media_links?.tiktok || '');
      setTwitter(band.social_media_links?.twitter || '');
      setWebsite(band.social_media_links?.website || '');
      setEmail(band.contact_info?.email || '');
      setPhone(band.contact_info?.phone || '');
      setBookingEmail(band.contact_info?.booking_email || '');
      setDiscography(band.discography || []);
    }
  }, [band, isCreateMode]);
  
  const forcePublicView = getParam('view') === 'public';

  const handleBack = () => {
    if (isEditing && !isCreateMode) {
      setIsEditing(false);
    } else {
      const fromSection = location.state?.fromSection;
      if (fromSection) {
        navigate('/dashboard', { state: { section: fromSection } });
      } else {
        navigate('/dashboard?section=admin-bands');
      }
    }
  };

  const handleFileFromBank = async (file: any) => {
    try {
      const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
      if (fileModalType === 'logo') {
        setSelectedImageForCrop(publicUrl);
        setSelectedLogoFileId(file.id);
        setShowFilebankModal(false);
        setShowAvatarCrop(true);
      } else {
        setBannerPreview(publicUrl);
        setSelectedBannerFileId(file.id);
        setShowFilebankModal(false);
      }
      if (band?.id) {
        try {
          await supabase.from('file_usage').insert({
            file_id: file.id,
            usage_type: fileModalType === 'logo' ? 'band_logo' : 'band_banner',
            reference_id: band.id
          });
        } catch (error) {
          console.log('File usage error:', error);
        }
      }
    } catch (error: any) {
      toast({ title: 'Feil', description: error.message, variant: 'destructive' });
    }
  };

  const addSong = () => {
    if (newSong.trim()) {
      setDiscography([...discography, newSong.trim()]);
      setNewSong('');
    }
  };

  const removeSong = (index: number) => setDiscography(discography.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Mangler bandnavn', description: 'Vennligst fyll inn et bandnavn', variant: 'destructive' });
      return;
    }
    if (!userId) {
      toast({ title: 'Feil', description: 'Kunne ikke hente brukerinformasjon', variant: 'destructive' });
      return;
    }
    setLoadingSave(true);
    try {
      if (isCreateMode) {
        const { data: newBand, error } = await supabase.from('bands').insert({
          name: name.trim(), genre: genre.trim() || null, description: description.trim() || null,
          bio: bio.trim() || null, image_url: imagePreview, banner_url: bannerPreview,
          founded_year: foundedYear ? parseInt(foundedYear) : null, is_public: false, created_by: userId,
          music_links: { spotify: spotify.trim() || undefined, youtube: youtube.trim() || undefined, soundcloud: soundcloud.trim() || undefined, appleMusic: appleMusic.trim() || undefined, bandcamp: bandcamp.trim() || undefined },
          social_media_links: { instagram: instagram.trim() || undefined, facebook: facebook.trim() || undefined, tiktok: tiktok.trim() || undefined, twitter: twitter.trim() || undefined, website: website.trim() || undefined },
          contact_info: { email: email.trim() || undefined, phone: phone.trim() || undefined, booking_email: bookingEmail.trim() || undefined },
          discography: discography.length > 0 ? discography : null,
        }).select().single();
        if (error) throw error;
        if (newBand) {
          if (selectedLogoFileId) await supabase.from('file_usage').insert({ file_id: selectedLogoFileId, usage_type: 'band_logo', reference_id: newBand.id });
          if (selectedBannerFileId) await supabase.from('file_usage').insert({ file_id: selectedBannerFileId, usage_type: 'band_banner', reference_id: newBand.id });
        }
        toast({ title: 'Band opprettet!', description: `${name} er nå opprettet` });
        navigate('/dashboard?section=admin-bands');
      } else {
        await supabase.from('bands').update({
          name: name.trim(), genre: genre.trim() || null, description: description.trim() || null,
          bio: bio.trim() || null, image_url: imagePreview || band?.image_url, banner_url: bannerPreview || band?.banner_url,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          music_links: { spotify: spotify.trim() || undefined, youtube: youtube.trim() || undefined, soundcloud: soundcloud.trim() || undefined, appleMusic: appleMusic.trim() || undefined, bandcamp: bandcamp.trim() || undefined },
          social_media_links: { instagram: instagram.trim() || undefined, facebook: facebook.trim() || undefined, tiktok: tiktok.trim() || undefined, twitter: twitter.trim() || undefined, website: website.trim() || undefined },
          contact_info: { email: email.trim() || undefined, phone: phone.trim() || undefined, booking_email: bookingEmail.trim() || undefined },
          discography: discography.length > 0 ? discography : null, updated_at: new Date().toISOString(),
        }).eq('id', band!.id).throwOnError();
        toast({ title: 'Band oppdatert!', description: 'Endringene har blitt lagret' });
        setIsEditing(false);
        refetch();
      }
    } catch (error: any) {
      toast({ title: isCreateMode ? 'Feil ved oppretting' : 'Feil ved oppdatering', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDeleteBand = async () => {
    if (deleteConfirmation !== 'SLETT') {
      toast({ title: 'Ugyldig bekreftelse', description: 'Du må skrive SLETT for å bekrefte slettingen', variant: 'destructive' });
      return;
    }
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du må være innlogget for å slette band');
      if (!band?.id) throw new Error('Ingen band ID');
      const { error } = await supabase.rpc('delete_band_permanently', { band_uuid: band.id, requesting_user_id: user.id });
      if (error) throw error;
      toast({ title: 'Band slettet', description: 'Bandet og alle tilknyttede data har blitt permanent slettet' });
      navigate('/dashboard?section=admin-bands');
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Feil ved sletting', description: error.message || 'Kunne ikke slette bandet', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteConfirmation('');
    }
  };

  if (!loading && band && (forcePublicView || (isMember && !isAdmin))) {
    return <BandViewModal open={true} onClose={() => navigate(-1)} band={band} showContactInfo={false} />;
  }

  if (loading && !isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!band && !isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Band ikke funnet</p>
            <Button onClick={() => navigate('/dashboard')}>Tilbake til dashbord</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 pb-20 md:pb-6">
        <div className="container max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
          {/* Mobile-optimized header */}
          <div className="flex items-center gap-2 md:gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur -mx-3 md:-mx-6 px-3 md:px-6 py-2 md:py-3 border-b md:border-0">
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Disc className="h-5 w-5 text-primary shrink-0" />
            <h1 className="hidden md:block text-lg md:text-2xl font-bold truncate">
              {isCreateMode ? 'Nytt band' : `Rediger ${band?.name}`}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              {/* Mobile-optimized tabs with scroll */}
              <div className="relative -mx-3 md:mx-0">
                <TabsList className="w-full h-auto flex md:grid md:grid-cols-6 overflow-x-auto overflow-y-hidden justify-start md:justify-center gap-1 p-1 bg-muted/30 rounded-none md:rounded-lg border-b md:border">
                  <TabsTrigger value="basic" className="shrink-0 text-xs md:text-sm px-3 py-2">
                    Grunnleggende
                  </TabsTrigger>
                  <TabsTrigger value="tech" className="shrink-0 text-xs md:text-sm px-3 py-2">
                    Tech
                  </TabsTrigger>
                  <TabsTrigger value="hospitality" className="shrink-0 px-3 py-2">
                    <Beer className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="shrink-0 text-xs md:text-sm px-3 py-2">
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="social" className="shrink-0 text-xs md:text-sm px-3 py-2">
                    Sosiale
                  </TabsTrigger>
                  <TabsTrigger value="music" className="shrink-0 text-xs md:text-sm px-3 py-2">
                    Musikk
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="basic" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                <Card>
                  <CardContent className="pt-4 md:pt-6 space-y-4 md:space-y-5">
                    {/* Mobile-optimized Logo and Banner */}
                    <div className="space-y-4">
                      {/* Logo section */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Logo</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 md:h-24 md:w-24 shrink-0 ring-2 ring-border">
                            <AvatarImage src={imagePreview || undefined} />
                            <AvatarFallback className="text-lg">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setFileModalType('logo'); setShowFilebankModal(true); }}
                            className="w-full md:w-auto"
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            <span className="hidden xs:inline">Velg fra Filbank</span>
                            <span className="xs:hidden">Velg logo</span>
                          </Button>
                        </div>
                      </div>

                      {/* Banner section */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Banner</Label>
                        {bannerPreview && (
                          <div className="relative w-full h-32 md:h-40 rounded-lg overflow-hidden border">
                            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setFileModalType('banner'); setShowFilebankModal(true); }}
                          className="w-full"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          {bannerPreview ? 'Endre banner' : 'Velg banner fra Filbank'}
                        </Button>
                      </div>
                    </div>

                    {/* Basic Info - Mobile optimized */}
                    <div className="space-y-3 md:space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm">Bandnavn *</Label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Navn på bandet" 
                          required 
                          className="text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="genre" className="text-sm">Sjanger</Label>
                          <Input 
                            id="genre" 
                            value={genre} 
                            onChange={(e) => setGenre(e.target.value)} 
                            placeholder="F.eks. Rock, Jazz, Pop"
                            className="text-base"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="foundedYear" className="text-sm">Stiftet år</Label>
                          <Input 
                            id="foundedYear" 
                            type="number" 
                            value={foundedYear} 
                            onChange={(e) => setFoundedYear(e.target.value)} 
                            placeholder="F.eks. 2020"
                            className="text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm">Kort beskrivelse</Label>
                        <Textarea 
                          id="description" 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)} 
                          placeholder="En kort beskrivelse av bandet" 
                          rows={3}
                          className="text-base resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bio" className="text-sm">Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={bio} 
                          onChange={(e) => setBio(e.target.value)} 
                          placeholder="En lengre bio om bandet" 
                          rows={5}
                          className="text-base resize-none"
                        />
                      </div>
                    </div>

                    {/* Contact Info - Mobile optimized */}
                    <div className="space-y-3 md:space-y-4 pt-4 border-t">
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4 md:h-5 md:w-5" />
                        Kontaktinformasjon
                      </h3>
                      <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-sm">E-post</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="kontakt@band.no"
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-sm">Telefon</Label>
                          <Input 
                            id="phone" 
                            type="tel"
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            placeholder="+47 123 45 678"
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="bookingEmail" className="text-sm">Booking e-post</Label>
                          <Input 
                            id="bookingEmail" 
                            type="email" 
                            value={bookingEmail} 
                            onChange={(e) => setBookingEmail(e.target.value)} 
                            placeholder="booking@band.no"
                            className="text-base"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Discography - Mobile optimized */}
                    <div className="space-y-3 md:space-y-4 pt-4 border-t">
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Disc className="h-4 w-4 md:h-5 md:w-5" />
                        Diskografi
                      </h3>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            value={newSong} 
                            onChange={(e) => setNewSong(e.target.value)} 
                            placeholder="Navn på sang/album" 
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSong())}
                            className="text-base"
                          />
                          <Button 
                            type="button" 
                            onClick={addSong} 
                            size="sm"
                            className="shrink-0 px-3 md:px-4"
                          >
                            <span className="hidden md:inline">Legg til</span>
                            <span className="md:hidden">+</span>
                          </Button>
                        </div>
                        {discography.length > 0 && (
                          <div className="space-y-1.5">
                            {discography.map((song, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-muted/30 border">
                                <span className="text-sm flex-1 truncate pr-2">{song}</span>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeSong(idx)}
                                  className="shrink-0 h-8 w-8 p-0"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tech" className="mt-4">
                {band?.id && userId && <BandTechSpecManager bandId={band.id} userId={userId} title="Tekniske spesifikasjoner" description="Last opp tekniske spesifikasjoner for bandet" />}
                {!band?.id && <Alert><AlertDescription>Lagre bandet først for å legge til tekniske spesifikasjoner</AlertDescription></Alert>}
              </TabsContent>

              <TabsContent value="hospitality" className="mt-4">
                {band?.id && userId && <BandHospitalityManager bandId={band.id} userId={userId} title="Hospitality Rider" description="Last opp hospitality rider for bandet" />}
                {!band?.id && <Alert><AlertDescription>Lagre bandet først for å legge til hospitality rider</AlertDescription></Alert>}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4">
                {band?.id && userId && <BandPortfolioManager bandId={band.id} userId={userId} title="Portfolio" description="Last opp bilder, videoer og annet materiale" />}
                {!band?.id && <Alert><AlertDescription>Lagre bandet først for å legge til portfolio</AlertDescription></Alert>}
              </TabsContent>

              <TabsContent value="social" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <SocialMusicLinksManager
                      title="Sosiale medier"
                      platforms={[
                        { id: 'instagram', name: 'Instagram', icon: <Share2 className="h-4 w-4" />, placeholder: 'https://instagram.com/bandnavn' },
                        { id: 'facebook', name: 'Facebook', icon: <Share2 className="h-4 w-4" />, placeholder: 'https://facebook.com/bandnavn' },
                        { id: 'tiktok', name: 'TikTok', icon: <Share2 className="h-4 w-4" />, placeholder: 'https://tiktok.com/@bandnavn' },
                        { id: 'twitter', name: 'Twitter/X', icon: <Share2 className="h-4 w-4" />, placeholder: 'https://twitter.com/bandnavn' },
                        { id: 'website', name: 'Nettside', icon: <Share2 className="h-4 w-4" />, placeholder: 'https://bandnavn.no' },
                      ]}
                      links={{
                        instagram: instagram,
                        facebook: facebook,
                        tiktok: tiktok,
                        twitter: twitter,
                        website: website,
                      }}
                      onChange={(links) => {
                        setInstagram(links.instagram || '');
                        setFacebook(links.facebook || '');
                        setTiktok(links.tiktok || '');
                        setTwitter(links.twitter || '');
                        setWebsite(links.website || '');
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="music" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <SocialMusicLinksManager
                      title="Musikklenker"
                      platforms={[
                        { id: 'spotify', name: 'Spotify', icon: <Disc className="h-4 w-4" />, placeholder: 'https://spotify.com/artist/...' },
                        { id: 'youtube', name: 'YouTube', icon: <Disc className="h-4 w-4" />, placeholder: 'https://youtube.com/@bandnavn' },
                        { id: 'soundcloud', name: 'SoundCloud', icon: <Disc className="h-4 w-4" />, placeholder: 'https://soundcloud.com/bandnavn' },
                        { id: 'appleMusic', name: 'Apple Music', icon: <Disc className="h-4 w-4" />, placeholder: 'https://music.apple.com/...' },
                        { id: 'bandcamp', name: 'Bandcamp', icon: <Disc className="h-4 w-4" />, placeholder: 'https://bandnavn.bandcamp.com' },
                      ]}
                      links={{
                        spotify: spotify,
                        youtube: youtube,
                        soundcloud: soundcloud,
                        appleMusic: appleMusic,
                        bandcamp: bandcamp,
                      }}
                      onChange={(links) => {
                        setSpotify(links.spotify || '');
                        setYoutube(links.youtube || '');
                        setSoundcloud(links.soundcloud || '');
                        setAppleMusic(links.appleMusic || '');
                        setBandcamp(links.bandcamp || '');
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-0 pt-4 md:pt-6 border-t sticky bottom-0 md:static bg-background/95 backdrop-blur -mx-3 md:mx-0 px-3 md:px-0 py-3 md:py-0 border-t">
              <div className="order-2 md:order-1">
                {!isCreateMode && band && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm" className="w-full md:w-auto">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slett band
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Er du sikker på at du vil slette bandet?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>Dette vil permanent slette bandet "{band.name}" og alle tilknyttede data, inkludert:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Alle medlemskap</li>
                            <li>Portfolio filer</li>
                            <li>Tekniske spesifikasjoner</li>
                            <li>Hospitality riders</li>
                            <li>Invitasjoner</li>
                          </ul>
                          <div className="pt-4">
                            <Label>Skriv <strong>SLETT</strong> for å bekrefte</Label>
                            <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="SLETT" className="mt-2" />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBand} disabled={deleteConfirmation !== 'SLETT' || deleting} className="bg-destructive hover:bg-destructive/90">
                          {deleting ? 'Sletter...' : 'Slett permanent'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex gap-2 order-1 md:order-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack} 
                  disabled={loadingSave}
                  className="flex-1 md:flex-none"
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit" 
                  disabled={loadingSave}
                  className="flex-1 md:flex-none"
                >
                  {loadingSave ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      <span className="hidden md:inline">Lagrer...</span>
                      <span className="md:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">{isCreateMode ? 'Opprett band' : 'Lagre endringer'}</span>
                      <span className="md:hidden">{isCreateMode ? 'Opprett' : 'Lagre'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Modals */}
          {showFilebankModal && userId && (
            <FilebankSelectionModal 
              isOpen={showFilebankModal} 
              onClose={() => setShowFilebankModal(false)} 
              onSelect={handleFileFromBank} 
              userId={userId}
              fileTypes={fileModalType === 'logo' ? ['image'] : ['image']}
            />
          )}
          {showAvatarCrop && selectedImageForCrop && userId && (
            <AvatarCropModal 
              isOpen={showAvatarCrop} 
              onClose={() => setShowAvatarCrop(false)} 
              initialImageUrl={selectedImageForCrop}
              onAvatarUpdate={(croppedUrl) => {
                setImagePreview(croppedUrl);
                setShowAvatarCrop(false);
              }}
              userId={userId}
              updateTable="bands"
              updateField="image_url"
              recordId={band?.id}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 pb-20 md:pb-6">
      <div className="container max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
        <BandHeader
          band={band!}
          currentUserRole={currentUserRole}
          membersCount={members.length}
          onInvite={() => setShowInviteDialog(true)}
          onEdit={() => setIsEditing(true)}
          onShowPublic={() => setShowPublicView(true)}
          onBack={handleBack}
          isAdmin={isAdmin}
        />
        
        {currentUserId && <BandInvites userId={currentUserId} />}
        
        <BandMembersSection
          members={members}
          currentUserRole={currentUserRole}
          bandId={bandId!}
          onUpdate={refetch}
        />
      </div>
      
      {showInviteDialog && band && (
        <InviteMemberDialog open={true} onOpenChange={(open) => !open && setShowInviteDialog(false)} bandId={bandId!} bandName={band.name} />
      )}
      {showPublicView && band && (
        <BandViewModal open={true} onClose={() => setShowPublicView(false)} band={band} showContactInfo={false} />
      )}
    </div>
  );
};

export default BandProfile;
