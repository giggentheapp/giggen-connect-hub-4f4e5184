import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { Band } from '@/types/band';
import { logger } from '@/utils/logger';

interface CreateBandData {
  name: string;
  genre?: string | null;
  description?: string | null;
  bio?: string | null;
  founded_year?: number | null;
  image_url?: string | null;
  banner_url?: string | null;
  music_links?: Record<string, any>;
  social_media_links?: Record<string, any>;
  contact_info?: Record<string, any>;
  discography?: string[] | null;
  selectedLogoFileId?: string | null;
  selectedBannerFileId?: string | null;
}

interface UpdateBandData {
  name?: string;
  genre?: string | null;
  description?: string | null;
  bio?: string | null;
  founded_year?: number | null;
  image_url?: string | null;
  banner_url?: string | null;
  music_links?: Record<string, any>;
  social_media_links?: Record<string, any>;
  contact_info?: Record<string, any>;
  discography?: string[] | null;
}

export const useCreateBand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBandData & { userId: string }) => {
      const { selectedLogoFileId, selectedBannerFileId, userId, ...bandData } = data;

      const { data: newBand, error: bandError } = await supabase
        .from('bands')
        .insert({
          ...bandData,
          created_by: userId,
          is_public: false
        })
        .select()
        .single();

      if (bandError) throw bandError;

      // Track file usage
      if (selectedLogoFileId) {
        await supabase.from('file_usage').insert({
          file_id: selectedLogoFileId,
          usage_type: 'band_logo',
          reference_id: newBand.id,
        });
      }
      if (selectedBannerFileId) {
        await supabase.from('file_usage').insert({
          file_id: selectedBannerFileId,
          usage_type: 'band_banner',
          reference_id: newBand.id,
        });
      }

      return newBand as Band;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.user(data.created_by) });
      
      logger.business('Band created', { bandId: data.id });
      toast({
        title: 'Band opprettet!',
        description: `${data.name} er nå opprettet`,
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to create band', error);
      toast({
        title: 'Feil ved oppretting',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bandId, data }: { bandId: string; data: UpdateBandData }) => {
      const { error } = await supabase
        .from('bands')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', bandId);

      if (error) throw error;

      // Refetch updated band
      const { data: updatedBand } = await supabase
        .from('bands')
        .select('*')
        .eq('id', bandId)
        .single();

      return updatedBand as Band;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.public });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.user(data.created_by) });
      
      logger.business('Band updated', { bandId: data.id });
      toast({
        title: 'Band oppdatert!',
        description: 'Endringene har blitt lagret',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to update band', error);
      toast({
        title: 'Feil ved oppdatering',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bandId }: { bandId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du må være innlogget for å slette band');

      const { error } = await supabase.rpc('delete_band_permanently', {
        band_uuid: bandId,
        requesting_user_id: user.id,
      });

      if (error) throw error;
      
      return { bandId, userId: user.id };
    },
    onSuccess: ({ bandId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.public });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.detail(bandId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.user(userId) });
      queryClient.removeQueries({ queryKey: queryKeys.bands.detail(bandId) });
      
      logger.business('Band deleted', { bandId });
      toast({
        title: 'Band slettet',
        description: 'Bandet og alle tilknyttede data har blitt permanent slettet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete band', error);
      toast({
        title: 'Feil ved sletting',
        description: error.message || 'Kunne ikke slette bandet',
        variant: 'destructive',
      });
    },
  });
};
