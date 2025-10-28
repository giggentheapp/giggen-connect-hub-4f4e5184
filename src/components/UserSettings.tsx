import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { validateDisplayName, validateEmail, validatePhone, validateBio } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { User, Bell, Globe, Shield, Camera, Save, Phone, Mail, LogOut, Key, Trash2, Share2, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { UserProfile } from "@/types/auth";
import { FilebankSelectionModal } from "@/components/FilebankSelectionModal";
import { SocialMusicLinksManager } from "@/components/SocialMusicLinksManager";
import { InstrumentManager } from "@/components/InstrumentManager";

interface ProfileSettings {
  show_public_profile: boolean;
  show_on_map: boolean;
  show_contact: boolean;
  notifications_booking_requests?: boolean;
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

export const UserSettings = ({ profile, onProfileUpdate }: UserSettingsProps) => {
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
    phone: "",
    email: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    youtube: "",
    spotify: "",
    soundcloud: "",
    tiktok: "",
    twitter: "",
    website: "",
    appleMusic: "",
    bandcamp: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [instruments, setInstruments] = useState<Array<{ instrument: string; details: string }>>([]);
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
        .from("profiles")
        .select("*")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (currentProfile) {
        setProfileData(currentProfile as unknown as UserProfile);
        setNewUsername(currentProfile.username || '');

        // Parse contact_info if it exists
        if (currentProfile.contact_info && typeof currentProfile.contact_info === "object") {
          const info = currentProfile.contact_info as any;
          setContactInfo({
            phone: info.phone || "",
            email: info.email || "",
          });
        }

        // Parse social_media_links if it exists
        if (currentProfile.social_media_links && typeof currentProfile.social_media_links === "object") {
          const social = currentProfile.social_media_links as any;
          setSocialLinks({
            instagram: social.instagram || "",
            facebook: social.facebook || "",
            youtube: social.youtube || "",
            spotify: social.spotify || "",
            soundcloud: social.soundcloud || "",
            tiktok: social.tiktok || "",
            twitter: social.twitter || "",
            website: social.website || "",
            appleMusic: social.appleMusic || "",
            bandcamp: social.bandcamp || "",
          });
        }

        // Parse instruments if it exists (for musicians)
        if (currentProfile.instruments && Array.isArray(currentProfile.instruments)) {
          setInstruments(currentProfile.instruments as Array<{ instrument: string; details: string }>);
        }
      }

      // Fetch profile settings for all users
      if (["musician", "organizer"].includes(profile.role)) {
        const { data: settings, error: settingsError } = await supabase
          .from("profile_settings")
          .select("*")
          .eq("maker_id", profile.user_id)
          .maybeSingle();

        if (settingsError && settingsError.code !== "PGRST116") {
          throw settingsError;
        }

        if (settings) {
          setProfileSettings(settings);
        } else {
          // Create default settings for artist if none exist
          const defaultSettings = {
            show_public_profile: false,
            show_on_map: false,
            show_contact: false,
          };
          setProfileSettings(defaultSettings);
        }

        // Fetch privacy settings for goers
        const { data: privacyData, error: privacyError } = await supabase
          .from("profiles")
          .select("privacy_settings")
          .eq("user_id", profile.user_id)
          .maybeSingle();

        if (privacyError && privacyError.code !== "PGRST116") {
          throw privacyError;
        }

        if (privacyData?.privacy_settings && typeof privacyData.privacy_settings === "object") {
          setPrivacySettings((prev) => ({ ...prev, ...(privacyData.privacy_settings as PrivacySettings) }));
        }
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Feil ved lasting av innstillinger",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      const updatedProfile = { ...profileData, ...updates };
      setProfileData(updatedProfile);
      onProfileUpdate?.(updatedProfile);

      toast({
        title: "Lagret!",
        description: "Profilinnstillingene ble oppdatert",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfileSettings = async (updates: Partial<ProfileSettings>) => {
    if (!["musician", "organizer"].includes(profile.role) || !profileSettings) return;

    try {
      setLoading(true);
      const newSettings = { ...profileSettings, ...updates };

      const { error } = await supabase.from("profile_settings").upsert({
        maker_id: profile.user_id,
        ...newSettings,
      });

      if (error) throw error;

      setProfileSettings(newSettings);
      toast({
        title: "Lagret!",
        description: "Synlighetsinnstillingene ble oppdatert",
      });
    } catch (error: any) {
      console.error("Error updating profile settings:", error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    if (!["musician", "organizer"].includes(profile.role)) return;

    try {
      setLoading(true);
      const newSettings = { ...privacySettings, ...updates };

      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: newSettings as any })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setPrivacySettings(newSettings);
      toast({
        title: "Lagret!",
        description: "Personverninnstillinger lagret",
      });
    } catch (error: any) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
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
    const bioValidation = validateBio(profileData.bio || "");

    const errors: Record<string, string> = {};
    if (!displayNameValidation.isValid) errors.display_name = displayNameValidation.error || "";
    if (!emailValidation.isValid) errors.email = emailValidation.error || "";
    if (!phoneValidation.isValid) errors.phone = phoneValidation.error || "";
    if (!bioValidation.isValid) errors.bio = bioValidation.error || "";

    setValidationErrors(errors);

    // Don't submit if there are validation errors
    if (Object.keys(errors).some((key) => errors[key])) {
      toast({
        title: "Valideringsfeil",
        description: "Vennligst rett opp feilene før du lagrer",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare updates object with proper validation
      const isValidUrl = (url: string) => {
        try {
          new URL(url.startsWith("http") ? url : "https://" + url);
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
            variant: "destructive",
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
        social_media_links: validatedSocialLinks,
        ...(profileData.role === 'musician' && { instruments }),
      };

      // Update profile
      await updateProfile(updates);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passordene matcher ikke",
        description: "Kontroller at begge passordene er identiske",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Passordet er for kort",
        description: "Passordet må være minst 6 tegn langt",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Passord oppdatert",
        description: "Ditt passord har blitt endret",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Feil ved passordendring",
        description: error.message,
        variant: "destructive",
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
        title: "Logget ut",
        description: "Du har blitt logget ut av kontoen din",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameError("Minimum 3 tegn");
      setUsernameAvailable(null);
      return;
    }

    if (value === profileData.username) {
      setUsernameAvailable(true);
      setUsernameError("");
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await supabase.functions.invoke('validate-username', {
        body: { username: value }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setUsernameAvailable(data.available);
      setUsernameError(data.error || "");
    } catch (error: any) {
      setUsernameError("Kunne ikke sjekke tilgjengelighet");
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!usernameAvailable) {
      toast({
        title: "Ugyldig brukernavn",
        description: usernameError || "Brukernavnet er ikke tilgjengelig",
        variant: "destructive",
      });
      return;
    }

    setChangingUsername(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: newUsername.toLowerCase(),
          username_changed: true
        })
        .eq("user_id", profile.user_id)
        .select();

      if (error) throw error;

      const updatedProfile = { ...profileData, username: newUsername.toLowerCase(), username_changed: true };
      setProfileData(updatedProfile);
      onProfileUpdate?.(updatedProfile);

      toast({
        title: "Brukernavn oppdatert",
        description: `Ditt brukernavn er nå @${newUsername.toLowerCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Feil ved endring av brukernavn",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingUsername(false);
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmation !== "SLETT") {
      toast({
        title: "Ugyldig bekreftelse",
        description: "Du må skrive SLETT for å bekrefte slettingen",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Du må være innlogget for å slette kontoen din');
      }

      const { error: authDeleteError } = await supabase.rpc('delete_auth_user');
      
      if (authDeleteError) {
        throw new Error('Kunne ikke slette brukerkonto');
      }

      toast({
        title: "Bruker slettet",
        description: "Din konto og alle tilknyttede data har blitt permanent slettet",
      });

      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message || "Kunne ikke slette brukeren",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileSelect = async (file: any) => {
    try {
      // Get public URL of the selected file
      const publicUrl = supabase.storage.from('filbank').getPublicUrl(file.file_path).data.publicUrl;
      
      // Set the image and open crop modal
      setSelectedImageForCrop(publicUrl);
      setShowFilebankModal(false);
      setShowAvatarCrop(true);
      
    } catch (error: any) {
      console.error('Error selecting file:', error);
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-8">
      {/* Profile Information */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{t("profileInformationSettings")}</h2>
          <p className="text-sm text-muted-foreground">Oppdater dine profildetaljer</p>
        </div>

        <div className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0">
              <AvatarImage src={profileData.avatar_url || undefined} />
              <AvatarFallback className="text-lg md:text-xl">
                {profileData.display_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium mb-1">{t("profilePicture")}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowFilebankModal(true)} className="h-8 text-xs">
                <FolderOpen className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Velg fra Filbank
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">{t("displayName")}</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfileData((prev) => ({ ...prev, display_name: value }));

                  const validation = validateDisplayName(value);
                  setValidationErrors((prev) => ({
                    ...prev,
                    display_name: validation.isValid ? "" : validation.error || "",
                  }));
                }}
                placeholder={t("yourName")}
              />
              {validationErrors.display_name && (
                <p className="text-sm text-destructive mt-1">{validationErrors.display_name}</p>
              )}
            </div>

            {/* Username Section */}
            <div className="space-y-3">
              <Label htmlFor="username">Brukernavn</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      setNewUsername(value);
                      if (value.length >= 3 && value !== profileData.username) {
                        checkUsername(value);
                      } else {
                        setUsernameAvailable(value === profileData.username ? true : null);
                        setUsernameError(value.length > 0 && value.length < 3 ? "Minimum 3 tegn" : "");
                      }
                    }}
                    placeholder="@brukernavn"
                    className="pr-10"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleChangeUsername}
                  disabled={changingUsername || !usernameAvailable || newUsername === profileData.username}
                  size="sm"
                >
                  {changingUsername ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              {usernameAvailable === true && !checkingUsername && newUsername !== profileData.username && (
                <p className="text-sm text-green-600">✓ Tilgjengelig</p>
              )}
              {usernameAvailable === false && !usernameError && !checkingUsername && (
                <p className="text-sm text-destructive">✗ Opptatt</p>
              )}
              <p className="text-xs text-muted-foreground">
                {(profileData as any).username_changed 
                  ? "Du har endret brukernavnet ditt" 
                  : "Originalt brukernavn (autogenerert)"}
              </p>
            </div>

            {/* Bio, address, and contact info for all users */}
            <>
              <>
                <div>
                  <Label htmlFor="bio">{t("biography")}</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfileData((prev) => ({ ...prev, bio: value }));

                      const validation = validateBio(value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        bio: validation.isValid ? "" : validation.error || "",
                      }));
                    }}
                    placeholder={t("biographyPlaceholder")}
                    rows={4}
                  />
                  {validationErrors.bio && <p className="text-sm text-destructive mt-1">{validationErrors.bio}</p>}
                </div>

                <div>
                  <Label>{t("location")}</Label>
                  <AddressAutocomplete
                    value={profileData.address || ""}
                    onChange={(address, coordinates) => {
                      setProfileData((prev) => ({
                        ...prev,
                        address: address,
                        latitude: coordinates?.lat || null,
                        longitude: coordinates?.lng || null,
                      }));
                    }}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">{t("contactInformation")}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3" />
                        {t("email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) => ({ ...prev, email: value }));

                          const validation = validateEmail(value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            email: validation.isValid ? "" : validation.error || "",
                          }));
                        }}
                        placeholder={t("emailPlaceholder")}
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3" />
                        {t("phoneNumber")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) => ({ ...prev, phone: value }));

                          const validation = validatePhone(value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            phone: validation.isValid ? "" : validation.error || "",
                          }));
                        }}
                        placeholder={t("phoneNumberPlaceholder")}
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            </>
          </div>

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? t("updating") : t("saveChanges")}
          </Button>
        </div>
      </div>

      {/* Instruments Section - Only for Musicians */}
      {profileData.role === 'musician' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Instrumenter & Roller</h2>
            <p className="text-sm text-muted-foreground">Legg til dine instrumenter og roller med detaljer</p>
          </div>

          <InstrumentManager
            instruments={instruments}
            onChange={setInstruments}
          />

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </div>
      )}

      {/* Social Media Settings - For All Users */}
      <>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Sosiale medier</h2>
            <p className="text-sm text-muted-foreground">Administrer dine sosiale medier</p>
          </div>

          <SocialMusicLinksManager
            title="Sosiale medier"
            platforms={[
              {
                id: "instagram",
                name: "Instagram",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                  </svg>
                ),
                placeholder: "https://instagram.com/...",
              },
              {
                id: "facebook",
                name: "Facebook",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                ),
                placeholder: "https://facebook.com/...",
              },
              {
                id: "tiktok",
                name: "TikTok",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                    />
                  </svg>
                ),
                placeholder: "https://www.tiktok.com/@...",
              },
              {
                id: "youtube",
                name: "YouTube",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    />
                  </svg>
                ),
                placeholder: "https://youtube.com/@...",
              },
              {
                id: "twitter",
                name: "X (Twitter)",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                ),
                placeholder: "https://twitter.com/...",
              },
              {
                id: "website",
                name: "Nettside",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path
                      fill="currentColor"
                      d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12S0 18.623 0 12 5.377 0 12 0zm0 2.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S17.302 2.4 12 2.4zm6.617 2.995a7.26 7.26 0 0 1 1.564 4.486c-.298-.05-.654-.091-1.051-.122-.12-1.518-.44-2.953-.923-4.187.133-.067.273-.128.41-.177zm-13.234 0c.137.049.277.11.41.177-.482 1.234-.804 2.669-.923 4.187-.397.031-.753.072-1.051.122A7.26 7.26 0 0 1 5.383 5.395zM12 4.8c.508 0 1.021.457 1.449 1.342.35.725.627 1.592.818 2.577a25.778 25.778 0 0 0-4.534 0c.191-.985.468-1.852.818-2.577C10.979 5.257 11.492 4.8 12 4.8zm-2.386.901c-.315.709-.563 1.507-.736 2.384a23.9 23.9 0 0 0-3.299.397c.465-1.089 1.180-2.063 2.101-2.876.625.03 1.25.063 1.934.095zm4.772 0c.684-.032 1.309-.065 1.934-.095.921.813 1.636 1.787 2.101 2.876a23.9 23.9 0 0 0-3.299-.397c-.173-.877-.421-1.675-.736-2.384zM12 9.6c.86 0 1.555 1.075 1.555 2.4S12.86 14.4 12 14.4 10.445 13.325 10.445 12 11.14 9.6 12 9.6z"
                    />
                  </svg>
                ),
                placeholder: "https://yourwebsite.com",
              },
            ]}
            links={{
              instagram: socialLinks.instagram,
              facebook: socialLinks.facebook,
              tiktok: socialLinks.tiktok,
              youtube: socialLinks.youtube,
              twitter: socialLinks.twitter || "",
              website: socialLinks.website,
            }}
            onChange={(updatedLinks) => {
              setSocialLinks((prev) => ({
                ...prev,
                instagram: updatedLinks.instagram || "",
                facebook: updatedLinks.facebook || "",
                tiktok: updatedLinks.tiktok || "",
                youtube: updatedLinks.youtube || "",
                twitter: updatedLinks.twitter || "",
                website: updatedLinks.website || "",
              }));
            }}
          />

          <div className="pt-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Musikkplattformer</h2>
            <p className="text-sm text-muted-foreground mb-4">Legg til lenker til din musikk</p>

            <SocialMusicLinksManager
              title="Musikklenker"
              platforms={[
                {
                  id: "spotify",
                  name: "Spotify",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path
                        fill="currentColor"
                        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
                      />
                    </svg>
                  ),
                  placeholder: "https://open.spotify.com/artist/...",
                },
                {
                  id: "soundcloud",
                  name: "SoundCloud",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path
                        fill="currentColor"
                        d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.05 0-.09.04-.099.099l-.178 1.327.178 1.303c.009.058.049.099.099.099.05 0 .09-.04.099-.099l.196-1.303-.196-1.327c-.009-.059-.05-.099-.099-.099m1.778-.899c-.06 0-.106.046-.114.106L1.72 13.58l.22 2.303c.008.06.053.106.114.106.061 0 .106-.046.114-.106l.241-2.303-.241-2.32c-.008-.06-.053-.106-.114-.106m.899-.44c-.064 0-.115.05-.124.116l-.207 2.76.207 2.672c.009.066.06.115.124.115.064 0 .115-.05.124-.115l.23-2.672-.23-2.76c-.009-.066-.06-.115-.124-.115m.899-.501c-.069 0-.124.055-.133.125l-.182 3.2.182 3.105c.009.07.064.125.133.125.07 0 .125-.055.134-.125l.202-3.105-.202-3.2c-.009-.07-.064-.125-.134-.125m.899-.424c-.075 0-.136.06-.145.137l-.153 3.625.153 3.512c.009.077.07.137.145.137.074 0 .135-.06.145-.137l.17-3.512-.17-3.625c-.01-.077-.071-.137-.145-.137m.899-.318c-.08 0-.144.063-.153.144l-.134 3.943.134 3.791c.009.08.073.144.153.144.08 0 .145-.064.154-.144l.149-3.791-.149-3.943c-.009-.081-.074-.144-.154-.144m.899-.248c-.085 0-.154.068-.163.156l-.115 4.191.115 4.07c.009.088.078.156.163.156.086 0 .155-.068.164-.156l.128-4.07-.128-4.191c-.009-.088-.078-.156-.164-.156m.902-.105c-.09 0-.163.073-.172.165l-.097 4.296.097 4.349c.009.092.082.164.172.164.09 0 .163-.072.172-.164l.106-4.349-.106-4.296c-.009-.092-.082-.165-.172-.165m.901.001c-.096 0-.173.078-.182.177l-.078 4.295.078 4.629c.009.099.086.177.182.177.095 0 .172-.078.181-.177l.089-4.629-.089-4.295c-.009-.099-.086-.177-.181-.177m.896.098c-.1 0-.181.081-.19.183l-.059 4.197.059 4.908c.009.102.09.184.19.184.1 0 .181-.082.19-.184l.067-4.908-.067-4.197c-.009-.102-.09-.183-.19-.183m.9.183c-.105 0-.19.086-.2.192l-.04 4.015.04 5.138c.01.105.095.191.2.191.104 0 .19-.086.199-.191l.048-5.138-.048-4.015c-.009-.105-.095-.192-.199-.192m.899.281c-.11 0-.199.09-.209.202l-.02 3.734.02 5.304c.01.112.099.202.209.202.11 0 .199-.09.209-.202l.029-5.304-.029-3.734c-.01-.112-.099-.202-.209-.202m.898.365c-.115 0-.209.095-.218.212v.001l-.001 3.369.001 5.469c.009.117.103.211.218.211.115 0 .209-.095.218-.211l.011-5.469-.011-3.37c-.009-.117-.103-.212-.218-.212m.899.466c-.12 0-.218.099-.227.221l.001 2.903v5.634c.009.122.107.221.226.221.12 0 .218-.099.227-.221v-5.634l-.001-2.903c-.009-.122-.107-.221-.226-.221m.899.568c-.125 0-.227.103-.236.231l.001 2.335v5.798c.009.128.111.232.236.232.125 0 .227-.104.236-.232v-5.798l-.001-2.335c-.009-.128-.111-.231-.236-.231m.899.685c-.13 0-.236.107-.245.241l.001 1.65v5.962c.009.134.115.241.244.241.13 0 .236-.107.245-.241v-5.962l-.001-1.65c-.009-.134-.115-.241-.244-.241m.898.786c-.135 0-.244.111-.253.253l.001.863v6.126c.009.142.118.253.252.253.135 0 .244-.111.253-.253v-6.126l-.001-.863c-.009-.142-.118-.253-.252-.253"
                      />
                    </svg>
                  ),
                  placeholder: "https://soundcloud.com/...",
                },
                {
                  id: "appleMusic",
                  name: "Apple Music",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path
                        fill="currentColor"
                        d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.258 1.466-2.795 2.787-.244.602-.383 1.23-.476 1.87-.059.41-.085.822-.124 1.233-.004.04-.01.083-.013.124v11.679c.01.152.017.303.026.455.05.841.121 1.683.36 2.48.439 1.461 1.359 2.526 2.745 3.197.85.41 1.777.599 2.73.686.327.038.656.054.985.08h12.062c.152-.01.303-.017.455-.026.841-.05 1.683-.121 2.48-.36 1.461-.439 2.526-1.359 3.197-2.745.41-.85.599-1.777.686-2.73.038-.327.054-.656.08-.985V6.142c-.003-.007-.007-.01-.01-.018zM17.732 3.005h.137c.385.015.77.027 1.155.075.495.061.976.16 1.427.398.518.273.865.694 1.05 1.243.12.355.177.723.213 1.095.03.312.051.626.051.939v12.033a9.84 9.84 0 0 1-.092 1.292c-.09.643-.254 1.26-.656 1.78-.31.4-.714.655-1.193.805a4.75 4.75 0 0 1-1.442.263c-.36.024-.722.039-1.083.039H6.261c-.38 0-.76-.013-1.14-.039-.535-.036-1.065-.104-1.57-.32-.655-.28-1.101-.772-1.357-1.422-.184-.467-.258-.96-.298-1.46-.024-.302-.043-.606-.043-.909V6.783c0-.38.013-.76.039-1.14.036-.535.104-1.065.32-1.57.28-.655.772-1.101 1.422-1.357.467-.184.96-.258 1.46-.298.302-.024.606-.043.909-.043h10.929c.152 0 .303-.001.455 0zm-5.726 12.8c0 .34-.002.68.001 1.02.003.274-.108.489-.346.618-.258.14-.532.223-.818.254-.373.04-.743.012-1.108-.073-.53-.123-1.001-.359-1.388-.764-.39-.408-.643-.893-.77-1.444-.115-.502-.147-1.01-.092-1.522.063-.586.25-1.13.609-1.61.4-.533.916-.907 1.54-1.13.424-.152.863-.246 1.318-.284.36-.03.718-.006 1.074.057.455.08.88.247 1.253.536.25.193.447.428.58.712.182.39.227.796.134 1.218-.107.48-.358.886-.751 1.206-.437.355-.956.57-1.52.67-.39.068-.781.084-1.174.03a2.997 2.997 0 0 1-1.155-.382c-.193-.119-.36-.267-.5-.445-.13-.165-.13-.165-.003-.334.14-.187.282-.373.426-.559.068-.088.134-.178.207-.26.088-.099.185-.099.292-.012.235.189.49.343.78.442.398.137.805.158 1.218.088.292-.05.57-.148.828-.293.255-.144.452-.34.577-.595.114-.234.144-.48.104-.733-.047-.29-.187-.527-.426-.697-.31-.219-.666-.337-1.038-.394-.392-.06-.787-.08-1.183-.053-.51.035-.998.14-1.465.342-.576.248-1.066.617-1.458 1.122-.383.495-.617 1.051-.711 1.667-.083.549-.06 1.095.07 1.632.158.652.457 1.235.92 1.723.39.412.853.71 1.372.924.538.22 1.098.333 1.673.378.425.033.85.026 1.273-.042.58-.093 1.133-.262 1.647-.544.373-.204.703-.464.984-.782.267-.303.473-.64.616-1.018.122-.322.19-.655.222-.995.037-.395.035-.79.035-1.185V3.417c0-.26.105-.364.366-.364h1.622c.26 0 .365.105.365.365v10.325c0 .21-.002.42.001.629.003.271-.104.489-.34.616-.258.139-.532.221-.818.252a2.88 2.88 0 0 1-1.108-.073c-.53-.123-1.001-.359-1.388-.764-.39-.408-.643-.893-.77-1.444-.115-.502-.147-1.01-.092-1.522.063-.586.25-1.13.609-1.61.4-.533.916-.907 1.54-1.13.424-.152.863-.246 1.318-.284.36-.03.718-.006 1.074.057.455.08.88.247 1.253.536.25.193.447.428.58.712.182.39.227.796.134 1.218-.107.48-.358.886-.751 1.206-.437.355-.956.57-1.52.67-.39.068-.781.084-1.174.03a2.997 2.997 0 0 1-1.155-.382c-.193-.119-.36-.267-.5-.445-.13-.165-.13-.165-.003-.334.14-.187.282-.373.426-.559.068-.088.134-.178.207-.26.088-.099.185-.099.292-.012.235.189.49.343.78.442.398.137.805.158 1.218.088.292-.05.57-.148.828-.293.255-.144.452-.34.577-.595.114-.234.144-.48.104-.733-.047-.29-.187-.527-.426-.697-.31-.219-.666-.337-1.038-.394-.392-.06-.787-.08-1.183-.053-.51.035-.998.14-1.465.342-.576.248-1.066.617-1.458 1.122-.383.495-.617 1.051-.711 1.667-.083.549-.06 1.095.07 1.632.158.652.457 1.235.92 1.723.39.412.853.71 1.372.924.538.22 1.098.333 1.673.378.425.033.85.026 1.273-.042.58-.093 1.133-.262 1.647-.544.373-.204.703-.464.984-.782.267-.303.473-.64.616-1.018.122-.322.19-.655.222-.995.037-.395.035-.79.035-1.185V3.417c0-.26.105-.364.366-.364h1.622c.26 0 .365.105.365.365v10.325z"
                      />
                    </svg>
                  ),
                  placeholder: "https://music.apple.com/...",
                },
                {
                  id: "bandcamp",
                  name: "Bandcamp",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path
                        fill="currentColor"
                        d="M0 18.75l7.437-13.5h16.563l-7.438 13.5z"
                      />
                    </svg>
                  ),
                  placeholder: "https://bandname.bandcamp.com",
                },
              ]}
              links={{
                spotify: socialLinks.spotify || "",
                soundcloud: socialLinks.soundcloud || "",
                appleMusic: socialLinks.appleMusic || "",
                bandcamp: socialLinks.bandcamp || "",
              }}
              onChange={(musicLinks) => {
                setSocialLinks((prev) => ({
                  ...prev,
                  spotify: musicLinks.spotify || "",
                  soundcloud: musicLinks.soundcloud || "",
                  appleMusic: musicLinks.appleMusic || "",
                  bandcamp: musicLinks.bandcamp || "",
                }));
              }}
            />
          </div>

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </div>
      </>

      {/* Simplified Privacy Settings for ALL USERS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Synlighetsinnstillinger</h2>
          <p className="text-sm text-muted-foreground">Kontroller hva som er synlig for andre</p>
        </div>

        <div className="space-y-3">
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex-1 pr-4">
              <Label className="text-sm font-medium cursor-pointer">Offentlig profil</Label>
              <p className="text-xs text-muted-foreground mt-1">Vis profilbilde, navn og om meg-tekst for alle</p>
            </div>
            <Switch
              checked={privacySettings.show_profile_to_goers ?? true}
              onCheckedChange={(checked) => updatePrivacySettings({ show_profile_to_goers: checked })}
              disabled={loading}
            />
          </div>

          {/* Location Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1 pr-4">
              <Label className="text-sm font-medium cursor-pointer">Lokasjon</Label>
              <p className="text-xs text-muted-foreground mt-1">Vis på kart og offentlig gjør adresse synlig</p>
            </div>
            <Switch
              checked={(profileSettings?.show_on_map || false) && (profileData.is_address_public || false)}
              onCheckedChange={async (checked) => {
                await updateProfileSettings({ show_on_map: checked });
                await updateProfile({ is_address_public: checked });
              }}
              disabled={loading}
            />
          </div>

          {/* Contact Info Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1 pr-4">
              <Label className="text-sm font-medium cursor-pointer">Kontaktinfo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tillat deling av kontaktinfo gjennom aktive bookinger
              </p>
            </div>
            <Switch
              checked={profileSettings?.show_contact || false}
              onCheckedChange={(checked) => updateProfileSettings({ show_contact: checked })}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Varslingsinnstillinger</h2>
          <p className="text-sm text-muted-foreground">Styr hvilke varsler du vil motta</p>
        </div>

        <div className="space-y-3">
          {/* Booking Request Notifications Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex-1 pr-4">
              <Label className="text-sm font-medium cursor-pointer">Booking-forespørsler</Label>
              <p className="text-xs text-muted-foreground mt-1">Få varsel når noen sender deg en bookingforespørsel</p>
            </div>
            <Switch
              checked={profileSettings?.notifications_booking_requests !== false}
              onCheckedChange={(checked) => updateProfileSettings({ notifications_booking_requests: checked })}
              disabled={loading}
            />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{t("changePassword")}</h2>
          <p className="text-sm text-muted-foreground">Oppdater ditt passord</p>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="new-password" className="text-sm">
              Nytt passord
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minst 6 tegn"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-sm">
              Bekreft passord
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Gjenta passordet"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={loading || !newPassword} className="w-full md:w-auto">
            <Key className="h-4 w-4 mr-2" />
            {loading ? t("updating") : t("changePassword")}
          </Button>
        </div>
      </div>

      {/* Logout */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{t("logOut")}</h2>
          <p className="text-sm text-muted-foreground">Logg ut av kontoen din</p>
        </div>

        <Button onClick={handleLogout} disabled={loading} variant="outline" className="w-full md:w-auto">
          <LogOut className="h-4 w-4 mr-2" />
          {loading ? t("loggingOut") : t("logOut")}
        </Button>
      </div>

      {/* Delete Account */}
      <div className="space-y-6 pt-6 border-t border-destructive/20">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-destructive mb-2">{t("deleteAccount")}</h2>
          <p className="text-sm text-muted-foreground">
            Permanent sletting av brukerdata. Denne handlingen kan ikke angres.
          </p>
        </div>

        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deleteAccount")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Er du sikker på at du vil slette kontoen din?</AlertDialogTitle>
                <AlertDialogDescription>
                  Denne handlingen kan ikke angres. All din data, inkludert profil, tilbud, og historikk vil bli
                  permanent slettet.
                  <br />
                  <br />
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
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={loading || deleteConfirmation !== "SLETT"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? "Sletter..." : "Slett bruker permanent"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        key={`user-avatar-${profileData.user_id}`}
        isOpen={showAvatarCrop}
        onClose={() => {
          setShowAvatarCrop(false);
          setSelectedImageForCrop(null);
        }}
        onAvatarUpdate={(avatarUrl) => {
          const updatedProfile = { ...profileData, avatar_url: avatarUrl };
          setProfileData(updatedProfile);
          onProfileUpdate?.(updatedProfile);
          setShowAvatarCrop(false);
          setSelectedImageForCrop(null);
        }}
        currentAvatarUrl={profileData.avatar_url}
        userId={profileData.user_id}
        initialImageUrl={selectedImageForCrop || undefined}
      />

      {/* Filebank Selection Modal */}
      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={handleAvatarFileSelect}
        userId={profileData.user_id}
        fileTypes={['image']}
        title="Velg profilbilde fra Filbank"
        description="Velg et bilde fra din filbank for å bruke som profilbilde"
      />
    </div>
  );
};
