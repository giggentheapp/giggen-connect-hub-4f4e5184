import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Briefcase, Lightbulb, FileText, Users, Calendar } from "lucide-react";
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

  const menuItems: Array<{
    id: string;
    label: string;
    description: string;
    icon: any;
    section?: string;
    path?: string;
    badge?: number;
  }> = [
    {
      id: "settings",
      label: "Innstillinger",
      description: "Administrer konto og preferanser",
      icon: Settings,
      section: "settings",
    },
    {
      id: "bookings",
      label: "Booking",
      description: "Se dine bookinger og avtaler",
      icon: Briefcase,
      section: "bookings",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: "admin-concepts",
      label: "Mine Tilbud",
      description: "Administrer dine tilbud",
      icon: Lightbulb,
      section: "admin-concepts",
    },
    {
      id: "admin-bands",
      label: "Mine Band",
      description: "Administrer dine band og medlemskap",
      icon: Users,
      section: "admin-bands",
    },
    {
      id: "admin-events",
      label: "Mine Arrangementer",
      description: "Administrer dine arrangementer",
      icon: Calendar,
      section: "admin-events",
    },
    {
      id: "admin-files",
      label: "Filbank",
      description: "Administrer dine filer",
      icon: FileText,
      section: "filbank",
    },
  ];

  const handleItemClick = (section?: string, path?: string) => {
    if (path) {
      navigate(path);
    } else if (section) {
      navigate(`/dashboard?section=${section}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meny</h1>
        <p className="text-muted-foreground">Velg en seksjon for å fortsette</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
              onClick={() => handleItemClick(item.section, item.path)}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{item.label}</CardTitle>
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1 md:mt-2 text-sm">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
