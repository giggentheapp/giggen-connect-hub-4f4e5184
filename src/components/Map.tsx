import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin } from 'lucide-react';

interface MapProps {
  className?: string;
  forceRefresh?: number; // Add prop to force refresh from parent
}

interface MakerLocation {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  address: string;
}

const Map: React.FC<MapProps> = ({ className = '', forceRefresh = 0 }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]); // Track markers for cleanup
  const [makers, setMakers] = useState<MakerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{total: number, visible: number, errors: string[]}>({
    total: 0, 
    visible: 0, 
    errors: []
  });
  const { toast } = useToast();

  // Log environment variables and get Mapbox token
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        // Log available environment variables (names only, not values)
        console.log('[ENV-CHECK] Available environment variables:', Object.keys(import.meta.env));
        console.log('[ENV-CHECK] VITE_MAPBOX_TOKEN exists:', !!import.meta.env.VITE_MAPBOX_TOKEN);
        console.log('[ENV-CHECK] VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
        console.log('[ENV-CHECK] VITE_SUPABASE_PUBLISHABLE_KEY exists:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        
        // Try direct environment variable first
        const directToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (directToken && directToken !== 'undefined') {
          console.log('[ENV-CHECK] Using VITE_MAPBOX_TOKEN from environment variables');
          setMapboxToken(directToken);
          mapboxgl.accessToken = directToken;
          return;
        }
        
        console.log('[ENV-CHECK] VITE_MAPBOX_TOKEN not found, trying edge function...');
        
        // Fallback to edge function for token
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('[MAPBOX-ERROR] Edge function failed:', error.message);
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
          return;
        }
        
        if (data?.token && data.token !== 'undefined') {
          console.log('[ENV-CHECK] Got token from edge function successfully');
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          console.error('[MAPBOX-ERROR] Edge function returned invalid token');
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
        }
      } catch (error: any) {
        console.error('[MAPBOX-ERROR] Token fetch failed:', error.message);
        setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
      }
    };
    
    getMapboxToken();
  }, []);

  // Robust fetch function with retry logic
  const fetchMakers = useCallback(async (retryCount = 0) => {
      try {
        console.log('[MAPBOX-FETCH] Starting to fetch makers with public addresses');
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            user_id,
            display_name,
            avatar_url,
            latitude,
            longitude,
            address
          `)
          .eq('role', 'maker')
          .eq('is_address_public', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .not('address', 'is', null)
          .order('display_name', { ascending: true });

        if (error) {
          console.error('[MAPBOX-ERROR] Database query failed:', error.code, error.message, error.details);
          throw error;
        }

        console.log(`[MAPBOX-SUCCESS] Raw database response: ${data?.length || 0} records`);
        console.log('[MAPBOX-DATA] Raw data:', JSON.stringify(data, null, 2));
        
        // Process makers data - ensure coordinates are valid numbers
        const makersData = data?.map(maker => ({
          user_id: maker.user_id,
          display_name: maker.display_name,
          avatar_url: maker.avatar_url,
          latitude: parseFloat(maker.latitude?.toString() || '0'),
          longitude: parseFloat(maker.longitude?.toString() || '0'),
          address: maker.address
        })).filter(maker => {
          // Validate coordinates are valid numbers
          const isValid = !isNaN(maker.latitude) && !isNaN(maker.longitude) && 
                         maker.latitude !== 0 && maker.longitude !== 0 && maker.address;
          
          if (!isValid) {
            console.warn(`[MAPBOX-SKIP] Invalid data for maker ${maker.display_name}:`, {
              lat: maker.latitude, lng: maker.longitude, address: maker.address
            });
          } else {
            console.log(`[MAPBOX-VALID] Maker ${maker.display_name} ready for map:`, {
              lat: maker.latitude, lng: maker.longitude
            });
          }
          
          return isValid;
        }) || [];

        console.log(`[MAPBOX-FINAL] Setting ${makersData.length} valid makers to state`);
        setMakers(makersData);
        
        // Update debug info
        setDebugInfo({
          total: data?.length || 0,
          visible: makersData.length,
          errors: []
        });
        
      } catch (error: any) {
        console.error('[MAPBOX-ERROR] Fetch failed:', error);
        
        // Retry logic for reliability
        if (retryCount < 2) {
          console.log(`[MAPBOX-RETRY] Retrying fetch (attempt ${retryCount + 2}/3)...`);
          setTimeout(() => fetchMakers(retryCount + 1), 1000);
          return;
        }
        
        const errorMsg = `Kunne ikke laste makere på kartet etter flere forsøk: ${error.message}`;
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, errorMsg]
        }));
        
        toast({
          title: "Feil ved lasting av kart",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        console.log('[MAPBOX-FETCH] Fetch process completed, setting loading to false');
        setLoading(false);
      }
    }, [toast]);

  // Fetch makers with public addresses - robust loading with retry
  useEffect(() => {
    console.log('[MAPBOX-MOUNT] Map component mounted, starting fetch process');
    fetchMakers();
  }, [fetchMakers, forceRefresh]); // Include forceRefresh to enable parent-triggered reloads

  // Initialize map
  useEffect(() => {
    console.log('[MAPBOX-INIT] Map initialization useEffect triggered');
    console.log('[MAPBOX-INIT] Conditions:', { 
      hasContainer: !!mapContainer.current, 
      hasToken: !!mapboxToken,
      hasMap: !!map.current 
    });
    
    if (!mapContainer.current || !mapboxToken) {
      console.log('[MAPBOX-INIT] Skipping map init - missing container or token');
      return;
    }
    
    // Prevent double initialization
    if (map.current) {
      console.log('[MAPBOX-INIT] Map already exists, skipping initialization');
      return;
    }

    try {
      console.log('[MAPBOX-ERROR] Initializing Mapbox GL map');
      
      // Validate container height
      const containerHeight = mapContainer.current.offsetHeight;
      if (containerHeight === 0) {
        console.warn('[MAPBOX-ERROR] Map container has zero height - this may cause rendering issues');
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // More colorful and contrasted style
        center: [10.7461, 59.9127], // Oslo, Norway as default center
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('[MAPBOX-SUCCESS] Map successfully loaded with streets-v11 style');
        setMapReady(true);
      });

      map.current.on('error', (e) => {
        console.error('[MAPBOX-ERROR] Map error:', e.error);
      });

      console.log('[MAPBOX-SUCCESS] Map initialization completed');

    } catch (error: any) {
      console.error('[MAPBOX-ERROR] Failed to initialize map:', error.message);
      toast({
        title: "Kartfeil",
        description: "Kunne ikke laste kartet",
        variant: "destructive",
      });
    }

    return () => {
      if (map.current) {
        console.log('[MAPBOX-CLEANUP] Cleaning up map instance');
        // Clean up markers first
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, [mapboxToken, toast]);

  // Add markers when makers data is available and map is ready
  useEffect(() => {
    console.log('[MAPBOX-MARKERS] Marker useEffect triggered');
    console.log('[MAPBOX-MARKERS] Conditions:', {
      hasMap: !!map.current,
      mapReady,
      makersCount: makers.length,
      markersArray: makers
    });
    
    if (!map.current || !mapReady || !makers.length) {
      console.log(`[MAPBOX-MARKERS] Skipping markers: map=${!!map.current}, ready=${mapReady}, makers=${makers.length}`);
      return;
    }

    console.log(`[MAPBOX-MARKERS] Adding ${makers.length} markers to map`);

    // Clean up existing markers properly
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];
    
    let successCount = 0;
    const errors: string[] = [];

    // Create markers for each maker
    makers.forEach((maker, index) => {
      try {
        console.log(`[MAPBOX-MARKER-${index}] Creating marker for ${maker.display_name} at [${maker.longitude}, ${maker.latitude}]`);
        
        // Validate coordinates before creating marker
        if (isNaN(maker.latitude) || isNaN(maker.longitude)) {
          console.error(`[MAPBOX-MARKER-${index}] Invalid coordinates for ${maker.display_name}`);
          return;
        }
        
        // Create marker container with name label
        const markerContainer = document.createElement('div');
        markerContainer.className = 'mapbox-marker-container';
        markerContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          cursor: pointer;
        `;

        // Create the profile marker element (always circular)
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker';
        
        if (maker.avatar_url) {
          // Profile picture marker
          markerEl.style.cssText = `
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            background-size: cover;
            background-position: center;
            background-image: url('${maker.avatar_url}');
            background-color: #f0f0f0;
            transition: all 0.2s ease;
            position: relative;
          `;
        } else {
          // Default avatar marker with initials
          markerEl.style.cssText = `
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            background: linear-gradient(135deg, #dc2626, #ef4444);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.2s ease;
            position: relative;
          `;
          
          // Add initials
          const initials = maker.display_name
            .split(' ')
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
          markerEl.textContent = initials;
        }

        // Create name label that's always visible
        const nameLabel = document.createElement('div');
        nameLabel.className = 'mapbox-marker-name';
        nameLabel.textContent = maker.display_name;
        nameLabel.style.cssText = `
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
          margin-top: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          pointer-events: none;
        `;

        // Add hover effects for the entire container
        const addHoverEffects = () => {
          markerEl.style.transform = 'scale(1.1)';
          markerEl.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
          nameLabel.style.background = 'rgba(0, 0, 0, 0.9)';
          nameLabel.style.transform = 'scale(1.05)';
        };

        const removeHoverEffects = () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
          nameLabel.style.background = 'rgba(0, 0, 0, 0.8)';
          nameLabel.style.transform = 'scale(1)';
        };

        markerContainer.addEventListener('mouseenter', addHoverEffects);
        markerContainer.addEventListener('mouseleave', removeHoverEffects);

        // Assemble the marker container
        markerContainer.appendChild(markerEl);
        markerContainer.appendChild(nameLabel);

      // Create popup with maker name and info
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="text-align: center; padding: 12px; min-width: 200px;">
          ${maker.avatar_url ? `
            <img 
              src="${maker.avatar_url}" 
              alt="${maker.display_name}"
              style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 8px; object-fit: cover; border: 2px solid #e0e0e0;"
              onerror="this.style.display='none'"
            />
          ` : `
            <div style="width: 40px; height: 40px; background: #dc2626; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
              ${maker.display_name.charAt(0).toUpperCase()}
            </div>
          `}
          <h3 style="margin: 0 0 6px 0; font-weight: bold; font-size: 16px; color: #333;">${maker.display_name}</h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">${maker.address}</p>
          <a 
            href="/profile/${maker.user_id}" 
            style="display: inline-block; padding: 6px 12px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#b91c1c'"
            onmouseout="this.style.backgroundColor='#dc2626'"
          >
            Se profil
          </a>
        </div>
      `);

        // Add marker to map with coordinate validation
        const markerCoords: [number, number] = [maker.longitude, maker.latitude];
        console.log(`[MAPBOX-MARKER-${index}] Adding marker at coordinates:`, markerCoords);
        
        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: 'bottom'
        })
          .setLngLat(markerCoords)
          .setPopup(popup)
          .addTo(map.current!);
          
        // Store marker for cleanup
        markersRef.current.push(marker);
        successCount++;
          
        console.log(`[MAPBOX-MARKER-${index}] ✅ Successfully added marker for ${maker.display_name}`);
        
      } catch (error: any) {
        const errorMsg = `Failed to create marker for ${maker.display_name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`[MAPBOX-MARKER-${index}] ❌ ${errorMsg}`, error);
      }
    });

    // Fit map to show all markers if we have any
    if (makers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      makers.forEach(maker => {
        bounds.extend([maker.longitude, maker.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 1000
      });
      
      console.log(`[MAPBOX-SUCCESS] Map bounds adjusted to show all ${makers.length} markers`);
    }
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      visible: successCount,
      errors
    }));
    
  }, [makers, mapReady]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Laster kart...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/10">
          <p className="text-destructive font-medium mb-2">Kartfeil</p>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border" 
          style={{ 
            minHeight: '400px',
            zIndex: 1,
            position: 'relative'
          }}
        />
        {makers.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg" style={{zIndex: 2}}>
            <div className="text-center p-6">
              <p className="text-muted-foreground font-medium mb-2">Ingen offentlige makere på kartet</p>
              <p className="text-sm text-muted-foreground">
                Makere må ha lagt inn adresse og satt den til offentlig i profilinnstillinger
              </p>
            </div>
          </div>
        )}
        
        {/* Map Status Indicator */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={mapReady ? "default" : "secondary"} className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {mapReady ? "Kart lastet" : "Laster kart..."}
          </Badge>
        </div>
        
        {/* Refresh Button */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="outline" 
            size="sm"
            onClick={() => fetchMakers()}
            disabled={loading}
            className="bg-background/80 backdrop-blur-sm"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Debug Information Panel */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Kart Debug-informasjon
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Status</div>
            <div className="text-xs text-muted-foreground">
              Mapbox Token: {mapboxToken ? '✅' : '❌'}<br/>
              Kart Ready: {mapReady ? '✅' : '❌'}<br/>
              Laster: {loading ? '🔄' : '✅'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Markører</div>
            <div className="text-xs text-muted-foreground">
              Total i DB: {debugInfo.total}<br/>
              Synlige: {debugInfo.visible}<br/>
              Aktive: {markersRef.current.length}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Koordinater</div>
            <div className="text-xs text-muted-foreground max-h-16 overflow-y-auto">
              {makers.length > 0 ? (
                makers.map((maker, i) => (
                  <div key={i}>
                    {maker.display_name}: [{maker.longitude.toFixed(4)}, {maker.latitude.toFixed(4)}]
                  </div>
                ))
              ) : (
                'Ingen markører lastet'
              )}
            </div>
          </div>
        </div>
        
        {/* Errors */}
        {debugInfo.errors.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-destructive mb-2">Feil ({debugInfo.errors.length})</div>
            <div className="text-xs text-destructive space-y-1 max-h-20 overflow-y-auto">
              {debugInfo.errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Detailed Maker Information */}
        {makers.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">Lastet Makere ({makers.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {makers.map((maker, i) => (
                <div key={i} className="p-2 bg-muted rounded text-muted-foreground">
                  <div className="font-medium">{maker.display_name}</div>
                  <div>Pos: {maker.latitude.toFixed(6)}, {maker.longitude.toFixed(6)}</div>
                  <div>Adresse: {maker.address}</div>
                  <div>Avatar: {maker.avatar_url ? '✅' : '❌'}</div>
                  <div>ID: {maker.user_id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;