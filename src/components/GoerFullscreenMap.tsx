import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, User, Heart } from 'lucide-react';

interface GoerFullscreenMapProps {
  onBack: () => void;
  onMakerClick?: (makerId: string) => void;
}

interface MakerData {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  avatar_url: string | null;
  address: string | null;
}

const GoerFullscreenMap = ({ onBack, onMakerClick }: GoerFullscreenMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [makers, setMakers] = useState<MakerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // First try environment variable (if available in development)
        const envToken = import.meta.env?.VITE_MAPBOX_TOKEN;
        if (envToken) {
          setMapToken(envToken);
          return;
        }

        // Fallback to Supabase function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) throw error;
        
        if (data?.token) {
          setMapToken(data.token);
        } else {
          throw new Error('No token received from function');
        }
      } catch (error: any) {
        console.error('Error fetching Mapbox token:', error);
        setTokenError(error.message);
      }
    };

    fetchToken();
  }, []);

  // Fetch makers data
  const fetchMakers = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'maker')
        .eq('is_address_public', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      
      setMakers(data || []);
    } catch (error: any) {
      console.error('Error fetching makers:', error);
      toast({
        title: "Feil ved lasting av makers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMakers();
  }, [fetchMakers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7522, 59.9139], // Oslo coordinates
        zoom: 10,
        pitch: 0,
      });

      // Add navigation controls
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
        console.error('Map error:', e);
        setTokenError('Feil ved lasting av kart');
      });

      return () => {
        // Clean up markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        
        // Clean up map
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error: any) {
      console.error('Error initializing map:', error);
      setTokenError('Kunne ikke initialisere kart');
    }
  }, [mapToken]);

  // Add markers for makers
  useEffect(() => {
    if (!map.current || !mapReady || makers.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    makers.forEach((maker) => {
      if (!maker.latitude || !maker.longitude) return;

      const coordinates: [number, number] = [maker.longitude, maker.latitude];
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.innerHTML = `
        <div class="w-12 h-12 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110">
          <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      `;

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-4 max-w-sm';
      popupContent.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-lg">${maker.display_name}</h3>
              <p class="text-sm text-gray-600">Maker</p>
            </div>
          </div>
          
          ${maker.bio ? `<p class="text-sm text-gray-700 line-clamp-3">${maker.bio}</p>` : ''}
          
          ${maker.address ? `
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              <span>${maker.address}</span>
            </div>
          ` : ''}
          
          <div class="flex gap-2 pt-2">
            <button class="view-profile-btn flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Se profil
            </button>
            <button class="favorite-btn w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors ${favorites.has(maker.user_id) ? 'text-red-500' : 'text-gray-500'}">
              <svg class="w-5 h-5" fill="${favorites.has(maker.user_id) ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      `;

      // Add event listeners to popup content
      const viewProfileBtn = popupContent.querySelector('.view-profile-btn');
      const favoriteBtn = popupContent.querySelector('.favorite-btn');
      
      if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
          if (onMakerClick) {
            onMakerClick(maker.user_id);
          }
        });
      }

      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
          setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(maker.user_id)) {
              newFavorites.delete(maker.user_id);
              toast({
                title: "Fjernet fra favoritter",
                description: `${maker.display_name} er fjernet fra favorittene dine`,
              });
            } else {
              newFavorites.add(maker.user_id);
              toast({
                title: "Lagt til i favoritter",
                description: `${maker.display_name} er lagt til i favorittene dine`,
              });
            }
            return newFavorites;
          });
        });
      }

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 25,
        className: 'maker-popup'
      }).setDOMContent(popupContent);

      // Create and add marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
      bounds.extend(coordinates);
      hasValidCoordinates = true;
    });

    // Fit map to show all markers
    if (hasValidCoordinates && map.current) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [makers, mapReady, favorites, onMakerClick, toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg">Laster kart...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Kartfeil</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Kunne ikke laste kartet: {tokenError}</p>
            <Button onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {makers.length} makers
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {favorites.size} favoritter
            </Badge>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 pt-20"
        style={{ width: '100%', height: 'calc(100% - 5rem)' }}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <Card className="bg-background/95 backdrop-blur-sm pointer-events-auto">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Klikk på en markør for å se maker-detaljer og gå til profilen deres
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoerFullscreenMap;