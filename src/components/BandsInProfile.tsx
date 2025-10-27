import { useUserBands } from "@/hooks/useBands";
import { ProfileBandCard } from "./ProfileBandCard";
import { Users } from "lucide-react";

interface BandsInProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export const BandsInProfile = ({ userId, isOwnProfile }: BandsInProfileProps) => {
  const { bands, loading } = useUserBands(userId);

  const visibleBands = bands.filter((band: any) => band.show_in_profile === true);

  if (loading) {
    return null;
  }

  if (visibleBands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 md:h-6 md:w-6 text-accent-orange" />
        <h2 className="text-xl md:text-2xl font-semibold">Medvirkende</h2>
      </div>
      <div className="space-y-3 md:space-y-4">
        {visibleBands.map((band) => (
          <ProfileBandCard key={band.id} band={band as any} />
        ))}
      </div>
    </div>
  );
};
