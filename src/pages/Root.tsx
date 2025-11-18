import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Root = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in, go to dashboard
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            navigate(`/profile/${profile.user_id}?section=dashboard`, { replace: true });
          } else {
            navigate('/auth', { replace: true });
          }
        } else {
          // User not logged in, check onboarding
          const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
          
          if (hasSeenOnboarding === 'true') {
            navigate('/auth', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/auth', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkAuthAndNavigate();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Root;
