import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  ticket_price: number | null;
  venue_latitude?: number | null;
  venue_longitude?: number | null;
  // Additional fields from events_market table
  created_at: string;
  created_by: string;
  event_datetime: string;
  expected_audience: number;
  is_public: boolean;
  portfolio_id: string;
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

interface MapBackgroundProps {
  userId?: string;
  onProfileClick?: (userId: string) => void;
  filterType?: 'makers' | 'events';
}

export const MapBackground = ({ userId, onProfileClick, filterType = 'makers' }: MapBackgroundProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [makers, setMakers] = useState<MakerData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      // Use new function for getting all visible makers
      const { data: makersData, error: makersError } = await supabase
        .rpc('get_all_visible_makers');

      if (makersError) throw makersError;

      // Filter makers with valid coordinates 
      const validMakers = (makersData || []).filter(maker => 
        maker.latitude && maker.longitude
      );

      console.log('📍 MapBackground: Loaded makers for map:', validMakers.length);
      
      setMakers(validMakers || []);
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

  // Fetch events data
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events_market')
        .select('*')
        .eq('is_public', true)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      console.log('📍 MapBackground: Loaded events for map:', eventsData?.length || 0);
      
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Feil ved lasting av arrangementer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (filterType === 'makers') {
      fetchMakers();
    } else if (filterType === 'events') {
      fetchEvents();
    }
  }, [fetchMakers, fetchEvents, filterType]);

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

  // Add markers for makers and events
  useEffect(() => {
    if (!map.current || !mapReady) return;
    if (filterType === 'makers' && makers.length === 0) return;
    if (filterType === 'events' && events.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    if (filterType === 'makers') {
      makers.forEach((maker) => {
        if (!maker.latitude || !maker.longitude) return;

        const coordinates: [number, number] = [maker.longitude, maker.latitude];
        
        // Create custom marker element for makers
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

        // Create popup content for makers
        const popupContent = document.createElement('div');
        popupContent.className = 'maker-popup-content max-w-sm p-4';
        popupContent.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                ${maker.avatar_url ? 
                  `<img src="${maker.avatar_url}" alt="${maker.display_name}" class="w-full h-full object-cover" />` :
                  `<span class="text-primary-foreground text-sm font-bold">${maker.display_name?.charAt(0) || 'M'}</span>`
                }
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-base">${maker.display_name}</h3>
                <p class="text-sm text-muted-foreground mt-1 line-clamp-2">${maker.bio || 'Ingen beskrivelse tilgjengelig'}</p>
                ${maker.address ? `<p class="text-xs text-muted-foreground mt-1 flex items-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>${maker.address}</p>` : ''}
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t">
              <button class="view-profile-btn flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Se profil
              </button>
            </div>
          </div>
        `;

        // Add event listeners to popup content
        const viewProfileBtn = popupContent.querySelector('.view-profile-btn');
        
        if (viewProfileBtn) {
          viewProfileBtn.addEventListener('click', () => {
            if (onProfileClick) {
              onProfileClick(maker.user_id);
            } else {
              navigate(`/profile/${maker.user_id}`);
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
    } else if (filterType === 'events') {
      events.forEach((event) => {
        // For now, events don't have coordinates in the database, so show placeholder message
        console.log('Event markers not yet implemented - venue coordinates needed in database');
      });
    }

    // Fit map to show all markers
    if (hasValidCoordinates && map.current) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [makers, events, mapReady, navigate, onProfileClick, filterType]);

  if (loading || tokenError) {
    return (
      <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        ) : (
          <div className="text-center p-4">
            <p className="text-destructive">Kartfeil: {tokenError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating Count Badge */}
      <div className="absolute top-4 right-4 z-40">
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border shadow-lg"
        >
          {filterType === 'makers' ? (
            <>
              <User className="w-4 h-4" />
              {makers.length} makers
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              {events.length} events
            </>
          )}
        </Badge>
      </div>
    </>
  );
};