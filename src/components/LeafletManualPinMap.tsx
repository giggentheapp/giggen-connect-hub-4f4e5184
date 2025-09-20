import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ManualPinMapProps {
  onCoordinatesSelected: (lat: number, lng: number, address?: string) => void;
  onCancel: () => void;
  initialCoordinates?: { lat: number; lng: number };
}

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const LeafletManualPinMap = ({ onCoordinatesSelected, onCancel, initialCoordinates }: ManualPinMapProps) => {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialCoordinates || null
  );
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
  };

  const handleSavePosition = async () => {
    if (!selectedCoords) return;

    // Try reverse geocoding to get address
    let address: string | undefined;
    
    try {
      setIsGeocodingAddress(true);
      
      // Use Nominatim (OpenStreetMap) reverse geocoding - free service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoords.lat}&lon=${selectedCoords.lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        address = data.display_name;
      }
    } catch (error) {
      console.warn('Could not reverse geocode coordinates:', error);
      // Continue without address - this is optional
    } finally {
      setIsGeocodingAddress(false);
    }

    onCoordinatesSelected(selectedCoords.lat, selectedCoords.lng, address);
  };

  const defaultCenter: [number, number] = initialCoordinates 
    ? [initialCoordinates.lat, initialCoordinates.lng]
    : [59.9139, 10.7522]; // Oslo sentrum

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Velg posisjon på kartet</CardTitle>
        <p className="text-sm text-muted-foreground">
          Klikk på kartet for å plassere en markør på ønsket posisjon
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 w-full rounded-lg overflow-hidden border">
          <MapContainer 
            center={defaultCenter}
            zoom={12} 
            className="w-full h-full"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedCoords && (
              <Marker position={[selectedCoords.lat, selectedCoords.lng]} />
            )}
          </MapContainer>
        </div>

        {selectedCoords && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p><strong>Valgte koordinater:</strong></p>
            <p>Breddegrad: {selectedCoords.lat.toFixed(6)}</p>
            <p>Lengdegrad: {selectedCoords.lng.toFixed(6)}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSavePosition} 
            disabled={!selectedCoords || isGeocodingAddress}
          >
            {isGeocodingAddress ? 'Henter adresse...' : 'Bruk denne posisjonen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeafletManualPinMap;