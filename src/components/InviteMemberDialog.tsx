import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus, Copy } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  bandName: string;
}

interface Musician {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export const InviteMemberDialog = ({
  open,
  onOpenChange,
  bandId,
  bandName,
}: InviteMemberDialogProps) => {
  const [search, setSearch] = useState('');
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const fetchMusicians = async () => {
      try {
        setLoading(true);
        
        // Get current band members
        const { data: members } = await supabase
          .from('band_members')
          .select('user_id')
          .eq('band_id', bandId);

        const memberIds = members?.map(m => m.user_id) || [];

        // Get all musicians except current members
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .eq('role', 'musiker' as any)
          .not('user_id', 'in', `(${memberIds.join(',')})`)
          .or(`display_name.ilike.%${search}%,username.ilike.%${search}%`)
          .limit(20);

        if (error) throw error;
        setMusicians(data || []);
      } catch (error: any) {
        toast({
          title: 'Feil ved søk',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMusicians();
  }, [open, search, bandId, toast]);

  const handleInvite = async (userId: string) => {
    try {
      setInviting(userId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('band_invites')
        .insert({
          band_id: bandId,
          invited_by: user.id,
          invited_user_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Invitasjon sendt!',
        description: 'Musikeren har mottatt invitasjonen',
      });

      // Remove from list
      setMusicians(prev => prev.filter(m => m.user_id !== userId));
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Allerede invitert',
          description: 'Denne musikeren har allerede en aktiv invitasjon',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Feil ved sending av invitasjon',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter musikere til {bandName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk etter musikere..."
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : musicians.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Ingen musikere funnet
              </div>
            ) : (
              musicians.map((musician) => (
                <div
                  key={musician.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={musician.avatar_url || undefined} />
                    <AvatarFallback>
                      {musician.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{musician.display_name}</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`@${musician.username}`);
                        toast({ title: 'Kopiert!', description: `@${musician.username} kopiert til utklippstavlen` });
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>@{musician.username}</span>
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(musician.user_id)}
                    disabled={inviting === musician.user_id}
                    className="gap-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    Inviter
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
