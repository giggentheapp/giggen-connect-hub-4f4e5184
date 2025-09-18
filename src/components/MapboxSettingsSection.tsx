import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Map, Key, TestTube, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface MapboxConfig {
  mapbox_access_token: string | null;
  mapbox_style_url: string;
}

interface MapboxSettingsSectionProps {
  userId: string;
}

export const MapboxSettingsSection = ({ userId }: MapboxSettingsSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<MapboxConfig>({
    mapbox_access_token: '',
    mapbox_style_url: 'mapbox://styles/mapbox/light-v11'
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMapboxConfig();
  }, [userId]);

  const fetchMapboxConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_settings')
        .select('mapbox_access_token, mapbox_style_url')
        .eq('maker_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig({
          mapbox_access_token: data.mapbox_access_token || '',
          mapbox_style_url: data.mapbox_style_url || 'mapbox://styles/mapbox/light-v11'
        });
      }
    } catch (error: any) {
      console.error('Error fetching mapbox config:', error);
      toast({
        title: "Feil ved lasting av Mapbox-konfiguration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const validateConfig = () => {
    const errors: Record<string, string> = {};

    if (!config.mapbox_access_token?.trim()) {
      errors.access_token = 'Access Token er påkrevd';
    } else if (!config.mapbox_access_token.startsWith('pk.')) {
      errors.access_token = 'Access Token må starte med "pk."';
    }

    if (!config.mapbox_style_url?.trim()) {
      errors.style_url = 'Style URL er påkrevd';
    } else if (!config.mapbox_style_url.startsWith('mapbox://styles/')) {
      errors.style_url = 'Style URL må starte med "mapbox://styles/"';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const testConfiguration = async () => {
    if (!validateConfig()) {
      toast({
        title: "Valideringsfeil",
        description: "Vennligst rett opp feilene før du tester",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test the Mapbox token by making a basic API call
      const response = await fetch(`https://api.mapbox.com/v1/tokens/validate?access_token=${config.mapbox_access_token}`);
      
      if (response.ok) {
        setTestResult('success');
        toast({
          title: "Konfigurasjon OK!",
          description: "Mapbox-konfigurasjonen fungerer som forventet",
        });
      } else {
        throw new Error('Invalid access token');
      }
    } catch (error: any) {
      console.error('Mapbox test failed:', error);
      setTestResult('error');
      toast({
        title: "Konfigurationsfeil",
        description: "Access Token er ugyldig eller har ikke nødvendige tillatelser",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!validateConfig()) {
      toast({
        title: "Valideringsfeil",
        description: "Vennligst rett opp feilene før du lagrer",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profile_settings')
        .upsert({
          maker_id: userId,
          mapbox_access_token: config.mapbox_access_token,
          mapbox_style_url: config.mapbox_style_url,
          // Keep existing settings
          show_about: false,
          show_contact: false,
          show_portfolio: false,
          show_techspec: false,
          show_events: false,
          show_on_map: false
        });

      if (error) throw error;

      toast({
        title: "Lagret!",
        description: "Mapbox-konfigurasjonen ble oppdatert"
      });

      setTestResult(null); // Reset test result after saving
    } catch (error: any) {
      console.error('Error saving mapbox config:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Mapbox-konfiguration
        </CardTitle>
        <CardDescription>
          Konfigurer din Mapbox Access Token og Style URL for å aktivere farger og custom styling på kart
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Access Token */}
        <div>
          <Label htmlFor="access-token" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Mapbox Access Token (autentisering)
          </Label>
          <Textarea
            id="access-token"
            value={config.mapbox_access_token || ''}
            onChange={(e) => {
              setConfig(prev => ({ ...prev, mapbox_access_token: e.target.value }));
              setValidationErrors(prev => ({ ...prev, access_token: '' }));
              setTestResult(null);
            }}
            placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHdv..."
            className="font-mono text-sm"
            rows={3}
          />
          {validationErrors.access_token && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.access_token}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Få din Access Token fra{' '}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mapbox Dashboard
            </a>
          </p>
        </div>

        {/* Style URL */}
        <div>
          <Label htmlFor="style-url">Mapbox Style URL (custom farger)</Label>
          <Input
            id="style-url"
            value={config.mapbox_style_url}
            onChange={(e) => {
              setConfig(prev => ({ ...prev, mapbox_style_url: e.target.value }));
              setValidationErrors(prev => ({ ...prev, style_url: '' }));
              setTestResult(null);
            }}
            placeholder="mapbox://styles/your-username/your-style-id"
            className="font-mono text-sm"
          />
          {validationErrors.style_url && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.style_url}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Opprett custom styles i{' '}
            <a 
              href="https://studio.mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mapbox Studio
            </a>
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${
            testResult === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300' 
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
          }`}>
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {testResult === 'success' 
              ? 'Konfigurasjonen fungerer perfekt!' 
              : 'Konfigurasjonen har feil - sjekk Access Token'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={testConfiguration} 
            variant="outline" 
            disabled={testing || loading}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Tester...' : 'Test konfigurasjon'}
          </Button>
          
          <Button 
            onClick={saveConfiguration} 
            disabled={loading || testing}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground border-l-2 border-muted pl-4">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Access Token må ha "styles:read" og "fonts:read" tillatelser</li>
            <li>Test alltid konfigurasjonen før du lagrer</li>
            <li>Custom styles gir bedre farger og branding muligheter</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
