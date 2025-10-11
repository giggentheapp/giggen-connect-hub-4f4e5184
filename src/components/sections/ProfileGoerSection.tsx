import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, MapPin, Mail, Phone } from 'lucide-react';
import { WorkingEventsDisplay } from '@/components/WorkingEventsDisplay';
import { UserProfile } from '@/types/auth';
interface ProfileGoerSectionProps {
  profile: UserProfile;
  currentUserId?: string;
  viewerRole?: 'organizer' | 'musician';
}
export const ProfileGoerSection = ({
  profile,
  currentUserId,
  viewerRole
}: ProfileGoerSectionProps) => {
  return <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
    <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6">
      <Card className="mx-auto">
        <CardHeader className="text-center px-3 md:px-6 py-3 md:py-6">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-2 md:mb-4">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" /> : <User className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />}
          </div>
          <CardTitle className="text-lg md:text-2xl">{profile.display_name}</CardTitle>
          <CardDescription className="text-sm md:text-lg capitalize">{profile.role}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>;
};