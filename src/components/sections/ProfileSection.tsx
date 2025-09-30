import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, Folder, Lightbulb, Calendar, Shield } from 'lucide-react';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import ConceptCard from '@/components/ConceptCard';
import { UpcomingEventsDisplay } from '@/components/UpcomingEventsDisplay';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
interface ProfileSectionProps {
  profile: UserProfile;
}
export const ProfileSection = ({
  profile
}: ProfileSectionProps) => {
  const { t } = useAppTranslation();
  console.log('🚨 ProfileSection RENDERED for user:', profile.user_id);
  console.log('🚨 ProfileSection will call UpcomingEventsSection with isAdminView=true');
  
  const {
    concepts,
    loading: conceptsLoading
  } = useUserConcepts(profile.user_id);
  return <div className="space-y-6">
      {/* Basic Profile Info */}
      <Card>
        <CardHeader className="text-center px-3 md:px-6 py-3 md:py-6">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-2 md:mb-4">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" /> : <User className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />}
          </div>
          <CardTitle className="text-lg md:text-2xl">{profile.display_name}</CardTitle>
          <CardDescription className="text-sm md:text-lg capitalize">{profile.role}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6 pb-3 md:pb-6">
          {profile.bio && <div>
              <h3 className="font-semibold mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                Om meg
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">{profile.bio}</p>
            </div>}

          <div className="space-y-1 md:space-y-2">
            <h3 className="font-semibold text-sm md:text-base">{t('profileInformation')}</h3>
            <div className="text-xs md:text-sm text-muted-foreground space-y-0.5 md:space-y-1">
              <p>{t('role')}: {t(profile.role)}</p>
              {profile.address && profile.is_address_public && <p>Lokasjon: {profile.address}</p>}
            </div>
          </div>

          {/* Social Media Links */}
          {profile.social_media_links && (
            <SocialMediaLinks socialLinks={profile.social_media_links} />
          )}
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader className="px-3 md:px-6 py-3 md:py-6 pb-2 md:pb-6">
          <CardTitle className="flex items-center gap-1.5 md:gap-2 text-base md:text-xl">
            <Folder className="h-4 w-4 md:h-5 md:w-5" />
            {t('myPortfolio')}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t('howPortfolioAppears')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <ProfilePortfolioViewer userId={profile.user_id} isOwnProfile={true} />
        </CardContent>
      </Card>

      {/* Concepts Section */}
      <Card>
        <CardHeader className="px-3 md:px-6 py-3 md:py-6 pb-2 md:pb-6">
          <CardTitle className="flex items-center gap-1.5 md:gap-2 text-base md:text-xl">
            <Lightbulb className="h-4 w-4 md:h-5 md:w-5" />
            {t('myPublishedOffers')}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t('yourVisibleOffers')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {conceptsLoading ? (
            <div className="text-center py-6 md:py-8">
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2 md:mb-4"></div>
              <p className="text-sm md:text-base">Laster tilbud...</p>
            </div>
          ) : concepts.length === 0 ? (
            <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Lightbulb className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>
              <p className="text-sm md:text-base font-medium text-foreground mb-1">
                {t('noPublishedOffers')}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {t('createPublishOffers')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {concepts.map(concept => (
                <ConceptCard key={concept.id} concept={concept} showActions={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events Section */}
      <Card>
        <CardHeader className="px-3 md:px-6 py-3 md:py-6 pb-2 md:pb-6">
          <CardTitle className="flex items-center gap-1.5 md:gap-2 text-base md:text-xl">
            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            {t('myUpcomingEvents')}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t('eventsYouAreInvolvedIn')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="mb-2 md:mb-4 p-2 md:p-3 bg-muted/50 rounded-lg">
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('privacyNote')}
            </p>
          </div>
          
          <UpcomingEventsDisplay userId={profile.user_id} />
        </CardContent>
      </Card>

    </div>;
};