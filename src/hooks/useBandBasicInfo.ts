import { useState, useEffect } from 'react';
import { Band } from '@/types/band';

interface BasicInfo {
  name: string;
  genre: string;
  description: string;
  bio: string;
  foundedYear: string;
}

export const useBandBasicInfo = (initialBand?: Band) => {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    genre: '',
    description: '',
    bio: '',
    foundedYear: '',
  });

  useEffect(() => {
    if (initialBand) {
      setBasicInfo({
        name: initialBand.name || '',
        genre: initialBand.genre || '',
        description: initialBand.description || '',
        bio: initialBand.bio || '',
        foundedYear: initialBand.founded_year?.toString() || '',
      });
    }
  }, [initialBand]);

  const setField = (field: keyof BasicInfo, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setBasicInfo({
      name: '',
      genre: '',
      description: '',
      bio: '',
      foundedYear: '',
    });
  };

  return {
    basicInfo,
    setField,
    reset,
  };
};
