import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ManualPinMapProps {
  onCoordinatesSelected: (lat: number, lng: number, address?: string) => void;
  onCancel: () => void;
  initialCoordinates?: { lat: number; lng: number };
}

const ManualPinMap: React.FC<ManualPinMapProps> = ({
  onCoordinatesSelected,
  onCancel,
  initialCoordinates
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialCoordinates || null
  );
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Get Mapbox token on component mount
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to get Mapbox token:', error);
      }
    };

    getMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoordinates ? [initialCoordinates.lng, initialCoordinates.lat] : [10.7461, 59.9127], // Oslo default
      zoom: initialCoordinates ? 15 : 10,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add click handler to place pin
    map.current.on('click', (e) => {
      const coords = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      };

      setSelectedCoords(coords);

      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.current!);
    });

    // Add initial marker if coordinates provided
    if (initialCoordinates) {
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([initialCoordinates.lng, initialCoordinates.lat])
        .addTo(map.current);
    }

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, initialCoordinates]);

  const handleSavePosition = async () => {
    if (!selectedCoords) return;

    try {
      // Try to reverse geocode to get address
      let address = '';
      if (mapboxToken) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedCoords.lng},${selectedCoords.lat}.json?access_token=${mapboxToken}&language=no`
        );
        if (response.ok) {
          const data = await response.json();
          address = data.features[0]?.place_name || '';
        }
      }

      onCoordinatesSelected(selectedCoords.lat, selectedCoords.lng, address);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Save without address if reverse geocoding fails
      onCoordinatesSelected(selectedCoords.lat, selectedCoords.lng);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Velg posisjon manuelt
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Klikk på kartet for å plassere en pin på ønsket posisjon
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border border-border"
          style={{ minHeight: '384px' }}
        />
        
        {selectedCoords && (
          <div className="p-3 bg-accent rounded-lg">
            <p className="text-sm font-medium">Valgt posisjon:</p>
            <p className="text-sm text-muted-foreground">
              Breddegrad: {selectedCoords.lat.toFixed(6)}
            </p>
            <p className="text-sm text-muted-foreground">
              Lengdegrad: {selectedCoords.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Avbryt
          </Button>
          <Button onClick={handleSavePosition} disabled={!selectedCoords}>
            <Save className="h-4 w-4 mr-1" />
            Bruk denne posisjonen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPinMap;