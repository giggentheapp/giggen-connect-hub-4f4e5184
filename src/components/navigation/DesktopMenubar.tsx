import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, User, Settings, ChevronDown, Calendar, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import giggenLogo from '@/assets/giggen-logo.png';

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
}

interface DesktopMenubarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: UserProfile;
}

export const DesktopMenubar = ({ activeSection, onSectionChange, profile }: DesktopMenubarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleNavigation = (section: string) => {
    onSectionChange(section);
    setIsExpanded(false);
    setExpandedSubmenu(null);
  };

  const navItems = [
    { 
      id: 'explore', 
      label: 'Utforsk', 
      icon: Search,
      subItems: []
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: User,
      subItems: []
    },
    { 
      id: 'bookings', 
      label: 'Bookinger', 
      icon: Calendar,
      subItems: []
    },
    { 
      id: 'admin', 
      label: 'Administrasjon', 
      icon: Settings,
      subItems: [
        { id: 'admin-files', label: 'Filer', action: () => handleNavigation('admin-files') },
        { id: 'admin-concepts', label: 'Konsepter', action: () => handleNavigation('admin-concepts') },
        { id: 'admin-events', label: 'Kommende arrangementer', action: () => handleNavigation('admin-events') },
        { id: 'admin-settings', label: 'Innstillinger', action: () => handleNavigation('admin-settings') }
      ]
    },
  ];

  const handleMainClick = (itemId: string) => {
    const item = navItems.find(item => item.id === itemId);
    if (item?.subItems && item.subItems.length > 0) {
      setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId);
    } else {
      handleNavigation(itemId);
    }
  };

  const handleSubItemClick = (subItem: any) => {
    if (subItem.action) {
      subItem.action();
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={cn(
        "h-full bg-card border-r border-border shadow-lg transition-all duration-300 overflow-hidden flex flex-col",
        isExpanded ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                src={giggenLogo} 
                alt="GIGGEN Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            {isExpanded && (
              <div className="opacity-0 animate-fade-in">
                <img 
                  src={giggenLogo} 
                  alt="GIGGEN Logo" 
                  className="h-20 object-contain drop-shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2 flex-1">
          {Array.isArray(navItems) ? navItems.filter(item => item && item.id).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || activeSection.startsWith(`${item.id}-`);
            const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
            const isSubmenuExpanded = expandedSubmenu === item.id;
            
            return (
              <div key={item.id}>
                {/* Main menu item */}
                <button
                  onClick={() => handleMainClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && (
                    <>
                      <span className="opacity-0 animate-fade-in flex-1">{item.label}</span>
                      {hasSubItems && (
                        <ChevronDown className={cn(
                          "h-4 w-4 opacity-0 animate-fade-in transition-transform",
                          isSubmenuExpanded && "rotate-180"
                        )} />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-menu items */}
                {hasSubItems && isExpanded && isSubmenuExpanded && (
                  <div className="ml-8 mt-1 space-y-1 opacity-0 animate-fade-in">
                    {Array.isArray(item.subItems) ? item.subItems.filter(subItem => subItem && subItem.id).map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubItemClick(subItem)}
                        className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-accent-foreground hover:bg-accent/50 rounded-lg transition-colors"
                      >
                        {subItem.label || 'Unnamed'}
                      </button>
                    )) : <></>}
                  </div>
                )}
              </div>
            );
          }) : []}
        </nav>

        {/* Bottom Controls */}
        {isExpanded && (
          <div className="mt-auto p-3 border-t border-border space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logg ut
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};