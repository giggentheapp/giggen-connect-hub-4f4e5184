import { useState } from 'react';
import { useDeleteBand } from './useBandMutations';

export const useBandDelete = (bandId: string, bandName: string) => {
  const deleteMutation = useDeleteBand();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const canDelete = deleteConfirmation === 'SLETT';

  const handleDelete = async (): Promise<boolean> => {
    if (!canDelete) {
      return false;
    }

    try {
      await deleteMutation.mutateAsync({ bandId });
      setDeleteConfirmation('');
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    deleteConfirmation,
    setDeleteConfirmation,
    isDeleting: deleteMutation.isPending,
    handleDelete,
    canDelete,
  };
};
