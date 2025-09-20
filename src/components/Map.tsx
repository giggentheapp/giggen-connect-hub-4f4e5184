import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
  className?: string;
  forceRefresh?: number;
}

interface MakerLocation {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  address: string;
}

const Map: React.FC<MapProps> = ({ className = '', forceRefresh = 0 }) => {
  // FORCE CONSOLE DEBUGGING - SHOULD BE VISIBLE IN BROWSER CONSOLE
  console.clear();
  console.log('%c🔴 MAP COMPONENT LOADED - DEBUG ACTIVE', 'color: red; font-size: 20px; font-weight: bold;');
  console.log('%c🔴 Current time:', 'color: red; font-weight: bold;', new Date().toISOString());
  console.log('🗺️ Map component rendering...', { className, forceRefresh });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [makers, setMakers] = useState<MakerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const { toast } = useToast();

  console.log('🗺️ Map state:', { 
    loading, 
    mapboxToken: mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'null',
    tokenError, 
    mapReady, 
    mapError,
    makersCount: makers.length 
  });

  // Test basic database access
  const testDatabaseAccess = useCallback(async () => {
    console.log('%c🔍 TESTING DATABASE ACCESS', 'color: orange; font-size: 14px; font-weight: bold;');
    
    try {
      // Test basic Supabase connection
      console.log('Testing basic Supabase connection...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(1);
      
      if (profilesError) {
        console.error('❌ Profiles access blocked:', profilesError);
        console.error('Error code:', profilesError.code);
        console.error('Error message:', profilesError.message);
      } else {
        console.log('✅ Profiles access OK:', profiles?.length || 0, 'records');
      }
      
      // Test profile_settings (where Mapbox token might be stored)
      const { data: settings, error: settingsError } = await supabase
        .from('profile_settings')
        .select('id, mapbox_access_token')
        .limit(1);
      
      if (settingsError) {
        console.error('❌ Profile settings access blocked:', settingsError);
        console.error('Settings error details:', settingsError);
      } else {
        console.log('✅ Profile settings access OK:', settings?.length || 0, 'records');
      }
      
      // Test events_market (should be publicly readable)
      const { data: events, error: eventsError } = await supabase
        .from('events_market')
        .select('id, title')
        .limit(1);
      
      if (eventsError) {
        console.error('❌ Events market blocked:', eventsError);
      } else {
        console.log('✅ Events market access OK:', events?.length || 0, 'records');
      }
      
    } catch (error) {
      console.error('❌ Database test failed with exception:', error);
    }
  }, []);

  // Debug all permissions systematically  
  const debugAllPermissions = useCallback(async () => {
    console.log('%c=== PERMISSION DEBUG START ===', 'color: red; font-size: 16px; font-weight: bold;');
    
    // Test current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user?.id || 'Not authenticated');
    console.log('User error:', userError);
    
    // Test each table access individually (TypeScript requires explicit table names)
    try {
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id').limit(1);
      console.log('📊 profiles:', profilesError ? '❌ BLOCKED' : '✅ OK');
      if (profilesError) {
        console.log(`  ❌ Error: ${profilesError.message}`);
        console.log(`  ❌ Code: ${profilesError.code}`);
      }
    } catch (err: any) {
      console.log('📊 profiles: ❌ EXCEPTION', err.message);
    }

    try {
      const { data: settings, error: settingsError } = await supabase.from('profile_settings').select('id').limit(1);
      console.log('📊 profile_settings:', settingsError ? '❌ BLOCKED' : '✅ OK');
      if (settingsError) {
        console.log(`  ❌ Error: ${settingsError.message}`);
        console.log(`  ❌ Code: ${settingsError.code}`);
      }
    } catch (err: any) {
      console.log('📊 profile_settings: ❌ EXCEPTION', err.message);
    }

    try {
      const { data: events, error: eventsError } = await supabase.from('events_market').select('id').limit(1);
      console.log('📊 events_market:', eventsError ? '❌ BLOCKED' : '✅ OK');
      if (eventsError) {
        console.log(`  ❌ Error: ${eventsError.message}`);
        console.log(`  ❌ Code: ${eventsError.code}`);
      }
    } catch (err: any) {
      console.log('📊 events_market: ❌ EXCEPTION', err.message);
    }

    try {
      const { data: bookings, error: bookingsError } = await supabase.from('bookings').select('id').limit(1);
      console.log('📊 bookings:', bookingsError ? '❌ BLOCKED' : '✅ OK');
      if (bookingsError) {
        console.log(`  ❌ Error: ${bookingsError.message}`);
        console.log(`  ❌ Code: ${bookingsError.code}`);
      }
    } catch (err: any) {
      console.log('📊 bookings: ❌ EXCEPTION', err.message);
    }

    try {
      const { data: concepts, error: conceptsError } = await supabase.from('concepts').select('id').limit(1);
      console.log('📊 concepts:', conceptsError ? '❌ BLOCKED' : '✅ OK');
      if (conceptsError) {
        console.log(`  ❌ Error: ${conceptsError.message}`);
        console.log(`  ❌ Code: ${conceptsError.code}`);
      }
    } catch (err: any) {
      console.log('📊 concepts: ❌ EXCEPTION', err.message);
    }
    
    console.log('%c=== PERMISSION DEBUG END ===', 'color: red; font-size: 16px; font-weight: bold;');
  }, []);

  // Test with temporary/demo Mapbox token
  const testWithTempToken = useCallback(async () => {
    console.log('%c🧪 TESTING WITH DEMO TOKEN', 'color: yellow; font-size: 14px; font-weight: bold;');
    
    // Use Mapbox's official demo token (public, limited usage)
    const DEMO_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    
    try {
      mapboxgl.accessToken = DEMO_TOKEN;
      setMapboxToken(DEMO_TOKEN);
      setTokenError(null);
      
      console.log('✅ Demo token set successfully');
      console.log('🧪 If map loads now, the issue is security blocking the real token');
      
      // Test basic Mapbox API access
      const testResponse = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${DEMO_TOKEN}`);
      console.log('🧪 Mapbox API test status:', testResponse.status);
      
      if (testResponse.ok) {
        console.log('✅ Mapbox API access works with demo token');
      } else {
        console.error('❌ Mapbox API blocked even with demo token');
      }
      
    } catch (error) {
      console.error('❌ Demo token test failed:', error);
    }
  }, []);

  // Test edge function directly after security fix
  const testEdgeFunctionFix = useCallback(async () => {
    console.log('%c🧪 TESTING EDGE FUNCTION AFTER RLS FIX', 'color: green; font-size: 14px; font-weight: bold;');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('❌ Edge function still blocked:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        return false;
      }
      
      if (data && data.token) {
        console.log('✅ Edge function working! Token received');
        console.log('🗺️ Token details:', {
          length: data.token.length,
          startsWithPk: data.token.startsWith('pk.'),
          preview: data.token.substring(0, 10) + '...',
          debug: data.debug
        });
        return data.token;
      }
      
      console.log('⚠️ Edge function working but no token returned');
      console.log('📊 Response data:', data);
      return false;
      
    } catch (err: any) {
      console.error('❌ Edge function exception:', err);
      console.error('❌ Exception details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      return false;
    }
  }, []);

  // Reinitialize map after security fix
  const reinitializeMapWithFix = useCallback(async () => {
    console.log('%c🔄 REINITIALIZING MAP AFTER SECURITY FIX', 'color: blue; font-size: 14px; font-weight: bold;');
    
    // Test edge function first
    const token = await testEdgeFunctionFix();
    
    if (!token) {
      console.error('❌ Cannot initialize map - no token available');
      setTokenError('Edge function tilgang fortsatt blokkert etter security fix');
      return;
    }
    
    try {
      console.log('🗺️ Setting up map with received token...');
      mapboxgl.accessToken = token;
      setMapboxToken(token);
      setTokenError(null);
      
      if (mapContainer.current) {
        // Clean up existing map if any
        if (map.current) {
          console.log('🧹 Cleaning up existing map instance');
          map.current.remove();
          map.current = null;
        }
        
        console.log('🗺️ Creating new map instance...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [10.7522, 59.9139], // Oslo
          zoom: 10,
          pitch: 15,
        });
        
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );
        
        map.current.on('load', () => {
          console.log('🎉 Map successfully loaded after security fix!');
          setMapReady(true);
          setMapError(false);
        });
        
        map.current.on('error', (e) => {
          console.error('❌ Map error after reinit:', e);
          setMapError(true);
        });
        
        console.log('✅ Map reinitialization completed');
        
      } else {
        console.error('❌ Map container not available for reinitialization');
      }
      
    } catch (error: any) {
      console.error('❌ Map reinitialization failed:', error);
      setTokenError(`Map reinit failed: ${error.message}`);
    }
  }, [testEdgeFunctionFix]);

  // Comprehensive test after all fixes
  const runCompleteSecurityTest = useCallback(async () => {
    console.log('%c🔬 RUNNING COMPLETE SECURITY TEST', 'color: purple; font-size: 16px; font-weight: bold;');
    
    // Step 1: Test database access
    await testDatabaseAccess();
    
    // Step 2: Test edge function
    const tokenResult = await testEdgeFunctionFix();
    
    // Step 3: Test permissions
    await debugAllPermissions();
    
    // Step 4: If all good, reinitialize map
    if (tokenResult) {
      console.log('🎯 All security tests passed - reinitializing map...');
      await reinitializeMapWithFix();
    } else {
      console.log('❌ Security tests failed - map initialization skipped');
    }
    
    console.log('%c🔬 COMPLETE SECURITY TEST FINISHED', 'color: purple; font-size: 16px; font-weight: bold;');
  }, [testDatabaseAccess, testEdgeFunctionFix, debugAllPermissions, reinitializeMapWithFix]);

  // Comprehensive security debugging function
  const debugSecurityIssues = useCallback(async () => {
    console.log('%c=== SECURITY DEBUG START ===', 'color: red; font-size: 16px; font-weight: bold;');
    
    try {
      // Run all tests
      await testDatabaseAccess();
      await debugAllPermissions();
      
      // Test authentication state
      console.log('🔍 Checking authentication state...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('User authenticated:', !!user);
      console.log('User ID:', user?.id);
      console.log('User role:', user?.user_metadata?.role);
      console.log('Auth error:', authError);
      
      // Test edge function access with detailed logging
      console.log('🔍 Testing edge function access...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
      console.log('Edge function access:', tokenError ? 'BLOCKED' : 'OK');
      console.log('Edge function response:', { data: tokenData, error: tokenError });
      
      if (tokenError) {
        console.error('❌ Edge function BLOCKED:', tokenError);
        console.error('Error code:', tokenError.code);
        console.error('Error message:', tokenError.message);
        console.error('Error details:', tokenError.details);
        console.error('Error hint:', tokenError.hint);
      }
      
      // Environment check
      console.log('🔍 Environment variables check:');
      console.log('Running in browser:', typeof window !== 'undefined');
      console.log('Supabase client exists:', !!supabase);
      
    } catch (debugError) {
      console.error('❌ Security debug error:', debugError);
    }
    
    console.log('%c=== SECURITY DEBUG END ===', 'color: red; font-size: 16px; font-weight: bold;');
  }, [testDatabaseAccess, debugAllPermissions]);

  // Enhanced token fetching with security debugging
  const getMapboxToken = useCallback(async () => {
    console.log('🗺️ Token fetch started...');
    
    // Run security debug first
    await debugSecurityIssues();
    
    try {
      console.log('🗺️ Attempting to fetch Mapbox token from edge function...');
      
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      console.log('🗺️ Edge function response:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorType: error?.constructor?.name
      });
      
      if (error) {
        console.error('❌ Edge function error DETAILED:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        setTokenError(`Edge function fejl: ${error.message}`);
        return;
      }
      
      if (data?.token && data.token !== 'undefined') {
        console.log('✅ Token received successfully!');
        console.log('🗺️ Token details:', {
          length: data.token.length,
          startsWithPk: data.token.startsWith('pk.'),
          preview: data.token.substring(0, 20) + '...'
        });
        
        // Test token validity by trying to set it
        try {
          mapboxgl.accessToken = data.token;
          console.log('✅ Mapbox access token set globally');
          setMapboxToken(data.token);
        } catch (tokenSetError) {
          console.error('❌ Error setting Mapbox token:', tokenSetError);
          setTokenError('Feil ved setting av Mapbox token');
        }
      } else {
        console.error('❌ Invalid token response:', {
          data,
          hasToken: !!data?.token,
          tokenValue: data?.token
        });
        setTokenError('Ugyldig token response fra server');
      }
    } catch (error: any) {
      console.error('❌ Critical error getting Mapbox token:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setTokenError(`Kritisk feil: ${error.message}`);
    }
  }, [debugSecurityIssues]);

  // Get Mapbox token
  useEffect(() => {
    console.log('🗺️ Token fetch useEffect triggered');
    getMapboxToken();
  }, [getMapboxToken]);

  // Fetch makers function
  const fetchMakers = useCallback(async (retryCount = 0) => {
      console.log('🗺️ Fetching makers...', { retryCount });
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_all_visible_makers');

        console.log('🗺️ Makers RPC response:', { data: data?.length, error });

        if (error) {
          throw error;
        }
        
        const makersData = data?.map(maker => ({
          user_id: maker.user_id,
          display_name: maker.display_name,
          avatar_url: maker.avatar_url,
          latitude: parseFloat(maker.latitude?.toString() || '0'),
          longitude: parseFloat(maker.longitude?.toString() || '0'),
          address: maker.address
        })).filter(maker => {
          const isValid = !isNaN(maker.latitude) && !isNaN(maker.longitude) && 
                         maker.latitude !== 0 && maker.longitude !== 0 && maker.address;
          return isValid;
        }) || [];

        console.log('✅ Processed makers data:', { 
          total: data?.length || 0, 
          valid: makersData.length,
          makers: makersData.map(m => ({ name: m.display_name, coords: [m.latitude, m.longitude] }))
        });

        setMakers(makersData);
        
      } catch (error: any) {
        console.error('❌ Error fetching makers:', error);
        
        if (retryCount < 2) {
          console.log('🔄 Retrying makers fetch in 1 second...');
          setTimeout(() => fetchMakers(retryCount + 1), 1000);
          return;
        }
        
        const errorMsg = `Kunne ikke laste makere på kartet etter flere forsøk: ${error.message}`;
        
        toast({
          title: "Feil ved lasting av kart",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, [toast]);

  // Fetch makers on mount and refresh
  useEffect(() => {
    fetchMakers();
  }, [fetchMakers, forceRefresh]);

  // Initialize map
  useEffect(() => {
    console.log('🗺️ Map initialization useEffect triggered');
    console.log('🗺️ Dependencies check:', {
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxToken,
      hasExistingMap: !!map.current,
      containerDimensions: mapContainer.current ? {
        width: mapContainer.current.offsetWidth,
        height: mapContainer.current.offsetHeight
      } : 'no container'
    });

    if (!mapContainer.current) {
      console.error('❌ Map container ref not available');
      return;
    }

    if (!mapboxToken) {
      console.error('❌ Mapbox token not available for map initialization');
      return;
    }

    if (map.current) {
      console.log('🗺️ Map already exists, skipping initialization');
      return;
    }

    try {
      console.log('🗺️ Attempting to create Mapbox map instance...');
      console.log('🗺️ Using token:', mapboxToken.substring(0, 20) + '...');
      console.log('🗺️ Container element:', mapContainer.current);
      
      // Ensure token is set globally
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7461, 59.9127], // Oslo, Norway
        zoom: 10,
        pitch: 15,
      });

      console.log('✅ Map instance created successfully:', map.current);

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      console.log('✅ Navigation controls added');

      map.current.on('load', () => {
        console.log('🎉 Map loaded successfully!');
        setMapReady(true);
        setMapError(false);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error occurred:', e);
        setMapError(true);
        toast({
          title: "Kartfeil",
          description: `Map error: ${e.error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
      });

      map.current.on('styledata', () => {
        console.log('🎨 Map style loaded');
      });

      map.current.on('sourcedata', (e) => {
        console.log('📊 Map source data event:', e.sourceId);
      });

    } catch (error: any) {
      console.error('❌ Error creating map instance:', error);
      setMapError(true);
      toast({
        title: "Kartfeil",
        description: `Kunne ikke laste kartet: ${error.message}`,
        variant: "destructive",
      });
    }

    return () => {
      console.log('🧹 Cleaning up map instance');
      if (map.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, [mapboxToken, toast]);

  // Add markers when data is ready
  useEffect(() => {
    console.log('🗺️ Markers useEffect triggered', {
      hasMap: !!map.current,
      mapReady,
      makersCount: makers.length,
      makers: makers.map(m => ({ name: m.display_name, coords: [m.latitude, m.longitude] }))
    });

    if (!map.current || !mapReady || !makers.length) {
      console.log('🗺️ Skipping markers - conditions not met');
      return;
    }

    console.log('🗺️ Adding markers to map...');

    // Clean up existing markers
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];

    // Create markers for each maker
    makers.forEach((maker, index) => {
      console.log(`🗺️ Creating marker ${index + 1}/${makers.length} for:`, maker.display_name);
      
      try {
        if (isNaN(maker.latitude) || isNaN(maker.longitude)) {
          console.warn('⚠️ Invalid coordinates for maker:', maker.display_name);
          return;
        }
        
        // Create marker container (keeping existing styling)
        const markerContainer = document.createElement('div');
        markerContainer.className = 'mapbox-marker-container';
        markerContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          cursor: pointer;
        `;

        // Create marker element with profile picture (keeping existing code)
        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker';
        
        // Always create a colorful circular marker with gradient border
        markerEl.style.cssText = `
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 4px solid transparent;
          background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%)) border-box;
          box-shadow: 0 6px 20px hsla(222.2 47.4% 11.2% / 0.3), 0 0 0 2px hsl(0 0% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
          overflow: hidden;
        `;

        // Inner container for avatar or initials
        const innerEl = document.createElement('div');
        innerEl.style.cssText = `
          width: 52px;
          height: 52px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(0 0% 100%);
        `;
        
        if (maker.avatar_url) {
          const img = document.createElement('img');
          img.src = maker.avatar_url;
          img.alt = maker.display_name;
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
          `;
          img.onerror = () => {
            // Fallback to initials if image fails to load
            img.style.display = 'none';
            const initialsEl = document.createElement('div');
            initialsEl.style.cssText = `
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%));
              display: flex;
              align-items: center;
              justify-content: center;
              color: hsl(0 0% 100%);
              font-weight: bold;
              font-size: 18px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            const initials = maker.display_name
              .split(' ')
              .map(name => name.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase();
            initialsEl.textContent = initials;
            innerEl.appendChild(initialsEl);
          };
          innerEl.appendChild(img);
        } else {
          const initialsEl = document.createElement('div');
          initialsEl.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, hsl(222.2 47.4% 11.2%), hsl(217.2 91.2% 59.8%));
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(0 0% 100%);
            font-weight: bold;
            font-size: 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `;
          const initials = maker.display_name
            .split(' ')
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
          initialsEl.textContent = initials;
          innerEl.appendChild(initialsEl);
        }
        
        markerEl.appendChild(innerEl);

        // Create name label with enhanced styling
        const nameLabel = document.createElement('div');
        nameLabel.className = 'mapbox-marker-name';
        nameLabel.textContent = maker.display_name;
        nameLabel.style.cssText = `
          background: hsla(222.2 47.4% 11.2% / 0.9);
          color: hsl(0 0% 100%);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
          margin-top: 8px;
          box-shadow: 0 4px 16px hsla(222.2 47.4% 11.2% / 0.2);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          pointer-events: none;
          border: 1px solid hsla(0 0% 100% / 0.1);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Add hover effects
        const addHoverEffects = () => {
          markerEl.style.transform = 'scale(1.15)';
          markerEl.style.boxShadow = '0 8px 25px hsla(222.2 47.4% 11.2% / 0.4), 0 0 0 3px hsl(217.2 91.2% 59.8% / 0.3)';
          nameLabel.style.background = 'hsla(222.2 47.4% 11.2% / 0.95)';
          nameLabel.style.transform = 'scale(1.05)';
          nameLabel.style.color = 'hsl(0 0% 100%)';
        };

        const removeHoverEffects = () => {
          markerEl.style.transform = 'scale(1)';
          markerEl.style.boxShadow = '0 6px 20px hsla(222.2 47.4% 11.2% / 0.3), 0 0 0 2px hsl(0 0% 100%)';
          nameLabel.style.background = 'hsla(222.2 47.4% 11.2% / 0.8)';
          nameLabel.style.transform = 'scale(1)';
          nameLabel.style.color = 'hsl(0 0% 100%)';
        };

        markerContainer.addEventListener('mouseenter', addHoverEffects);
        markerContainer.addEventListener('mouseleave', removeHoverEffects);

        markerContainer.appendChild(markerEl);
        markerContainer.appendChild(nameLabel);

        // Create popup
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="text-align: center; padding: 12px; min-width: 200px;">
            ${maker.avatar_url ? `
              <img 
                src="${maker.avatar_url}" 
                alt="${maker.display_name}"
                style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 8px; object-fit: cover; border: 2px solid #e0e0e0;"
                onerror="this.style.display='none'"
              />
            ` : `
              <div style="width: 40px; height: 40px; background: #dc2626; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                ${maker.display_name.charAt(0).toUpperCase()}
              </div>
            `}
            <h3 style="margin: 0 0 6px 0; font-weight: bold; font-size: 16px; color: #333;">${maker.display_name}</h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">${maker.address}</p>
            <a 
              href="/profile/${maker.user_id}" 
              style="display: inline-block; padding: 6px 12px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background-color 0.2s;"
              onmouseover="this.style.backgroundColor='#b91c1c'"
              onmouseout="this.style.backgroundColor='#dc2626'"
            >
              Se profil
            </a>
          </div>
        `);

        // Add marker to map
        const markerCoords: [number, number] = [maker.longitude, maker.latitude];
        
        console.log(`🗺️ Adding marker for ${maker.display_name} at:`, markerCoords);
        
        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: 'bottom'
        })
          .setLngLat(markerCoords)
          .setPopup(popup)
          .addTo(map.current!);
          
        markersRef.current.push(marker);
        console.log(`✅ Marker added successfully for ${maker.display_name}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to create marker for ${maker.display_name}:`, error);
      }
    });

    console.log(`✅ Added ${markersRef.current.length} markers to map`);

    // Fit map to show all markers
    if (makers.length > 0) {
      console.log('🗺️ Fitting map bounds to show all markers...');
      const bounds = new mapboxgl.LngLatBounds();
      makers.forEach(maker => {
        bounds.extend([maker.longitude, maker.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 1000
      });
      console.log('✅ Map bounds set');
    }
    
  }, [makers, mapReady]);

  console.log('🗺️ Final render state:', { loading, tokenError, mapError });

  // Module-level debug flag to prevent multiple alerts
  let mapDebugShown = false;

  // EXTREME DEBUG ALERT - WILL POP UP IF COMPONENT RENDERS
  if (!mapDebugShown) {
    alert('🔴 MAP COMPONENT IS LOADING - TOKEN: ' + (mapboxToken ? 'EXISTS' : 'MISSING'));
    mapDebugShown = true;
  }

  // FORCE VISIBLE DEBUG PANEL COMPONENT
  const ExtremeDebugPanel = () => (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '20px',
        zIndex: 99999,
        border: '3px solid black',
        fontSize: '16px',
        fontWeight: 'bold',
        minWidth: '300px',
        borderRadius: '5px'
      }}
    >
      <h3 style={{margin: '0 0 10px 0'}}>🔴 MAP DEBUG STATUS</h3>
      <div>Token: {mapboxToken ? '✅ EXISTS (' + mapboxToken.substring(0, 10) + '...)' : '❌ MISSING'}</div>  
      <div>Map Ready: {mapReady ? '✅ YES' : '❌ NO'}</div>
      <div>Loading: {loading ? '🔄 YES' : '✅ NO'}</div>
      <div>Token Error: {tokenError ? '❌ ' + tokenError : '✅ NONE'}</div>
      <div>Map Error: {mapError ? '❌ YES' : '✅ NO'}</div>
      <div>Makers: {makers?.length || 0}</div>
      <div>Container Ref: {mapContainer.current ? '✅ YES' : '❌ NO'}</div>
        <div style={{marginTop: '10px', fontSize: '12px'}}>
          Time: {new Date().toLocaleTimeString()}
        </div>
        <button 
          onClick={debugSecurityIssues}
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'yellow',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔍 RUN SECURITY DEBUG
        </button>
        <button 
          onClick={testDatabaseAccess}
          style={{
            marginTop: '5px',
            padding: '8px 12px',
            backgroundColor: 'cyan',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📊 TEST DATABASE ACCESS
        </button>
        <button 
          onClick={testWithTempToken}
          style={{
            marginTop: '5px',
            padding: '8px 12px',
            backgroundColor: 'orange',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🧪 TEST DEMO TOKEN
        </button>
        <button 
          onClick={runCompleteSecurityTest}
          style={{
            marginTop: '5px',
            padding: '8px 12px',
            backgroundColor: 'lime',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔬 COMPLETE SECURITY TEST
        </button>
        <button 
          onClick={testEdgeFunctionFix}
          style={{
            marginTop: '5px',
            padding: '8px 12px',
            backgroundColor: 'lightgreen',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🧪 TEST EDGE FUNCTION
        </button>
        <button 
          onClick={reinitializeMapWithFix}
          style={{
            marginTop: '5px',
            padding: '8px 12px',
            backgroundColor: 'gold',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 REINIT MAP
        </button>
    </div>
  );

  if (loading) {
    console.log('🗺️ Rendering loading state');
    return (
      <>
        {/* EXTREME DEBUG PANEL - ALWAYS VISIBLE */}
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            backgroundColor: 'red',
            color: 'white',
            padding: '20px',
            zIndex: 99999,
            border: '3px solid black',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '300px',
            borderRadius: '5px'
          }}
        >
          <h3 style={{margin: '0 0 10px 0'}}>🔴 MAP DEBUG - LOADING STATE</h3>
          <div>Token: {mapboxToken ? '✅ EXISTS' : '❌ MISSING'}</div>
          <div>Loading: ✅ YES</div>
          <div>Time: {new Date().toLocaleTimeString()}</div>
        </div>
        
        <div className={`flex items-center justify-center h-96 ${className}`} style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Laster kart...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Token: {mapboxToken ? 'Tilgjengelig' : 'Venter'} | 
              Map: {mapReady ? 'Klar' : 'Initialiserer'}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (tokenError) {
    console.log('🗺️ Rendering token error state:', tokenError);
    return (
      <>
        {/* EXTREME DEBUG PANEL - ALWAYS VISIBLE */}
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            backgroundColor: 'red',
            color: 'white',
            padding: '20px',
            zIndex: 99999,
            border: '3px solid black',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '300px',
            borderRadius: '5px'
          }}
        >
          <h3 style={{margin: '0 0 10px 0'}}>🔴 MAP DEBUG - TOKEN ERROR</h3>
          <div>Token: ❌ ERROR</div>
          <div>Error: {tokenError}</div>  
          <div>Time: {new Date().toLocaleTimeString()}</div>
        </div>
        
        <div className={`flex items-center justify-center h-96 ${className}`} style={{ minHeight: '400px' }}>
          <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/10">
            <p className="text-destructive font-medium mb-2">Kartfeil</p>
            <p className="text-sm text-muted-foreground">{tokenError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </>
    );
  }

  if (mapError) {
    console.log('🗺️ Rendering map error state');
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-6 border border-destructive rounded-lg bg-destructive/10">
          <p className="text-destructive font-medium mb-2">Kart laster ikke</p>
          <p className="text-sm text-muted-foreground">Det oppstod en feil ved lasting av kartet</p>
          <button 
            onClick={() => {
              setMapError(false);
              window.location.reload();
            }} 
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
          >
            Last på nytt
          </button>
        </div>
      </div>
    );
  }

  console.log('🗺️ Rendering map container');

  return (
    <>
      {/* EXTREME DEBUG PANEL - ALWAYS VISIBLE */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          backgroundColor: 'red',
          color: 'white',
          padding: '20px',
          zIndex: 99999,
          border: '3px solid black',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '300px',
          borderRadius: '5px'
        }}
      >
        <h3 style={{margin: '0 0 10px 0'}}>🔴 MAP DEBUG - MAIN RENDER</h3>
        <div>Token: {mapboxToken ? '✅ EXISTS (' + mapboxToken.substring(0, 10) + '...)' : '❌ MISSING'}</div>
        <div>Map Ready: {mapReady ? '✅ YES' : '❌ NO'}</div>
        <div>Loading: {loading ? '🔄 YES' : '✅ NO'}</div>
        <div>Token Error: {tokenError ? '❌ ' + tokenError : '✅ NONE'}</div>
        <div>Map Error: {mapError ? '❌ YES' : '✅ NO'}</div>
        <div>Makers: {makers?.length || 0}</div>
        <div>Container Ref: {mapContainer.current ? '✅ YES' : '❌ NO'}</div>
        <div style={{marginTop: '10px', fontSize: '12px'}}>
          Time: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '400px' }}>
      {/* Debug Info */}
      <div className="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
        <div>Token: {mapboxToken ? '✓' : '✗'}</div>
        <div>Map: {mapReady ? '✓' : '✗'}</div>
        <div>Makers: {makers.length}</div>
        <div>Error: {mapError ? '✗' : '✓'}</div>
      </div>

      {/* Token Error Display */}
      {tokenError && (
        <div className="absolute top-4 right-4 z-10 bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-lg p-4 shadow-lg border max-w-md">
          <h3 className="font-semibold text-sm mb-2">Kartfeil</h3>
          <p className="text-xs">{tokenError}</p>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ 
          minHeight: '400px',
          background: '#f0f0f0' // Visible background to see if container exists
        }} 
      />
      
      {/* Loading Overlay */}
      {!mapReady && mapboxToken && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Initialiserer kart...</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Map;