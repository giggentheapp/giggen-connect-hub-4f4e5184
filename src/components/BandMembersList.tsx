import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BandMember } from '@/types/band';
import { Crown, Shield, MoreVertical, UserMinus, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BandMembersListProps {
  members: BandMember[];
  currentUserRole: string | null;
  bandId: string;
  onUpdate: () => void;
}

export const BandMembersList = ({
  members,
  currentUserRole,
  bandId,
  onUpdate,
}: BandMembersListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'founder';

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('band_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Rolle oppdatert',
        description: `Medlemmet er nå ${newRole === 'admin' ? 'admin' : 'medlem'}`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Feil ved oppdatering av rolle',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('band_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Medlem fjernet',
        description: 'Medlemmet har blitt fjernet fra bandet',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Feil ved fjerning av medlem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'founder':
        return (
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            <span className="hidden md:inline">Grunnlegger</span>
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            <span className="hidden md:inline">Admin</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span className="hidden md:inline">Medlem</span>
            <span className="md:hidden text-xs">M</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          <Avatar
            className="h-10 w-10 md:h-12 md:w-12 cursor-pointer flex-shrink-0"
            onClick={() => navigate(`/profile/${member.user_id}`, { 
              state: { fromSection: 'admin-bands' } 
            })}
          >
            <AvatarImage src={member.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs md:text-sm">
              {member.profile?.display_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/profile/${member.user_id}`, { 
              state: { fromSection: 'admin-bands' } 
            })}
          >
            <h4 className="font-semibold truncate text-sm md:text-base">
              {member.profile?.display_name || 'Ukjent'}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              @{member.profile?.username}
            </p>
          </div>
          {getRoleBadge(member.role)}
          {isAdmin && member.role !== 'founder' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading} className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.role === 'member' ? (
                  <DropdownMenuItem
                    onClick={() => handleRoleChange(member.id, 'admin')}
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" />
                    Gjør til admin
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleRoleChange(member.id, 'member')}
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" />
                    Gjør til medlem
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleRemoveMember(member.id, member.user_id)}
                  className="gap-2 text-destructive"
                >
                  <UserMinus className="h-4 w-4" />
                  Fjern fra band
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
};
