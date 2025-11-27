import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBandDelete = (bandId: string, bandName: string) => {
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = deleteConfirmation === 'SLETT';

  const handleDelete = async (): Promise<boolean> => {
    if (!canDelete) {
      toast({
        title: 'Ugyldig bekreftelse',
        description: 'Du må skrive SLETT for å bekrefte slettingen',
        variant: 'destructive',
      });
      return false;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du må være innlogget for å slette band');

      const { error } = await supabase.rpc('delete_band_permanently', {
        band_uuid: bandId,
        requesting_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Band slettet',
        description: 'Bandet og alle tilknyttede data har blitt permanent slettet',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Feil ved sletting',
        description: error.message || 'Kunne ikke slette bandet',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  return {
    deleteConfirmation,
    setDeleteConfirmation,
    isDeleting,
    handleDelete,
    canDelete,
  };
};
