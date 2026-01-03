import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIp } from '../_shared/rateLimiter.ts'
import { sanitizeString } from '../_shared/sanitize.ts'
import { getSecurityHeaders, getRateLimitHeaders } from '../_shared/securityHeaders.ts'

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

    // Validate email format
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
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

    // Basic email validation (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
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

    // Additional length check
    if (trimmedEmail.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Email address is too long' }),
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

    console.log("Password reset request for:", trimmedEmail);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Always use production URL for password reset redirects
    // This ensures links work for all users regardless of where they request reset
    const PRODUCTION_URL = 'https://giggen.org';
    const redirectTo = `${PRODUCTION_URL}/auth`;
    
    console.log("Sending password reset email with redirectTo:", redirectTo);
    console.log("Request origin was:", req.headers.get('origin'));

    // Use Supabase's built-in password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Kunne ikke sende passordtilbakestilling. Prøv igjen.';
      
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        errorMessage = 'Ugyldig e-postadresse. Sjekk at e-posten er riktig formatert.';
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = 'For mange forespørsler. Vent litt før du prøver igjen.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
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

    console.log("Password reset email sent successfully via Supabase");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Hvis e-posten eksisterer, har vi sendt en lenke for å tilbakestille passordet.'
      }),
      { 
        status: 200, 
        headers: { 
          ...securityHeaders, 
          ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt),
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'En uventet feil oppstod' }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...securityHeaders 
        },
      }
    );
  }
};

serve(handler);
