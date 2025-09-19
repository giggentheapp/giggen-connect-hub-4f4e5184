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
      const {
        data: currentProfile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('user_id', profile.user_id).single();
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
        const {
          data: settings,
          error: settingsError
        } = await supabase.from('profile_settings').select('*').eq('maker_id', profile.user_id).single();
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
      const {
        error
      } = await supabase.from('profiles').update(updates).eq('user_id', profile.user_id);
      if (error) throw error;
      const updatedProfile = {
        ...profileData,
        ...updates
      };
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
      const newSettings = {
        ...profileSettings,
        ...updates
      };
      const {
        error
      } = await supabase.from('profile_settings').upsert({
        maker_id: profile.user_id,
        ...newSettings
      });
      if (error) throw error;
      setProfileSettings(newSettings);
      toast({
        title: "Lagret!",
        description: "Synlighetsinnstillinger ble oppdatert"
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

    await updateProfile({
      display_name: profileData.display_name,
      bio: profileData.bio,
      contact_info: contactInfo,
      is_address_public: profileData.is_address_public,
      address: profileData.address
    });
  };
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfile({
        avatar_url: data.publicUrl
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Feil",
        description: "Passordene matcher ikke",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Feil",
        description: "Passordet må være minst 6 tegn langt",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Lagret!",
        description: "Passordet ble endret"
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Feil ved oppdatering",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmation !== 'SLETT') {
      toast({
        title: "Feil",
        description: "Du må skrive 'SLETT' for å bekrefte",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Delete all user data and profile (this will cascade to auth.users)
      const { error: deleteDataError } = await supabase
        .rpc('delete_user_data', { user_uuid: profile.user_id });
      
      if (deleteDataError) throw deleteDataError;
      
      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: "Bruker slettet",
        description: "Din bruker og alle tilhørende data er slettet"
      });
      
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-6 max-w-4xl">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profilinnstillinger
          </CardTitle>
          <CardDescription>
            Administrer din grunnleggende profilinformasjon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Endre profilbilde
                  </span>
                </Button>
              </Label>
              <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display-name">Visningsnavn</Label>
              <Input id="display-name" value={profileData.display_name} onChange={e => {
                const value = e.target.value;
                setProfileData(prev => ({
                  ...prev,
                  display_name: value
                }));
                
                // Validate display name
                const validation = validateDisplayName(value);
                setValidationErrors(prev => ({
                  ...prev,
                  display_name: validation.isValid ? '' : validation.error || ''
                }));
              }} />
              {validationErrors.display_name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.display_name}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="bio">Om meg</Label>
              <Textarea 
                id="bio" 
                value={profileData.bio || ''} 
                onChange={e => {
                  const value = e.target.value;
                  setProfileData(prev => ({
                    ...prev,
                    bio: value
                  }));
                  
                  // Validate bio
                  const validation = validateBio(value);
                  setValidationErrors(prev => ({
                    ...prev,
                    bio: validation.isValid ? '' : validation.error || ''
                  }));
                }}
                placeholder="Fortell litt om deg selv..."
                rows={3}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.bio}</p>
              )}
            </div>
          </div>

          {/* Contact Information - Only for Makers */}
          {profileData.role === 'maker' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Kontaktinformasjon</h3>
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
                  onChange={e => {
                    const value = e.target.value;
                    setContactInfo(prev => ({
                      ...prev,
                      email: value
                    }));
                    
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
                  onChange={e => {
                    const value = e.target.value;
                    setContactInfo(prev => ({
                      ...prev,
                      phone: value
                    }));
                    
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
                  onChange={e => setContactInfo(prev => ({
                    ...prev,
                    website: e.target.value
                  }))}
                  placeholder="https://dinside.no"
                />
              </div>
            </div>
          </div>
          )}

          

          

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
                    setProfileData(prev => ({
                      ...prev,
                      is_address_public: checked
                    }));
                    // If making address private, also disable map visibility
                    if (!checked) {
                      updateProfileSettings({ show_on_map: false });
                    }
                  }}
                  disabled={loading}
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
          <Button 
            onClick={handleChangePassword} 
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full md:w-auto"
          >
            <Key className="h-4 w-4 mr-2" />
            {loading ? 'Oppdaterer...' : 'Endre passord'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Kontohandlinger
          </CardTitle>
          <CardDescription>
            Administrer din konto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logg ut
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett bruker
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denne handlingen kan ikke angres. Dette vil permanent slette din bruker og alle tilhørende data inkludert profil, konsepter, bookinger og arrangementer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <Label htmlFor="delete-confirm">
                  Skriv 'SLETT' for å bekrefte:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="SLETT"
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
    </div>;
};