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
      // Fetch only bands with complete profiles (image and description/bio required)
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
        .eq('is_public', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter bands that have either description or bio filled
      const completeBands = (data || []).filter(band => 
        (band.description && band.description.length > 0) || 
        (band.bio && band.bio.length > 0)
      );

      // Fetch profiles separately for members
      const bandsWithCounts = await Promise.all(completeBands.map(async (band) => {
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

  const fetchUserBands = async () => {
    if (!userId) {
      setBands([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('band_members')
        .select(`
          id,
          role,
          joined_at,
          show_in_profile,
          band:band_id (
            id,
            name,
            description,
            image_url,
            genre,
            founded_year,
            created_by,
            created_at,
            updated_at,
            is_public,
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
          show_in_profile: item.show_in_profile,
          member_id: item.id,
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

  useEffect(() => {
    fetchUserBands();
  }, [userId, toast]);

  return { bands, loading, refetch: fetchUserBands };
};
