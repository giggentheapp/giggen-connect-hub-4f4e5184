import { useState, useEffect } from 'react';
import { Band } from '@/types/band';

export const useBandDiscography = (initialBand?: Band) => {
  const [discography, setDiscography] = useState<string[]>([]);

  useEffect(() => {
    if (initialBand) {
      setDiscography(initialBand.discography || []);
    }
  }, [initialBand]);

  const addSong = (song: string) => {
    if (song.trim()) {
      setDiscography(prev => [...prev, song.trim()]);
    }
  };

  const removeSong = (index: number) => {
    setDiscography(prev => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setDiscography([]);
  };

  return {
    discography,
    addSong,
    removeSong,
    reset,
  };
};
