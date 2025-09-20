import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    const bucket = url.searchParams.get('bucket') || 'portfolio';
    const authHeader = req.headers.get('authorization');

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Serving file: ${bucket}/${filePath}, auth: ${authHeader ? 'present' : 'missing'}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Security: Verify authentication for sensitive files
    if (authHeader && bucket !== 'avatars') {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (authError || !user) {
        console.log(`Unauthorized access attempt to ${bucket}/${filePath}`);
        return new Response(
          JSON.stringify({ error: 'Unauthorized access' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Log access for audit trail
      console.log(`Authenticated file access: user ${user.id} accessed ${bucket}/${filePath}`);
    }

    // Download file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
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

    console.log(`File served successfully: ${filePath}, size: ${data.size}`);

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

    const contentType = getContentType(filePath);
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || 'file';

    // Return the file with proper headers
    return new Response(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});