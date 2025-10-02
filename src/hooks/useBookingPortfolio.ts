import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PortfolioAttachment {
  id: string;
  booking_id: string;
  portfolio_file_id: string;
  attached_by: string;
  created_at: string;
  portfolio_file: {
    id: string;
    filename: string;
    file_path: string;
    file_type: string;
    file_url: string | null;
    mime_type: string | null;
    title?: string;
    description?: string;
    user_id: string;
  };
}

export const useBookingPortfolio = (bookingId: string | undefined) => {
  const [attachments, setAttachments] = useState<PortfolioAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAttachments = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          booking_id,
          portfolio_file_id,
          attached_by,
          created_at,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_type,
            file_url,
            mime_type,
            title,
            description,
            user_id
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttachments(data as any || []);
      logger.debug('Portfolio attachments fetched', { bookingId, count: data?.length });
    } catch (error) {
      logger.error('Error fetching portfolio attachments', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste porteføljevedlegg",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const attachPortfolioFile = async (portfolioFileId: string) => {
    if (!bookingId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('booking_portfolio_attachments')
        .insert({
          booking_id: bookingId,
          portfolio_file_id: portfolioFileId,
          attached_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Fil lagt ved",
        description: "Porteføljeefilen er lagt ved bookingen",
      });

      await fetchAttachments();
    } catch (error: any) {
      logger.error('Error attaching portfolio file', error);
      toast({
        title: "Kunne ikke legge ved fil",
        description: error.message || "Noe gikk galt",
        variant: "destructive",
      });
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('booking_portfolio_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      toast({
        title: "Fil fjernet",
        description: "Porteføljeefilen er fjernet fra bookingen",
      });

      await fetchAttachments();
    } catch (error: any) {
      logger.error('Error removing attachment', error);
      toast({
        title: "Kunne ikke fjerne fil",
        description: error.message || "Noe gikk galt",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [bookingId]);

  return {
    attachments,
    loading,
    attachPortfolioFile,
    removeAttachment,
    refetch: fetchAttachments,
  };
};
