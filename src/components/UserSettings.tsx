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
import { User, Bell, Globe, Shield, Camera, Save, Phone, Mail, LogOut, Key, Trash2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { UserProfile } from "@/types/auth";

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
    website: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
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
        .from("profiles")
        .select("*")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (currentProfile) {
        setProfileData(currentProfile as unknown as UserProfile);

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
            website: social.website || "",
          });
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

      // Call the database function to delete all user data including storage files
      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_uuid: profile.user_id
      });

      if (deleteError) throw deleteError;

      toast({
        title: "Bruker slettet",
        description: "Din konto og alle tilknyttede data har blitt permanent slettet",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Feil ved sletting",
        description: error.message || "Kunne ikke slette brukeren",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <Button variant="outline" size="sm" onClick={() => setShowAvatarCrop(true)} className="h-8 text-xs">
                <Camera className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                {t("changePicture")}
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

      {/* Social Media Settings - For All Users */}
      <>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">{t("socialMedia")}</h2>
            <p className="text-sm text-muted-foreground">Legg til dine sosiale medier</p>
          </div>

          <div className="space-y-3">
            {/* Instagram */}
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary">
                  <path
                    fill="currentColor"
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                  />
                </svg>
                {t("instagram")}
              </Label>
              <Input
                type="url"
                placeholder={t("instagramPlaceholder")}
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))}
              />
            </div>

            {/* Facebook */}
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary">
                  <path
                    fill="currentColor"
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                {t("facebook")}
              </Label>
              <Input
                type="url"
                placeholder={t("facebookPlaceholder")}
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, facebook: e.target.value }))}
              />
            </div>

            {/* YouTube */}
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary">
                  <path
                    fill="currentColor"
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                  />
                </svg>
                {t("youtube")}
              </Label>
              <Input
                type="url"
                placeholder={t("youtubePlaceholder")}
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, youtube: e.target.value }))}
              />
            </div>

            {/* Spotify */}
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary">
                  <path
                    fill="currentColor"
                    d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
                  />
                </svg>
                Spotify
              </Label>
              <Input
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={socialLinks.spotify}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, spotify: e.target.value }))}
              />
            </div>

            {/* Website */}
            <div>
              <Label className="flex items-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary">
                  <path
                    fill="currentColor"
                    d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12S0 18.623 0 12 5.377 0 12 0zm0 2.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S17.302 2.4 12 2.4zm6.617 2.995a7.26 7.26 0 0 1 1.564 4.486c-.298-.05-.654-.091-1.051-.122-.12-1.518-.44-2.953-.923-4.187.133-.067.273-.128.41-.177zm-13.234 0c.137.049.277.11.41.177-.482 1.234-.804 2.669-.923 4.187-.397.031-.753.072-1.051.122A7.26 7.26 0 0 1 5.383 5.395zM12 4.8c.508 0 1.021.457 1.449 1.342.35.725.627 1.592.818 2.577a25.778 25.778 0 0 0-4.534 0c.191-.985.468-1.852.818-2.577C10.979 5.257 11.492 4.8 12 4.8zm-2.386.901c-.315.709-.563 1.507-.736 2.384a23.9 23.9 0 0 0-3.299.397c.465-1.089 1.180-2.063 2.101-2.876.625.03 1.25.063 1.934.095zm4.772 0c.684-.032 1.309-.065 1.934-.095.921.813 1.636 1.787 2.101 2.876a23.9 23.9 0 0 0-3.299-.397c-.173-.877-.421-1.675-.736-2.384zM12 9.6c.86 0 1.555 1.075 1.555 2.4S12.86 14.4 12 14.4 10.445 13.325 10.445 12 11.14 9.6 12 9.6z"
                  />
                </svg>
                Nettside
              </Label>
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={socialLinks.website}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {loading ? t("savingSocialMedia") : t("saveSocialMedia")}
            </Button>
          </div>
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
              checked={profileSettings?.show_public_profile || false}
              onCheckedChange={(checked) => updateProfileSettings({ show_public_profile: checked })}
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
        isOpen={showAvatarCrop}
        onClose={() => setShowAvatarCrop(false)}
        onAvatarUpdate={(avatarUrl) => {
          const updatedProfile = { ...profileData, avatar_url: avatarUrl };
          setProfileData(updatedProfile);
          onProfileUpdate?.(updatedProfile);
          setShowAvatarCrop(false);
        }}
        currentAvatarUrl={profileData.avatar_url}
        userId={profileData.user_id}
      />
    </div>
  );
};
