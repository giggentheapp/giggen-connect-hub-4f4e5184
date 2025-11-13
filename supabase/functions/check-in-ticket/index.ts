import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const allowedOrigins = [
  'https://giggen.org',
  'https://www.giggen.org',
  'http://localhost:5173',
  'http://localhost:3000'
];

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
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
    const admin = data.user;
    
    if (!admin) {
      throw new Error("User not authenticated");
    }

    // Check if user is musician or organizer
    const { data: userRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", admin.id);

    if (!userRoles || userRoles.length === 0) {
      throw new Error("Unauthorized: Only admins and organizers can check in tickets");
    }

    const hasAccess = userRoles.some(r => r.role === 'admin' || r.role === 'organizer');
    if (!hasAccess) {
      throw new Error("Unauthorized: Only admins and organizers can check in tickets");
    }

    const { ticketCode } = await req.json();

    if (!ticketCode) {
      throw new Error("Ticket code is required");
    }

    // Fetch ticket with event and user details
    const { data: ticket, error: ticketError } = await supabaseClient
      .from("tickets")
      .select(`
        *,
        events (*),
        profiles:user_id (display_name, avatar_url)
      `)
      .eq("ticket_code", ticketCode)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Ugyldig billett",
          message: "Billetten ble ikke funnet i systemet"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (ticket.status === "used") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Billetten er allerede brukt",
          message: `Innsjekket ${new Date(ticket.used_at).toLocaleString("no-NO")}`,
          ticket
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (ticket.status === "cancelled") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Billetten er kansellert",
          message: "Denne billetten er ikke lenger gyldig",
          ticket
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Mark ticket as used
    const { data: updatedTicket, error: updateError } = await supabaseClient
      .from("tickets")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        checked_in_by: admin.id,
      })
      .eq("id", ticket.id)
      .select(`
        *,
        events (*),
        profiles:user_id (display_name, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      throw new Error("Failed to check in ticket");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Innsjekk vellykket!",
        ticket: updatedTicket
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking in ticket:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
