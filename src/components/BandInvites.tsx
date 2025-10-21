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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Bandinvitasjoner
          <Badge variant="default">{invites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={invite.band?.image_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {invite.band?.name?.substring(0, 2).toUpperCase() || 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{invite.band?.name}</h4>
              <p className="text-sm text-muted-foreground">
                Invitert av {invite.inviter?.display_name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => acceptInvite(invite.id)}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Godta
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineInvite(invite.id)}
                className="gap-1"
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
