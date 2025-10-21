import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { BandCard } from "@/components/BandCard";
import { CreateBandModal } from "@/components/CreateBandModal";
import { BandInvites } from "@/components/BandInvites";
import { useUserBands } from "@/hooks/useBands";
import { UserProfile } from "@/types/auth";

interface AdminBandsSectionProps {
  profile: UserProfile;
}

export const AdminBandsSection = ({ profile }: AdminBandsSectionProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { bands, loading } = useUserBands(profile.user_id);

  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Mine Band</h1>
            <p className="text-sm text-muted-foreground">Administrer dine band og medlemskap</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt band
          </Button>
        </div>

        {/* Band Invites */}
        <BandInvites userId={profile.user_id} />

        {/* My Bands */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent-orange" />
            <h2 className="text-xl font-semibold">Mine Band ({bands.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Laster band...</p>
            </div>
          ) : bands.length > 0 ? (
            <div className="grid gap-4">
              {bands.map((band) => (
                <BandCard key={band.id} band={band} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Du er ikke medlem av noen band ennå</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Opprett ditt første band
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Band Modal */}
      <CreateBandModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
};
