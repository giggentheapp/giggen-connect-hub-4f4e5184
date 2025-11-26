import { BandMember } from '@/types/band';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { BandMembersList } from '@/components/BandMembersList';

interface BandMembersSectionProps {
  members: BandMember[];
  currentUserRole: string | null;
  bandId: string;
  onUpdate: () => void;
}

export const BandMembersSection = ({
  members,
  currentUserRole,
  bandId,
  onUpdate,
}: BandMembersSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Medlemmer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BandMembersList
          members={members}
          currentUserRole={currentUserRole}
          bandId={bandId}
          onUpdate={onUpdate}
        />
      </CardContent>
    </Card>
  );
};
