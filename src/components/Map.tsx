import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
  className?: string;
}

interface MakerLocation {
  id: string;
  display_name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  address: string;
}

const Map: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [makers, setMakers] = useState<MakerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
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

  // Fetch makers with map visibility enabled
  useEffect(() => {
    const fetchMakers = async () => {
      try {
        console.log('[MAPBOX-ERROR] Starting to fetch public makers for map');
        
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            avatar_url,
            latitude,
            longitude,
            address,
            profile_settings!inner(show_on_map)
          `)
          .eq('role', 'maker')
          .eq('profile_settings.show_on_map', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .not('address', 'is', null);

        if (error) {
          console.error('[RLS-DENIED] Error fetching makers:', error.code, error.message, error.details);
          throw error;
        }

        console.log(`[MAPBOX-DEBUG] Successfully fetched ${data?.length || 0} public makers with address and coordinates`);

        const makersData = data?.filter(maker => {
          const hasValidCoordinates = maker.latitude && maker.longitude;
          const hasAddress = maker.address;
          console.log(`[MAPBOX-DEBUG] Processing maker ${maker.display_name}: lat=${maker.latitude}, lng=${maker.longitude}, address=${maker.address}, show_on_map=${maker.profile_settings?.show_on_map}`);
          if (!hasValidCoordinates || !hasAddress) {
            console.log(`[MAPBOX-FILTER] Skipping maker ${maker.display_name}: missing coordinates (${maker.latitude}, ${maker.longitude}) or address (${maker.address})`);
            return false;
          }
          return true;
        }).map(maker => ({
          id: maker.id,
          display_name: maker.display_name,
          avatar_url: maker.avatar_url,
          latitude: Number(maker.latitude),
          longitude: Number(maker.longitude),
          address: maker.address
        })) || [];

        console.log(`[MAPBOX-DEBUG] Final filtered makers data:`, makersData);
        setMakers(makersData);
        
        if (makersData.length > 0) {
          console.log('[MAPBOX-DEBUG] Makers ready for map display:', makersData.map(m => ({ 
            name: m.display_name, 
            hasAvatar: !!m.avatar_url, 
            coordinates: [m.longitude, m.latitude] 
          })));
        } else {
          console.log('[MAPBOX-DEBUG] No makers passed the filter - checking why...');
        }
      } catch (error: any) {
        console.error('[MAPBOX-ERROR] Error fetching makers:', error);
        toast({
          title: "Feil ved lasting av kart",
          description: "Kunne ikke laste makere på kartet",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMakers();
  }, [toast]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
    // Prevent double initialization
    if (map.current) {
      console.log('[MAPBOX-ERROR] Map already initialized, skipping');
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
        console.log('[MAPBOX-ERROR] Map successfully loaded with streets-v11 style');
      });

      map.current.on('error', (e) => {
        console.error('[MAPBOX-ERROR] Map error:', e.error);
      });

      console.log('[MAPBOX-ERROR] Map initialization completed');

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
        console.log('[MAPBOX-ERROR] Cleaning up map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, toast]);

  // Add markers when makers data is available
  useEffect(() => {
    if (!map.current || makers.length === 0) return;

    console.log(`[MAPBOX-ERROR] Adding ${makers.length} maker markers to map`);

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each maker
    makers.forEach((maker, index) => {
      console.log(`[MAPBOX-ERROR] Creating marker ${index + 1} for ${maker.display_name}`);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'mapbox-marker';
      
      if (maker.avatar_url) {
        // Custom profile picture marker
        markerEl.style.cssText = `
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          cursor: pointer;
          background-size: cover;
          background-position: center;
          background-image: url('${maker.avatar_url}');
          background-color: #f0f0f0;
          transition: all 0.2s ease;
          position: relative;
        `;
        
        // Add hover effect for profile pictures
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'scale(1.15)';
          markerEl.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
        });
        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        });
      } else {
        // Red standard pin for makers without profile picture
        markerEl.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: #dc2626;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transform: rotate(-45deg);
          position: relative;
          transition: transform 0.2s ease;
        `;
        
        // Add inner white dot for standard red pin
        const innerDot = document.createElement('div');
        innerDot.style.cssText = `
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        `;
        markerEl.appendChild(innerDot);
        
        // Hover effect for red pin
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'rotate(-45deg) scale(1.1)';
        });
        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'rotate(-45deg) scale(1)';
        });
      }

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
            href="/profile/${maker.id}" 
            style="display: inline-block; padding: 6px 12px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#b91c1c'"
            onmouseout="this.style.backgroundColor='#dc2626'"
          >
            Se profil
          </a>
        </div>
      `);

      // Add marker to map
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([maker.longitude, maker.latitude])
        .setPopup(popup)
        .addTo(map.current!);
        
      console.log(`[MAPBOX-ERROR] Marker added for ${maker.display_name} at [${maker.longitude}, ${maker.latitude}]`);
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
      
      console.log(`[MAPBOX-ERROR] Map bounds adjusted to show all ${makers.length} markers`);
    }
  }, [makers]);

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
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg" 
        style={{ minHeight: '400px' }}
      />
      {makers.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
          <div className="text-center p-6">
            <p className="text-muted-foreground font-medium mb-2">Ingen offentlige makere på kartet</p>
            <p className="text-sm text-muted-foreground">
              Makere må ha lagt inn adresse og aktivert "Vis meg på kart" i sine profilinnstillinger
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;