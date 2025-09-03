import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleProvider';

export interface SecureProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
}

export const useSecureProfile = (targetUserId: string | undefined, isOwnProfile = false) => {
  const [profile, setProfile] = useState<SecureProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role: currentUserRole } = useRole();

  useEffect(() => {
    if (!targetUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isOwnProfile) {
          // Full access to own profile
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', targetUserId)
            .single();

          if (fetchError) throw fetchError;
          setProfile(data);
        } else {
          // Use secure function for other users' profiles
          const { data, error: fetchError } = await supabase
            .rpc('get_public_profile', { target_user_id: targetUserId });

          if (fetchError) throw fetchError;
          
          if (data && data.length > 0) {
            setProfile(data[0]);
          } else {
            setProfile(null);
          }
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId, isOwnProfile]);

  return { profile, loading, error, refetch: () => {
    if (targetUserId) {
      // Re-run the effect by updating loading state
      setLoading(true);
    }
  }};
};

// Hook specifically for viewing other users' profiles securely
export const usePublicProfile = (targetUserId: string | undefined) => {
  return useSecureProfile(targetUserId, false);
};

// Hook for current user's own profile with full access
export const useOwnProfile = (targetUserId: string | undefined) => {
  return useSecureProfile(targetUserId, true);
};