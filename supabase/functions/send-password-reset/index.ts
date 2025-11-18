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

    // Get the redirect URL from the request origin or use production URL
    const requestOrigin = req.headers.get('origin') || 'https://giggen.org';
    const redirectTo = `${requestOrigin}/auth`;
    
    console.log("Sending password reset email with redirectTo:", redirectTo);

    // Use Supabase's built-in password reset email
    // This sends an email automatically with the correct recovery link
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
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
      JSON.stringify({ success: true }),
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
      JSON.stringify({ error: error.message }),
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
