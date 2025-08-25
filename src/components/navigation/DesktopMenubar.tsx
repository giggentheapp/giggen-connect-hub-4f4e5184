import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Compass, User, Settings, ChevronDown, Calendar } from 'lucide-react';

interface DesktopMenubarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const DesktopMenubar = ({ activeSection, onSectionChange }: DesktopMenubarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const handleNavigation = (section: string) => {
    onSectionChange(section);
    setIsExpanded(false);
    setExpandedSubmenu(null);
  };

  const navItems = [
    { 
      id: 'explore', 
      label: 'Utforsk', 
      icon: Compass,
      subItems: []
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: User,
      subItems: [
        { id: 'profile-maker', label: 'Maker-visning', action: () => handleNavigation('profile-maker') },
        { id: 'profile-goer', label: 'Goer-visning', action: () => handleNavigation('profile-goer') }
      ]
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
    if (item?.subItems.length > 0) {
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
      </div>
    </div>
  );
};