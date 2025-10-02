import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Music, Eye, Calendar, Image, Star } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigate } from 'react-router-dom';

interface MakerCardProps {
  maker: {
    id: string;
    user_id: string;
    display_name: string;
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
  const { isArtist } = useRole();
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  
  const privacySettings = maker.privacy_settings || {};
  const showPortfolio = privacySettings.show_portfolio_to_goers;
  const showEvents = privacySettings.show_events_to_goers;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <div className="p-4 space-y-3">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {maker.avatar_url ? (
                <img 
                  src={maker.avatar_url} 
                  alt={maker.display_name || 'Profile'}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                  onError={(e) => {
                    console.log('Image failed to load:', maker.avatar_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Music className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-base truncate">
                {maker.display_name}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {t(maker.role)}
              </Badge>
            </div>
            
            {maker.address && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">{maker.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio section */}
        {maker.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {maker.bio}
          </p>
        )}

        {/* Features badges */}
        {(showPortfolio || showEvents) && (
          <div className="flex items-center gap-2 flex-wrap">
            {showPortfolio && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Image className="w-3 h-3" />
                {t('filterPortfolio')}
              </Badge>
            )}
            {showEvents && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('filterEvents')}
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => onViewProfile(maker.user_id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-4 w-4 mr-1.5" />
            {t('viewProfile')}
          </Button>
          
          {isArtist && (
            <Button
              onClick={() => navigate(`/booking/create/${maker.user_id}`)}
              size="sm"
              className="flex-1"
            >
              <Music className="w-4 h-4 mr-1.5" />
              {t('book')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};