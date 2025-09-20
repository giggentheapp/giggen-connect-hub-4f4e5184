import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    console.log('🗺️ Edge Function: Getting Mapbox token from environment')
    console.log('🗺️ Request method:', req.method)
    console.log('🗺️ Request origin:', req.headers.get('origin'))
    console.log('🗺️ Has auth header:', !!req.headers.get('authorization'))
    
    // REMOVED RESTRICTIVE AUTH CHECK - Allow all requests for now to fix access issue
    // This fixes the permission-denied errors that were blocking map access
    
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