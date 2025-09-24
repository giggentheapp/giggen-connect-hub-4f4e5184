import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  Music,
  Calendar,
  Star 
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface FilterOptions {
  location: string;
  hasPortfolio: boolean;
  hasEvents: boolean;
  isVerified: boolean;
}

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  resultCount: number;
  loading?: boolean;
  onMapClick?: () => void; // Add map click handler
}

export const SearchFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFiltersChange,
  resultCount,
  loading = false,
  onMapClick
}: SearchFiltersProps) => {
  const { t } = useAppTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      location: '',
      hasPortfolio: false,
      hasEvents: false,
      isVerified: false,
    });
  };

  const toggleFilter = (key: keyof FilterOptions, value?: any) => {
    if (key === 'location') {
      onFiltersChange({ ...filters, [key]: value || '' });
    } else {
      onFiltersChange({ ...filters, [key]: !filters[key] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border shadow-sm text-base md:text-sm min-h-[44px]"
            inputMode="search"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted touch-target"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 min-h-[44px] touch-target"
        >
          <Filter className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">{t('filters')}</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Map button */}
        {onMapClick && (
          <Button
            variant="outline"
            onClick={onMapClick}
            className="px-3 min-h-[44px] touch-target"
          >
            <MapPin className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t('mapButton')}</span>
            <span className="sm:hidden">{t('map')}</span>
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-muted/30 p-4 rounded-lg border animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Location filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{t('filterLocation')}</label>
              <Select
                value={filters.location}
                onValueChange={(value) => toggleFilter('location', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t('allPlaces')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('allPlaces')}</SelectItem>
                  <SelectItem value="oslo">Oslo</SelectItem>
                  <SelectItem value="bergen">Bergen</SelectItem>
                  <SelectItem value="trondheim">Trondheim</SelectItem>
                  <SelectItem value="stavanger">Stavanger</SelectItem>
                  <SelectItem value="kristiansand">Kristiansand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick filter toggles */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('properties')}</label>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={filters.hasPortfolio ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('hasPortfolio')}
                  className="h-7 text-xs"
                >
                  <Music className="w-3 h-3 mr-1" />
                  {t('filterPortfolio')}
                </Button>
                <Button
                  variant={filters.hasEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('hasEvents')}
                  className="h-7 text-xs"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('filterEvents')}
                </Button>
                <Button
                  variant={filters.isVerified ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('isVerified')}
                  className="h-7 text-xs"
                >
                  <Star className="w-3 h-3 mr-1" />
                  {t('verified')}
                </Button>
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} {t('filtersActive')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-primary hover:text-primary"
              >
                <X className="w-3 h-3 mr-1" />
                {t('removeAll')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            t('searching')
          ) : (
            <>
              {resultCount} {t('makersFound')}
              {searchTerm && (
                <span> for "{searchTerm}"</span>
              )}
            </>
          )}
        </div>

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex gap-1 flex-wrap">
            {filters.location && (
              <Badge variant="secondary" className="text-xs capitalize">
                <MapPin className="w-3 h-3 mr-1" />
                {filters.location}
              </Badge>
            )}
            {filters.hasPortfolio && (
              <Badge variant="secondary" className="text-xs">
                <Music className="w-3 h-3 mr-1" />
                {t('filterPortfolio')}
              </Badge>
            )}
            {filters.hasEvents && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {t('filterEvents')}
              </Badge>
            )}
            {filters.isVerified && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {t('verified')}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};