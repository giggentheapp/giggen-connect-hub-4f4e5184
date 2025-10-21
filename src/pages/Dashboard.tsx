import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { ArtistDashboard } from "@/components/ArtistDashboard";
import { AudienceView } from "@/components/AudienceView";
import { Link } from "react-router-dom";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { UserProfile } from "@/types/auth";

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Check for existing session and load profile
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          navigate("/auth");
          setLoading(false);
          return;
        }

        try {
          // CRITICAL: Verify user exists in auth.users before attempting profile operations
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !authUser) {
            navigate("/auth");
            setLoading(false);
            return;
          }

          // Now safely load/create profile using verified user ID
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", authUser.id)
            .maybeSingle();

          if (profileError) {
            toast({
              title: t("profileLoadError"),
              description: profileError.message,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          if (!profileData) {
            // Profile should have been created by database trigger
            toast({
              title: "Profil ikke funnet",
              description: "Vennligst logg ut og inn igjen",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            navigate('/auth');
            setLoading(false);
            return;
          }
          
          setProfile(profileData as unknown as UserProfile);
        } catch (err) {
          toast({
            title: t("profileLoadError"),
            description: "Unexpected error occurred",
            variant: "destructive",
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        navigate("/auth");
      });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    // Clear session and local storage
    const { error } = await supabase.auth.signOut();

    // Force clear localStorage as backup
    localStorage.removeItem("sb-hkcdyqghfqyrlwjcsrnx-auth-token");
    sessionStorage.clear();

    if (error) {
      toast({
        title: t("signOutError"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4 shadow-glow"></div>
          <p className="text-lg font-medium bg-gradient-primary bg-clip-text text-transparent">
            {t("GIGGEN laster ...")}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-glow border-gradient">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">{t("couldNotLoadUserData")}</p>
            <Button variant="gradient" onClick={() => navigate("/auth")} className="w-full">
              {t("goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10">
      {/* Role-specific dashboard with integrated navigation */}
      {["musician", "organizer"].includes(profile.role) ? (
        <ArtistDashboard profile={profile} />
      ) : (
        <AudienceView profile={profile} />
      )}
    </div>
  );
};

export default Dashboard;
