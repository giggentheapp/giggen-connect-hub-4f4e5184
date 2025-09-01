import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Heart, User } from 'lucide-react';
import { FavoriteMaker } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

interface FavoriteMakerCardProps {
  maker: FavoriteMaker;
  onRemove: (makerId: string) => void;
}

export const FavoriteMakerCard = ({ maker, onRemove }: FavoriteMakerCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/profile/${maker.id}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(maker.id);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={maker.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{maker.display_name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{maker.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Heart className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </CardHeader>
      {maker.bio && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{maker.bio}</p>
        </CardContent>
      )}
    </Card>
  );
};