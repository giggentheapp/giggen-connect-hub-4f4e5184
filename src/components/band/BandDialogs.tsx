import { Band } from '@/types/band';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { EditBandDialog } from '@/components/EditBandDialog';
import { BandViewModal } from '@/components/BandViewModal';

interface BandDialogsProps {
  activeDialog: 'invite' | 'edit' | 'public' | null;
  onClose: () => void;
  band: Band;
  bandId: string;
  onSuccess: () => void;
}

export const BandDialogs = ({
  activeDialog,
  onClose,
  band,
  bandId,
  onSuccess,
}: BandDialogsProps) => {
  return (
    <>
      <InviteMemberDialog
        open={activeDialog === 'invite'}
        onOpenChange={(open) => !open && onClose()}
        bandId={bandId}
        bandName={band.name}
      />
      <EditBandDialog
        open={activeDialog === 'edit'}
        onClose={onClose}
        band={band}
        onSuccess={onSuccess}
      />
      <BandViewModal
        open={activeDialog === 'public'}
        onClose={onClose}
        band={band}
        showContactInfo={false}
      />
    </>
  );
};
