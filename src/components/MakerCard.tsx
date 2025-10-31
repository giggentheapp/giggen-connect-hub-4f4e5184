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
    instruments?: Array<{ instrument: string; details: string }>;
  };
  onViewProfile: (userId: string) => void;
}

export const MakerCard = ({ maker, onViewProfile }: MakerCardProps) => {
  const { t } = useAppTranslation();
  
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

        {/* Instruments - Only for Musicians */}
        {maker.role === 'musician' && maker.instruments && maker.instruments.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/50">
            {maker.instruments.slice(0, 3).map((item, index) => (
              <div 
                key={index}
                className="inline-flex flex-col px-2.5 py-1.5 rounded-md bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 border border-accent-orange/20"
              >
                <span className="text-xs font-semibold text-accent-orange leading-none">
                  {item.instrument}
                </span>
                {item.details && (
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {item.details}
                  </span>
                )}
              </div>
            ))}
            {maker.instruments.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{maker.instruments.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};