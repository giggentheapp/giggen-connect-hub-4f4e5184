import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompleteTicketPurchase } from "@/hooks/useTickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getProfileUrl, navigateToAuth, navigateToProfile } from "@/lib/navigation";

export default function TicketSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const sessionId = searchParams.get("session_id");
  
  const { mutate: completeTicketPurchase, isPending, isSuccess } = useCompleteTicketPurchase();

  useEffect(() => {
    if (sessionId && !isSuccess) {
      completeTicketPurchase(sessionId);
    }
  }, [sessionId, completeTicketPurchase, isSuccess]);

  const handleViewTickets = () => {
    if (user) {
      navigateToProfile(navigate, user.id, 'tickets', false);
    } else {
      navigateToAuth(navigate, true, 'User not logged in - redirecting from ticket success');
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Behandler betaling...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vennligst vent mens vi oppretter din billett
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Betaling vellykket!</CardTitle>
          <CardDescription>
            Din billett er nå tilgjengelig i "Mine billetter"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleViewTickets}
            className="w-full"
          >
            Se mine billetter
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Tilbake til forsiden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
