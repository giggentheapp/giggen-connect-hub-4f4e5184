import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conceptService } from '@/services/conceptService';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { CreateConceptInput, UpdateConceptInput } from '@/services/conceptService';
import { logger } from '@/utils/logger';

export const useCreateConcept = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateConceptInput) => {
      return await conceptService.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.user(data.maker_id) });
      
      logger.business('Concept created', { conceptId: data.id });
      toast({
        title: 'Tilbud opprettet',
        description: 'Tilbudet ditt er opprettet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to create concept', error);
      toast({
        title: 'Feil ved oppretting av tilbud',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateConcept = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conceptId, updates }: { conceptId: string; updates: UpdateConceptInput }) => {
      return await conceptService.update(conceptId, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.user(data.maker_id) });
      
      logger.business('Concept updated', { conceptId: data.id });
      toast({
        title: 'Tilbud oppdatert',
        description: 'Endringene er lagret',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to update concept', error);
      toast({
        title: 'Feil ved oppdatering av tilbud',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const usePublishConcept = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conceptId: string) => {
      return await conceptService.publish(conceptId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.user(data.maker_id) });
      
      logger.business('Concept published', { conceptId: data.id });
      toast({
        title: 'Tilbud publisert',
        description: 'Tilbudet ditt er nå synlig for andre',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to publish concept', error);
      toast({
        title: 'Feil ved publisering av tilbud',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteConcept = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conceptId: string) => {
      return await conceptService.delete(conceptId);
    },
    onSuccess: (_, conceptId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(conceptId) });
      
      logger.business('Concept deleted', { conceptId });
      toast({
        title: 'Tilbud slettet',
        description: 'Tilbudet er permanent fjernet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete concept', error);
      toast({
        title: 'Feil ved sletting av tilbud',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
