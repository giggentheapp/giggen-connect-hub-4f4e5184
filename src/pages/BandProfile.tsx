import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BandViewModal } from '@/components/BandViewModal';
import { BandInvites } from '@/components/BandInvites';
import { BandHeader } from '@/components/band/BandHeader';
import { BandMembersSection } from '@/components/band/BandMembersSection';
import { BandDialogs } from '@/components/band/BandDialogs';
import { useBandData } from '@/hooks/useBandData';
import { useBandPermissions } from '@/hooks/useBandPermissions';
import { useQueryParams } from '@/hooks/useQueryParams';

const BandProfile = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getParam } = useQueryParams();
  
  // Custom hooks handle complexity
  const { band, members, loading, refetch } = useBandData(bandId);
  const { currentUserRole, isAdmin, isMember, currentUserId } = useBandPermissions(bandId, members);
  
  // Simplified dialog state
  const [activeDialog, setActiveDialog] = useState<'invite' | 'edit' | 'public' | null>(null);
  
  const forcePublicView = getParam('view') === 'public';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <BandHeader
          band={band}
          currentUserRole={currentUserRole}
          membersCount={members.length}
          onInvite={() => setActiveDialog('invite')}
          onEdit={() => setActiveDialog('edit')}
          onShowPublic={() => setActiveDialog('public')}
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
      
      {isAdmin && (
        <BandDialogs
          activeDialog={activeDialog}
          onClose={() => setActiveDialog(null)}
          band={band}
          bandId={bandId!}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default BandProfile;
