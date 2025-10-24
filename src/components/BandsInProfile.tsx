import { useUserBands } from "@/hooks/useBands";
import { ProfileBandCard } from "./ProfileBandCard";
import { Users } from "lucide-react";

interface BandsInProfileProps {
  userId: string;
  isOwnProfile: boolean;
}

export const BandsInProfile = ({ userId, isOwnProfile }: BandsInProfileProps) => {
  const { bands, loading } = useUserBands(userId);

  if (loading || bands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {bands.map((band) => (
        <ProfileBandCard key={band.id} band={band as any} />
      ))}
    </div>
  );
};
