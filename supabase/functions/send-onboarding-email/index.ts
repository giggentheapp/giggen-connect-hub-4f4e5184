import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { checkRateLimit, getClientIp } from '../_shared/rateLimiter.ts'
import { sanitizeObject } from '../_shared/sanitize.ts'
import { getSecurityHeaders, getRateLimitHeaders } from '../_shared/securityHeaders.ts'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface OnboardingEmailRequest {
  language: string;
  role: string;
  source: string;
  other_text?: string;
  timestamp: string;
  context: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin') || '';
  const securityHeaders = getSecurityHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: securityHeaders });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);
  
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: new Date(rateCheck.resetAt).toISOString() }),
      { 
        status: 429,
        headers: { 
          ...securityHeaders, 
          ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
          'Content-Type': 'application/json' 
        }
      }
    );
  }

  try {
    const rawData: OnboardingEmailRequest = await req.json();
    
    // Sanitize all input
    const sanitizedData = sanitizeObject(rawData);
    const { language, role, source, other_text, timestamp, context } = sanitizedData;

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
          ...securityHeaders,
          ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-onboarding-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...securityHeaders,
          ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
          "Content-Type": "application/json" 
        },
      }
    );
  }
};

serve(handler);
