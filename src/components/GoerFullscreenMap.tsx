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
      
      // Create custom marker element with profile picture
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      
      const outerDiv = document.createElement('div');
      outerDiv.className = 'w-16 h-16 rounded-full border-4 border-white shadow-xl cursor-pointer transform transition-all duration-300 hover:scale-110 hover:shadow-2xl';
      outerDiv.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--ring)))';
      outerDiv.style.boxShadow = '0 8px 25px hsla(var(--primary) / 0.3), 0 0 0 2px hsl(var(--background))';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'w-12 h-12 rounded-full overflow-hidden bg-background/95 flex items-center justify-center m-auto mt-1';
      
      if (maker.avatar_url) {
        const img = document.createElement('img');
        img.src = maker.avatar_url;
        img.alt = maker.display_name || 'Maker Avatar';
        img.className = 'w-full h-full object-cover';
        img.onerror = () => {
          // Fallback to initials if image fails
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

      // Create popup content with safe DOM methods
      const popupContent = document.createElement('div');
      popupContent.className = 'p-4 max-w-sm';
      
      const container = document.createElement('div');
      container.className = 'space-y-3';
      
      const header = document.createElement('div');
      header.className = 'flex items-center gap-3';
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center';
      
      if (maker.avatar_url) {
        const img = document.createElement('img');
        img.src = maker.avatar_url;
        img.alt = maker.display_name || 'Maker Avatar';
        img.className = 'w-full h-full object-cover';
        img.onerror = () => {
          // Fallback to initials if image fails
          img.style.display = 'none';
          const initialsEl = document.createElement('div');
          initialsEl.className = 'w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold';
          initialsEl.textContent = maker.display_name?.charAt(0).toUpperCase() || 'M';
          avatarDiv.appendChild(initialsEl);
        };
        avatarDiv.appendChild(img);
      } else {
        const initialsEl = document.createElement('div');
        initialsEl.className = 'w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold';
        initialsEl.textContent = maker.display_name?.charAt(0).toUpperCase() || 'M';
        avatarDiv.appendChild(initialsEl);
      }
      
      const textDiv = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'font-semibold text-lg';
      title.textContent = maker.display_name || 'Unknown Maker';
      
      const subtitle = document.createElement('p');
      subtitle.className = 'text-sm text-gray-600';
      subtitle.textContent = 'Maker';
      
      textDiv.appendChild(title);
      textDiv.appendChild(subtitle);
      header.appendChild(avatarDiv);
      header.appendChild(textDiv);
      container.appendChild(header);
      
      if (maker.bio) {
        const bioP = document.createElement('p');
        bioP.className = 'text-sm text-gray-700 line-clamp-3';
        bioP.textContent = maker.bio;
        container.appendChild(bioP);
      }
      
      if (maker.address) {
        const addressDiv = document.createElement('div');
        addressDiv.className = 'flex items-center gap-2 text-sm text-gray-600';
        
        const addressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        addressSvg.setAttribute('class', 'w-4 h-4');
        addressSvg.setAttribute('fill', 'currentColor');
        addressSvg.setAttribute('viewBox', '0 0 20 20');
        
        const addressPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        addressPath.setAttribute('fill-rule', 'evenodd');
        addressPath.setAttribute('d', 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z');
        addressPath.setAttribute('clip-rule', 'evenodd');
        
        const addressSpan = document.createElement('span');
        addressSpan.textContent = maker.address;
        
        addressSvg.appendChild(addressPath);
        addressDiv.appendChild(addressSvg);
        addressDiv.appendChild(addressSpan);
        container.appendChild(addressDiv);
      }
      
      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'flex pt-2';
      
      const viewButton = document.createElement('button');
      viewButton.className = 'view-profile-btn w-full bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors';
      viewButton.textContent = 'Se profil';
      
      buttonDiv.appendChild(viewButton);
      container.appendChild(buttonDiv);
      popupContent.appendChild(container);

      // Add event listeners to popup content
      const viewProfileBtn = popupContent.querySelector('.view-profile-btn');
      
      if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
          if (onMakerClick) {
            onMakerClick(maker.user_id);
          }
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
  }, [makers, mapReady, onMakerClick]);

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
      {/* Map Container - Full Screen */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating Sidebar - Flies in from left */}
      <div 
        className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className={cn(
          "h-full bg-card/95 backdrop-blur-sm border-r border-border shadow-lg transition-all duration-300 overflow-y-auto",
          isExpanded ? "w-64" : "w-16"
        )}>
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              {isExpanded && (
                <span className="font-bold text-lg text-foreground opacity-0 animate-fade-in">
                  UTFORSK
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-2">
            <button
              onClick={onBack}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {isExpanded && (
                <span className="opacity-0 animate-fade-in flex-1">
                  Tilbake til dashboard
                </span>
              )}
            </button>

            {/* Makers Stats */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <Users className="h-5 w-5 flex-shrink-0 text-primary" />
                {isExpanded && (
                  <div className="opacity-0 animate-fade-in flex-1">
                    <p className="text-sm font-medium">{makers.length} Makers</p>
                    <p className="text-xs text-muted-foreground">Synlige på kartet</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-3 py-2">
                <Search className="h-5 w-5 flex-shrink-0 text-primary" />
                {isExpanded && (
                  <div className="opacity-0 animate-fade-in flex-1">
                    <p className="text-sm font-medium">Utforsk</p>
                    <p className="text-xs text-muted-foreground">Klikk på markører for detaljer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Makers */}
            {isExpanded && makers.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground px-3 mb-2 opacity-0 animate-fade-in">
                  Nylige makers
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {makers.slice(0, 5).map((maker) => (
                    <button
                      key={maker.id}
                      onClick={() => onMakerClick && onMakerClick(maker.user_id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left hover:bg-accent/50 opacity-0 animate-fade-in"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{maker.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {maker.address || 'Maker'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Floating Makers Count Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border shadow-lg"
        >
          <MapPin className="w-4 h-4" />
          {makers.length} makers
        </Badge>
      </div>

      {/* Floating Instructions */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <Card className="bg-background/95 backdrop-blur-sm border shadow-lg pointer-events-auto">
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