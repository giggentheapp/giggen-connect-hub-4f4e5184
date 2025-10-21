import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserBands } from "@/hooks/useBands";
import { BandCard } from "./BandCard";
import { CreateBandModal } from "./CreateBandModal";
import { Users } from "lucide-react";

interface BandsInProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export const BandsInProfile = ({ userId, isOwnProfile }: BandsInProfileProps) => {
  const { bands, loading } = useUserBands(userId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mine Band
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
            {isOwnProfile ? "Mine Band" : "Band"}
          </CardTitle>
          {isOwnProfile && <CreateBandModal userId={userId} />}
        </div>
      </CardHeader>
      <CardContent>
        {bands.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isOwnProfile ? "Du er ikke medlem av noen band ennå" : "Ikke medlem av noen band"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bands.map((band) => (
              <BandCard key={band.id} band={band} userRole={(band as any).user_role} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
