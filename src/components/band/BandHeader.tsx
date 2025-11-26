import { Band } from '@/types/band';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Settings, UserPlus } from 'lucide-react';
import { getRoleIcon, getRoleBadgeText } from '@/utils/bandHelpers';

interface BandHeaderProps {
  band: Band;
  currentUserRole: string | null;
  membersCount: number;
  onInvite: () => void;
  onEdit: () => void;
  onShowPublic: () => void;
  onBack: () => void;
  isAdmin: boolean;
}

export const BandHeader = ({
  band,
  currentUserRole,
  membersCount,
  onInvite,
  onEdit,
  onShowPublic,
  onBack,
  isAdmin,
}: BandHeaderProps) => {
  const RoleIcon = currentUserRole ? getRoleIcon(currentUserRole) : null;

  return (
    <>
      {/* Header Title */}
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 md:h-10 md:w-10"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">Band Profil</h1>
      </div>

      {/* Band Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 mx-auto md:mx-0">
              <AvatarImage src={band.image_url || undefined} />
              <AvatarFallback className="text-2xl md:text-4xl bg-gradient-primary text-primary-foreground">
                {band.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3 md:space-y-4">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold">{band.name}</h2>
                  {currentUserRole && (
                    <Badge variant="default" className="gap-1 w-fit">
                      {RoleIcon && <RoleIcon className="h-4 w-4" />}
                      <span className="hidden md:inline">
                        {getRoleBadgeText(currentUserRole)}
                      </span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm md:text-base">
                  <Users className="h-4 w-4" />
                  <span>{membersCount} medlemmer</span>
                </div>
              </div>
              {band.description && (
                <p className="text-sm md:text-base text-muted-foreground">{band.description}</p>
              )}
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onInvite}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Inviter medlem</span>
                    <span className="sm:hidden">Inviter</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Rediger band</span>
                    <span className="sm:hidden">Rediger</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowPublic}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Publikumsvisning</span>
                    <span className="md:hidden">Publikum</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
