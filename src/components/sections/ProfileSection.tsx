import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface ProfileSectionProps {
  profile: UserProfile;
}

export const ProfileSection = ({ profile }: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Min Profil</h1>
        <p className="text-muted-foreground">Se hvordan din profil vises for andre</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Vis som Maker
            </CardTitle>
            <CardDescription>
              Forhåndsvis profilen slik andre Makere ser den
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">{profile.display_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              </div>
              
              {profile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Om meg</h4>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              <Button asChild className="w-full">
                <Link to={`/profile/${profile.user_id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vis som Maker
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vis som Goer</CardTitle>
            <CardDescription>
              Forhåndsvis profilen slik Goere ser den
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Forhåndsvisning av hvordan Goere ser din profil
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/profile/${profile.user_id}?view=goer`}>
                  Vis som Goer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};