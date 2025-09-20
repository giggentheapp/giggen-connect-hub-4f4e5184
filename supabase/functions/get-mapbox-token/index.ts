import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🗺️ SECURED Edge Function: Getting Mapbox token with proper JWT validation')
    console.log('🗺️ Request method:', req.method)
    console.log('🗺️ Request origin:', req.headers.get('origin'))
    console.log('🗺️ Has auth header:', !!req.headers.get('authorization'))
    
    // SECURITY ENHANCEMENT: Proper JWT validation with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Use service role for edge functions
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Verify user authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          debug: {
            message: 'Authorization header is required to access Mapbox token',
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validate JWT token format and authenticity
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Invalid authorization header format')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication format',
          debug: {
            message: 'Authorization header must be Bearer token',
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Extract and validate JWT with Supabase
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      console.error('❌ JWT validation failed:', authError?.message)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          debug: {
            message: authError?.message || 'Token validation failed',
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('✅ User authenticated successfully:', user.id)
    
    // SECURITY AUDIT: Log token access
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'MAPBOX_TOKEN_ACCESS',
          table_name: 'system',
          record_id: null,
          sensitive_fields: ['mapbox_token']
        })
    } catch (auditError) {
      console.warn('⚠️ Failed to log audit entry:', auditError)
    }
    
    // Get Mapbox token from secrets
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN')
    
    console.log('🗺️ Environment check:')
    console.log('🗺️ MAPBOX_ACCESS_TOKEN exists:', !!mapboxToken)
    console.log('🗺️ Token length:', mapboxToken?.length || 0)
    console.log('🗺️ Token starts with pk.:', mapboxToken?.startsWith('pk.') || false)
    
    if (!mapboxToken) {
      console.error('❌ MAPBOX_ACCESS_TOKEN not found in environment')
      console.error('❌ Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('MAP')))
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured',
          debug: {
            envVarsAvailable: Object.keys(Deno.env.toObject()).filter(key => key.includes('MAP')),
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (mapboxToken === 'undefined' || mapboxToken.length < 10) {
      console.error('❌ Invalid Mapbox token detected')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Mapbox token configuration',
          debug: {
            tokenLength: mapboxToken.length,
            tokenType: typeof mapboxToken,
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('✅ Mapbox token found and returned successfully')
    console.log('🗺️ Response data prepared with token length:', mapboxToken.length)
    
    return new Response(
      JSON.stringify({ 
        token: mapboxToken,
        debug: {
          tokenPreview: mapboxToken.substring(0, 10) + '...',
          timestamp: new Date().toISOString(),
          success: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Critical error in edge function:', error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        debug: {
          errorName: error.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})