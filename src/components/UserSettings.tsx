import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { validateDisplayName, validateEmail, validatePhone, validateBio } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
import { User, Bell, Globe, Shield, Camera, Save, Phone, Mail, LogOut, Key, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from '@/components/AddressAutocomplete';

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

interface PrivacySettings {
  show_profile_to_goers?: boolean;
  show_portfolio_to_goers?: boolean;
  show_events_to_goers?: boolean;
  show_contact_info_to_goers?: boolean;
  show_pricing_to_goers?: boolean;
}

interface UserSettingsProps {
  profile: UserProfile;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

export const UserSettings = ({
  profile,
  onProfileUpdate
}: UserSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [profileData, setProfileData] = useState<UserProfile>(profile);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_profile_to_goers: true,
    show_portfolio_to_goers: true,
    show_events_to_goers: true,
    show_contact_info_to_goers: false,
    show_pricing_to_goers: false,
  });
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    website: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch current settings when component mounts
  useEffect(() => {
    fetchUserSettings();
  }, [profile.user_id]);

  const fetchUserSettings = async () => {
    try {
      // Fetch current profile data
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();
      
      if (profileError) throw profileError;
      
      if (currentProfile) {
        setProfileData(currentProfile);

        // Parse contact_info if it exists
        if (currentProfile.contact_info && typeof currentProfile.contact_info === 'object') {
          const info = currentProfile.contact_info as any;
          setContactInfo({
            phone: info.phone || '',
            email: info.email || '',
            website: info.website || ''
          });
        }
      }

      // Fetch profile settings for makers
      if (profile.role === 'maker') {
        const { data: settings, error: settingsError } = await supabase
          .from('profile_settings')
          .select('*')
          .eq('maker_id', profile.user_id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }
        
        if (settings) {
          setProfileSettings(settings);
        } else {
          // Create default settings for maker if none exist
          const defaultSettings = {
            show_about: false,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false,
            show_on_map: false
          };
          setProfileSettings(defaultSettings);
        }

        // Fetch privacy settings for goers
        const { data: privacyData, error: privacyError } = await supabase
          .from('profiles')
          .select('privacy_settings')
          .eq('user_id', profile.user_id)
          .single();

        if (privacyError && privacyError.code !== 'PGRST116') {
          throw privacyError;
        }

        if (privacyData?.privacy_settings && typeof privacyData.privacy_settings === 'object') {
          setPrivacySettings(prev => ({ ...prev, ...(privacyData.privacy_settings as PrivacySettings) }));
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Feil ved lasting av innstillinger",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      const updatedProfile = { ...profileData, ...updates };
      setProfileData(updatedProfile);
      onProfileUpdate?.(updatedProfile);
      
      toast({
        title: "Lagret!",
        description: "Profilinnstillingene ble oppdatert"
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfileSettings = async (updates: Partial<ProfileSettings>) => {
    if (profile.role !== 'maker' || !profileSettings) return;
    
    try {
      setLoading(true);
      const newSettings = { ...profileSettings, ...updates };
      
      const { error } = await supabase
        .from('profile_settings')
        .upsert({
          maker_id: profile.user_id,
          ...newSettings
        });
      
      if (error) throw error;
      
      setProfileSettings(newSettings);
      toast({
        title: "Lagret!",
        description: "Synlighetsinnstillingene ble oppdatert"
      });
    } catch (error: any) {
      console.error('Error updating profile settings:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    if (profile.role !== 'maker') return;
    
    try {
      setLoading(true);
      const newSettings = { ...privacySettings, ...updates };

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: newSettings as any })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setPrivacySettings(newSettings);
      toast({
        title: "Lagret!",
        description: "Personverninnstillinger lagret"
      });
    } catch (error: any) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    // Validate all fields before submitting
    const displayNameValidation = validateDisplayName(profileData.display_name);
    const emailValidation = validateEmail(contactInfo.email);
    const phoneValidation = validatePhone(contactInfo.phone);
    const bioValidation = validateBio(profileData.bio || '');

    const errors: Record<string, string> = {};
    if (!displayNameValidation.isValid) errors.display_name = displayNameValidation.error || '';
    if (!emailValidation.isValid) errors.email = emailValidation.error || '';
    if (!phoneValidation.isValid) errors.phone = phoneValidation.error || '';
    if (!bioValidation.isValid) errors.bio = bioValidation.error || '';

    setValidationErrors(errors);

    // Don't submit if there are validation errors
    if (Object.keys(errors).some(key => errors[key])) {
      toast({
        title: "Valideringsfeil",
        description: "Vennligst rett opp feilene før du lagrer",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare updates object
      const updates: Partial<UserProfile> = {
        display_name: profileData.display_name,
        bio: profileData.bio,
        address: profileData.address,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        is_address_public: profileData.is_address_public,
        contact_info: contactInfo
      };

      // Update profile
      await updateProfile(updates);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passordene matcher ikke",
        description: "Kontroller at begge passordene er identiske",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Passordet er for kort",
        description: "Passordet må være minst 6 tegn langt",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: 'Passord oppdatert',
        description: 'Ditt passord har blitt endret'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Feil ved passordendring',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmation !== 'SLETT') {
      toast({
        title: "Ugyldig bekreftelse",
        description: "Du må skrive SLETT for å bekrefte slettingen",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Delete user profile and related data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Delete auth user (this will cascade delete other related data)
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);

      if (authError) throw authError;

      toast({
        title: "Bruker slettet",
        description: "Din konto har blitt permanent slettet"
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profilinformasjon
          </CardTitle>
          <CardDescription>
            Oppdater dine grunnleggende profildetaljer som vises til andre brukere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url || undefined} />
              <AvatarFallback>
                {profileData.display_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Profilbilde</h3>
              <p className="text-sm text-muted-foreground">
                Velg et profilbilde som representerer deg
              </p>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Endre bilde
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Visningsnavn</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfileData(prev => ({ ...prev, display_name: value }));
                  
                  // Validate display name
                  const validation = validateDisplayName(value);
                  setValidationErrors(prev => ({
                    ...prev,
                    display_name: validation.isValid ? '' : validation.error || ''
                  }));
                }}
                placeholder="Ditt navn eller artistnavn"
              />
              {validationErrors.display_name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.display_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Biografi</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfileData(prev => ({ ...prev, bio: value }));
                  
                  // Validate bio
                  const validation = validateBio(value);
                  setValidationErrors(prev => ({
                    ...prev,
                    bio: validation.isValid ? '' : validation.error || ''
                  }));
                }}
                placeholder="Fortell litt om deg selv, din musikk og erfaring..."
                rows={4}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.bio}</p>
              )}
            </div>
            
            <div>
              <Label>Adresse</Label>
              <AddressAutocomplete
                value={profileData.address || ''}
                onChange={(address, coordinates) => {
                  setProfileData(prev => ({
                    ...prev,
                    address: address,
                    latitude: coordinates?.lat || null,
                    longitude: coordinates?.lng || null
                  }));
                }}
                placeholder="Din adresse (valgfri)"
              />
            </div>
          </div>

          {/* Contact Information - Collapsible */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Kontaktinformasjon</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContactInfo(prev => ({ ...prev, email: value }));

                    // Validate email
                    const validation = validateEmail(value);
                    setValidationErrors(prev => ({
                      ...prev,
                      email: validation.isValid ? '' : validation.error || ''
                    }));
                  }}
                  placeholder="din@epost.no"
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefonnummer
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContactInfo(prev => ({ ...prev, phone: value }));

                    // Validate phone
                    const validation = validatePhone(value);
                    setValidationErrors(prev => ({
                      ...prev,
                      phone: validation.isValid ? '' : validation.error || ''
                    }));
                  }}
                  placeholder="+47 123 45 678"
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="website">Nettside</Label>
                <Input
                  id="website"
                  type="url"
                  value={contactInfo.website}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://dinside.no"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Settings - Only for Makers */}
      {profileData.role === 'maker' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Personvern og synlighet
            </CardTitle>
            <CardDescription>
              Kontroller hva andre kan se av profilen din. Disse innstillingene bestemmer hvilke deler av profilen som vises til andre brukere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Map Visibility */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4" />
                  <Label className="text-sm font-medium">Vis på kart</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  La andre finne deg på kartet. Krever at adressen din også er offentlig.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_on_map || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_on_map: checked })}
                disabled={loading}
              />
            </div>

            {/* About Me Section */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  <Label className="text-sm font-medium">Om meg-seksjon</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vis biografien din til andre brukere som besøker profilen din.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_about || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_about: checked })}
                disabled={loading}
              />
            </div>

            {/* Contact Information */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" />
                  <Label className="text-sm font-medium">Kontaktinformasjon</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Del kontaktinformasjon med andre brukere når dere har en bekreftet booking.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_contact || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_contact: checked })}
                disabled={loading}
              />
            </div>

            {/* Portfolio */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="h-4 w-4" />
                  <Label className="text-sm font-medium">Portefølje</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  La andre se bildene og videoene i porteføljen din.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_portfolio || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_portfolio: checked })}
                disabled={loading}
              />
            </div>

            {/* Technical Specifications */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4" />
                  <Label className="text-sm font-medium">Tekniske spesifikasjoner</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Del tekniske krav og spesifikasjoner med potensielle samarbeidspartnere.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_techspec || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_techspec: checked })}
                disabled={loading}
              />
            </div>

            {/* Events */}
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4" />
                  <Label className="text-sm font-medium">Arrangementer</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vis dine planlagte arrangementer og konserter til andre brukere.
                </p>
              </div>
              <Switch
                checked={profileSettings?.show_events || false}
                onCheckedChange={(checked) => updateProfileSettings({ show_events: checked })}
                disabled={loading}
              />
            </div>

            {/* Address Privacy */}
            <div className="border-t pt-4">
              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4" />
                    <Label className="text-sm font-medium">Offentlig adresse</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gjør adressen din synlig for andre brukere. Dette er nødvendig for å vises på kartet.
                  </p>
                </div>
                <Switch
                  checked={profileData.is_address_public || false}
                  onCheckedChange={(checked) => {
                    setProfileData(prev => ({ ...prev, is_address_public: checked }));
                    // If making address private, also disable map visibility
                    if (!checked) {
                      updateProfileSettings({ show_on_map: false });
                    }
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Goer-specific visibility settings */}
            <div className="border-t pt-6 space-y-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Synlighet for Goers</h4>
                <p className="text-sm text-muted-foreground">
                  Kontroller hvilken informasjon Goers kan se fra profilen din
                </p>
              </div>

              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" />
                    <Label className="text-sm font-medium">Vis profil til Goers</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La Goers se navn, bilde og beskrivelse
                  </p>
                </div>
                <Switch
                  checked={privacySettings.show_profile_to_goers}
                  onCheckedChange={(checked) => updatePrivacySettings({ show_profile_to_goers: checked })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="h-4 w-4" />
                    <Label className="text-sm font-medium">Vis portefølje til Goers</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La Goers se eksempler på ditt arbeid
                  </p>
                </div>
                <Switch
                  checked={privacySettings.show_portfolio_to_goers}
                  onCheckedChange={(checked) => updatePrivacySettings({ show_portfolio_to_goers: checked })}
                  disabled={loading || !privacySettings.show_profile_to_goers}
                />
              </div>

              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4" />
                    <Label className="text-sm font-medium">Vis arrangementer til Goers</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La Goers se dine kommende arrangementer
                  </p>
                </div>
                <Switch
                  checked={privacySettings.show_events_to_goers}
                  onCheckedChange={(checked) => updatePrivacySettings({ show_events_to_goers: checked })}
                  disabled={loading || !privacySettings.show_profile_to_goers}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Endre passord
          </CardTitle>
          <CardDescription>
            Oppdater ditt passord for økt sikkerhet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">Nytt passord</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minst 6 tegn"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Bekreft passord</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Gjenta passordet"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={loading || !newPassword}>
            {loading ? 'Oppdaterer...' : 'Endre passord'}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Slett konto
          </CardTitle>
          <CardDescription>
            Permanent sletting av brukerdata. Denne handlingen kan ikke angres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Slett konto permanent
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Er du sikker på at du vil slette kontoen din?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denne handlingen kan ikke angres. All din data, inkludert profil, tilbud, og historikk vil bli permanent slettet.
                  <br /><br />
                  Skriv <strong>SLETT</strong> for å bekrefte at du vil slette kontoen din.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Skriv SLETT her"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={loading || deleteConfirmation !== 'SLETT'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? 'Sletter...' : 'Slett bruker permanent'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
