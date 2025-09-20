import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';

interface Maker {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  latitude: number;
  longitude: number;
}

interface MVPDemoMapProps {
  makers?: Maker[];
}

const MVPDemoMap = ({ makers: propMakers }: MVPDemoMapProps) => {
  const [makers, setMakers] = useState<Maker[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Fix Leaflet icons and ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // CRITICAL: Fix marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
  
  // Hent makers fra database eller bruk props
  useEffect(() => {
    if (propMakers && propMakers.length > 0) {
      setMakers(propMakers.filter(m => m.latitude && m.longitude));
    } else {
      fetchMakersForMap();
    }
  }, [propMakers]);
  
  const fetchMakersForMap = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_all_visible_makers')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      if (!error && data) {
        setMakers(data);
      } else {
        // For MVP: Bruk dummy data hvis database feiler
        setMakers(getDummyMakers());
      }
    } catch (err) {
      console.log('Error fetching makers:', err);
      setMakers(getDummyMakers());
    }
  };
  
  // Dummy data for demo hvis database ikke fungerer
  const getDummyMakers = (): Maker[] => [
    { 
      id: '1', 
      user_id: '1',
      display_name: 'Jazz Trio Oslo', 
      bio: 'Profesjonell jazztrio', 
      latitude: 59.9139, 
      longitude: 10.7522 
    },
    { 
      id: '2', 
      user_id: '2',
      display_name: 'Akustisk Duo', 
      bio: 'Akustisk musikk for alle anledninger', 
      latitude: 59.9239, 
      longitude: 10.7422 
    },
    { 
      id: '3', 
      user_id: '3',
      display_name: 'DJ Elektronika', 
      bio: 'Moderne elektronisk musikk', 
      latitude: 59.9039, 
      longitude: 10.7622 
    },
    { 
      id: '4', 
      user_id: '4',
      display_name: 'Rock Band Bergen', 
      bio: 'Energisk rock og pop', 
      latitude: 60.3913, 
      longitude: 5.3221 
    },
    { 
      id: '5', 
      user_id: '5',
      display_name: 'Klassisk Kvartett', 
      bio: 'Klassisk musikk av høy kvalitet', 
      latitude: 59.9339, 
      longitude: 10.7122 
    }
  ];
  
  const handleProfileClick = (maker: Maker) => {
    console.log('Demo: Se profil for', maker.display_name);
    // For MVP demo - kan kobles til profil modal senere
  };
  
  // Don't render until client-side is ready
  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground">Laster kart...</p>
      </div>
    );
  }
  
  try {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
        <MapContainer 
          center={[59.9139, 10.7522]} // Oslo
          zoom={8} 
          className="w-full h-full"
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {makers.map((maker) => (
            <Marker 
              key={maker.id} 
              position={[maker.latitude, maker.longitude]}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <h3 className="font-bold text-base mb-1">{maker.display_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {maker.bio || 'Musiker i nettverket'}
                  </p>
                  <button 
                    className="w-full px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                    onClick={() => handleProfileClick(maker)}
                  >
                    Se profil
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="w-full h-96 bg-red-50 flex items-center justify-center rounded-lg">
        <p className="text-destructive">Kart kunne ikke lastes</p>
      </div>
    );
  }
};

export default MVPDemoMap;