import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Briefcase, Lightbulb, FileText, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/types/auth";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

interface MenuSectionProps {
  profile: UserProfile;
}

export const MenuSection = ({ profile }: MenuSectionProps) => {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { unreadCount } = useNotifications();

  const menuItems = [
    {
      id: 'settings',
      label: t('settings'),
      description: 'Administrer konto og preferanser',
      icon: Settings,
      section: 'settings'
    },
    {
      id: 'bookings',
      label: t('bookings'),
      description: 'Se dine bookinger og avtaler',
      icon: Briefcase,
      section: 'bookings',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'admin-concepts',
      label: t('My Offers'),
      description: 'Administrer dine tilbud',
      icon: Lightbulb,
      section: 'admin-concepts'
    },
    {
      id: 'admin-files',
      label: 'Filer',
      description: 'Administrer dine filer',
      icon: FileText,
      section: 'admin-files'
    },
    {
      id: 'tickets',
      label: 'Mine billetter',
      description: 'Se dine kjøpte billetter',
      icon: Ticket,
      section: 'tickets'
    }
  ];

  const handleItemClick = (section: string) => {
    navigate(`/?section=${section}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meny</h1>
        <p className="text-muted-foreground">Velg en seksjon for å fortsette</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.id}
              className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
              onClick={() => handleItemClick(item.section)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.label}</CardTitle>
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
