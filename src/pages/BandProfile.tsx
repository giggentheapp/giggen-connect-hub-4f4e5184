import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Band, BandMember } from '@/types/band';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Settings, UserPlus, Crown, Shield } from 'lucide-react';
import { BandMembersList } from '@/components/BandMembersList';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { EditBandDialog } from '@/components/EditBandDialog';
import { BandViewModal } from '@/components/BandViewModal';
import { BandInvites } from '@/components/BandInvites';

const BandProfile = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPublicView, setShowPublicView] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Check if we should force public view (from profile section)
  const searchParams = new URLSearchParams(window.location.search);
  const forcePublicView = searchParams.get('view') === 'public';

  useEffect(() => {
    if (!bandId) return;

    const fetchBandData = async () => {
      try {
        setLoading(true);

        // Fetch band data
        const { data: bandData, error: bandError } = await supabase
          .from('bands')
          .select('*')
          .eq('id', bandId)
          .single();

        if (bandError) throw bandError;
        
        // Type-cast jsonb fields from Supabase
        setBand({
          ...bandData,
          music_links: bandData.music_links as Band['music_links'],
          social_media_links: bandData.social_media_links as Band['social_media_links'],
          contact_info: bandData.contact_info as Band['contact_info'],
          discography: bandData.discography as string[] | null,
        });

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('band_members')
          .select('*')
          .eq('band_id', bandId)
          .order('joined_at', { ascending: true });

        if (membersError) throw membersError;

        // Fetch profiles separately
        const memberIds = membersData?.map(m => m.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, role')
          .in('user_id', memberIds);

        const profiles = profilesData || [];
        const membersWithProfiles = (membersData || []).map(member => ({
          ...member,
          role: member.role as 'member' | 'admin' | 'founder',
          profile: profiles.find(p => p.user_id === member.user_id)
        }));

        setMembers(membersWithProfiles);

        // Check current user's role in band
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const userMember = membersData?.find(m => m.user_id === user.id);
          setCurrentUserRole(userMember?.role || null);
        }
      } catch (error: any) {
        toast({
          title: 'Feil ved lasting av band',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBandData();
  }, [bandId, toast]);

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'founder';
  const isMember = !!currentUserRole;

  const handleBack = () => {
    const fromSection = location.state?.fromSection;
    if (fromSection) {
      navigate('/dashboard', { state: { section: fromSection } });
    } else {
      navigate('/dashboard?section=admin-bands');
    }
  };

  // If force public view (from profile section) OR user is a member but not admin, show public view
  if (!loading && band && (forcePublicView || (isMember && !isAdmin))) {
    return <BandViewModal open={true} onClose={() => navigate(-1)} band={band} showContactInfo={false} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!band) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Band ikke funnet</p>
            <Button onClick={() => navigate('/dashboard')}>
              Tilbake til dashbord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'founder':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Band Profil</h1>
        </div>

        {/* Band Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 mx-auto md:mx-0">
                <AvatarImage src={band.image_url || undefined} />
                <AvatarFallback className="text-2xl md:text-4xl bg-gradient-primary text-primary-foreground">
                  {band.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3 md:space-y-4">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold">{band.name}</h2>
                    {currentUserRole && (
                      <Badge variant="default" className="gap-1 w-fit">
                        {getRoleIcon(currentUserRole)}
                        <span className="hidden md:inline">
                          {currentUserRole === 'founder' && 'Grunnlegger'}
                          {currentUserRole === 'admin' && 'Admin'}
                          {currentUserRole === 'member' && 'Medlem'}
                        </span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm md:text-base">
                    <Users className="h-4 w-4" />
                    <span>{members.length} medlemmer</span>
                  </div>
                </div>
                {band.description && (
                  <p className="text-sm md:text-base text-muted-foreground">{band.description}</p>
                )}
                {isAdmin && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowInviteDialog(true)}
                      className="gap-2 w-full sm:w-auto"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Inviter medlem</span>
                      <span className="sm:hidden">Inviter</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDialog(true)}
                      className="gap-2 w-full sm:w-auto"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Rediger band</span>
                      <span className="sm:hidden">Rediger</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPublicView(true)}
                      className="gap-2 w-full sm:w-auto"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden md:inline">Publikumsvisning</span>
                      <span className="md:hidden">Publikum</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Band Invites - show for the current user */}
        {currentUserId && <BandInvites userId={currentUserId} />}

        {/* Members Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Medlemmer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BandMembersList
              members={members}
              currentUserRole={currentUserRole}
              bandId={bandId!}
              onUpdate={() => window.location.reload()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <InviteMemberDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            bandId={bandId!}
            bandName={band.name}
          />
          <EditBandDialog
            open={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            band={band}
            onSuccess={() => window.location.reload()}
          />
          <BandViewModal
            open={showPublicView}
            onClose={() => setShowPublicView(false)}
            band={band}
            showContactInfo={false}
          />
        </>
      )}
    </div>
  );
};

export default BandProfile;
