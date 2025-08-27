import { EventMarket } from "@/components/EventMarket";

export default function EventMarketPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Arrangementmarked</h1>
          <p className="text-muted-foreground">
            Utforsk alle publiserte arrangementer
          </p>
        </div>
        
        <EventMarket />
      </div>
    </div>
  );
}