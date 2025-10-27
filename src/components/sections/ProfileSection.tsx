import { User, Lightbulb, Calendar, MapPin, Copy } from 'lucide-react';
import { ProfilePortfolioDisplay } from '@/components/ProfilePortfolioDisplay';
import { ProfileConceptCard } from '@/components/ProfileConceptCard';
import { ProfileEventCard } from '@/components/ProfileEventCard';
import { BandsInProfile } from '@/components/BandsInProfile';
import { BandInvites } from '@/components/BandInvites';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { BookingRequest } from '@/components/BookingRequest';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
interface ProfileSectionProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
}
export const ProfileSection = ({
  profile,
  isOwnProfile = false
}: ProfileSectionProps) => {
  const { t } = useAppTranslation();
  const { toast } = useToast();
  
  const handleCopyUsername = () => {
    const username = `@${(profile as any).username}`;
    navigator.clipboard.writeText(username);
    toast({
      title: 'Kopiert!',
      description: `${username} kopiert til utklippstavlen`,
    });
  };
  
  const {
    concepts: allConcepts,
    loading: conceptsLoading
  } = useUserConcepts(profile.user_id);
  
  const { events: allEvents, loading: eventsLoading } = useUpcomingEvents(profile.user_id);
  
  // ProfileSection is the PUBLIC view - ALWAYS show only published concepts
  // regardless of who is viewing (even if viewing own profile)
  const concepts = allConcepts.filter(c => c.is_published);
  
  // Filter events to only show public ones (is_public_after_approval = true)
  const events = allEvents.filter(e => e.is_public_after_approval === true);

  
  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">
      
      {/* Book Now Button - Top Right (Only for other profiles) */}
      {!isOwnProfile && (
        <div className="flex justify-end">
          <BookingRequest 
            receiverId={profile.user_id} 
            receiverName={profile.display_name}
          />
        </div>
      )}

      {/* Profile Header */}
      <div className="text-center space-y-4 md:space-y-6">
        <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-accent-orange/30 via-accent-pink/20 to-accent-purple/30 p-1 mx-auto shadow-2xl">
          <div className="w-full h-full rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="h-12 w-12 md:h-20 md:w-20 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-accent-orange via-accent-pink to-accent-purple bg-clip-text text-transparent">
              {profile.display_name}
            </h1>
            <button
              onClick={handleCopyUsername}
              className="inline-flex items-center gap-2 text-lg md:text-xl text-muted-foreground hover:text-foreground transition-colors mb-2 group"
            >
              <span>@{(profile as any).username}</span>
              <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-orange animate-pulse"></span>
              <span className="capitalize font-medium">{profile.role}</span>
            </div>
          </div>

          {profile.bio && (
            <div className="max-w-2xl mx-auto">
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed px-4 whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.address && profile.is_address_public && (
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground bg-muted/30 px-4 py-2 rounded-full inline-flex mx-auto">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent-orange" />
              <span>{profile.address}</span>
            </div>
          )}

          {/* Social Media Links */}
          {profile.social_media_links && (
            <div className="pt-2">
              <SocialMediaLinks socialLinks={profile.social_media_links} />
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="space-y-4 md:space-y-6">
        {isOwnProfile && (
          <div className="flex justify-start">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard?section=filbank">
                Administrer portefølje i Filbank
              </Link>
            </Button>
          </div>
        )}
        <ProfilePortfolioDisplay userId={profile.user_id} />
      </div>

      {/* Concepts Section */}
      {concepts.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            <h2 className="text-xl md:text-2xl font-semibold">Mine tilbud</h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {concepts.map(concept => (
              <ProfileConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      )}

      {/* Band Invites (only for own profile) */}
      {isOwnProfile && (profile.role === 'musician' || profile.role === 'organizer') && (
        <BandInvites userId={profile.user_id} />
      )}

      {/* Upcoming Events Section */}
      {events.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            <h2 className="text-xl md:text-2xl font-semibold">{t('myUpcomingEvents')}</h2>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {events.map(event => (
              <ProfileEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Bands Section */}
      {(profile.role === 'musician' || profile.role === 'organizer') && (
        <BandsInProfile userId={profile.user_id} isOwnProfile={isOwnProfile} />
      )}
      </div>
    </div>
  );
};