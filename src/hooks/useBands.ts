import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BandWithMembers } from '@/types/band';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';

export const useBands = () => {
  const { data: bands = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.bands.public,
    queryFn: async () => {
      // Fetch only bands with complete profiles
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
        .not('banner_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter bands that have either description or bio filled
      const completeBands = (data || []).filter(band => 
        (band.description && band.description.length > 0) || 
        (band.bio && band.bio.length > 0)
      );

      // Collect ALL member IDs from ALL bands first (deduplication)
      const allMemberIds = completeBands
        .flatMap(band => band.band_members?.map(m => m.user_id) || [])
        .filter((id, index, arr) => arr.indexOf(id) === index);

      // Fetch ALL profiles in ONE query
      let allProfiles: any[] = [];
      if (allMemberIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, role')
          .in('user_id', allMemberIds);
        
        if (profilesError) {
          logger.warn('Error fetching profiles:', profilesError);
        } else {
          allProfiles = profilesData || [];
        }
      }

      // Map profiles in memory
      const bandsWithCounts = completeBands.map((band) => {
        const memberIds = band.band_members?.map(m => m.user_id) || [];
        const profiles = allProfiles.filter(p => memberIds.includes(p.user_id));

        const membersWithProfiles = band.band_members?.map(member => ({
          ...member,
          profile: profiles.find(p => p.user_id === member.user_id)
        })) || [];

        return {
          ...band,
          members: membersWithProfiles,
          member_count: band.band_members?.length || 0
        };
      });

      return bandsWithCounts as BandWithMembers[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('bands-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bands' 
      }, () => {
        logger.debug('Band changed, invalidating cache');
        refetch();
      })
      .subscribe();

    const handleVisibilityChange = () => {
      refetch();
    };
    
    window.addEventListener('band-visibility-changed', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('band-visibility-changed', handleVisibilityChange);
    };
  }, [refetch]);

  return { bands, loading, error, refetch };
};

export const useUserBands = (userId: string | undefined) => {
  const { data: bands = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.bands.user(userId || ''),
    queryFn: async () => {
      if (!userId) return [];

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
          role: item.role,
          user_role: item.role,
          show_in_profile: item.show_in_profile,
          member_id: item.id,
          member_count: item.band.band_members?.length || 0,
        }));

      return userBands as unknown as BandWithMembers[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { bands, loading, error, refetch };
};
