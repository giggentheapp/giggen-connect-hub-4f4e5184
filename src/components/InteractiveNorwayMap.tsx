import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Maker {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  city: string;
  x: number;
  y: number;
}

const InteractiveNorwayMap = () => {
  const [selectedMaker, setSelectedMaker] = useState<Maker | null>(null);
  const [makers, setMakers] = useState<Maker[]>([]);
  const [viewMode, setViewMode] = useState('map');

  useEffect(() => {
    fetchMakersForMap();
  }, []);

  const fetchMakersForMap = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_all_visible_makers');
      
      if (!error && data) {
        const mappedMakers = data.map((maker: any) => ({
          ...maker,
          city: extractCityFromAddress(maker.address),
          ...getCoordinatesForCity(extractCityFromAddress(maker.address))
        }));
        setMakers(mappedMakers);
      } else {
        setMakers(getDummyMakers());
      }
    } catch (err) {
      console.log('Using dummy data for demo');
      setMakers(getDummyMakers());
    }
  };

  const extractCityFromAddress = (address: string | null): string => {
    if (!address) return 'Oslo';
    const cities = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Kristiansand', 'Bodø'];
    const foundCity = cities.find(city => address.toLowerCase().includes(city.toLowerCase()));
    return foundCity || 'Oslo';
  };

  const getDummyMakers = (): Maker[] => [
    { 
      id: '1', 
      user_id: '1',
      display_name: 'Jazz Ensemble Oslo', 
      bio: 'Profesjonell jazztrio for alle anledninger',
      x: 300, 
      y: 400, 
      city: 'Oslo' 
    },
    { 
      id: '2', 
      user_id: '2',
      display_name: 'Bergen Blues Band', 
      bio: 'Autentisk blues fra vestlandet',
      x: 150, 
      y: 350, 
      city: 'Bergen' 
    },
    { 
      id: '3', 
      user_id: '3',
      display_name: 'Trondheim Folk Trio', 
      bio: 'Tradisjonell norsk folkemusikk',
      x: 280, 
      y: 200, 
      city: 'Trondheim' 
    },
    { 
      id: '4', 
      user_id: '4',
      display_name: 'Stavanger Rock', 
      bio: 'Energisk rock og moderne covers',
      x: 120, 
      y: 450, 
      city: 'Stavanger' 
    },
    { 
      id: '5', 
      user_id: '5',
      display_name: 'Tromsø Acoustic', 
      bio: 'Akustisk musikk fra nord',
      x: 270, 
      y: 80, 
      city: 'Tromsø' 
    }
  ];

  const getCoordinatesForCity = (city: string) => {
    const cityCoords: Record<string, { x: number; y: number }> = {
      'Oslo': { x: 300, y: 400 },
      'Bergen': { x: 150, y: 350 },
      'Trondheim': { x: 280, y: 200 },
      'Stavanger': { x: 120, y: 450 },
      'Tromsø': { x: 270, y: 80 },
      'Kristiansand': { x: 180, y: 480 },
      'Bodø': { x: 250, y: 120 }
    };
    return cityCoords[city] || { x: 250, y: 300 };
  };

  const handleProfileClick = (maker: Maker) => {
    console.log('Demo: Se profil for', maker.display_name);
    // For MVP demo - kan kobles til profil modal senere
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden shadow-lg">
      {/* Toggle button */}
      <button 
        className="absolute top-4 right-4 z-20 bg-card px-4 py-2 rounded-lg shadow-md border backdrop-blur-sm"
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
      >
        {viewMode === 'map' ? '📋 Liste' : '🗺️ Kart'}
      </button>

      {viewMode === 'map' ? (
        <>
          {/* SVG Norge-kart */}
          <svg
            viewBox="0 0 400 600"
            className="w-full h-full cursor-pointer"
            style={{ background: 'linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--muted-foreground) / 0.1))' }}
          >
            {/* Norge outline (forenklet) */}
            <path
              d="M120,500 L100,480 L90,450 L85,400 L90,350 L100,300 L110,250 L130,200 L150,150 L180,120 L220,100 L260,90 L300,85 L330,90 L350,110 L370,140 L380,180 L385,220 L390,260 L385,300 L380,340 L370,380 L360,420 L350,460 L330,490 L300,510 L260,520 L220,515 L180,500 L150,485 Z"
              fill="hsl(var(--accent))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Fjorder og detaljer */}
            <path
              d="M150,350 L140,360 L145,370 L155,365 Z"
              fill="hsl(var(--primary) / 0.3)"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />
            <path
              d="M280,200 L275,210 L285,215 L290,205 Z"
              fill="hsl(var(--primary) / 0.3)"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />

            {/* Maker markers */}
            {makers.map((maker) => (
              <g key={maker.id}>
                {/* Marker shadow */}
                <circle
                  cx={maker.x + 2}
                  cy={maker.y + 2}
                  r="10"
                  fill="rgba(0,0,0,0.2)"
                />
                {/* Main marker */}
                <circle
                  cx={maker.x}
                  cy={maker.y}
                  r="10"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth="3"
                  className="cursor-pointer hover:opacity-80 transition-all duration-200"
                  onClick={() => setSelectedMaker(maker)}
                />
                {/* Pulse animation for active marker */}
                {selectedMaker?.id === maker.id && (
                  <circle
                    cx={maker.x}
                    cy={maker.y}
                    r="15"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
              </g>
            ))}
            
            {/* City labels */}
            <text x="300" y="435" textAnchor="middle" className="text-sm font-bold fill-foreground">Oslo</text>
            <text x="150" y="380" textAnchor="middle" className="text-sm font-bold fill-foreground">Bergen</text>
            <text x="280" y="190" textAnchor="middle" className="text-sm font-bold fill-foreground">Trondheim</text>
            <text x="120" y="485" textAnchor="middle" className="text-sm font-bold fill-foreground">Stavanger</text>
            <text x="270" y="70" textAnchor="middle" className="text-sm font-bold fill-foreground">Tromsø</text>
          </svg>

          {/* Info panel */}
          <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-md border">
            <h3 className="font-semibold text-foreground mb-1">Musikere i Norge</h3>
            <p className="text-sm text-muted-foreground">{makers.length} aktive musikere</p>
            <p className="text-xs text-muted-foreground mt-1">Klikk på markører for info</p>
          </div>

          {/* Selected maker popup */}
          {selectedMaker && (
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border max-w-xs animate-fade-in">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-foreground">{selectedMaker.display_name}</h3>
                <button
                  onClick={() => setSelectedMaker(null)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{selectedMaker.bio || 'Musiker i nettverket'}</p>
              <p className="text-xs text-primary mb-3">📍 {selectedMaker.city}</p>
              <button 
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                onClick={() => handleProfileClick(selectedMaker)}
              >
                Se profil
              </button>
            </div>
          )}
        </>
      ) : (
        /* Liste-visning */
        <div className="h-full p-4 bg-card/95 backdrop-blur-sm">
          <h3 className="font-semibold mb-4 text-foreground">Musikere i nettverket</h3>
          <div className="space-y-3 overflow-y-auto" style={{height: 'calc(100% - 60px)'}}>
            {makers.map((maker) => (
              <div 
                key={maker.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setSelectedMaker(maker)}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{maker.display_name}</h4>
                  <p className="text-sm text-muted-foreground">{maker.bio || 'Musiker i nettverket'}</p>
                  <p className="text-xs text-primary">📍 {maker.city}</p>
                </div>
                <button 
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(maker);
                  }}
                >
                  Se profil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveNorwayMap;