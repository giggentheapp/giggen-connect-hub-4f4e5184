import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Band, BandMember } from '@/types/band';
import { useToast } from '@/hooks/use-toast';

export const useBandData = (bandId: string | undefined) => {
  const { toast } = useToast();
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBandData = async () => {
    if (!bandId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch band data
      const { data: bandData, error: bandError } = await supabase
        .from('bands')
        .select('*')
        .eq('id', bandId)
        .single();

      if (bandError) throw bandError;

      // Type-cast jsonb fields from Supabase
      setBand({
        ...bandData,
        music_links: bandData.music_links as Band['music_links'],
        social_media_links: bandData.social_media_links as Band['social_media_links'],
        contact_info: bandData.contact_info as Band['contact_info'],
        discography: bandData.discography as string[] | null,
      });

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', bandId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Fetch profiles separately
      const memberIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, role')
        .in('user_id', memberIds);

      const profiles = profilesData || [];
      const membersWithProfiles = (membersData || []).map(member => ({
        ...member,
        role: member.role as 'member' | 'admin' | 'founder',
        profile: profiles.find(p => p.user_id === member.user_id)
      }));

      setMembers(membersWithProfiles);
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Feil ved lasting av band',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandData();
  }, [bandId]);

  return {
    band,
    members,
    loading,
    error,
    refetch: fetchBandData,
  };
};
