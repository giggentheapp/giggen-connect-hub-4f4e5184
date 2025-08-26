import { EventMarket as EventMarketComponent } from "@/components/EventMarket";

const EventMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <EventMarketComponent />
      </div>
    </div>
  );
};

export default EventMarket;