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
    email: ''
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
            email: info.email || ''
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

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: 'Logget ut',
        description: 'Du har blitt logget ut av kontoen din'
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Feil ved utlogging',
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
            </div>
          </div>

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
        </CardContent>
      </Card>

      {/* Consolidated Privacy Settings for Makers */}
      {profileData.role === 'maker' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Synlighet og personvern
            </CardTitle>
            <CardDescription>
              Kontroller hvem som kan se hvilken informasjon fra profilen din
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master Profile Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Offentlig profil</Label>
                  <p className="text-sm text-muted-foreground">
                    Gjør profilen din synlig for andre på plattformen
                  </p>
                </div>
                <Switch
                  checked={privacySettings.show_profile_to_goers || false}
                  onCheckedChange={(checked) => {
                    updatePrivacySettings({ show_profile_to_goers: checked });
                    if (!checked) {
                      // If disabling public profile, also disable dependent settings
                      updatePrivacySettings({ 
                        show_portfolio_to_goers: false,
                        show_events_to_goers: false 
                      });
                      updateProfileSettings({
                        show_about: false,
                        show_portfolio: false,
                        show_events: false,
                        show_on_map: false
                      });
                    }
                  }}
                  disabled={loading}
                />
              </div>

              {/* Profile Content Settings - Only shown if public profile is enabled */}
              {privacySettings.show_profile_to_goers && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Profilinnhold</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Biografi og beskrivelse</Label>
                        <p className="text-sm text-muted-foreground">
                          Vis din biografi for alle brukere
                        </p>
                      </div>
                      <Switch
                        checked={profileSettings?.show_about || false}
                        onCheckedChange={(checked) => updateProfileSettings({ show_about: checked })}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Portefølje og arbeider</Label>
                        <p className="text-sm text-muted-foreground">
                          La andre se eksempler på ditt arbeid
                        </p>
                      </div>
                      <Switch
                        checked={(profileSettings?.show_portfolio || false) && (privacySettings.show_portfolio_to_goers || false)}
                        onCheckedChange={(checked) => {
                          updateProfileSettings({ show_portfolio: checked });
                          updatePrivacySettings({ show_portfolio_to_goers: checked });
                        }}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Arrangementer og konserter</Label>
                        <p className="text-sm text-muted-foreground">
                          Vis dine kommende arrangementer
                        </p>
                      </div>
                      <Switch
                        checked={(profileSettings?.show_events || false) && (privacySettings.show_events_to_goers || false)}
                        onCheckedChange={(checked) => {
                          updateProfileSettings({ show_events: checked });
                          updatePrivacySettings({ show_events_to_goers: checked });
                        }}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Tekniske spesifikasjoner</Label>
                        <p className="text-sm text-muted-foreground">
                          Del tekniske krav og utstyrsbehov
                        </p>
                      </div>
                      <Switch
                        checked={profileSettings?.show_techspec || false}
                        onCheckedChange={(checked) => updateProfileSettings({ show_techspec: checked })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Lokasjon og kontakt</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Vis på kart</Label>
                        <p className="text-sm text-muted-foreground">
                          Vis din lokasjon på kartet (krever offentlig adresse)
                        </p>
                      </div>
                      <Switch
                        checked={(profileSettings?.show_on_map || false) && (profileData.is_address_public || false)}
                        onCheckedChange={(checked) => {
                          updateProfileSettings({ show_on_map: checked });
                          if (checked && !profileData.is_address_public) {
                            setProfileData(prev => ({ ...prev, is_address_public: true }));
                          }
                        }}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Offentlig adresse</Label>
                        <p className="text-sm text-muted-foreground">
                          Gjør adressen din synlig for andre brukere
                        </p>
                      </div>
                      <Switch
                        checked={profileData.is_address_public || false}
                        onCheckedChange={(checked) => {
                          setProfileData(prev => ({ ...prev, is_address_public: checked }));
                          if (!checked) {
                            updateProfileSettings({ show_on_map: false });
                          }
                        }}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Kontaktinformasjon</Label>
                        <p className="text-sm text-muted-foreground">
                          Del kontaktinfo med andre brukere (kun i bookinger)
                        </p>
                      </div>
                      <Switch
                        checked={profileSettings?.show_contact || false}
                        onCheckedChange={(checked) => updateProfileSettings({ show_contact: checked })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Sikkerhet først</p>
                        <p>Sensitive opplysninger som priser og personlige meldinger deles kun i godkjente bookinger.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
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

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Logg ut
          </CardTitle>
          <CardDescription>
            Logg ut av kontoen din og returner til startsiden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} disabled={loading} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? 'Logger ut...' : 'Logg ut'}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
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
