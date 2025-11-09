import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  language: string;
  role: string;
  source: string;
  other_text?: string;
  timestamp: string;
  context: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, role, source, other_text, timestamp, context }: OnboardingEmailRequest = await req.json();

    console.log("Onboarding data received:", { language, role, source, other_text, timestamp, context });

    const sourceLabel = source === 'other' && other_text ? `Annet: ${other_text}` : source;
    
    const emailResponse = await resend.emails.send({
      from: "GIGGEN <onboarding@resend.dev>",
      to: ["giggen.main@gmail.com"],
      subject: "Ny bruker etter første innlogging",
      html: `
        <h1>Ny bruker etter første innlogging</h1>
        <p><strong>Språk:</strong> ${language}</p>
        <p><strong>Valgt rolle:</strong> ${role}</p>
        <p><strong>Kilde:</strong> ${sourceLabel}</p>
        <p><strong>Tidspunkt:</strong> ${timestamp}</p>
        <p><strong>Kontekst:</strong> ${context}</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Onboarding email sent successfully"
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
