import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Compass, User, Settings, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface DesktopMenubarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const DesktopMenubar = ({ activeSection, onSectionChange }: DesktopMenubarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Utforsk', icon: Compass },
    { id: 'profile', label: 'Profil', icon: User, hasDropdown: true },
    { id: 'admin', label: 'Administrasjon', icon: Settings, hasDropdown: true },
  ];

  const handleMainClick = (itemId: string) => {
    // Always navigate to the main section when clicking the main menu item
    onSectionChange(itemId);
  };

  return (
    <div 
      className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out pointer-events-auto"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo-only state */}
      <div className={cn(
        "h-full bg-card border-r border-border shadow-lg transition-all duration-300 pointer-events-auto",
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
            const isActive = activeSection === item.id || activeSection.startsWith(`${item.id}-`);
            
            if (item.hasDropdown && isExpanded) {
              return (
                <div key={item.id} className="relative">
                  {/* Main clickable area */}
                  <button
                    onClick={() => handleMainClick(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left pointer-events-auto',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="opacity-0 animate-fade-in flex-1">{item.label}</span>
                  </button>
                  
                  {/* Separate dropdown trigger */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent/50 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronDown className="h-4 w-4 opacity-0 animate-fade-in" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      side="right" 
                      className="z-[70] bg-popover border shadow-lg pointer-events-auto"
                      sideOffset={12}
                      avoidCollisions={true}
                    >
                      {item.id === 'profile' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => onSectionChange('profile')}
                            className="pointer-events-auto cursor-pointer"
                          >
                            Vis som Maker
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/profile/goer-view" className="pointer-events-auto cursor-pointer">
                              Vis som Goer
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {item.id === 'admin' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => onSectionChange('admin-files')}
                            className="pointer-events-auto cursor-pointer"
                          >
                            Filer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onSectionChange('admin-concepts')}
                            className="pointer-events-auto cursor-pointer"
                          >
                            Konsepter
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onSectionChange('admin-settings')}
                            className="pointer-events-auto cursor-pointer"
                          >
                            Innstillinger
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => handleMainClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors pointer-events-auto',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="opacity-0 animate-fade-in">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};