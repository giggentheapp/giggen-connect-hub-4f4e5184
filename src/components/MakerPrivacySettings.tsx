import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivacySettings {
  show_profile_to_goers?: boolean;
  show_portfolio_to_goers?: boolean;
  show_events_to_goers?: boolean;
  show_contact_info_to_goers?: boolean;
  show_pricing_to_goers?: boolean;
}

interface MakerPrivacySettingsProps {
  userId: string;
}

export const MakerPrivacySettings = ({ userId }: MakerPrivacySettingsProps) => {
  const [settings, setSettings] = useState<PrivacySettings>({
    show_profile_to_goers: true,
    show_portfolio_to_goers: true,
    show_events_to_goers: true,
    show_contact_info_to_goers: false,
    show_pricing_to_goers: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, [userId]);

  const fetchPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data?.privacy_settings && typeof data.privacy_settings === 'object') {
        setSettings(prev => ({ ...prev, ...(data.privacy_settings as PrivacySettings) }));
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Kunne ikke laste personverninnstillinger');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: settings as any })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Personverninnstillinger lagret');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Kunne ikke lagre innstillinger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Synlighet for Goers
        </CardTitle>
        <CardDescription>
          Kontroller hvilken informasjon Goers kan se fra profilen din
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Personvern er viktig</p>
              <p>Goers vil aldri se priser, kontaktinfo eller booking-detaljer uansett innstillinger. Dette styrer kun grunnleggende profilinformasjon.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Vis profil til Goers</Label>
              <p className="text-sm text-muted-foreground">
                La Goers se navn, bilde og beskrivelse
              </p>
            </div>
            <Switch
              checked={settings.show_profile_to_goers}
              onCheckedChange={(checked) => updateSetting('show_profile_to_goers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Vis portefølje til Goers</Label>
              <p className="text-sm text-muted-foreground">
                La Goers se eksempler på ditt arbeid
              </p>
            </div>
            <Switch
              checked={settings.show_portfolio_to_goers}
              onCheckedChange={(checked) => updateSetting('show_portfolio_to_goers', checked)}
              disabled={!settings.show_profile_to_goers}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Vis arrangementer til Goers</Label>
              <p className="text-sm text-muted-foreground">
                La Goers se dine kommende arrangementer
              </p>
            </div>
            <Switch
              checked={settings.show_events_to_goers}
              onCheckedChange={(checked) => updateSetting('show_events_to_goers', checked)}
              disabled={!settings.show_profile_to_goers}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {settings.show_profile_to_goers ? (
                <>
                  <Eye className="h-4 w-4" />
                  Synlig for Goers
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Skjult for Goers
                </>
              )}
            </div>
            
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Lagrer...' : 'Lagre innstillinger'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};