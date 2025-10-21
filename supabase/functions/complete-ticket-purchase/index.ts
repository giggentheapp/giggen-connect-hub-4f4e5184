import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const eventId = session.metadata?.event_id;
    const userId = session.metadata?.user_id;

    if (!eventId || userId !== user.id) {
      throw new Error("Invalid session metadata");
    }

    // Generate unique ticket code
    const ticketCode = crypto.randomUUID();

    // Create ticket record
    const { data: ticket, error: ticketError } = await supabaseClient
      .from("tickets")
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_code: ticketCode,
        qr_code_data: ticketCode, // Use ticket code as QR data initially
        status: "valid",
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      throw new Error("Failed to create ticket");
    }

    // Update qr_code_data to use the actual ticket ID for scanning
    const { error: updateError } = await supabaseClient
      .from("tickets")
      .update({
        qr_code_data: ticket.id, // Set to ticket ID for QR scanner
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating QR code data:", updateError);
    }

    // Check if transaction already exists for this payment intent
    const { data: existingTransaction } = await supabaseClient
      .from("transactions")
      .select()
      .eq("stripe_payment_id", session.payment_intent as string)
      .maybeSingle();

    if (!existingTransaction) {
      // Create transaction record only if it doesn't exist
      const { error: transactionError } = await supabaseClient
        .from("transactions")
        .insert({
          user_id: userId,
          ticket_id: ticket.id,
          event_id: eventId,
          stripe_payment_id: session.payment_intent as string,
          amount_nok: session.amount_total! / 100, // Convert from øre
          status: "completed",
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        throw new Error("Failed to create transaction record");
      }
    }

    return new Response(
      JSON.stringify({ success: true, ticket }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error completing purchase:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
