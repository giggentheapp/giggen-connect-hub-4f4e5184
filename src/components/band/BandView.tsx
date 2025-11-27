import { useState } from 'react';
import { Band, BandMember } from '@/types/band';
import { BandHeader } from '@/components/band/BandHeader';
import { BandMembersSection } from '@/components/band/BandMembersSection';
import { BandInvites } from '@/components/BandInvites';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { BandViewModal } from '@/components/BandViewModal';

interface BandViewProps {
  band: Band;
  members: BandMember[];
  currentUserRole: string | null;
  isAdmin: boolean;
  isMember: boolean;
  currentUserId: string | null;
  onEdit: () => void;
  onBack: () => void;
  onRefetch: () => void;
}

export const BandView = ({
  band,
  members,
  currentUserRole,
  isAdmin,
  isMember,
  currentUserId,
  onEdit,
  onBack,
  onRefetch,
}: BandViewProps) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPublicView, setShowPublicView] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 pb-20 md:pb-6">
      <div className="container max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
        <BandHeader
          band={band}
          currentUserRole={currentUserRole}
          membersCount={members.length}
          onInvite={() => setShowInviteDialog(true)}
          onEdit={onEdit}
          onShowPublic={() => setShowPublicView(true)}
          onBack={onBack}
          isAdmin={isAdmin}
        />

        {currentUserId && <BandInvites userId={currentUserId} />}

        <BandMembersSection
          members={members}
          currentUserRole={currentUserRole}
          bandId={band.id}
          onUpdate={onRefetch}
        />
      </div>

      {showInviteDialog && (
        <InviteMemberDialog
          open={true}
          onOpenChange={setShowInviteDialog}
          bandId={band.id}
          bandName={band.name}
        />
      )}

      {showPublicView && (
        <BandViewModal
          open={true}
          onClose={() => setShowPublicView(false)}
          band={band}
          showContactInfo={false}
        />
      )}
    </div>
  );
};
