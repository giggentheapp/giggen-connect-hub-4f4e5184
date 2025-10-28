import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandWithMembers } from '@/types/band';
import { Users, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BandViewModal } from './BandViewModal';

interface BandCardProps {
  band: BandWithMembers;
  userRole?: string;
}

export const BandCard = ({ band, userRole }: BandCardProps) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

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

  // Check if user is admin or founder
  const isAdmin = userRole === 'admin' || userRole === 'founder';

  const handleCardClick = () => {
    // If admin/founder, navigate to band profile page (has edit button)
    // Otherwise, show modal
    if (isAdmin) {
      navigate(`/band/${band.id}`);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
        onClick={handleCardClick}
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
              <UsersRound className="w-6 h-6 text-primary" />
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

      <CardContent className="space-y-3">
        {band.genre && (
          <Badge variant="secondary" className="text-xs">
            {band.genre}
          </Badge>
        )}
        
        {band.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {band.description}
          </p>
        )}
        
        {band.founded_year && (
          <p className="text-xs text-muted-foreground">
            Dannet: {band.founded_year}
          </p>
        )}
      </CardContent>
    </Card>

    <BandViewModal 
      open={showModal} 
      onClose={() => setShowModal(false)} 
      band={band}
      showContactInfo={isAdmin}
    />
    </>
  );
};
