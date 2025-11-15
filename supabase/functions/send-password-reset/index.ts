import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIp } from '../_shared/rateLimiter.ts'
import { sanitizeString } from '../_shared/sanitize.ts'
import { getSecurityHeaders, getRateLimitHeaders } from '../_shared/securityHeaders.ts'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface PasswordResetRequest {
  email: string;
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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 
          ...securityHeaders, 
          ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
          'Content-Type': 'application/json' 
        }
      }
    );
  }

  try {
    const rawData: PasswordResetRequest = await req.json();
    const { email } = rawData;

    // Sanitize email
    const sanitizedEmail = sanitizeString(email);

    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { 
            ...securityHeaders, 
            ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    console.log("Password reset request for:", sanitizedEmail);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Generate password reset link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: sanitizedEmail,
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    if (!data?.properties?.action_link) {
      throw new Error("Failed to generate reset link");
    }

    const resetLink = data.properties.action_link;

    // Send email with reset link
    const emailResponse = await resend.emails.send({
      from: "GIGGEN <onboarding@resend.dev>",
      to: [sanitizedEmail],
      subject: "Tilbakestill passordet ditt - GIGGEN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">Tilbakestill passordet ditt</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Vi har mottatt en forespørsel om å tilbakestille passordet ditt for din GIGGEN-konto.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Klikk på knappen nedenfor for å lage et nytt passord:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(135deg, #FF6B6B 0%, #FFB88C 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-size: 16px;
                      font-weight: bold;
                      display: inline-block;">
              Tilbakestill passord
            </a>
          </div>
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            Lenken er gyldig i 1 time.
          </p>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">
            Hvis du ikke ba om denne tilbakestillingen, kan du trygt ignorere denne e-posten.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} GIGGEN. Alle rettigheter reservert.
          </p>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Password reset email sent successfully"
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
    console.error("Error in send-password-reset function:", error);
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
