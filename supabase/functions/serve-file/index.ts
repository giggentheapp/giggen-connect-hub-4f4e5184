import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Whitelist av tillatte buckets
const ALLOWED_BUCKETS = ['filbank', 'avatars'] as const;
type AllowedBucket = typeof ALLOWED_BUCKETS[number];

// Sikker path-validering
function validateFilePath(path: string, userId: string, bucket: string): { valid: boolean; error?: string; normalizedPath?: string } {
  // 1. Sjekk for null/undefined
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Invalid file path' };
  }

  // 2. Normalize path (fjerner ../ og //)
  const normalizedPath = path.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  
  // 3. Sjekk for path traversal-forsøk
  if (normalizedPath.includes('..') || path.includes('..')) {
    console.warn(`⚠️ PATH TRAVERSAL ATTEMPT: User ${userId} tried to access: ${path}`);
    return { valid: false, error: 'Path traversal detected' };
  }
  
  // 4. Blokkér absolute paths
  if (normalizedPath.startsWith('/')) {
    console.warn(`⚠️ ABSOLUTE PATH ATTEMPT: User ${userId} tried: ${path}`);
    return { valid: false, error: 'Absolute paths not allowed' };
  }
  
  // 5. Sjekk at path starter med brukerens ID (kun for filbank)
  if (bucket === 'filbank') {
    const expectedPrefix = `${userId}/`;
    if (!normalizedPath.startsWith(expectedPrefix)) {
      console.warn(`⚠️ UNAUTHORIZED ACCESS ATTEMPT: User ${userId} tried to access: ${path}`);
      return { valid: false, error: 'Access denied: Can only access own files' };
    }
  }
  
  // 6. Blokkér spesialtegn som kan være farlige
  if (/[<>:"|?*\x00-\x1f]/.test(normalizedPath)) {
    console.warn(`⚠️ INVALID CHARACTERS: User ${userId} path: ${path}`);
    return { valid: false, error: 'Invalid characters in path' };
  }

  // 7. Sjekk maksimal path-lengde (forhindre DoS)
  if (normalizedPath.length > 1024) {
    console.warn(`⚠️ PATH TOO LONG: User ${userId} path length: ${normalizedPath.length}`);
    return { valid: false, error: 'Path too long' };
  }
  
  return { valid: true, normalizedPath };
}

function validateBucket(bucket: string | null): bucket is AllowedBucket {
  if (bucket === null || !ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    console.warn(`⚠️ INVALID BUCKET ATTEMPT: ${bucket}`);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    const bucket = url.searchParams.get('bucket') || 'filbank';
    const authHeader = req.headers.get('authorization');

    // Valider bucket først
    if (!validateBucket(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Invalid bucket specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // KRITISK: Autentisering er ALLTID påkrevd
    if (!authHeader) {
      console.warn(`⚠️ NO AUTH HEADER: Attempted access to ${bucket}/${filePath}`);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.warn(`⚠️ AUTHENTICATION FAILED: ${bucket}/${filePath}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Valider filsti med brukerisolering
    const validation = validateFilePath(filePath, user.id, bucket);
    
    if (!validation.valid) {
      // Log til audit trail
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'FILE_ACCESS_DENIED',
        resource_type: 'storage',
        resource_id: `${bucket}/${filePath}`,
        details: {
          error: validation.error,
          bucket,
          attempted_path: filePath,
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      }).catch(err => console.error('Audit log failed:', err));

      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Bruk den normaliserte, validerte stien
    const safePath = validation.normalizedPath!;
    
    console.log(`✅ Authorized access: user ${user.id} → ${bucket}/${safePath}`);

    // Download file fra Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(safePath);

    if (error) {
      console.error(`❌ Download error for ${bucket}/${safePath}:`, error);
      
      // Log failed access
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'FILE_ACCESS_FAILED',
        resource_type: 'storage',
        resource_id: `${bucket}/${safePath}`,
        details: {
          error: error.message,
          bucket,
          path: safePath
        }
      }).catch(err => console.error('Audit log failed:', err));

      return new Response(
        JSON.stringify({ error: 'File not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'File data is empty' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestDuration = Date.now() - requestStart;

    // Log successful access til audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'FILE_ACCESSED',
      resource_type: 'storage',
      resource_id: `${bucket}/${safePath}`,
      details: {
        bucket,
        path: safePath,
        file_size: data.size,
        duration_ms: requestDuration,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      }
    }).catch(err => console.error('Audit log failed:', err));

    console.log(`✅ File served: ${bucket}/${safePath} (${data.size} bytes, ${requestDuration}ms)`);

    // Determine content type based on file extension
    const getContentType = (path: string): string => {
      const ext = path.toLowerCase().split('.').pop();
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'txt': return 'text/plain';
        case 'json': return 'application/json';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        default: return 'application/octet-stream';
      }
    };

    const contentType = getContentType(safePath);
    const filename = safePath.split('/').pop() || 'file';

    // Return the file with security headers
    return new Response(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600', // Private cache only
        'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
        'X-Frame-Options': 'SAMEORIGIN', // Prevent clickjacking
      },
    });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
