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
  const { toast } = useToast();

  // Initialize Mapbox token from environment
  useEffect(() => {
    // We'll use a default token for now, but in production this should come from edge function
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTEzcTZtZ3gwbW1rMmpxeWNvMjhsbjF3In0.DOcL8WrAQ3yWGKtgN0dGOw';
  }, []);

  // Fetch makers with map visibility enabled
  useEffect(() => {
    const fetchMakers = async () => {
      try {
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

        if (error) throw error;

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
        console.error('Error fetching makers:', error);
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
    if (!mapContainer.current) return;

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

    return () => {
      map.current?.remove();
    };
  }, []);

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
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Laster kart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-96 rounded-lg" />
      {makers.length === 0 && (
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