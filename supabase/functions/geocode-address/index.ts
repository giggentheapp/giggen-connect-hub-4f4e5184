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
    const { address } = await req.json()
    
    if (!address || address.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Address must be at least 3 characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Mapbox token from secrets
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN')
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN not found in environment')
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call Mapbox Geocoding API with enhanced options for Norway
    const encodedAddress = encodeURIComponent(address.trim())
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=NO&limit=5&types=address,poi,place&language=no`
    
    console.log('Calling Mapbox API:', geocodeUrl.replace(mapboxToken, '[REDACTED]'))
    
    const response = await fetch(geocodeUrl)
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ error: 'Geocoding service unavailable' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Mapbox response:', JSON.stringify(data, null, 2))

    if (!data.features || data.features.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No addresses found',
          features: []
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format response for AddressAutocomplete component
    const formattedFeatures = data.features.map((feature: any) => ({
      place_name: feature.place_name,
      center: feature.center, // [longitude, latitude]
      text: feature.text,
      properties: feature.properties
    }))

    return new Response(
      JSON.stringify({
        features: formattedFeatures,
        query: address
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Geocoding error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal geocoding error',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})