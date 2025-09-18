import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateMapboxConfigRequest {
  styleUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗺️ Update Mapbox Config function called');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`👤 User authenticated: ${user.id}`);

    // Parse request body
    const body: UpdateMapboxConfigRequest = await req.json();
    const { styleUrl } = body;

    if (!styleUrl) {
      return new Response(
        JSON.stringify({ error: 'Style URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate style URL format
    if (!styleUrl.startsWith('mapbox://styles/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid style URL format. Must start with "mapbox://styles/"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🎨 Updating Mapbox style URL: ${styleUrl}`);

    // Check if profile settings exist for this user
    const { data: existingSettings, error: fetchError } = await supabase
      .from('profile_settings')
      .select('*')
      .eq('maker_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile settings:', fetchError);
      throw fetchError;
    }

    // Upsert the mapbox configuration
    const updateData = {
      maker_id: user.id,
      mapbox_style_url: styleUrl,
      // Preserve existing settings or use defaults
      show_about: existingSettings?.show_about ?? false,
      show_contact: existingSettings?.show_contact ?? false,
      show_portfolio: existingSettings?.show_portfolio ?? false,
      show_techspec: existingSettings?.show_techspec ?? false,
      show_events: existingSettings?.show_events ?? false,
      show_on_map: existingSettings?.show_on_map ?? false,
    };

    const { error: updateError } = await supabase
      .from('profile_settings')
      .upsert(updateData);

    if (updateError) {
      console.error('❌ Error updating profile settings:', updateError);
      throw updateError;
    }

    console.log('✅ Mapbox style URL updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mapbox configuration updated successfully',
        styleUrl: styleUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in update-mapbox-config function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});