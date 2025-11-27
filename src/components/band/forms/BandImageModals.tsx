import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { AvatarCropModal } from '@/components/AvatarCropModal';

interface BandImageModalsProps {
  userId: string | null;
  bandId?: string;
  showFilebankModal: boolean;
  showCropModal: boolean;
  fileModalType: 'logo' | 'banner';
  selectedImageForCrop: string | null;
  onCloseFilebank: () => void;
  onFileSelected: (file: any) => void;
  onAvatarUpdate: (avatarUrl: string) => void;
  onCloseCrop: () => void;
}

export const BandImageModals = ({
  userId,
  bandId,
  showFilebankModal,
  showCropModal,
  fileModalType,
  selectedImageForCrop,
  onCloseFilebank,
  onFileSelected,
  onAvatarUpdate,
  onCloseCrop,
}: BandImageModalsProps) => {
  console.log('[BandImageModals] Render:', {
    userId: userId ? 'set' : 'null',
    showFilebankModal,
    showCropModal,
    selectedImageForCrop: selectedImageForCrop ? 'set' : 'null',
    fileModalType,
  });

  if (!userId) {
    console.log('[BandImageModals] UserId is null, returning null');
    return null;
  }

  return (
    <>
      {showFilebankModal && (
        <FilebankSelectionModal
          isOpen={showFilebankModal}
          onClose={onCloseFilebank}
          onSelect={onFileSelected}
          userId={userId}
          fileTypes={['image']}
        />
      )}
      {showCropModal && selectedImageForCrop && (
        <>
          {console.log('[BandImageModals] Rendering AvatarCropModal')}
          <AvatarCropModal
            isOpen={showCropModal}
            onClose={onCloseCrop}
            onAvatarUpdate={onAvatarUpdate}
            userId={userId}
            initialImageUrl={selectedImageForCrop}
          />
        </>
      )}
    </>
  );
};
