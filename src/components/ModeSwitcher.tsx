import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Users, UserCog } from "lucide-react";

interface ModeSwitcherProps {
  profile: {
    id: string;
    user_id: string;
    current_mode?: string;
    default_mode?: string;
    role: 'maker' | 'goer';
  };
  onModeChange?: (newMode: string) => void;
}

export const ModeSwitcher = ({ profile, onModeChange }: ModeSwitcherProps) => {
  const [mode, setMode] = useState(profile.current_mode || profile.default_mode || 'maker');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Only show mode switcher for makers who can switch between modes
  if (profile.role !== 'maker') {
    return null;
  }

  const toggleMode = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const newMode = mode === "maker" ? "goer" : "maker";
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ current_mode: newMode })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setMode(newMode);
      onModeChange?.(newMode);
      
      // Navigate to appropriate dashboard
      if (newMode === 'goer') {
        navigate('/dashboard/goer/market');
      } else {
        navigate('/dashboard');
      }
      
      toast({
        title: "Modus endret",
        description: `Du er nå i ${newMode === 'maker' ? 'Maker' : 'Publikum'}-modus`,
      });
    } catch (error: any) {
      toast({
        title: "Feil ved endring av modus",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {mode === "maker" ? "Maker-modus" : "Publikum-modus"}
      </Badge>
      <Button 
        onClick={toggleMode} 
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
      >
        {mode === "maker" ? (
          <Users className="h-4 w-4" />
        ) : (
          <UserCog className="h-4 w-4" />
        )}
        Bytt til {mode === "maker" ? "Publikum" : "Maker"}
      </Button>
    </div>
  );
};