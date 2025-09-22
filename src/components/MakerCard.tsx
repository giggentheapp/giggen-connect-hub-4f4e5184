import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Music, Eye, Calendar, Image, Star } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';

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
  const { ismaker } = useRole();
  
  const privacySettings = maker.privacy_settings || {};
  const showPortfolio = privacySettings.show_portfolio_to_goers;
  const showEvents = privacySettings.show_events_to_goers;

  return (
    <Card className="group hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-border/50 hover:border-primary/20">
      <CardContent className="p-0">
        {/* Header with avatar and basic info */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {maker.avatar_url ? (
                  <img 
                    src={maker.avatar_url} 
                    alt={maker.display_name || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Avatar load error for maker:', maker.user_id, maker.avatar_url);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.appendChild(
                        Object.assign(document.createElement('div'), {
                          innerHTML: '<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>',
                          className: 'w-6 h-6 text-primary flex items-center justify-center'
                        })
                      );
                    }}
                  />
                ) : (
                  <Music className="w-6 h-6 text-primary" />
                )}
              </div>
              {/* Online indicator - could be enhanced with real status */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-base truncate">
                  {maker.display_name}
                </h3>
                <Badge variant="secondary" className="text-xs shrink-0">
                  maker
                </Badge>
              </div>
              
              {maker.address && (
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{maker.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio section */}
        {maker.bio && (
          <div className="px-4 pb-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {maker.bio}
            </p>
          </div>
        )}

        {/* Features badges - matching reference design */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {showPortfolio && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Image className="w-3 h-3" />
                Portefølje
              </Badge>
            )}
            {showEvents && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Arrangement
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Star className="w-3 h-3" />
              Verifisert
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button
            onClick={() => onViewProfile(maker.user_id)}
            variant="outline"
            size="sm"
            className="flex-1 text-primary border-primary/20 hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Se profil
          </Button>
          
          {/* Only show Book button to Makers */}
          {ismaker && onBookMaker && (
            <Button
              onClick={() => onBookMaker(maker.user_id)}
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Music className="w-4 h-4 mr-1.5" />
              Book
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};