import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Band, BandWithMembers } from '@/types/band';
import { useToast } from '@/hooks/use-toast';

export const useBands = () => {
  const [bands, setBands] = useState<BandWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bands')
        .select(`
          *,
          band_members (
            id,
            band_id,
            user_id,
            role,
            joined_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for members
      const bandsWithCounts = await Promise.all((data || []).map(async (band) => {
        const memberIds = band.band_members?.map(m => m.user_id) || [];
        
        let profiles: any[] = [];
        if (memberIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url, role')
            .in('user_id', memberIds);
          
          profiles = profilesData || [];
        }

        const membersWithProfiles = band.band_members?.map(member => ({
          ...member,
          profile: profiles.find(p => p.user_id === member.user_id)
        })) || [];

        return {
          ...band,
          members: membersWithProfiles,
          member_count: band.band_members?.length || 0
        };
      }));

      setBands(bandsWithCounts as BandWithMembers[]);
    } catch (error: any) {
      toast({
        title: 'Feil ved lasting av band',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBands();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('bands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bands' }, () => {
        fetchBands();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { bands, loading, refetch: fetchBands };
};

export const useUserBands = (userId: string | undefined) => {
  const [bands, setBands] = useState<BandWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setBands([]);
      setLoading(false);
      return;
    }

    const fetchUserBands = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('band_members')
          .select(`
            id,
            role,
            joined_at,
            band:band_id (
              id,
              name,
              description,
              image_url,
              created_by,
              created_at,
              updated_at,
              band_members (
                id,
                user_id,
                role
              )
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        const userBands = (data || [])
          .filter(item => item.band)
          .map(item => ({
            ...item.band,
            user_role: item.role,
            member_count: item.band.band_members?.length || 0,
          }));

        setBands(userBands as any);
      } catch (error: any) {
        toast({
          title: 'Feil ved lasting av band',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserBands();
  }, [userId, toast]);

  return { bands, loading };
};
