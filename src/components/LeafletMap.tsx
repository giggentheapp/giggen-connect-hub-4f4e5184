import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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

interface MakerData {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  bio?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public: boolean;
}

interface LeafletMapProps {
  className?: string;
  filterType?: 'makers' | 'events';
  onProfileClick?: (userId: string) => void;
}

export const LeafletMap = ({ className = "", filterType = 'makers', onProfileClick }: LeafletMapProps) => {
  const [makers, setMakers] = useState<MakerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMakers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_all_visible_makers');
      
      if (error) throw error;

      // Filter for makers with valid coordinates
      const validMakers = (data || []).filter(
        (maker: MakerData) => 
          maker.latitude && 
          maker.longitude && 
          maker.display_name
      );

      setMakers(validMakers);
    } catch (err: any) {
      console.error('Error fetching makers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filterType === 'makers') {
      fetchMakers();
    }
  }, [filterType, fetchMakers]);

  const handleMakerClick = (maker: MakerData) => {
    if (onProfileClick) {
      onProfileClick(maker.user_id);
    } else {
      navigate(`/profile/${maker.user_id}`);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-96 bg-muted/50 flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Laster kart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-96 bg-muted/50 flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-destructive mb-2">Kunne ikke laste kart</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-96 rounded-lg overflow-hidden ${className}`}>
      <MapContainer 
        center={[59.9139, 10.7522]} // Oslo sentrum
        zoom={10} 
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {makers.map((maker) => (
          <Marker 
            key={maker.user_id} 
            position={[maker.latitude!, maker.longitude!]}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center space-x-3 mb-2">
                  {maker.avatar_url && (
                    <img 
                      src={maker.avatar_url} 
                      alt={maker.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-base">{maker.display_name}</h3>
                    {maker.address && (
                      <p className="text-xs text-muted-foreground">{maker.address}</p>
                    )}
                  </div>
                </div>
                
                {maker.bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {maker.bio}
                  </p>
                )}
                
                <button 
                  className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  onClick={() => handleMakerClick(maker)}
                >
                  Se profil
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating badge with maker count */}
      <Badge 
        variant="secondary" 
        className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm"
      >
        {makers.length} {makers.length === 1 ? 'maker' : 'makers'} synlige
      </Badge>
    </div>
  );
};

export default LeafletMap;