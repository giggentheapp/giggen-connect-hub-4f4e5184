import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import GoerFullscreenMap from '@/components/GoerFullscreenMap';
import { cn } from '@/lib/utils';
import { Search, Heart, Settings, LogOut, Compass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteMakerCard } from '@/components/FavoriteMakerCard';
import { FavoriteEventCard } from '@/components/FavoriteEventCard';

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
  created_at: string;
  updated_at: string;
  default_mode?: string;
  current_mode?: string;
}

interface GoerViewProps {
  profile: UserProfile;
  onModeChange?: (newMode: string) => void;
}

export const GoerView = ({ profile, onModeChange }: GoerViewProps) => {
  const [activeSection, setActiveSection] = useState('favorites');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // For Utforsk-seksjonen
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favoriteMakers, favoriteEvents, loading, removeFavorite } = useFavorites(profile.user_id);
  
  // Check if user is a Maker in Goer mode (needs ModeSwitcher)
  const isMakerInGoerMode = profile.role === 'maker' && onModeChange;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  const goerNavItems = [
    { id: 'explore', label: 'Utforsk', icon: Search },
    { id: 'favorites', label: 'Favoritter', icon: Heart },
    { id: 'settings', label: 'Innstillinger', icon: Settings },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'explore':
        return (
          <div className="h-screen">
            <GoerFullscreenMap 
              onBack={() => setActiveSection('favorites')}
              onMakerClick={(makerId) => {
                navigate(`/profile/${makerId}`);
              }}
            />
          </div>
        );
      case 'favorites':
        if (loading) {
          return (
            <div>
              <h1 className="text-2xl font-bold mb-6">Favoritter</h1>
              <div className="space-y-6">
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <p className="text-muted-foreground">Laster favoritter...</p>
                </div>
              </div>
            </div>
          );
        }

        const hasNoFavorites = favoriteMakers.length === 0 && favoriteEvents.length === 0;

        if (hasNoFavorites) {
          return (
            <div>
              <h1 className="text-2xl font-bold mb-6">Favoritter</h1>
              <div className="text-center py-12">
                <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Du har ingen favoritter ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Utforsk makers og arrangementer for å legge til favoritter
                </p>
                <Button onClick={() => setActiveSection('explore')} variant="outline">
                  Utforsk nå
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div>
            <h1 className="text-2xl font-bold mb-6">Favoritter</h1>
            <div className="space-y-8">
              {favoriteMakers.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Favoritt Makers ({favoriteMakers.length})</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteMakers.map((maker) => (
                      <FavoriteMakerCard
                        key={maker.id}
                        maker={maker}
                        onRemove={(makerId) => removeFavorite(makerId, 'maker')}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {favoriteEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Favoritt Arrangementer ({favoriteEvents.length})</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteEvents.map((event) => (
                      <FavoriteEventCard
                        key={event.id}
                        event={event}
                        onRemove={(eventId) => removeFavorite(eventId, 'event')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h1 className="text-2xl font-bold mb-6">Innstillinger</h1>
            <div className="space-y-6 max-w-2xl">
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="font-semibold mb-4">Konto</h3>
                <div className="space-y-3">
                  {isMakerInGoerMode && (
                    <div className="pb-4 border-b">
                      <ModeSwitcher profile={profile} onModeChange={onModeChange} />
                    </div>
                  )}
                  <button className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    Slett konto
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h1 className="text-2xl font-bold mb-6">Favoritter</h1>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Favoritt Makers</h2>
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <p className="text-muted-foreground">Dine favoritt makers kommer her</p>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Favoritt Arrangementer</h2>
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <p className="text-muted-foreground">Dine favoritt arrangementer kommer her</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    setIsExpanded(false);
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div 
          className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div className={cn(
            "h-full bg-card border-r border-border shadow-lg transition-all duration-300 overflow-y-auto",
            isExpanded ? "w-64" : "w-16"
          )}>
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                {isExpanded && (
                  <span className="font-bold text-lg text-foreground opacity-0 animate-fade-in">
                    GIGGEN
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-2">
              {goerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="opacity-0 animate-fade-in flex-1">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* ModeSwitcher for Makers in Goer mode */}
              {isMakerInGoerMode && isExpanded && (
                <div className="pt-4 border-t border-border">
                  <ModeSwitcher profile={profile} onModeChange={onModeChange} />
                </div>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-4"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="opacity-0 animate-fade-in flex-1">
                    Logg ut
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${!isMobile ? 'ml-16' : ''} ${isMobile ? 'pb-16' : ''}`}>
        <div className="container mx-auto px-4 py-6">
          {renderActiveSection()}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {goerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                    isActive 
                      ? 'text-primary bg-accent' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
            
            {/* Mobile Logout Button */}
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs font-medium truncate">Logg ut</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};