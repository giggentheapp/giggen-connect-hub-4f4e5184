import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye } from 'lucide-react';

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

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
          <CardDescription className="text-lg capitalize">{profile.role}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {profile.bio && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Om meg
              </h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Profilinformasjon</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Rolle: {profile.role}</p>
              {profile.address && profile.is_address_public && (
                <p>Lokasjon: {profile.address}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Dette er hvordan andre Makere ser din profil.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};