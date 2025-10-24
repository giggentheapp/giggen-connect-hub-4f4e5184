import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandWithMembers } from '@/types/band';
import { Users, Music } from 'lucide-react';
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
      className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/band/${band.id}`)}
    >
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {band.image_url ? (
              <img 
                src={band.image_url} 
                alt={band.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-base">{band.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {band.member_count || 0} medlemmer
            </CardDescription>
          </div>
          {userRole && (
            <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs shrink-0">
              {getRoleLabel(userRole)}
            </Badge>
          )}
        </div>
      </CardHeader>

      {band.description && (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {band.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
