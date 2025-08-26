import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft } from "lucide-react";

interface EventMarketItem {
  id: string;
  title: string;
  description: string | null;
  ticket_price: number | null;
  venue: string | null;
  date: string;
  time: string | null;
  is_public: boolean;
  portfolio_id: string | null;
  created_by: string | null;
  coordinates?: [number, number];
}

const GoerMap = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [events, setEvents] = useState<EventMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventMarketItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  // Get Mapbox token
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

  useEffect(() => {
    loadEventsWithVenues();
  }, []);

  const loadEventsWithVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("events_market")
        .select("id, title, description, ticket_price, venue, date, time, is_public, portfolio_id, created_by")
        .eq("is_public", true)
        .not("venue", "is", null)
        .order("date", { ascending: true });

      if (fetchError) throw fetchError;
      
      // For demo purposes, add some mock coordinates for events
      const eventsWithCoordinates = (data || []).map((event, index) => ({
        ...event,
        coordinates: [
          10.7461 + (Math.random() - 0.5) * 0.1, // Oslo longitude ± random offset
          59.9127 + (Math.random() - 0.5) * 0.1  // Oslo latitude ± random offset
        ] as [number, number]
      }));
      
      setEvents(eventsWithCoordinates);
    } catch (err: any) {
      console.error("Error loading events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        zoom: 12,
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

    // Create markers for each event
    events.forEach((event) => {
      if (!event.coordinates) return;

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'event-marker';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        background: linear-gradient(135deg, #dc2626, #ef4444);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="text-align: center; padding: 12px; min-width: 200px;">
          <h3 style="margin: 0 0 6px 0; font-weight: bold; font-size: 16px; color: #333;">${event.title}</h3>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${event.venue}</p>
          <p style="margin: 0 0 10px 0; font-size: 12px; color: #888;">${new Date(event.date).toLocaleDateString('nb-NO')}</p>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('openEventDetails', { detail: '${event.id}' }))"
            style="display: inline-block; padding: 6px 12px; background: #dc2626; color: white; text-decoration: none; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#b91c1c'"
            onmouseout="this.style.backgroundColor='#dc2626'"
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
        .setLngLat(event.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
        
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      events.forEach(event => {
        if (event.coordinates) {
          bounds.extend(event.coordinates);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 1000
      });
    }
    
  }, [events, mapReady]);

  // Listen for event details requests
  useEffect(() => {
    const handleOpenEventDetails = (e: any) => {
      const eventId = e.detail;
      const event = events.find(ev => ev.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setModalOpen(true);
      }
    };

    window.addEventListener('openEventDetails', handleOpenEventDetails);
    return () => window.removeEventListener('openEventDetails', handleOpenEventDetails);
  }, [events]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/goer/market')}
            className="bg-card/95 backdrop-blur-sm shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dashboard
          </Button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Laster kart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || tokenError) {
    return (
      <div className="fixed inset-0 bg-background">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/goer/market')}
            className="bg-card/95 backdrop-blur-sm shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dashboard
          </Button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/10 max-w-md">
            <p className="text-destructive font-medium mb-2">Kartfeil</p>
            <p className="text-sm text-muted-foreground">{error || tokenError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/goer/market')}
          className="bg-card/95 backdrop-blur-sm shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til dashboard
        </Button>
      </div>

      {/* Fullscreen Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default GoerMap;