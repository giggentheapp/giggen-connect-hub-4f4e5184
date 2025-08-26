import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Store, Map, Users, ChevronDown } from 'lucide-react';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';

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

interface GoerLayoutProps {
  profile: UserProfile;
  children: React.ReactNode;
}

export const GoerLayout = ({ profile, children }: GoerLayoutProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      id: 'market', 
      label: 'Arrangementsmarked', 
      icon: Store,
      path: '/dashboard/goer/market'
    },
    { 
      id: 'map', 
      label: 'Kart', 
      icon: Map,
      path: '/dashboard/goer/map'
    },
    { 
      id: 'makers', 
      label: 'Makers', 
      icon: Users,
      path: '/dashboard/goer/makers'
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsExpanded(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative min-h-screen">
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      active
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="opacity-0 animate-fade-in flex-1">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`border-b bg-card/95 backdrop-blur-sm z-40 ${!isMobile ? 'ml-16' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Goer</h1>
              <p className="text-sm text-muted-foreground">
                Velkommen, {profile.display_name}
              </p>
            </div>
            <ModeSwitcher profile={profile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${!isMobile ? 'ml-16' : ''} ${isMobile ? 'pb-16' : ''}`}>
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <nav className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'flex flex-col items-center px-3 py-2 rounded-lg transition-colors',
                    active
                      ? 'text-accent-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};