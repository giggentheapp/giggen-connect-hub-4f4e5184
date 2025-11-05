import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Eye, EyeOff } from "lucide-react";
import { BandCard } from "@/components/BandCard";
import { CreateBandModal } from "@/components/CreateBandModal";
import { BandInvites } from "@/components/BandInvites";
import { useUserBands } from "@/hooks/useBands";
import { UserProfile } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminBandsSectionProps {
  profile: UserProfile;
}

export const AdminBandsSection = ({ profile }: AdminBandsSectionProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { bands, loading, refetch } = useUserBands(profile.user_id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleBandVisibility = async (bandId: string, bandName: string, currentState: boolean, userRole: string) => {
    console.log('🔄 Toggle band visibility:', { bandId, bandName, currentState, userRole });
    
    // Only admin or founder can change public visibility
    if (!['admin', 'founder'].includes(userRole)) {
      toast({
        title: 'Ingen tilgang',
        description: 'Kun admin eller grunnlegger kan endre synlighet',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newVisibilityState = !currentState;
      console.log('➡️ Setting is_public to:', newVisibilityState);
      
      const { error, data } = await supabase
        .from('bands')
        .update({ 
          is_public: newVisibilityState,
          updated_at: new Date().toISOString()
        })
        .eq('id', bandId)
        .select()
        .single();

      if (error) {
        console.error('❌ Toggle error:', error);
        throw error;
      }
      
      console.log('✅ Band updated:', data);

      toast({
        title: newVisibilityState ? '✅ Band synlig i utforsk' : '🔒 Band skjult fra utforsk',
        description: newVisibilityState 
          ? `"${bandName}" er nå synlig i utforsk-seksjonen` 
          : `"${bandName}" er nå skjult fra utforsk-seksjonen`,
      });
      
      // Refetch to get updated data
      await refetch();
      
    } catch (error: any) {
      console.error('❌ Toggle visibility error:', error);
      toast({
        title: 'Kunne ikke endre synlighet',
        description: error.message || 'En ukjent feil oppstod',
        variant: 'destructive',
      });
    }
  };

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
            <div className="space-y-3">
              {bands.map((band: any) => (
                <div key={band.id} className="group relative rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/20 hover:border-border transition-all">
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div 
                        onClick={() => navigate(`/band/${band.id}`)}
                        className="cursor-pointer"
                      >
                        <h3 className="text-sm font-semibold truncate">{band.name}</h3>
                        {band.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {band.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange"></span>
                            {band.member_count} medlemmer
                          </span>
                          {band.genre && (
                            <span className="inline-flex items-center gap-1">
                              <span>•</span>
                              {band.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border shrink-0">
                      {band.is_public ? (
                        <>
                          <Eye className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium">Offentlig</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Skjult</span>
                        </>
                      )}
                      <Switch
                        checked={band.is_public}
                        onCheckedChange={() => toggleBandVisibility(band.id, band.name, band.is_public, band.user_role)}
                        className="data-[state=checked]:bg-green-500 scale-75"
                        disabled={!['admin', 'founder'].includes(band.user_role)}
                      />
                    </div>
                  </div>
                </div>
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
