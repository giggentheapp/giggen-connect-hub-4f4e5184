import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Globe, AlertCircle } from "lucide-react";
import { BandCard } from "@/components/BandCard";
import { BandInvites } from "@/components/BandInvites";
import { useUserBands } from "@/hooks/useBands";
import { UserProfile } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminBandsSectionProps {
  profile: UserProfile;
}

export const AdminBandsSection = ({ profile }: AdminBandsSectionProps) => {
  const [missingFieldsDialog, setMissingFieldsDialog] = useState<{
    open: boolean;
    type: 'profile' | 'public' | null;
    bandName: string;
    missing: string[];
  }>({
    open: false,
    type: null,
    bandName: '',
    missing: [],
  });
  const { bands, loading, refetch } = useUserBands(profile.user_id);
  const { toast } = useToast();
  const navigate = useNavigate();


  const toggleProfileVisibility = async (bandId: string, memberId: string, bandName: string, currentState: boolean) => {
    console.log('🔄 Toggle profile visibility:', { memberId, bandName, currentState });

    const newVisibilityState = !currentState;
    
    // If turning ON, check if band profile is complete
    if (newVisibilityState) {
      const { data: bandData, error: fetchError } = await supabase
        .from('bands')
        .select('image_url, description, bio')
        .eq('id', bandId)
        .single();

      if (fetchError) {
        toast({
          title: 'Feil ved sjekk av bandprofil',
          description: fetchError.message,
          variant: 'destructive',
        });
        return;
      }

      const missing: string[] = [];
      if (!bandData.image_url) missing.push('Profilbilde');
      if (!bandData.description && !bandData.bio) missing.push('Beskrivelse eller Bio');

      if (missing.length > 0) {
        setMissingFieldsDialog({
          open: true,
          type: 'profile',
          bandName,
          missing,
        });
        return;
      }
    }

    try {
      const { error, data } = await supabase
        .from('band_members')
        .update({ 
          show_in_profile: newVisibilityState
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('❌ Toggle error:', error);
        throw error;
      }
      
      console.log('✅ Band member updated:', data);

      toast({
        title: newVisibilityState ? '✅ Synlig i profil' : '🔒 Skjult fra profil',
        description: newVisibilityState 
          ? `"${bandName}" vises nå i din profil` 
          : `"${bandName}" er nå skjult fra din profil`,
      });
      
      await refetch();
      
    } catch (error: any) {
      console.error('❌ Toggle profile visibility error:', error);
      toast({
        title: 'Kunne ikke endre profilsynlighet',
        description: error.message || 'En ukjent feil oppstod',
        variant: 'destructive',
      });
    }
  };

  const toggleBandPublicVisibility = async (bandId: string, bandName: string, currentState: boolean) => {
    console.log('🔄 Toggle band public visibility:', { bandId, bandName, currentState });

    const newVisibilityState = !currentState;
    
    // If turning ON public visibility, check if band profile is complete
    if (newVisibilityState) {
      const { data: bandData, error: fetchError } = await supabase
        .from('bands')
        .select('image_url, banner_url, description, bio')
        .eq('id', bandId)
        .single();

      if (fetchError) {
        toast({
          title: 'Feil ved sjekk av bandprofil',
          description: fetchError.message,
          variant: 'destructive',
        });
        return;
      }

      const missing: string[] = [];
      if (!bandData.image_url) missing.push('Profilbilde');
      if (!bandData.banner_url) missing.push('Banner');
      if (!bandData.description && !bandData.bio) missing.push('Beskrivelse eller Bio');

      if (missing.length > 0) {
        setMissingFieldsDialog({
          open: true,
          type: 'public',
          bandName,
          missing,
        });
        return;
      }
    }

    try {
      const { error, data } = await supabase
        .from('bands')
        .update({ 
          is_public: newVisibilityState
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
        title: newVisibilityState ? '✅ Synlig i Utforsk' : '🔒 Skjult fra Utforsk',
        description: newVisibilityState 
          ? `"${bandName}" er nå satt som offentlig` 
          : `"${bandName}" er nå skjult fra utforskningsseksjonen`,
      });
      
      await refetch();
      
      window.dispatchEvent(new CustomEvent('band-visibility-changed', { 
        detail: { bandId, isPublic: newVisibilityState } 
      }));
      
    } catch (error: any) {
      console.error('❌ Toggle band public visibility error:', error);
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
          <Button onClick={() => navigate('/band/new')}>
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
                  <div className="flex flex-col gap-3 p-3">
                    <div className="flex items-start gap-3">
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
                    </div>
                    
                    {/* Visibility Toggles */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Profile Visibility Toggle */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border shrink-0">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium">
                          {band.show_in_profile ? 'I profil' : 'Ikke i profil'}
                        </span>
                        <Switch
                          checked={band.show_in_profile}
                          onCheckedChange={() => toggleProfileVisibility(band.id, band.member_id, band.name, band.show_in_profile)}
                          className="data-[state=checked]:bg-blue-500 scale-75"
                        />
                      </div>
                      
                      {/* Public Visibility Toggle - Only for admins/founders */}
                      {(band.role === 'admin' || band.role === 'founder') && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border shrink-0">
                          <Globe className="h-3 w-3 text-accent-orange" />
                          <span className="text-xs font-medium">
                            {band.is_public ? 'Synlig i Utforsk' : 'Skjult fra Utforsk'}
                          </span>
                          <Switch
                            checked={band.is_public}
                            onCheckedChange={() => toggleBandPublicVisibility(band.id, band.name, band.is_public)}
                            className="data-[state=checked]:bg-accent-orange scale-75"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Du er ikke medlem av noen band ennå</p>
              <Button onClick={() => navigate('/band/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Opprett ditt første band
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Missing Fields Dialog */}
      <AlertDialog open={missingFieldsDialog.open} onOpenChange={(open) => setMissingFieldsDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Profil ikke komplett</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                Bandet <strong>"{missingFieldsDialog.bandName}"</strong> kan ikke vises {missingFieldsDialog.type === 'profile' ? 'i din profil' : 'i Utforsk'} før disse feltene er fylt ut:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                {missingFieldsDialog.missing.map((field) => (
                  <li key={field} className="text-sm">{field}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                Gå til bandets side for å legge til manglende informasjon.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMissingFieldsDialog({ open: false, type: null, bandName: '', missing: [] })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
