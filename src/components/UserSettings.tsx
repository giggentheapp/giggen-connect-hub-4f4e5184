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
import { User, Bell, Globe, Shield, Camera, Save, Phone, Mail, LogOut, Key, Trash2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';

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
  const { t } = useAppTranslation();
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
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    spotify: '',
    soundcloud: '',
    tiktok: '',
    website: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
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
          setProfileData(currentProfile as UserProfile);

        // Parse contact_info if it exists
        if (currentProfile.contact_info && typeof currentProfile.contact_info === 'object') {
          const info = currentProfile.contact_info as any;
          setContactInfo({
            phone: info.phone || '',
            email: info.email || ''
          });
        }

        // Parse social_media_links if it exists
        if (currentProfile.social_media_links && typeof currentProfile.social_media_links === 'object') {
          const social = currentProfile.social_media_links as any;
          setSocialLinks({
            instagram: social.instagram || '',
            facebook: social.facebook || '',
            youtube: social.youtube || '',
            spotify: social.spotify || '',
            soundcloud: social.soundcloud || '',
            tiktok: social.tiktok || '',
            website: social.website || ''
          });
        }
      }

      // Fetch profile settings for artists
      if (profile.role === 'artist') {
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
          // Create default settings for artist if none exist
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
        .update(updates as any)
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
    if (profile.role !== 'artist' || !profileSettings) return;
    
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
    if (profile.role !== 'artist') return;
    
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

      // Prepare updates object with proper validation
      const isValidUrl = (url: string) => {
        try {
          new URL(url.startsWith('http') ? url : 'https://' + url);
          return true;
        } catch (_) {
          return false;
        }
      };

      // Validate social media URLs
      const validatedSocialLinks: Record<string, string> = {};
      for (const [key, value] of Object.entries(socialLinks)) {
        if (value.trim() && !isValidUrl(value.trim())) {
          toast({
            title: "Ugyldig URL",
            description: `Ugyldig URL for ${key}: ${value}`,
            variant: "destructive"
          });
          return;
        }
        validatedSocialLinks[key] = value.trim();
      }

      const updates: Partial<UserProfile> = {
        display_name: profileData.display_name,
        bio: profileData.bio,
        address: profileData.address,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        is_address_public: profileData.is_address_public,
        contact_info: contactInfo,
        social_media_links: validatedSocialLinks
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
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <User className="h-4 w-4 md:h-5 md:w-5" />
            {t('profileInformationSettings')}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {t('updateProfileDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-3 md:px-6 pb-3 md:pb-6">
          {/* Avatar Upload Section */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={profileData.avatar_url || undefined} />
              <AvatarFallback>
                {profileData.display_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xs md:text-sm font-medium">{t('profilePicture')}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {t('selectProfilePicture')}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAvatarCrop(true)}
                className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
              >
                <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                {t('changePicture')}
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">{t('displayName')}</Label>
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
                placeholder={t('yourName')}
              />
              {validationErrors.display_name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.display_name}</p>
              )}
            </div>

            {/* Only show bio, address, and contact info for artists */}
            {profileData.role === 'artist' && (
              <>
                <div>
                  <Label htmlFor="bio">{t('biography')}</Label>
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
                    placeholder={t('biographyPlaceholder')}
                    rows={4}
                  />
                  {validationErrors.bio && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.bio}</p>
                  )}
                </div>
                
                <div>
                  <Label>{t('location')}</Label>
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
                    placeholder={t('addressPlaceholder')}
                  />
                </div>

                {/* Contact Information - Only for Makers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{t('contactInformation')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('email')}
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
                        placeholder={t('emailPlaceholder')}
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('phoneNumber')}
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
                        placeholder={t('phoneNumberPlaceholder')}
                      />
                      {validationErrors.phone && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? t('updating') : t('saveChanges')}
          </Button>
        </CardContent>
      </Card>

      {/* Social Media Settings - Only for Artists */}
      {profileData.role === 'artist' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              {t('socialMedia')}
            </CardTitle>
            <CardDescription>
              {t('addSocialMediaProfiles')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instagram */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                {t('instagram')}
              </Label>
              <Input
                type="url"
                placeholder={t('instagramPlaceholder')}
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
              />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-blue-600">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {t('facebook')}
              </Label>
              <Input
                type="url"
                placeholder={t('facebookPlaceholder')}
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
              />
            </div>

            {/* YouTube */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-red-600">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {t('youtube')}
              </Label>
              <Input
                type="url"
                placeholder={t('youtubePlaceholder')}
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
              />
            </div>

            {/* Spotify */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Spotify
              </Label>
              <Input
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={socialLinks.spotify}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, spotify: e.target.value }))}
              />
            </div>

            {/* SoundCloud */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.104.101.104.05 0 .093-.046.101-.104l.255-2.105-.255-2.154c-.008-.054-.05-.1-.101-.1zm1.33.075c-.058 0-.106.053-.113.12L2.04 14.479l.35 2.047c.007.067.055.12.113.12.057 0 .105-.053.112-.12L3.025 14.479l-.41-2.059c-.007-.067-.055-.12-.112-.12zm1.286.107c-.064 0-.116.058-.123.13l-.296 1.877.296 2.013c.007.072.059.131.123.131.063 0 .116-.059.123-.131l.32-2.013-.32-1.877c-.007-.072-.06-.13-.123-.13zm1.27.15c-.069 0-.125.062-.132.139l-.265 1.698.265 1.989c.007.077.063.139.132.139.068 0 .124-.062.131-.139L5.458 14.757l-.265-1.698c-.007-.077-.063-.139-.131-.139zm1.247.2c-.074 0-.134.066-.141.148l-.234 1.548.234 1.967c.007.082.067.148.141.148.073 0 .133-.066.14-.148L6.457 14.757l-.234-1.548c-.007-.082-.067-.148-.14-.148zm1.24.26c-.079 0-.143.071-.15.159l-.204 1.289.204 1.947c.007.088.071.159.15.159.078 0 .142-.071.149-.159L7.697 14.757l-.204-1.289c-.007-.088-.071-.159-.149-.159zm1.225.31c-.083 0-.15.075-.157.169l-.175 1.038.175 1.927c.007.094.074.169.157.169.082 0 .149-.075.156-.169L8.922 14.757l-.175-1.038c-.007-.094-.074-.169-.156-.169zm9.761-2.094c-.837 0-1.516.679-1.516 1.516 0 .837.679 1.516 1.516 1.516.836 0 1.515-.679 1.515-1.516 0-.837-.679-1.516-1.515-1.516zm-1.616 2.68c-.088 0-.159.08-.166.179l-.155.959.155 1.906c.007.099.078.179.166.179.087 0 .158-.08.165-.179L16.8 14.757l-.155-.959c-.007-.099-.078-.179-.165-.179zm-1.203-.395c-.093 0-.168.084-.175.188l-.135.766.135 1.88c.007.104.082.188.175.188.092 0 .167-.084.174-.188L15.597 14.757l-.135-.766c-.007-.104-.082-.188-.174-.188zm-1.184-.419c-.097 0-.175.088-.182.197l-.115.588.115 1.854c.007.109.085.197.182.197.096 0 .174-.088.181-.197L14.413 14.757l-.115-.588c-.007-.109-.085-.197-.181-.197zm-1.166-.435c-.101 0-.182.092-.189.207l-.095.416.095 1.828c.007.115.088.207.189.207.1 0 .181-.092.188-.207L13.229 14.757l-.095-.416c-.007-.115-.088-.207-.188-.207zm-1.149-.451c-.105 0-.189.096-.196.217l-.075.25.075 1.802c.007.121.091.217.196.217.104 0 .188-.096.195-.217L12.08 14.757l-.075-.25c-.007-.121-.091-.217-.195-.217zm-1.131-.467c-.109 0-.196.1-.203.227l-.055.09.055 1.776c.007.127.094.227.203.227.108 0 .195-.1.202-.227L10.931 14.757l-.055-.09c-.007-.127-.094-.227-.202-.227z"/>
                </svg>
                SoundCloud
              </Label>
              <Input
                type="url"
                placeholder="https://soundcloud.com/yourprofile"
                value={socialLinks.soundcloud}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, soundcloud: e.target.value }))}
              />
            </div>

            {/* TikTok */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </Label>
              <Input
                type="url"
                placeholder="https://tiktok.com/@yourhandle"
                value={socialLinks.tiktok}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="currentColor" d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12S0 18.623 0 12 5.377 0 12 0zm0 2.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S17.302 2.4 12 2.4zm6.617 2.995a7.26 7.26 0 0 1 1.564 4.486c-.298-.05-.654-.091-1.051-.122-.12-1.518-.44-2.953-.923-4.187.133-.067.273-.128.41-.177zm-13.234 0c.137.049.277.11.41.177-.482 1.234-.804 2.669-.923 4.187-.397.031-.753.072-1.051.122A7.26 7.26 0 0 1 5.383 5.395zM12 4.8c.508 0 1.021.457 1.449 1.342.35.725.627 1.592.818 2.577a25.778 25.778 0 0 0-4.534 0c.191-.985.468-1.852.818-2.577C10.979 5.257 11.492 4.8 12 4.8zm-2.386.901c-.315.709-.563 1.507-.736 2.384a23.9 23.9 0 0 0-3.299.397c.465-1.089 1.180-2.063 2.101-2.876.625.03 1.25.063 1.934.095zm4.772 0c.684-.032 1.309-.065 1.934-.095.921.813 1.636 1.787 2.101 2.876a23.9 23.9 0 0 0-3.299-.397c-.173-.877-.421-1.675-.736-2.384zM12 9.6c.86 0 1.555 1.075 1.555 2.4S12.86 14.4 12 14.4 10.445 13.325 10.445 12 11.14 9.6 12 9.6z"/>
                </svg>
                Nettside
              </Label>
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={socialLinks.website}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <Button onClick={handleProfileSubmit} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? t('savingSocialMedia') : t('saveSocialMedia')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Consolidated Privacy Settings for Artists */}
      {profileData.role === 'artist' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('visibilityAndPrivacy')}
            </CardTitle>
            <CardDescription>
              {t('controlWhoSees')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master Profile Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t('publicProfile')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('makeProfileVisible')}
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
                    <h4 className="text-sm font-medium text-foreground">{t('profileContent')}</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <Label>{t('biographyDescription')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('showBiographyToAll')}
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
                         <Label>{t('portfolioWork')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('showWorkExamples')}
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
                         <Label>{t('eventsAndConcerts')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('showUpcomingEvents')}
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
                        <Label>{t('technicalSpecifications')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('shareTechRequirements')}
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
                    <h4 className="text-sm font-medium text-foreground">{t('locationAndContact')}</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <Label>{t('showOnMap')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('showLocationOnMap')}
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
                         <Label>{t('publicAddress')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('makeAddressVisible')}
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
                         <Label>{t('contactInfoTitle')}</Label>
                         <p className="text-sm text-muted-foreground">
                           {t('shareContactInfo')}
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
                         <p className="font-medium mb-1">{t('securityFirst')}</p>
                         <p>{t('sensitiveInfoNote')}</p>
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
            {t('changePassword')}
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
            {loading ? t('updating') : t('changePassword')}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            {t('logOut')}
          </CardTitle>
          <CardDescription>
            {t('signOutOfAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} disabled={loading} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? t('loggingOut') : t('logOut')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t('deleteAccount')}
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
                {t('deleteAccount')}
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

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={showAvatarCrop}
        onClose={() => setShowAvatarCrop(false)}
        onAvatarUpdate={(avatarUrl) => {
          setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
          onProfileUpdate?.({ ...profileData, avatar_url: avatarUrl });
        }}
        currentAvatarUrl={profileData.avatar_url}
        userId={profile.user_id}
      />
    </div>
  );
};
