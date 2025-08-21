import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FileUpload from '@/components/FileUpload';
import PortfolioManager from '@/components/PortfolioManager';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Phone, Save } from 'lucide-react';

interface ProfileData {
  id: string;
  display_name: string;
  bio?: string;
  contact_info?: any;
  avatar_url?: string;
  role: string;
  user_id: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public?: boolean;
}

interface ProfileSettings {
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
  show_on_map: boolean;
}

const ProfileSettings = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings>({
    show_about: false,
    show_contact: false,
    show_portfolio: false,
    show_techspec: false,
    show_events: false,
    show_on_map: false
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [isAddressPublic, setIsAddressPublic] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !currentUser) return;
      
      // Check if user is accessing their own profile
      if (currentUser.id !== userId) {
        toast({
          title: "Ingen tilgang",
          description: "Du kan kun redigere din egen profil",
          variant: "destructive",
        });
        return;
      }

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;
        
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setAddress(profileData.address || '');
        setIsAddressPublic(profileData.is_address_public || false);
        
        const contactInfo = profileData.contact_info as any;
        setEmail(contactInfo?.email || '');
        setPhone(contactInfo?.phone || '');

        // Fetch privacy settings
        const { data: settingsData } = await supabase
          .from('profile_settings')
          .select('*')
          .eq('maker_id', userId)
          .single();

        if (settingsData) {
          setSettings(settingsData);
        }

      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste profildata",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser, toast]);

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
    if (!profile || !currentUser) return;

    setSaving(true);
    try {
      let coordinates = null;
      
      // Use coordinates if already available from autocomplete, otherwise geocode
      if (profile.latitude && profile.longitude && address === profile.address) {
        coordinates = {
          latitude: profile.latitude,
          longitude: profile.longitude
        };
      } else if (address.trim() && address !== profile.address) {
        // Only geocode if address has changed and we don't have coordinates
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
        // Clear coordinates if address is empty
        profileUpdate.latitude = null;
        profileUpdate.longitude = null;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update or create privacy settings
      const { error: settingsError } = await supabase
        .from('profile_settings')
        .upsert({
          maker_id: userId,
          ...settings
        });

      if (settingsError) throw settingsError;

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...profileUpdate } : null);

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
        .eq('user_id', userId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, avatar_url: file.publicUrl } : null);
      
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

  if (loading) {
    return <div className="flex justify-center p-8">Laster...</div>;
  }

  if (!profile || currentUser?.id !== userId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/profile/${userId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til profil
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Profilinnstillinger</h1>
      </div>

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
                  folderPath={userId}
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
                if (coordinates) {
                  // Store coordinates for later use in handleSave
                  setProfile(prev => prev ? {
                    ...prev,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng,
                    address: newAddress
                  } : prev);
                }
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

        {/* Portefølje */}
        <div className="lg:col-span-2">
          <PortfolioManager
            bucketName="portfolio"
            folderPath={userId!}
            userId={userId!}
            title="Portefølje"
            description="Last opp bilder, video, lyd og dokumenter til din portefølje. Legg til tittel og beskrivelse for hvert element."
          />
        </div>

        {/* Tech Spec */}
        <div className="lg:col-span-2">
          <PortfolioManager
            bucketName="concepts"
            folderPath={userId!}
            userId={userId!}
            title="Tech Spec"
            description="Last opp tekniske spesifikasjoner og dokumenter."
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving || geocoding}>
          <Save className="h-4 w-4 mr-2" />
          {geocoding ? 'Finner koordinater...' : saving ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;