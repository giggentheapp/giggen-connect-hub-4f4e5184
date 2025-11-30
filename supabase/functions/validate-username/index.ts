import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIp } from '../_shared/rateLimiter.ts'
import { sanitizeString } from '../_shared/sanitize.ts'
import { getSecurityHeaders, getRateLimitHeaders } from '../_shared/securityHeaders.ts'

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  
  // Create CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  const securityHeaders = { ...getSecurityHeaders(origin), ...corsHeaders };
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { 
        status: 405,
        headers: { ...securityHeaders, ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    let { username } = await req.json();

    console.log('Validating username:', username);

    // Sanitize username
    if (username) {
      username = sanitizeString(username);
    }

    // Validate username length
    if (!username || username.length < 3 || username.length > 50) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: "Username must be 3-50 characters" 
        }),
        { 
          status: 400,
          headers: { ...securityHeaders, ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt), 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate username format (alphanumeric, underscore, dash only)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: "Only letters, numbers, underscore, and dash allowed" 
        }),
        { 
          status: 400,
          headers: { ...securityHeaders, ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt), 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if username already exists (case-insensitive)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      throw error;
    }

    const available = !data;

    console.log('Username availability:', available);

    return new Response(
      JSON.stringify({ 
        available, 
        username: username.toLowerCase() 
      }),
      { 
        status: 200, 
        headers: { ...securityHeaders, ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt), 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error validating username:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...securityHeaders, ...getRateLimitHeaders(rateCheck.remaining, rateCheck.resetAt), 'Content-Type': 'application/json' }
      }
    );
  }
});
