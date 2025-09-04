import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, MapPin, Mail, Phone } from 'lucide-react';
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
interface ProfileGoerSectionProps {
  profile: UserProfile;
}
export const ProfileGoerSection = ({
  profile
}: ProfileGoerSectionProps) => {
  const [currentProfile, setCurrentProfile] = useState(profile);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setCurrentProfile(event.detail);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Update profile when prop changes
  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  return <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            {currentProfile.avatar_url ? <img src={currentProfile.avatar_url} alt={currentProfile.display_name} className="w-full h-full rounded-full object-cover" /> : <User className="h-12 w-12 text-muted-foreground" />}
          </div>
          <CardTitle className="text-2xl">{currentProfile.display_name}</CardTitle>
          <CardDescription className="text-lg capitalize">{currentProfile.role}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentProfile.bio && <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Om meg
              </h3>
              <p className="text-muted-foreground">{currentProfile.bio}</p>
            </div>}

          {currentProfile.is_address_public && currentProfile.address && <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasjon
              </h3>
              <p className="text-muted-foreground">{currentProfile.address}</p>
            </div>}

          {currentProfile.contact_info && <div>
              <h3 className="font-semibold mb-2">Kontaktinformasjon</h3>
              <div className="space-y-2">
                {currentProfile.contact_info.email && <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{currentProfile.contact_info.email}</span>
                  </div>}
                {currentProfile.contact_info.phone && <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{currentProfile.contact_info.phone}</span>
                  </div>}
              </div>
            </div>}

          <div className="pt-4 border-t">
            
          </div>
        </CardContent>
      </Card>
    </div>;
};