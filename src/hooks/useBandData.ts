import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Band, BandMember } from '@/types/band';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

export const useBandData = (bandId: string | undefined) => {
  const { toast } = useToast();

  const { 
    data: bandData, 
    isLoading: bandLoading, 
    error: bandError,
    refetch: refetchBand 
  } = useQuery({
    queryKey: queryKeys.bands.detail(bandId || ''),
    queryFn: async () => {
      if (!bandId) return null;

      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('id', bandId)
        .single();

      if (error) throw error;

      // Type-cast jsonb fields
      return {
        ...data,
        music_links: data.music_links as Band['music_links'],
        social_media_links: data.social_media_links as Band['social_media_links'],
        contact_info: data.contact_info as Band['contact_info'],
        discography: data.discography as string[] | null,
      } as Band;
    },
    enabled: !!bandId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });

  const { 
    data: members = [], 
    isLoading: membersLoading, 
    refetch: refetchMembers 
  } = useQuery({
    queryKey: [...queryKeys.bands.detail(bandId || ''), 'members'],
    queryFn: async () => {
      if (!bandId) return [];

      const { data: membersData, error: membersError } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', bandId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Batch fetch profiles
      const memberIds = membersData?.map(m => m.user_id) || [];
      
      let profiles: any[] = [];
      if (memberIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, role')
          .in('user_id', memberIds);
        
        profiles = profilesData || [];
      }

      const membersWithProfiles = (membersData || []).map(member => ({
        ...member,
        role: member.role as 'member' | 'admin' | 'founder',
        profile: profiles.find(p => p.user_id === member.user_id)
      }));

      return membersWithProfiles as BandMember[];
    },
    enabled: !!bandId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Error handling
  useEffect(() => {
    if (bandError) {
      toast({
        title: 'Feil ved lasting av band',
        description: (bandError as Error).message,
        variant: 'destructive',
      });
    }
  }, [bandError, toast]);

  const loading = bandLoading || membersLoading;

  const refetch = () => {
    refetchBand();
    refetchMembers();
  };

  return {
    band: bandData || null,
    members,
    loading,
    error: bandError,
    refetch,
  };
};
