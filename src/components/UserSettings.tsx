import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Bell, Globe, Shield, Camera, Save, Phone, Mail } from 'lucide-react';
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
  const [profileData, setProfileData] = useState<UserProfile>(profile);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    website: ''
  });
  const {
    toast
  } = useToast();

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
              <Input id="display-name" value={profileData.display_name} onChange={e => setProfileData(prev => ({
              ...prev,
              display_name: e.target.value
            }))} />
            </div>
            
          </div>

          

          

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      

      {/* Language & Notifications */}
      
    </div>;
};