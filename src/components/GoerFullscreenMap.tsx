import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, User, Users, Search, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapboxConfig } from '@/hooks/useMapboxConfig';

interface GoerFullscreenMapProps {
  onBack: () => void;
  onMakerClick?: (makerId: string) => void;
  userId?: string;
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

const GoerFullscreenMap = ({ onBack, onMakerClick, userId }: GoerFullscreenMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [makers, setMakers] = useState<MakerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();

  // Get mapbox configuration (user's custom or system default)
  const { config: mapboxConfig, loading: configLoading } = useMapboxConfig(userId);

  // Fetch Mapbox token from config or edge function
  useEffect(() => {
    if (mapboxConfig.accessToken && !configLoading) {
      console.log('🗺️ GoerFullscreenMap using custom token:', mapboxConfig.accessToken.substring(0, 20) + '...');
      setMapToken(mapboxConfig.accessToken);
      setTokenError(null);
      return;
    }

    if (!configLoading && !mapboxConfig.accessToken) {
      console.log('🔄 GoerFullscreenMap: No user config, falling back to system token');
      // Fallback to edge function if no user config
      const fetchToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-mapbox-token');
          
          if (error) throw error;
          
          if (data?.token) {
            // Ensure we only use public tokens for map rendering
            if (data.token.startsWith('pk.')) {
              console.log('✅ GoerFullscreenMap using system public token:', data.token.substring(0, 20) + '...');
              setMapToken(data.token);
            } else {
              throw new Error('System token is not a public token (must start with pk.)');
            }
          } else {
            throw new Error('No token received from function');
          }
        } catch (error: any) {
          console.error('❌ GoerFullscreenMap token error:', error);
          setTokenError(`Mapbox token error: ${error.message}`);
        }
      };

      fetchToken();
    }
  }, [mapboxConfig, configLoading, userId]);

  // Fetch makers data
  const fetchMakers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the same secure data access method as other components
      const { data, error } = await supabase
        .rpc('get_all_visible_makers');

      if (error) throw error;
      
      // Transform data to match expected format
      const makersData = data?.filter(maker => 
        maker.latitude && maker.longitude && maker.address
      ).map(maker => ({
        id: maker.id,
        user_id: maker.user_id,
        display_name: maker.display_name,
        bio: maker.bio,
        latitude: parseFloat(maker.latitude?.toString() || '0'),
        longitude: parseFloat(maker.longitude?.toString() || '0'),
        is_address_public: maker.is_address_public,
        avatar_url: maker.avatar_url,
        address: maker.address
      })) || [];
      
      setMakers(makersData);
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
    if (!mapContainer.current || !mapToken || configLoading) return;

    console.log('🗺️ GoerFullscreenMap using token:', mapToken.substring(0, 20) + '...');
    console.log('🎨 Color-enabled Mapbox token loaded!');
    console.log('🎨 Using style URL:', mapboxConfig.styleUrl);
    mapboxgl.accessToken = mapToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapboxConfig.styleUrl || 'mapbox://styles/mapbox/light-v11',
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
  }, [mapToken, mapboxConfig.styleUrl, configLoading]);

  // Add markers when map is ready and makers are loaded
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
      bounds.extend(coordinates);
      hasValidCoordinates = true;
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker cursor-pointer transform transition-all duration-300 hover:scale-110';
      
      const outerDiv = document.createElement('div');
      outerDiv.className = 'w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center';
      outerDiv.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))';
      outerDiv.style.boxShadow = '0 8px 25px hsla(var(--primary) / 0.3)';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'w-12 h-12 rounded-full overflow-hidden bg-background/95 flex items-center justify-center';
      
      if (maker.avatar_url) {
        const img = document.createElement('img');
        img.src = maker.avatar_url;
        img.alt = maker.display_name || 'Maker Avatar';
        img.className = 'w-full h-full object-cover';
        img.onerror = () => {
          img.style.display = 'none';
          const initialsEl = document.createElement('div');
          initialsEl.className = 'w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold';
          initialsEl.textContent = maker.display_name?.charAt(0).toUpperCase() || 'M';
          innerDiv.appendChild(initialsEl);
        };
        innerDiv.appendChild(img);
      } else {
        const initialsEl = document.createElement('div');
        initialsEl.className = 'w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold';
        initialsEl.textContent = maker.display_name?.charAt(0).toUpperCase() || 'M';
        innerDiv.appendChild(initialsEl);
      }
      
      outerDiv.appendChild(innerDiv);
      markerElement.appendChild(outerDiv);
      
      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              ${maker.avatar_url 
                ? `<img src="${maker.avatar_url}" alt="${maker.display_name}" class="w-full h-full object-cover" />` 
                : `<div class="text-sm font-bold text-primary">${maker.display_name?.charAt(0).toUpperCase() || 'M'}</div>`
              }
            </div>
            <div>
              <h3 class="font-semibold text-sm">${maker.display_name || 'Ukjent Maker'}</h3>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Aktiv
              </div>
            </div>
          </div>
          ${maker.bio ? `<p class="text-xs text-muted-foreground mb-2">${maker.bio.substring(0, 100)}${maker.bio.length > 100 ? '...' : ''}</p>` : ''}
          <div class="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            ${maker.address || 'Lokasjon ikke oppgitt'}
          </div>
          <button 
            class="w-full px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
            onclick="window.handleMakerClick && window.handleMakerClick('${maker.user_id}')"
          >
            Se profil
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);

      // Handle marker click
      markerElement.addEventListener('click', () => {
        popup.addTo(map.current!);
      });
    });

    // Set up global handler for maker clicks
    (window as any).handleMakerClick = (makerId: string) => {
      if (onMakerClick) {
        onMakerClick(makerId);
      }
    };

    // Fit map to show all markers with some padding
    if (hasValidCoordinates) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12
      });
    }

  }, [mapReady, makers, onMakerClick]);

  if (tokenError) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold mb-2">Kartfeil</h2>
          <p className="text-muted-foreground mb-4">{tokenError}</p>
          <Button onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold">Utforsk makers</span>
            <Badge variant="secondary">{makers.length}</Badge>
          </div>
          
          <div className="w-20" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Loading Overlay */}
      {(loading || !mapToken) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              {!mapToken ? 'Laster kart...' : 'Henter makers...'}
            </p>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className={cn(
        "absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg transition-all duration-300 z-10",
        isExpanded ? "h-48" : "h-auto"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Makers på kartet
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Skjul' : 'Vis mer'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-2">
            Klikk på en markør for å se profil og kontaktinfo
          </p>
          
          {isExpanded && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                • Kun makers som har gjort lokasjon synlig vises
              </div>
              <div className="text-xs text-muted-foreground">
                • Bruk zoom og pan for å utforske området
              </div>
              <div className="text-xs text-muted-foreground">
                • Kontakt makers direkte gjennom deres profil
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
};

export default GoerFullscreenMap;