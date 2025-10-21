import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserBands } from '@/hooks/useBands';
import { BandCard } from './BandCard';
import { Users, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateBandModal } from './CreateBandModal';
import { Button } from './ui/button';

interface BandsInProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export const BandsInProfile = ({ userId, isOwnProfile }: BandsInProfileProps) => {
  const { bands, loading } = useUserBands(userId);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mine band
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isOwnProfile ? 'Mine band' : 'Band'}
          </CardTitle>
          {isOwnProfile && (
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nytt band
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {bands.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isOwnProfile ? 'Du er ikke medlem av noen band ennå' : 'Ikke medlem av noen band'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bands.map((band) => (
              <BandCard
                key={band.id}
                band={band}
                userRole={(band as any).user_role}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {isOwnProfile && (
        <CreateBandModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal}
        />
      )}
    </Card>
  );
};
