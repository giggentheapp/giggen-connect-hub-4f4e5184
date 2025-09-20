import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
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

interface LeafletFullscreenMapProps {
  onBack: () => void;
  onMakerClick: (userId: string) => void;
}

const LeafletFullscreenMap = ({ onBack, onMakerClick }: LeafletFullscreenMapProps) => {
  const [makers, setMakers] = useState<MakerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const fetchMakers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_all_visible_makers');
      
      if (error) throw error;

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
    fetchMakers();
  }, [fetchMakers]);

  const handleMakerClick = (maker: MakerData) => {
    onMakerClick(maker.user_id);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Laster kart...</p>
          <p className="text-muted-foreground">Henter makers fra databasen</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-2">Kunne ikke laste kart</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til dashboard
            </Button>
            <Badge variant="secondary">
              {makers.length} {makers.length === 1 ? 'maker' : 'makers'} synlige
            </Badge>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="pt-16 pb-16 h-full">
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
                <div className="p-3 min-w-[220px]">
                  <div className="flex items-center space-x-3 mb-3">
                    {maker.avatar_url ? (
                      <img 
                        src={maker.avatar_url} 
                        alt={maker.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {maker.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-base">{maker.display_name}</h3>
                      {maker.address && (
                        <p className="text-xs text-muted-foreground">{maker.address}</p>
                      )}
                    </div>
                  </div>
                  
                  {maker.bio && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {maker.bio}
                    </p>
                  )}
                  
                  <button 
                    className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    onClick={() => handleMakerClick(maker)}
                  >
                    Se profil
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <div className="bg-background/95 backdrop-blur-sm border-t">
          <div className="px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Kartinformasjon</span>
              {isInfoExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {isInfoExpanded && (
            <div className="px-4 pb-4 border-t bg-muted/20">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Hvordan bruke kartet:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Klikk på en markør for å se maker-info</li>
                  <li>• Bruk zoom-kontrollene for å navigere</li>
                  <li>• Klikk "Se profil" for å åpne makerprofilen</li>
                  <li>• Kun makers som har aktivert kartsynlighet vises</li>
                </ul>
                <p className="pt-2 text-xs text-muted-foreground">
                  Kartdata fra OpenStreetMap - gratis og åpen kilde
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeafletFullscreenMap;