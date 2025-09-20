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
        // Only use the Supabase edge function (VITE_* env vars not supported in Lovable)
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          setTokenError('Mapbox token ikke tilgjengelig. Kontakt support.');
          return;
        }
        
        if (data?.token && data.token !== 'undefined') {
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          setTokenError('Mapbox token ikke tilgjengelig. Kontakt support.');
        }
      } catch (error: any) {
        console.error('Error getting Mapbox token:', error);
        setTokenError('Feil ved lasting av kart. Prøv igjen senere.');
      }
    };
    
    getMapboxToken();
  }, []);

  // Fetch makers function
  const fetchMakers = useCallback(async (retryCount = 0) => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_all_visible_makers');

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
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7461, 59.9127], // Oslo, Norway
        zoom: 10,
        pitch: 15,
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

        // Create marker element with profile picture
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker';
        
        // Always create a colorful circular marker with gradient border
        markerEl.style.cssText = `
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 4px solid transparent;
          background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%)) border-box;
          box-shadow: 0 6px 20px hsla(222.2 47.4% 11.2% / 0.3), 0 0 0 2px hsl(0 0% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
          overflow: hidden;
        `;

        // Inner container for avatar or initials
        const innerEl = document.createElement('div');
        innerEl.style.cssText = `
          width: 52px;
          height: 52px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(0 0% 100%);
        `;
        
        if (maker.avatar_url) {
          const img = document.createElement('img');
          img.src = maker.avatar_url;
          img.alt = maker.display_name;
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
          `;
          img.onerror = () => {
            // Fallback to initials if image fails to load
            img.style.display = 'none';
            const initialsEl = document.createElement('div');
            initialsEl.style.cssText = `
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%));
              display: flex;
              align-items: center;
              justify-content: center;
              color: hsl(0 0% 100%);
              font-weight: bold;
              font-size: 18px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            const initials = maker.display_name
              .split(' ')
              .map(name => name.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase();
            initialsEl.textContent = initials;
            innerEl.appendChild(initialsEl);
          };
          innerEl.appendChild(img);
        } else {
          const initialsEl = document.createElement('div');
          initialsEl.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%));
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(0 0% 100%);
            font-weight: bold;
            font-size: 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `;
          const initials = maker.display_name
            .split(' ')
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
          initialsEl.textContent = initials;
          innerEl.appendChild(initialsEl);
        }
        
        markerEl.appendChild(innerEl);

        // Create name label with enhanced styling
        const nameLabel = document.createElement('div');
        nameLabel.className = 'mapbox-marker-name';
        nameLabel.textContent = maker.display_name;
        nameLabel.style.cssText = `
          background: hsla(222.2 47.4% 11.2% / 0.9);
          color: hsl(0 0% 100%);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
          margin-top: 8px;
          box-shadow: 0 4px 16px hsla(222.2 47.4% 11.2% / 0.2);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          pointer-events: none;
          border: 1px solid hsla(0 0% 100% / 0.1);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Add hover effects
        const addHoverEffects = () => {
          markerEl.style.transform = 'scale(1.15)';
          markerEl.style.boxShadow = '0 8px 25px hsla(222.2 47.4% 11.2% / 0.4), 0 0 0 3px hsl(217.2 91.2% 59.8% / 0.3)';
          nameLabel.style.background = 'hsla(222.2 47.4% 11.2% / 0.95)';
          nameLabel.style.transform = 'scale(1.05)';
          nameLabel.style.color = 'hsl(0 0% 100%)';
        };

        const removeHoverEffects = () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = '0 6px 20px hsla(222.2 47.4% 11.2% / 0.3), 0 0 0 2px hsl(0 0% 100%)';
          nameLabel.style.background = 'hsla(222.2 47.4% 11.2% / 0.8)';
          nameLabel.style.transform = 'scale(1)';
          nameLabel.style.color = 'hsl(0 0% 100%)';
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