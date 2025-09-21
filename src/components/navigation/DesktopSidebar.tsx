import { cn } from '@/lib/utils';
import { Compass, User, Settings } from 'lucide-react';

interface DesktopSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const DesktopSidebar = ({ activeSection, onSectionChange }: DesktopSidebarProps) => {
  const navItems = [
    { id: 'explore', label: 'Utforsk', icon: Compass },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'admin', label: 'Administrasjon', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar-background border-r border-sidebar-border h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="relative">
            <img 
              src="/logo-guitar-lightbulb.png" 
              alt="GIGGEN Logo" 
              className="w-10 h-10 object-contain animate-glow profile-glow rounded-lg p-1"
            />
          </div>
          <div>
            <span className="text-xl font-bold text-gradient">GIGGEN</span>
            <p className="text-xs text-muted-foreground">Connect Hub</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {Array.isArray(navItems) ? navItems.filter(item => item && item.id).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          }) : []}
        </ul>
      </nav>
    </aside>
  );
};