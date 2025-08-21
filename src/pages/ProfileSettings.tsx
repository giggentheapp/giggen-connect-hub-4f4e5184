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
import FileViewerByPath from '@/components/FileViewerByPath';
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
}

interface ProfileSettings {
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
}

const ProfileSettings = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings>({
    show_about: false,
    show_contact: false,
    show_portfolio: false,
    show_techspec: false,
    show_events: false
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

  const handleSave = async () => {
    if (!profile || !currentUser) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          contact_info: {
            email: email,
            phone: phone
          }
        })
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
                  bucketName="portfolio"
                  folderPath={`avatar/${userId}`}
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
          </CardContent>
        </Card>

        {/* Portefølje filer */}
        <Card>
          <CardHeader>
            <CardTitle>Portefølje filer</CardTitle>
          </CardHeader>
          <CardContent>
            <FileViewerByPath 
              bucketName="portfolio" 
              folderPath={`portfolio/${userId}`}
              showControls={true}
            />
          </CardContent>
        </Card>

        {/* Tech spec filer */}
        <Card>
          <CardHeader>
            <CardTitle>Tech spec filer</CardTitle>
          </CardHeader>
          <CardContent>
            <FileViewerByPath 
              bucketName="concepts" 
              folderPath={`techspec/${userId}`}
              showControls={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;