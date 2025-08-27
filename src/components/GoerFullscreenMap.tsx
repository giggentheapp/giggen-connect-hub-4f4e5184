import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GoerFullscreenMapProps {
  className?: string;
}

interface EventMarketData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  ticket_price?: number;
  created_by?: string;
  is_public: boolean;
  portfolio_id?: string;
}

const GoerFullscreenMap: React.FC<GoerFullscreenMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [events, setEvents] = useState<EventMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get Mapbox token (same logic as Map.tsx)
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const directToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (directToken && directToken !== 'undefined') {
          setMapboxToken(directToken);
          mapboxgl.accessToken = directToken;
          return;
        }
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
          return;
        }
        
        if (data?.token && data.token !== 'undefined') {
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
        }
      } catch (error: any) {
        setTokenError('Du må legge inn VITE_MAPBOX_TOKEN som miljøvariabel eller MAPBOX_ACCESS_TOKEN som Supabase secret.');
      }
    };
    
    getMapboxToken();
  }, []);

  // Fetch events from events_market
  const fetchEvents = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events_market')
        .select('*')
        .eq('is_public', true)
        .not('venue', 'is', null)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }
      
      setEvents(data || []);
      
    } catch (error: any) {
      if (retryCount < 2) {
        setTimeout(() => fetchEvents(retryCount + 1), 1000);
        return;
      }
      
      toast({
        title: "Feil ved lasting av arrangementer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) {
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [10.7461, 59.9127], // Oslo, Norway
        zoom: 10,
      });

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
      });

    } catch (error: any) {
      toast({
        title: "Kartfeil",
        description: "Kunne ikke laste kartet",
        variant: "destructive",
      });
    }

    return () => {
      if (map.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, [mapboxToken, toast]);

  // Add event markers when data is ready
  useEffect(() => {
    if (!map.current || !mapReady || !events.length) {
      return;
    }

    // Clean up existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // For now, we'll use placeholder coordinates for venues
    // In a real app, you'd geocode the venue addresses
    const defaultCoords = [
      [10.7461, 59.9127], // Oslo
      [10.7389, 59.9139], // Oslo center
      [10.7522, 59.9147], // Grünerløkka
      [10.7594, 59.9311], // Majorstuen
    ];

    // Create markers for each event
    events.forEach((event, index) => {
      try {
        // Use cycling coordinates for demo purposes
        const coords = defaultCoords[index % defaultCoords.length];
        
        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'event-marker';
        markerEl.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        `;
        
        markerEl.textContent = '🎵';

        // Add hover effects
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'scale(1.1)';
          markerEl.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
        });

        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        });

        // Create popup with event details
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="text-align: center; padding: 16px; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 18px; color: #333;">${event.title}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${new Date(event.date).toLocaleDateString('no-NO')}</p>
            ${event.time ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Kl. ${event.time}</p>` : ''}
            ${event.venue ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Sted:</strong> ${event.venue}</p>` : ''}
            ${event.ticket_price ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #666;"><strong>Pris:</strong> ${event.ticket_price} kr</p>` : ''}
            ${event.description ? `<p style="margin: 0 0 12px 0; font-size: 13px; color: #777; max-width: 200px;">${event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}</p>` : ''}
            <button 
              onclick="window.open('/market', '_blank')"
              style="display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s;"
              onmouseover="this.style.backgroundColor='#1d4ed8'"
              onmouseout="this.style.backgroundColor='#3b82f6'"
            >
              Se detaljer
            </button>
          </div>
        `);

        // Add marker to map
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'bottom'
        })
          .setLngLat(coords as [number, number])
          .setPopup(popup)
          .addTo(map.current!);
          
        markersRef.current.push(marker);
        
      } catch (error: any) {
        console.error('Failed to create event marker:', error);
      }
    });

    // Fit map to show all markers if there are events
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      defaultCoords.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 13,
        duration: 1000
      });
    }
    
  }, [events, mapReady]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Laster arrangementer...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/10 max-w-md">
          <p className="text-destructive font-medium mb-2">Kartfeil</p>
          <p className="text-sm text-muted-foreground mb-4">{tokenError}</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="secondary"
          className="bg-background/90 backdrop-blur-sm border shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake til dashboard
        </Button>
      </div>

      {/* Event counter */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium">
          {events.length} arrangementer på kartet
        </p>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default GoerFullscreenMap;