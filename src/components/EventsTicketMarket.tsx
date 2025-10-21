import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, Users } from "lucide-react";
import { useEvents, usePurchaseTicket } from "@/hooks/useTickets";
import { Skeleton } from "@/components/ui/skeleton";

export function EventsTicketMarket() {
  const { data: events, isLoading } = useEvents();
  const { mutate: purchaseTicket, isPending } = usePurchaseTicket();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Ingen arrangementer tilgjengelig</h3>
        <p className="text-muted-foreground">Kom tilbake senere for å se nye konserter og festivaler</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Billetter</h2>
        <p className="text-muted-foreground">Kjøp billetter til kommende arrangementer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const isPastEvent = eventDate < new Date();

          return (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {eventDate.toLocaleDateString("no-NO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Maks {event.expected_audience} deltakere</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {event.ticket_price} kr
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                {event.has_paid_tickets ? (
                  <Button
                    className="w-full"
                    disabled={isPastEvent || isPending}
                    onClick={() => purchaseTicket(event.id)}
                    variant="default"
                  >
                    {isPastEvent ? "Arrangementet er passert" : "Kjøp billett"}
                  </Button>
                ) : (
                  <Button className="w-full" disabled variant="secondary">
                    Ikke tilgjengelig for kjøp i appen
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
