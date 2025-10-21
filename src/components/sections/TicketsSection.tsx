import { MyTicketsView } from "@/components/MyTicketsView";
import { UserProfile } from "@/types/auth";

interface TicketsSectionProps {
  profile: UserProfile;
}

export const TicketsSection = ({ profile }: TicketsSectionProps) => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mine billetter</h1>
        <p className="text-muted-foreground">Administrer dine kjøpte billetter</p>
      </div>

      <MyTicketsView />
    </div>
  );
};
