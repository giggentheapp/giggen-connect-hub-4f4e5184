import { Band } from '@/types/band';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { EditBandDialog } from '@/components/EditBandDialog';
import { BandViewModal } from '@/components/BandViewModal';

interface BandDialogsProps {
  activeDialog: 'invite' | 'edit' | 'public' | null;
  onClose: () => void;
  band: Band | null;
  bandId: string | null;
  onSuccess: () => void;
  isCreateMode?: boolean;
}

export const BandDialogs = ({
  activeDialog,
  onClose,
  band,
  bandId,
  onSuccess,
  isCreateMode = false
}: BandDialogsProps) => {
  return (
    <>
      {activeDialog === 'invite' && bandId && band && (
        <InviteMemberDialog
          open={true}
          onOpenChange={(open) => !open && onClose()}
          bandId={bandId}
          bandName={band.name}
        />
      )}
      
      {activeDialog === 'edit' && (
        <EditBandDialog
          open={true}
          onClose={onClose}
          band={band}
          onSuccess={onSuccess}
          isCreateMode={isCreateMode}
        />
      )}
      
      {activeDialog === 'public' && band && (
        <BandViewModal
          open={true}
          onClose={onClose}
          band={band}
          showContactInfo={false}
        />
      )}
    </>
  );
};
