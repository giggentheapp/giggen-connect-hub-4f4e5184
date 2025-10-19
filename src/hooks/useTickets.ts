import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Custom types for ticket system (independent of Supabase auto-generated types)
export interface TicketEvent {
  id: string;
  title: string;
  venue: string;
  date: string;
  description: string | null;
  ticket_price: number;
  expected_audience: number;
  is_public: boolean;
  created_at: string;
  created_by: string | null;
  has_paid_tickets: boolean;
}

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  qr_code_data: string;
  status: "valid" | "used" | "cancelled";
  purchased_at: string;
  used_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
  events_market?: TicketEvent;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export const useEvents = () => {
  return useQuery<TicketEvent[]>({
    queryKey: ["ticket-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_market" as any)
        .select("id, title, venue, date, description, ticket_price, expected_audience, is_public, created_at, created_by, has_paid_tickets")
        .eq("is_public", true)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TicketEvent[];
    },
  });
};

export const useMyTickets = () => {
  return useQuery<Ticket[]>({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tickets" as any)
        .select(`
          *,
          events_market:event_id (*),
          profiles:user_id (display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Ticket[];
    },
  });
};

export const usePurchaseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create checkout session
      const { data, error } = await supabase.functions.invoke("create-ticket-checkout", {
        body: { eventId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Failed to create checkout session");

      // Open Stripe Checkout in new tab
      window.open(data.url, "_blank");
      
      return data;
    },
    onSuccess: () => {
      toast.success("Åpner betalingsvindu...");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke starte billettskjøp");
    },
  });
};

export const useCompleteTicketPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke("complete-ticket-purchase", {
        body: { sessionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
      toast.success("Billett kjøpt! Du finner den i 'Mine billetter'");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke fullføre billettskjøp");
    },
  });
};

export const useCheckInTicket = () => {
  return useMutation({
    mutationFn: async (ticketCode: string) => {
      const { data, error } = await supabase.functions.invoke("check-in-ticket", {
        body: { ticketCode },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Innsjekk vellykket!");
      } else {
        toast.error(data.error || "Innsjekk feilet");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke sjekke inn billett");
    },
  });
};
