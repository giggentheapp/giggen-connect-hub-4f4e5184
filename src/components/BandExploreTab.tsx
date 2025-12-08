import { useMemo, useState, useEffect } from 'react';
import { useBands } from '@/hooks/useBands';
import { BandCard } from './BandCard';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

interface BandExploreTabProps {
  searchTerm?: string;
}

export const BandExploreTab = ({ searchTerm = '' }: BandExploreTabProps) => {
  const { bands, loading } = useBands();
  const [portfoliosByBandId, setPortfoliosByBandId] = useState<Record<string, any[]>>({});
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ✅ OPTIMIZED: Fetch ALL portfolios in ONE query
  useEffect(() => {
    const fetchAllPortfolios = async () => {
      if (bands.length === 0) {
        setPortfoliosLoading(false);
        return;
      }

      try {
        const bandIds = bands.map(b => b.id);
        
        // ONE query for ALL portfolios
        const { data, error } = await supabase
          .from('band_portfolio')
          .select('*')
          .in('band_id', bandIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by band_id (fast in-memory operation)
        const grouped = (data || []).reduce((acc, portfolio) => {
          const bandId = portfolio.band_id;
          if (!acc[bandId]) {
            acc[bandId] = [];
          }
          acc[bandId].push(portfolio);
          return acc;
        }, {} as Record<string, any[]>);

        setPortfoliosByBandId(grouped);
      } catch (error) {
        console.error('Error fetching portfolios:', error);
        // Continue without portfolios - cards will show without images
      } finally {
        setPortfoliosLoading(false);
      }
    };

    if (!loading && bands.length > 0) {
      fetchAllPortfolios();
    } else if (!loading && bands.length === 0) {
      setPortfoliosLoading(false);
    }
  }, [bands, loading]);
  
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
            <BandCard 
              key={band.id} 
              band={band}
              portfolioFiles={portfoliosByBandId[band.id] || []}
              portfolioLoading={portfoliosLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};
