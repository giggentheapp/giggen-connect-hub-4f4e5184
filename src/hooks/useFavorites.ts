import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FavoriteMaker {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: string;
}

export interface FavoriteEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
}

export const useFavorites = (userId: string | undefined) => {
  const [favoriteMakers, setFavoriteMakers] = useState<FavoriteMaker[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    if (!userId) {
      setFavoriteMakers([]);
      setFavoriteEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 FETCHING FAVORITES for userId:', userId);

      // Fetch favorite makers - simplified query first
      const { data: makerFavorites, error: makerError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'maker');

      console.log('📊 Maker favorites query result:', { makerFavorites, makerError });

      if (makerError) {
        console.error('❌ Maker favorites error:', makerError);
        throw makerError;
      }

      // Fetch favorite events - simplified query first
      const { data: eventFavorites, error: eventError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'event');

      console.log('📊 Event favorites query result:', { eventFavorites, eventError });

      if (eventError) {
        console.error('❌ Event favorites error:', eventError);
        throw eventError;
      }

      // If we have favorite makers, fetch their profiles
      let makers: FavoriteMaker[] = [];
      if (makerFavorites && makerFavorites.length > 0) {
        const makerIds = makerFavorites.map(fav => fav.item_id);
        console.log('🔍 Fetching profiles for maker IDs:', makerIds);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, bio, avatar_url, role')
          .in('user_id', makerIds);

        console.log('📊 Profiles query result:', { profiles, profilesError });

        if (profilesError) {
          console.error('❌ Profiles error:', profilesError);
          throw profilesError;
        }

        makers = profiles?.map(profile => ({
          id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          role: profile.role
        })) || [];
      }

      // If we have favorite events, fetch their details
      let events: FavoriteEvent[] = [];
      if (eventFavorites && eventFavorites.length > 0) {
        const eventIds = eventFavorites.map(fav => fav.item_id);
        console.log('🔍 Fetching events for IDs:', eventIds);
        
        const { data: eventDetails, error: eventsError } = await supabase
          .from('events')
          .select('id, title, description, event_date, location')
          .in('id', eventIds);

        console.log('📊 Events query result:', { eventDetails, eventsError });

        if (eventsError) {
          console.error('❌ Events error:', eventsError);
          throw eventsError;
        }

        events = eventDetails?.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          location: event.location
        })) || [];
      }

      console.log('✅ Final results:', { makers, events });
      setFavoriteMakers(makers);
      setFavoriteEvents(events);
    } catch (err: any) {
      console.error('❌ ERROR fetching favorites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (itemId: string, itemType: 'maker' | 'event') => {
    if (!userId) return;

    try {
      console.log('➕ Adding favorite:', { userId, itemId, itemType });
      
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_type: itemType
        });

      if (error) throw error;

      console.log('✅ Favorite added successfully');
      
      // Refetch to update local state
      await fetchFavorites();
    } catch (err: any) {
      console.error('❌ Error adding favorite:', err);
      setError(err.message);
    }
  };

  const removeFavorite = async (itemId: string, itemType: 'maker' | 'event') => {
    if (!userId) return;

    try {
      console.log('➖ Removing favorite:', { userId, itemId, itemType });
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) throw error;

      console.log('✅ Favorite removed successfully');

      // Update local state
      if (itemType === 'maker') {
        setFavoriteMakers(prev => prev.filter(maker => maker.id !== itemId));
      } else {
        setFavoriteEvents(prev => prev.filter(event => event.id !== itemId));
      }
    } catch (err: any) {
      console.error('❌ Error removing favorite:', err);
      setError(err.message);
    }
  };

  const isFavorite = (itemId: string, itemType: 'maker' | 'event') => {
    if (itemType === 'maker') {
      return favoriteMakers.some(maker => maker.id === itemId);
    } else {
      return favoriteEvents.some(event => event.id === itemId);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  return {
    favoriteMakers,
    favoriteEvents,
    loading,
    error,
    refetch: fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };
};