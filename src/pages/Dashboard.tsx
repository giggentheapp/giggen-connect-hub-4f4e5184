import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';
import { MakerDashboard } from '@/components/MakerDashboard';
import { GoerView } from '@/components/GoerView';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useAppTranslation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session and load profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('📋 Dashboard: Checking session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        console.log('❌ Dashboard: No user, redirecting to auth');
        navigate('/auth');
        return;
      }

      try {
        console.log('👤 Dashboard: Loading profile for user:', session.user.id);
        
        // Load user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('❌ Dashboard: Error loading profile:', error);
          toast({
            title: t('profileLoadError'),
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Dashboard: Profile loaded successfully:', profileData);
          setProfile(profileData as UserProfile);
        }
      } catch (err) {
        console.error('❌ Dashboard: Unexpected error loading profile:', err);
        toast({
          title: t('profileLoadError'),
          description: 'Unexpected error occurred',
          variant: "destructive",
        });
      }
      
      setLoading(false);
    }).catch(err => {
      console.error('❌ Dashboard: Session check failed:', err);
      setLoading(false);
      navigate('/auth');
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    console.log('🚪 Dashboard.tsx: Signing out...');
    
    // Clear session and local storage
    const { error } = await supabase.auth.signOut();
    
    // Force clear localStorage as backup
    localStorage.removeItem('sb-hkcdyqghfqyrlwjcsrnx-auth-token');
    sessionStorage.clear();
    
    if (error) {
      console.error('❌ Dashboard.tsx: Sign out error:', error);
      toast({
        title: t('signOutError'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('✅ Dashboard.tsx: Signed out successfully, navigating to /auth');
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4 shadow-glow"></div>
          <p className="text-lg font-medium bg-gradient-primary bg-clip-text text-transparent">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-glow border-gradient">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              {t('couldNotLoadUserData')}
            </p>
            <Button variant="gradient" onClick={() => navigate('/auth')} className="w-full">
              {t('goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🎛️ Dashboard: Rendering with state:', {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    userRole: profile?.role
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
      {/* Role-specific dashboard with integrated navigation */}
      {profile.role === 'artist' ? (
        <MakerDashboard profile={profile} />
      ) : (
        <GoerView profile={profile} />
      )}
    </div>
  );
};

export default Dashboard;