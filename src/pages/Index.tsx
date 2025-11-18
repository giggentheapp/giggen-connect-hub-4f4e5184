import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user profile to navigate to dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          navigate(`/profile/${profile.user_id}?section=dashboard`);
        }
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-2">GIGGEN</CardTitle>
          <CardDescription className="text-lg">
            Plattformen som kobler kreative Makers med engasjerte Goers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-left">
              <h3 className="font-semibold mb-2">🎨 GiggenMaker</h3>
              <p className="text-sm text-muted-foreground">
                Opprett tilbud, bygg portefølje og administrer arrangementer. 
                Vis frem din kreativitet og knytt kontakter.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold mb-2">👀 GiggenGoer</h3>
              <p className="text-sm text-muted-foreground">
                Utforsk kreative prosjekter, følg med på arrangementer og 
                oppdag nye talenter i kreativbransjen.
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={() => {
                navigate('/auth');
              }} 
              className="w-full"
              size="lg"
            >
              Kom i gang
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Har du allerede konto? Klikk "Kom i gang" for å logge inn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
