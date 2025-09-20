import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MakerData {
  user_id: string;
  display_name: string;
  role: string;
  avatar_url: string;
  bio: string;
  address: string;
  latitude: number;
  longitude: number;
  is_address_public: boolean;
  created_at: string;
  id: string;
}

interface SafeLeafletMapProps {
  className?: string;
  filterType?: 'makers' | 'events';
  onProfileClick?: (makerId: string) => void;
}

const SafeLeafletMap: React.FC<SafeLeafletMapProps> = ({ 
  className = "", 
  filterType = 'makers', 
  onProfileClick 
}) => {
  const [mapError, setMapError] = useState(false);
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();

  const { data: makers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['visible-makers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_visible_makers');
        if (error) throw error;
        return data as MakerData[];
      } catch (error) {
        console.error('Error fetching makers:', error);
        throw error;
      }
    },
    enabled: isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleMakerClick = (makerId: string) => {
    if (onProfileClick) {
      onProfileClick(makerId);
    } else {
      navigate(`/profile/${makerId}`);
    }
  };

  if (!isOnline) {
    return (
      <div className={`w-full h-96 bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Ingen internetttilkobling</p>
            <p className="text-sm text-muted-foreground">Kart vil laste når tilkoblingen er tilbake</p>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`w-full h-96 bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <p className="text-lg font-medium">Kart kunne ikke lastes</p>
            <p className="text-sm text-muted-foreground">Det oppstod en feil ved lasting av kartet</p>
          </div>
          <Button 
            onClick={() => {
              setMapError(false);
              refetch();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Prøv igjen
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full h-96 bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Laster kart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-96 bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <p className="text-lg font-medium">Kunne ikke laste data</p>
            <p className="text-sm text-muted-foreground">Prøv å laste siden på nytt</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Last på nytt
          </Button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`relative w-full ${className}`}>
        <MapContainer 
          center={[59.9139, 10.7522]} 
          zoom={10} 
          className="w-full h-full rounded-lg"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          />
          
          {makers.map((maker) => (
            <Marker 
              key={maker.user_id} 
              position={[maker.latitude, maker.longitude]}
            >
              <Popup>
                <div className="p-3 min-w-[250px] max-w-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={maker.avatar_url} alt={maker.display_name} />
                      <AvatarFallback>
                        {maker.display_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{maker.display_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {maker.role}
                      </Badge>
                    </div>
                  </div>
                  
                  {maker.address && (
                    <p className="text-sm text-muted-foreground mb-2">{maker.address}</p>
                  )}
                  
                  {maker.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {maker.bio}
                    </p>
                  )}
                  
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleMakerClick(maker.user_id)}
                  >
                    Se profil
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Floating maker count */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {makers.length} {filterType === 'makers' ? 'makers' : 'events'} synlige
          </Badge>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    setMapError(true);
    return null;
  }
};

export default SafeLeafletMap;