import { useBands } from '@/hooks/useBands';
import { BandCard } from './BandCard';

export const BandExploreTab = () => {
  const { bands, loading } = useBands();

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : bands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Ingen band ennå
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bands.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      )}
    </div>
  );
};
