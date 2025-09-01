import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';

interface FavoriteButtonProps {
  userId: string | undefined;
  itemId: string;
  itemType: 'maker' | 'event';
  itemName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const FavoriteButton = ({ 
  userId, 
  itemId, 
  itemType, 
  itemName, 
  variant = 'ghost',
  size = 'sm',
  className = ''
}: FavoriteButtonProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites(userId);
  const { toast } = useToast();
  
  const isCurrentlyFavorite = isFavorite(itemId, itemType);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      toast({
        title: "Må være innlogget",
        description: "Du må være innlogget for å legge til favoritter",
        variant: "destructive",
      });
      return;
    }

    if (isCurrentlyFavorite) {
      await removeFavorite(itemId, itemType);
      toast({
        title: "Fjernet fra favoritter",
        description: `${itemName} er fjernet fra favorittene dine`,
      });
    } else {
      await addFavorite(itemId, itemType);
      toast({
        title: "Lagt til i favoritter",
        description: `${itemName} er lagt til i favorittene dine`,
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      className={`${isCurrentlyFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'} ${className}`}
    >
      <Heart className={`h-4 w-4 ${isCurrentlyFavorite ? 'fill-current' : ''}`} />
    </Button>
  );
};