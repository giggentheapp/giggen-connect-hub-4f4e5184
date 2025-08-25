import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
  className?: string;
  forceRefresh?: number;
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
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [makers, setMakers] = useState<MakerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { toast } = useToast();

  // Get Mapbox token
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const directToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (directToken && directToken !== 'undefined') {
          setMapboxToken(directToken);
          mapboxgl.accessToken = directToken;
          return;
        }
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
          return;
        }
        
        if (data?.token && data.token !== 'undefined') {
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
        }
      } catch (error: any) {
        setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
      }
    };
    
    getMapboxToken();
  }, []);

  // Fetch makers function
  const fetchMakers = useCallback(async (retryCount = 0) => {
      try {
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
          throw error;
        }
        
        const makersData = data?.map(maker => ({
          user_id: maker.user_id,
          display_name: maker.display_name,
          avatar_url: maker.avatar_url,
          latitude: parseFloat(maker.latitude?.toString() || '0'),
          longitude: parseFloat(maker.longitude?.toString() || '0'),
          address: maker.address
        })).filter(maker => {
          const isValid = !isNaN(maker.latitude) && !isNaN(maker.longitude) && 
                         maker.latitude !== 0 && maker.longitude !== 0 && maker.address;
          return isValid;
        }) || [];

        setMakers(makersData);
        
      } catch (error: any) {
        if (retryCount < 2) {
          setTimeout(() => fetchMakers(retryCount + 1), 1000);
          return;
        }
        
        const errorMsg = `Kunne ikke laste makere på kartet etter flere forsøk: ${error.message}`;
        
        toast({
          title: "Feil ved lasting av kart",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, [toast]);

  // Fetch makers on mount and refresh
  useEffect(() => {
    fetchMakers();
  }, [fetchMakers, forceRefresh]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) {
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [10.7461, 59.9127], // Oslo, Norway
        zoom: 10,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapReady(true);
      });

      map.current.on('error', (e) => {
        // Map error occurred
      });

    } catch (error: any) {
      toast({
        title: "Kartfeil",
        description: "Kunne ikke laste kartet",
        variant: "destructive",
      });
    }

    return () => {
      if (map.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, [mapboxToken, toast]);

  // Add markers when data is ready
  useEffect(() => {
    if (!map.current || !mapReady || !makers.length) {
      return;
    }

    // Clean up existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // Create markers for each maker
    makers.forEach((maker) => {
      try {
        if (isNaN(maker.latitude) || isNaN(maker.longitude)) {
          return;
        }
        
        // Create marker container
        const markerContainer = document.createElement('div');
        markerContainer.className = 'mapbox-marker-container';
        markerContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          cursor: pointer;
        `;

        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker';
        
        if (maker.avatar_url) {
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
          
          const initials = maker.display_name
            .split(' ')
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
          markerEl.textContent = initials;
        }

        // Create name label
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

        // Add hover effects
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

        markerContainer.appendChild(markerEl);
        markerContainer.appendChild(nameLabel);

        // Create popup
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

        // Add marker to map
        const markerCoords: [number, number] = [maker.longitude, maker.latitude];
        
        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: 'bottom'
        })
          .setLngLat(markerCoords)
          .setPopup(popup)
          .addTo(map.current!);
          
        markersRef.current.push(marker);
        
      } catch (error: any) {
        // Failed to create marker - continue with other markers
      }
    });

    // Fit map to show all markers
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
    }
    
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
    <div className={`relative w-full h-full ${className}`}>
      {/* Token Error Display */}
      {tokenError && (
        <div className="absolute top-4 right-4 z-10 bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-lg p-4 shadow-lg border max-w-md">
          <h3 className="font-semibold text-sm mb-2">Kartfeil</h3>
          <p className="text-xs">{tokenError}</p>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default Map;