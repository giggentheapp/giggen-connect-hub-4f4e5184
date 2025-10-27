import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Music, Calendar, Image, User } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigate } from 'react-router-dom';

interface MakerCardProps {
  maker: {
    id: string;
    user_id: string;
    display_name: string;
    username: string;
    bio: string | null;
    role: string;
    avatar_url: string | null;
    address: string | null;
    privacy_settings: any;
    created_at: string;
  };
  onViewProfile: (userId: string) => void;
  onBookMaker?: (userId: string) => void;
}

export const MakerCard = ({ maker, onViewProfile, onBookMaker }: MakerCardProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  
  const privacySettings = maker.privacy_settings || {};
  const showPortfolio = privacySettings.show_portfolio_to_goers;
  const showEvents = privacySettings.show_events_to_goers;

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
      onClick={() => onViewProfile(maker.user_id)}
    >
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {maker.avatar_url ? (
              <img 
                src={maker.avatar_url} 
                alt={maker.display_name || 'Profile'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-base">{maker.display_name}</CardTitle>
            <CardDescription className="text-xs">@{maker.username}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {maker.role === 'musician' || maker.role === 'MUSIKER' ? 'Musiker' : 'Arrangør'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {maker.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{maker.address}</span>
          </div>
        )}

        {maker.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {maker.bio}
          </p>
        )}

        {(showPortfolio || showEvents) && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {showPortfolio && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Image className="w-3 h-3" />
                Portfolio
              </Badge>
            )}
            {showEvents && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Arrangementer
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};