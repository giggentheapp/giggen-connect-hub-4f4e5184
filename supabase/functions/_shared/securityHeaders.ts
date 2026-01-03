// Security headers for all edge functions

const allowedOrigins = [
  'https://giggen.no',
  'https://www.giggen.no',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://[::]:8080'
];

const CSP_HEADER = [
  "default-src 'none'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co https://giggen.no https://www.giggen.no",
  "frame-ancestors 'none'"
].join('; ');

// Helper to check if origin is a Lovable domain
function isLovableDomain(origin: string): boolean {
  if (!origin) return false;
  return (
    origin.includes('.lovableproject.com') ||
    origin.includes('.lovable.app') ||
    origin.includes('lovable.dev') ||
    origin.includes('id-preview--')
  );
}

export function getSecurityHeaders(requestOrigin: string) {
  // Check if origin is allowed or is a Lovable preview domain
  const isLovablePreview = isLovableDomain(requestOrigin);
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin) || isLovablePreview;
  
  const origin = isAllowedOrigin ? requestOrigin : allowedOrigins[0];
  
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
