import { Card } from '@/components/ui/card';
import { Users, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BandWithMembers } from '@/types/band';

interface ProfileBandCardProps {
  band: BandWithMembers & { user_role?: string };
}

export const ProfileBandCard = ({ band }: ProfileBandCardProps) => {
  const navigate = useNavigate();

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

  const handleClick = () => {
    navigate(`/band/${band.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{band.name}</h3>
        
        {band.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {band.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm pt-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{band.member_count || 0} medlemmer</span>
          </div>
          
          {band.genre && (
            <div className="flex items-center gap-1.5">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span>{band.genre}</span>
            </div>
          )}

          {band.user_role && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{getRoleLabel(band.user_role)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};