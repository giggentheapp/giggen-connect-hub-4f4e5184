import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BandMember } from '@/types/band';

export const useBandPermissions = (bandId: string | undefined, members: BandMember[]) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const userMember = members.find(m => m.user_id === user.id);
        setCurrentUserRole(userMember?.role || null);
      }
    };

    if (members.length > 0) {
      fetchUserRole();
    }
  }, [members, bandId]);

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'founder';
  const isMember = !!currentUserRole;
  const isFounder = currentUserRole === 'founder';

  return {
    currentUserId,
    currentUserRole,
    isAdmin,
    isMember,
    isFounder,
  };
};
