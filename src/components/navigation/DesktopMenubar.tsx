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

  return (
    <div 
      className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo-only state */}
      <div className={cn(
        "h-full bg-card border-r border-border shadow-lg transition-all duration-300",
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
            const isActive = activeSection === item.id;
            
            if (item.hasDropdown && isExpanded) {
              return (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="opacity-0 animate-fade-in">{item.label}</span>
                      <ChevronDown className="h-4 w-4 ml-auto opacity-0 animate-fade-in" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="right">
                    {item.id === 'profile' && (
                      <>
                        <DropdownMenuItem onClick={() => onSectionChange('profile')}>
                          Vis som Maker
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile/goer-view">
                            Vis som Goer
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {item.id === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={() => onSectionChange('admin-files')}>
                          Filer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSectionChange('admin-concepts')}>
                          Konsepter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSectionChange('admin-settings')}>
                          Innstillinger
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
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