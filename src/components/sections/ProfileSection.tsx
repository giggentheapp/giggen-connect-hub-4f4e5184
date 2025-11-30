import { User, Lightbulb, Calendar, MapPin, Copy, ArrowLeft } from 'lucide-react';
import { ProfilePortfolioDisplay } from '@/components/ProfilePortfolioDisplay';
import { ProfileConceptCard } from '@/components/ProfileConceptCard';
import { ProfileEventCard } from '@/components/ProfileEventCard';
import { BandsInProfile } from '@/components/BandsInProfile';
import { BandInvites } from '@/components/BandInvites';
import { useConcepts } from '@/hooks/useConcepts';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { BookingRequest } from '@/components/BookingRequest';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

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
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scrolling to missing field
  useEffect(() => {
    const state = location.state as { missingFields?: string[]; scrollToMissing?: boolean };
    if (state?.scrollToMissing && state?.missingFields && state.missingFields.length > 0) {
      // Show toast with missing fields
      toast({
        title: "Fullfør profilen din",
        description: `Mangler: ${state.missingFields.join(", ")}`,
        duration: 5000,
      });

      // Scroll to first missing field
      const firstMissing = state.missingFields[0];
      const fieldMap: Record<string, string> = {
        "Profilbilde": "avatar",
        "Visningsnavn": "display-name",
        "Brukernavn": "username",
        "Bio": "bio",
        "Kontaktinformasjon": "contact",
        "Sosiale medier": "social-links",
        "Musikkplattform": "social-links",
        "Offentlige innstillinger": "visibility",
      };

      const elementId = fieldMap[firstMissing];
      if (elementId) {
        setTimeout(() => {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add highlight effect
            element.classList.add("ring-2", "ring-primary", "ring-offset-2");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 2000);
          }
        }, 300);
      }

      // Clear the state
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, location.pathname, location.search]);
  
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
  } = useConcepts(profile.user_id);
  
  const { events: allEvents, loading: eventsLoading } = useUpcomingEvents(profile.user_id);
  
  // ProfileSection is the PUBLIC view - ALWAYS show only published concepts
  // regardless of who is viewing (even if viewing own profile)
  const concepts = allConcepts.filter(c => c.is_published);
  
  // Filter events to only show public ones (is_public_after_approval = true)
  const events = allEvents.filter(e => e.is_public_after_approval === true);

  
  const handleBack = () => {
    // Check if we have explore state to return to
    const exploreState = location.state;
    if (exploreState?.fromSection === 'explore') {
      // Navigate back to explore with all the saved state
      navigate(`/profile/${profile.user_id}?section=explore`, { 
        state: {
          activeView: exploreState.activeView,
          searchTerm: exploreState.searchTerm,
          scrollPosition: exploreState.scrollPosition
        }
      });
    } else {
      // Fallback to generic navigation
      navigate(-1);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Back Button and Actions */}
      <div className="flex items-center justify-between gap-4 animate-fade-in">
        {!isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Tilbake</span>
          </Button>
        )}
        
        {!isOwnProfile && (
          <div className="animate-scale-in">
            <BookingRequest 
              receiverId={profile.user_id} 
              receiverName={profile.display_name}
            />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="text-center space-y-4 md:space-y-6 animate-scale-in">
        <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-accent-orange/40 via-accent-pink/30 to-accent-purple/40 p-1 mx-auto shadow-2xl hover:shadow-accent-orange/20 transition-all duration-300 hover:scale-105">
          <div className="w-full h-full rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-background">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name} 
                className="w-full h-full object-cover transition-transform hover:scale-110 duration-300" 
              />
            ) : (
              <User className="h-12 w-12 md:h-20 md:w-20 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div className="animate-fade-in flex flex-col items-center gap-2">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground hover:scale-105 transition-transform inline-block text-center">
              {profile.display_name}
            </h1>
            <button
              onClick={handleCopyUsername}
              className="inline-flex items-center gap-2 text-base md:text-lg text-muted-foreground hover:text-foreground transition-all group hover:scale-105 px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              <span>@{(profile as any).username}</span>
              <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground">
            <span className="capitalize font-medium px-3 py-1 rounded-full bg-gradient-to-r from-accent-orange/10 to-accent-pink/10 border border-accent-orange/20">{profile.role}</span>
          </div>

          {profile.bio && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed px-4 whitespace-pre-wrap bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl py-6 border border-border/50 backdrop-blur-sm shadow-sm">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.address && profile.is_address_public && (
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground bg-gradient-to-r from-muted/50 to-muted/30 px-6 py-3 rounded-full inline-flex mx-auto backdrop-blur-sm border border-border/50 hover:scale-105 transition-transform shadow-sm hover:shadow-md">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent-orange" />
              <span>{profile.address}</span>
            </div>
          )}


          {/* Instruments Display - Only for Musicians */}
          {profile.role === 'musician' && (profile as any).instruments && Array.isArray((profile as any).instruments) && (profile as any).instruments.length > 0 && (
            <div className="max-w-2xl mx-auto px-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {((profile as any).instruments as Array<{ instrument: string; details: string }>).map((item, index) => (
                  <div 
                    key={index}
                    className="inline-flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 border border-accent-orange/30 hover:scale-105 transition-all hover:shadow-lg hover:shadow-accent-orange/20 backdrop-blur-sm"
                  >
                    <span className="text-sm font-bold text-accent-orange">
                      {item.instrument}
                    </span>
                    {item.details && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.details}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {isOwnProfile && (
          <div className="flex justify-start">
            <Button asChild variant="outline" size="sm" className="hover:scale-105 transition-transform">
              <Link to="/dashboard?section=filbank">
                Administrer portefølje i Filbank
              </Link>
            </Button>
          </div>
        )}
        <div className="transition-all duration-300">
          <ProfilePortfolioDisplay userId={profile.user_id} />
        </div>
      </div>

      {/* Concepts Section */}
      {concepts.length > 0 && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 group-hover:scale-110 transition-transform">
              <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-pink bg-clip-text text-transparent">Mine tilbud</h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {concepts.map((concept, index) => (
              <div key={concept.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <ProfileConceptCard concept={concept} />
              </div>
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
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-pink/20 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-pink bg-clip-text text-transparent">{t('myUpcomingEvents')}</h2>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <ProfileEventCard event={event} />
              </div>
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