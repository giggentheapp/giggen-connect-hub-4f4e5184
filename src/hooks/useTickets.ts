import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Custom types for ticket system (independent of Supabase auto-generated types)
export interface TicketEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  description: string | null;
  price_nok: number;
  capacity: number;
  tickets_sold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
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
  events?: TicketEvent;
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
        .from("events" as any)
        .select("*")
        .eq("is_active", true)
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
          events (*),
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
