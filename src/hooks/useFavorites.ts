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

      // Fetch favorite makers
      const { data: makerFavorites, error: makerError } = await supabase
        .from('favorites')
        .select(`
          item_id,
          profiles!inner(
            id,
            display_name,
            bio,
            avatar_url,
            role
          )
        `)
        .eq('user_id', userId)
        .eq('item_type', 'maker');

      if (makerError) throw makerError;

      // Fetch favorite events
      const { data: eventFavorites, error: eventError } = await supabase
        .from('favorites')
        .select(`
          item_id,
          events!inner(
            id,
            title,
            description,
            event_date,
            location
          )
        `)
        .eq('user_id', userId)
        .eq('item_type', 'event');

      if (eventError) throw eventError;

      // Transform data
      const makers = makerFavorites?.map((fav: any) => ({
        id: fav.profiles.id,
        display_name: fav.profiles.display_name,
        bio: fav.profiles.bio,
        avatar_url: fav.profiles.avatar_url,
        role: fav.profiles.role
      })) || [];

      const events = eventFavorites?.map((fav: any) => ({
        id: fav.events.id,
        title: fav.events.title,
        description: fav.events.description,
        event_date: fav.events.event_date,
        location: fav.events.location
      })) || [];

      setFavoriteMakers(makers);
      setFavoriteEvents(events);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (itemId: string, itemType: 'maker' | 'event') => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) throw error;

      // Update local state
      if (itemType === 'maker') {
        setFavoriteMakers(prev => prev.filter(maker => maker.id !== itemId));
      } else {
        setFavoriteEvents(prev => prev.filter(event => event.id !== itemId));
      }
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      setError(err.message);
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
    removeFavorite
  };
};