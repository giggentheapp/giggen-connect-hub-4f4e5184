import { User, Folder, Lightbulb, Calendar, MapPin } from 'lucide-react';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import ConceptCard from '@/components/ConceptCard';
import { UpcomingEventsDisplay } from '@/components/UpcomingEventsDisplay';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
interface ProfileSectionProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
}
export const ProfileSection = ({
  profile,
  isOwnProfile = false
}: ProfileSectionProps) => {
  const { t } = useAppTranslation();
  console.log('🚨 ProfileSection RENDERED for user:', profile.user_id, 'isOwnProfile:', isOwnProfile);
  
  const {
    concepts: allConcepts,
    loading: conceptsLoading
  } = useUserConcepts(profile.user_id);
  
  // ProfileSection is the PUBLIC view - ALWAYS show only published concepts
  // regardless of who is viewing (even if viewing own profile)
  const concepts = allConcepts.filter(c => c.is_published);
  
  console.log('📊 ProfileSection concepts (PUBLIC VIEW):', {
    total: allConcepts.length,
    published: concepts.length,
    isOwnProfile
  });
  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-8 md:space-y-12">
      {/* Profile Header */}
      <div className="text-center space-y-4 md:space-y-6">
        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 flex items-center justify-center mx-auto ring-4 ring-background shadow-lg">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.display_name} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <User className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground" />
          )}
        </div>
        
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">{profile.display_name}</h1>
          <p className="text-sm md:text-lg text-muted-foreground capitalize flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-orange"></span>
            {profile.role}
          </p>
        </div>

        {profile.bio && (
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {profile.bio}
          </p>
        )}

        {profile.address && profile.is_address_public && (
          <p className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
            {profile.address}
          </p>
        )}

        {/* Social Media Links */}
        {profile.social_media_links && (
          <div className="pt-2">
            <SocialMediaLinks socialLinks={profile.social_media_links} />
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <Folder className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
          <h2 className="text-xl md:text-2xl font-semibold">Portefølje</h2>
        </div>
        <div className="border-t pt-4 md:pt-6">
          <ProfilePortfolioViewer userId={profile.user_id} isOwnProfile={true} />
        </div>
      </div>

      {/* Concepts Section */}
      {concepts.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            <h2 className="text-xl md:text-2xl font-semibold">Tilbud</h2>
          </div>
          <div className="border-t pt-4 md:pt-6 space-y-3 md:space-y-4">
            {concepts.map(concept => (
              <ConceptCard key={concept.id} concept={concept} showActions={false} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            <h2 className="text-xl md:text-2xl font-semibold">{t('myUpcomingEvents')}</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground pl-8 md:pl-9">
            {t('eventsYouAreInvolvedIn')}
          </p>
        </div>
        
        <div className="border-t pt-4 md:pt-6">
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-muted/30 rounded-lg border border-muted">
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('privacyNote')}
            </p>
          </div>
          
          <UpcomingEventsDisplay userId={profile.user_id} />
        </div>
      </div>
    </div>
  );
};