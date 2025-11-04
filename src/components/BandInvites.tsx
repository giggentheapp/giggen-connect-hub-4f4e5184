import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBandInvites } from '@/hooks/useBandInvites';
import { Check, X, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BandInvitesProps {
  userId: string;
}

export const BandInvites = ({ userId }: BandInvitesProps) => {
  const { invites, loading, acceptInvite, declineInvite } = useBandInvites(userId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bandinvitasjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/10 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <span>Bandinvitasjoner</span>
          <Badge variant="default" className="ml-auto">{invites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-3 p-3 border-2 border-primary/20 rounded-lg bg-background/80 backdrop-blur-sm hover:border-primary/40 transition-all"
          >
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={invite.band?.image_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {invite.band?.name?.substring(0, 2).toUpperCase() || 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate text-base">{invite.band?.name}</h4>
              <p className="text-sm text-muted-foreground">
                Invitert av {invite.inviter?.display_name}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                onClick={() => acceptInvite(invite.id)}
                className="gap-1 bg-green-600 hover:bg-green-700 min-w-[90px]"
              >
                <Check className="h-4 w-4" />
                Godta
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineInvite(invite.id)}
                className="gap-1 min-w-[90px]"
              >
                <X className="h-4 w-4" />
                Avslå
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
