import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FileUpload from '@/components/FileUpload';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface ProfileSettings {
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
  show_on_map: boolean;
}

interface SettingsSectionProps {
  profile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export const SettingsSection = ({ profile, onProfileUpdate }: SettingsSectionProps) => {
  const [settings, setSettings] = useState<ProfileSettings>({
    show_about: false,
    show_contact: false,
    show_portfolio: false,
    show_techspec: false,
    show_events: false,
    show_on_map: false
  });
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const { toast } = useToast();

  // Form states
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(profile.address || '');
  const [isAddressPublic, setIsAddressPublic] = useState(profile.is_address_public || false);

  useEffect(() => {
    const contactInfo = profile.contact_info as any;
    setEmail(contactInfo?.email || '');
    setPhone(contactInfo?.phone || '');

    // Fetch privacy settings
    const fetchSettings = async () => {
      const { data: settingsData } = await supabase
        .from('profile_settings')
        .select('*')
        .eq('maker_id', profile.user_id)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }
    };

    fetchSettings();
  }, [profile]);

  const geocodeAddress = async (addressToGeocode: string) => {
    if (!addressToGeocode.trim()) return null;
    
    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: addressToGeocode }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Feil ved adresseoppslag",
        description: "Kunne ikke finne koordinater for adressen",
        variant: "destructive",
      });
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let coordinates = null;
      
      // Use coordinates if already available, otherwise geocode
      if (profile.latitude && profile.longitude && address === profile.address) {
        coordinates = {
          latitude: profile.latitude,
          longitude: profile.longitude
        };
      } else if (address.trim() && address !== profile.address) {
        coordinates = await geocodeAddress(address);
      }

      // Update profile
      const profileUpdate: any = {
        display_name: displayName,
        bio: bio,
        address: address || null,
        is_address_public: isAddressPublic,
        contact_info: {
          email: email,
          phone: phone
        }
      };

      // Add coordinates if we have them
      if (coordinates) {
        profileUpdate.latitude = coordinates.latitude;
        profileUpdate.longitude = coordinates.longitude;
      } else if (!address.trim()) {
        profileUpdate.latitude = null;
        profileUpdate.longitude = null;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Update or create privacy settings
      const { error: settingsError } = await supabase
        .from('profile_settings')
        .upsert({
          maker_id: profile.user_id,
          ...settings
        });

      if (settingsError) throw settingsError;

      // Update parent component
      onProfileUpdate({ ...profile, ...profileUpdate });

      toast({
        title: "Lagret",
        description: "Profilinnstillinger er oppdatert",
      });

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre endringer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = (key: keyof ProfileSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAvatarUpload = async (file: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: file.publicUrl })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      onProfileUpdate({ ...profile, avatar_url: file.publicUrl });
      
      toast({
        title: "Profilbilde oppdatert",
        description: "Ditt nye profilbilde er lagret",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere profilbilde",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grunnleggende info */}
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende informasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="avatar">Profilbilde</Label>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <FileUpload
                  bucketName="avatars"
                  folderPath={profile.user_id}
                  onFileUploaded={handleAvatarUpload}
                  acceptedTypes=".jpg,.jpeg,.png,.gif"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="displayName">Navn</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bio">Om meg</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fortell litt om deg selv..."
              />
            </div>

            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <AddressAutocomplete
              value={address}
              onChange={(newAddress, coordinates) => {
                setAddress(newAddress);
              }}
              placeholder="Gate, postnummer, by..."
            />
          </CardContent>
        </Card>

        {/* Personverninnstillinger */}
        <Card>
          <CardHeader>
            <CardTitle>Personverninnstillinger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show_about">Vis "Om meg"</Label>
              <Switch
                id="show_about"
                checked={settings.show_about}
                onCheckedChange={(checked) => handleToggleChange('show_about', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_contact">Vis kontaktinfo</Label>
              <Switch
                id="show_contact"
                checked={settings.show_contact}
                onCheckedChange={(checked) => handleToggleChange('show_contact', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_portfolio">Vis portefølje</Label>
              <Switch
                id="show_portfolio"
                checked={settings.show_portfolio}
                onCheckedChange={(checked) => handleToggleChange('show_portfolio', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_techspec">Vis tech spec</Label>
              <Switch
                id="show_techspec"
                checked={settings.show_techspec}
                onCheckedChange={(checked) => handleToggleChange('show_techspec', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_events">Vis arrangementer</Label>
              <Switch
                id="show_events"
                checked={settings.show_events}
                onCheckedChange={(checked) => handleToggleChange('show_events', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show_on_map">Vis meg på kart</Label>
              <Switch
                id="show_on_map"
                checked={settings.show_on_map}
                onCheckedChange={(checked) => handleToggleChange('show_on_map', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_address_public">Vis adresse offentlig</Label>
                <p className="text-sm text-muted-foreground">
                  Gjør adressen din synlig på kartet for andre brukere
                </p>
              </div>
              <Switch
                id="is_address_public"
                checked={isAddressPublic}
                onCheckedChange={setIsAddressPublic}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || geocoding}>
          <Save className="h-4 w-4 mr-2" />
          {geocoding ? 'Finner koordinater...' : saving ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
      </div>
    </div>
  );
};