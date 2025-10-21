import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BandInvite } from '@/types/band';
import { useToast } from '@/hooks/use-toast';

export const useBandInvites = (userId: string | undefined) => {
  const [invites, setInvites] = useState<BandInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvites = async () => {
    if (!userId) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('band_invites')
        .select('*')
        .eq('invited_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const invitesWithData = await Promise.all((data || []).map(async (invite) => {
        const [{ data: band }, { data: inviter }] = await Promise.all([
          supabase.from('bands').select('id, name, description, image_url').eq('id', invite.band_id).single(),
          supabase.from('profiles').select('display_name, avatar_url').eq('user_id', invite.invited_by).single()
        ]);

        return {
          ...invite,
          status: invite.status as 'pending' | 'accepted' | 'declined',
          band,
          inviter
        };
      }));

      setInvites(invitesWithData as BandInvite[]);
    } catch (error: any) {
      toast({
        title: 'Feil ved lasting av invitasjoner',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('band-invites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_invites',
          filter: `invited_user_id=eq.${userId}`,
        },
        () => {
          fetchInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const acceptInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.rpc('accept_band_invite', {
        invite_id: inviteId,
      });

      if (error) throw error;

      toast({
        title: 'Invitasjon akseptert',
        description: 'Du er nå medlem av bandet',
      });

      fetchInvites();
    } catch (error: any) {
      toast({
        title: 'Feil ved aksept av invitasjon',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('band_invites')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Invitasjon avslått',
      });

      fetchInvites();
    } catch (error: any) {
      toast({
        title: 'Feil ved avslag av invitasjon',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { invites, loading, acceptInvite, declineInvite, refetch: fetchInvites };
};
