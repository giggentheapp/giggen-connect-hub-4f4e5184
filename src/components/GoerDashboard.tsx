import { ModeSwitcher } from '@/components/ModeSwitcher';
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
  created_at: string;
  updated_at: string;
  default_mode?: string;
  current_mode?: string;
}

interface GoerDashboardProps {
  profile: UserProfile;
  children?: React.ReactNode;
  onModeChange?: () => void;
}

export const GoerDashboard = ({ profile, children, onModeChange }: GoerDashboardProps) => {
  const navigate = useNavigate();

  const handleModeChange = () => {
    // Navigate to maker dashboard when mode changes
    navigate('/dashboard');
    onModeChange?.();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Sign Out */}
      <header className="border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">GIGGEN</h1>
              <p className="text-sm text-muted-foreground">
                Velkommen, {profile.display_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ModeSwitcher profile={profile} onModeChange={handleModeChange} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {children || (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Finn GiggenMakers</h2>
              <p className="text-muted-foreground">
                Utforsk makere i ditt område ved å åpne kartet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};