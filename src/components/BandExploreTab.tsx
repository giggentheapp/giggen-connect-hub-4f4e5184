import { useMemo } from 'react';
import { useBands } from '@/hooks/useBands';
import { BandCard } from './BandCard';
import { useDebounce } from '@/hooks/useDebounce';

interface BandExploreTabProps {
  searchTerm?: string;
}

export const BandExploreTab = ({ searchTerm = '' }: BandExploreTabProps) => {
  const { bands, loading } = useBands();
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Memoize filtered bands to prevent unnecessary re-renders
  const filteredBands = useMemo(() => {
    if (!debouncedSearch) return bands;
    
    return bands.filter(band =>
      band.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      band.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      band.genre?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [bands, debouncedSearch]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredBands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {debouncedSearch ? 'Ingen band funnet' : 'Ingen band ennå'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBands.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      )}
    </div>
  );
};
