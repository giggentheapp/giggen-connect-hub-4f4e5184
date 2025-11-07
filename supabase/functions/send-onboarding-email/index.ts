import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  language: string;
  role: string;
  source: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, role, source, timestamp }: OnboardingEmailRequest = await req.json();

    console.log("Onboarding data received:", { language, role, source, timestamp });

    // For now, just log the data since we don't have Resend set up
    // In production, you would send this via Resend to giggen.main@gmail.com
    
    // Example Resend implementation (commented out):
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailResponse = await resend.emails.send({
      from: "GIGGEN <onboarding@resend.dev>",
      to: ["giggen.main@gmail.com"],
      subject: "Ny onboarding-bruker",
      html: `
        <h1>Ny onboarding-bruker</h1>
        <p><strong>Språk:</strong> ${language}</p>
        <p><strong>Valgt rolle:</strong> ${role}</p>
        <p><strong>Kilde:</strong> ${source}</p>
        <p><strong>Tidspunkt:</strong> ${timestamp}</p>
      `,
    });
    */

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Onboarding data logged successfully"
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-onboarding-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
