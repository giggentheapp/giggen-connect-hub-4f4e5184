import { useUserBands } from "@/hooks/useBands";
import { ProfileBandCard } from "./ProfileBandCard";
import { Users } from "lucide-react";

interface BandsInProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export const BandsInProfile = ({ userId, isOwnProfile }: BandsInProfileProps) => {
  const { bands, loading } = useUserBands(userId);

  // Filter to only show bands where show_in_profile is true
  const visibleBands = bands.filter((band: any) => band.show_in_profile === true);

  if (loading || visibleBands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {visibleBands.map((band) => (
        <ProfileBandCard key={band.id} band={band as any} />
      ))}
    </div>
  );
};
