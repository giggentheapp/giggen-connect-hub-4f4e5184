import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BandWithMembers } from '@/types/band';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BandCardProps {
  band: BandWithMembers;
  userRole?: string;
}

export const BandCard = ({ band, userRole }: BandCardProps) => {
  const navigate = useNavigate();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'founder':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'founder':
        return 'Grunnlegger';
      case 'admin':
        return 'Admin';
      default:
        return 'Medlem';
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={() => navigate(`/band/${band.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={band.image_url || undefined} />
            <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
              {band.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{band.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{band.member_count || 0} medlemmer</span>
            </div>
          </div>
          {userRole && (
            <Badge variant={getRoleBadgeVariant(userRole)}>
              {getRoleLabel(userRole)}
            </Badge>
          )}
        </div>
      </CardHeader>
      {band.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {band.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
