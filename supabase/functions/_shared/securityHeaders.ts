// Security headers for all edge functions

const allowedOrigins = [
  'https://giggen.org',
  'https://www.giggen.org',
  'http://localhost:5173',
  'http://localhost:3000'
];

const CSP_HEADER = [
  "default-src 'none'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co https://giggen.org https://www.giggen.org",
  "frame-ancestors 'none'"
].join('; ');

export function getSecurityHeaders(requestOrigin: string) {
  const origin = allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Security-Policy': CSP_HEADER,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export function getRateLimitHeaders(remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
  };
}
