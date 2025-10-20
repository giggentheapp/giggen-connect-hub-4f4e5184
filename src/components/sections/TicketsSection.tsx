import { EventsTicketMarket } from "@/components/EventsTicketMarket";
import { MyTicketsView } from "@/components/MyTicketsView";
import { UserProfile } from "@/types/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TicketsSectionProps {
  profile: UserProfile;
}

export const TicketsSection = ({ profile }: TicketsSectionProps) => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billetter</h1>
        <p className="text-muted-foreground">Kjøp og administrer dine billetter</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Utforsk arrangementer</TabsTrigger>
          <TabsTrigger value="my-tickets">Mine billetter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="mt-6">
          <EventsTicketMarket />
        </TabsContent>
        
        <TabsContent value="my-tickets" className="mt-6">
          <MyTicketsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
