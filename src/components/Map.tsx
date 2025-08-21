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

  // Get Mapbox token from edge function
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        console.log('[ENV-CHECK] Attempting to fetch Mapbox token from edge function');
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('[MAPBOX-ERROR] Failed to get token from edge function:', error.message);
          setTokenError('Mapbox-token mangler. Legg inn gyldig token i miljøvariabler.');
          return;
        }
        
        if (data?.token) {
          console.log('[ENV-CHECK] Mapbox token successfully retrieved from edge function');
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          console.error('[MAPBOX-ERROR] No token returned from edge function');
          setTokenError('Mapbox-token mangler. Legg inn gyldig token i miljøvariabler.');
        }
      } catch (error: any) {
        console.error('[MAPBOX-ERROR] Error fetching token:', error.message);
        setTokenError('Mapbox-token mangler. Legg inn gyldig token i miljøvariabler.');
      }
    };
    
    getMapboxToken();
  }, []);

  // Fetch makers with map visibility enabled
  useEffect(() => {
    const fetchMakers = async () => {
      try {
        console.log('[MAPBOX-ERROR] Starting to fetch makers for map');
        
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
          .not('longitude', 'is', null);

        if (error) {
          console.error('[RLS-DENIED] Error fetching makers:', error.code, error.message, error.details);
          throw error;
        }

        console.log(`[MAPBOX-ERROR] Successfully fetched ${data?.length || 0} makers with map visibility`);

        const makersData = data?.map(maker => ({
          id: maker.id,
          display_name: maker.display_name,
          avatar_url: maker.avatar_url,
          latitude: Number(maker.latitude),
          longitude: Number(maker.longitude),
          address: maker.address
        })) || [];

        setMakers(makersData);
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
        style: 'mapbox://styles/mapbox/light-v11',
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
        console.log('[MAPBOX-ERROR] Map successfully loaded');
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

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each maker
    makers.forEach(maker => {
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'mapbox-marker';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        background-size: cover;
        background-position: center;
        background-image: url('${maker.avatar_url || '/placeholder.svg'}');
        background-color: #f0f0f0;
      `;

      // Create popup content
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="text-align: center; padding: 8px;">
          <img 
            src="${maker.avatar_url || '/placeholder.svg'}" 
            alt="${maker.display_name}"
            style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 8px; object-fit: cover;"
          />
          <h3 style="margin: 0 0 4px 0; font-weight: bold;">${maker.display_name}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${maker.address}</p>
          <a 
            href="/profile/${maker.id}" 
            style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #007cbf; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
          >
            Se profil
          </a>
        </div>
      `);

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([maker.longitude, maker.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit map to show all markers if we have any
    if (makers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      makers.forEach(maker => {
        bounds.extend([maker.longitude, maker.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
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
          <div className="text-center">
            <p className="text-muted-foreground">Ingen makere er synlige på kartet</p>
            <p className="text-sm text-muted-foreground mt-1">Makere må aktivere kartsynlighet i sine innstillinger</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;