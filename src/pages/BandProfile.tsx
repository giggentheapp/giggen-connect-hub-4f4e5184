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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
        <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-2xl font-bold">{isCreateMode ? 'Opprett nytt band' : `Rediger ${band?.name}`}</h1>
          </div>
          <form onSubmit={handleSubmit}><p className="text-sm text-muted-foreground">Implementerer...</p></form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
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
