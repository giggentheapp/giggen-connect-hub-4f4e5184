import { useMyTickets } from "@/hooks/useTickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket as TicketIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import QRCode from "react-qr-code";

export function MyTicketsView() {
  const { data: tickets, isLoading } = useMyTickets();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-48 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <TicketIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Ingen billetter</h3>
        <p className="text-muted-foreground">Du har ikke kjøpt noen billetter ennå</p>
      </div>
    );
  }

  const now = new Date();
  const upcomingTickets = tickets.filter(
    (t) => t.events_market && new Date(t.events_market.date) > now && t.status === "valid"
  );
  const pastTickets = tickets.filter(
    (t) => t.events_market && (new Date(t.events_market.date) <= now || t.status !== "valid")
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mine billetter</h2>
        <p className="text-muted-foreground">Se og administrer dine kjøpte billetter</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">
            Kommende ({upcomingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Tidligere ({pastTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen kommende arrangementer
            </div>
          ) : (
            upcomingTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen tidligere arrangementer
            </div>
          ) : (
            pastTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: any }) {
  const event = ticket.events_market;
  if (!event) return null;

  const eventDate = new Date(event.date);
  const statusColor = {
    valid: "default",
    used: "secondary",
    cancelled: "destructive",
  } as const;

  const statusText = {
    valid: "Gyldig",
    used: "Brukt",
    cancelled: "Kansellert",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </CardDescription>
          </div>
          <Badge variant={statusColor[ticket.status]}>
            {statusText[ticket.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {eventDate.toLocaleDateString("no-NO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {ticket.status === "valid" && (
          <div className="flex flex-col items-center gap-4 p-6 bg-background rounded-lg border">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Din billett</p>
              <p className="text-xs text-muted-foreground">
                Vis denne QR-koden ved inngang
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <QRCode
                value={ticket.ticket_code}
                size={200}
                level="H"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                {ticket.ticket_code.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {ticket.status === "used" && ticket.used_at && (
          <div className="text-sm text-muted-foreground text-center">
            Innsjekket{" "}
            {new Date(ticket.used_at).toLocaleString("no-NO", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
