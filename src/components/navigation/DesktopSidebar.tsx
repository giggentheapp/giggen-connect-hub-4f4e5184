import { cn } from '@/lib/utils';
import { Search, User, Settings, Database } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigate, useLocation } from 'react-router-dom';
import giggenLogo from '@/assets/giggen-logo.png';

interface DesktopSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const DesktopSidebar = ({ activeSection, onSectionChange }: DesktopSidebarProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'explore', label: t('explore'), icon: Search, type: 'section' },
    { id: 'profile', label: t('profile'), icon: User, type: 'section' },
    { id: 'admin', label: t('administration'), icon: Settings, type: 'section' },
  ];

  // Add direct route navigation items
  const routeItems = [
    { 
      id: 'filbank', 
      label: t('fileBank'), 
      icon: Database, 
      type: 'route',
      path: '/filbank' 
    },
    { 
      id: 'settings', 
      label: t('settings'), 
      icon: Settings, 
      type: 'route',
      path: '/settings' 
    }
  ];

  const allItems = [...navItems, ...routeItems];

  const handleItemClick = (item: any) => {
    if (item.type === 'route') {
      navigate(item.path);
    } else {
      onSectionChange(item.id);
    }
  };

  const isActiveItem = (item: any) => {
    if (item.type === 'route') {
      return location.pathname === item.path;
    }
    return activeSection === item.id;
  };

  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar-background border-r border-sidebar-border h-full">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <img 
            src={giggenLogo} 
            alt="GIGGEN Logo" 
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
        </div>
      </div>
      
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {Array.isArray(allItems) ? allItems.filter(item => item && item.id).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
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