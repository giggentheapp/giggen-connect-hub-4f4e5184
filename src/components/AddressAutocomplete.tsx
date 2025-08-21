import React, { useState, useRef, useEffect } from 'react';
import { MapPin, AlertCircle, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ManualPinMap from './ManualPinMap';

interface AddressSuggestion {
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
  properties?: {
    address?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  className?: string;
  placeholder?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  className,
  placeholder = "Skriv inn adresse..."
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualPin, setShowManualPin] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get Mapbox token on component mount
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to get Mapbox token:', error);
        setError('Kunne ikke laste kartfunksjonalitet');
      }
    };

    getMapboxToken();
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim() || !mapboxToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=no&types=address,poi&limit=5&language=no`
      );

      if (!response.ok) {
        throw new Error('Feil ved søk etter adresser');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setError('Kunne ikke søke etter adresser. Prøv å sett pin manuelt.');
      setSuggestions([]);
      setShowManualPin(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset states
    setError(null);
    setShowManualPin(false);

    if (newValue.trim().length >= 3) {
      // Debounce search
      timeoutRef.current = setTimeout(() => {
        searchAddresses(newValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    onChange(suggestion.place_name, {
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    setShowManualPin(false);
  };

  const handleManualPin = () => {
    setShowManualPin(true);
    setError(null);
  };

  const handleManualPinCoordinates = (lat: number, lng: number, reverseAddress?: string) => {
    const finalAddress = reverseAddress || value || 'Manuelt valgt posisjon';
    onChange(finalAddress, { lat, lng });
    setShowManualPin(false);
    setError(null);
  };

  const handleCancelManualPin = () => {
    setShowManualPin(false);
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="address">Adresse</Label>
      <div className="relative" ref={inputRef}>
        <Input
          id="address"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-8"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0 text-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{suggestion.place_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guide text */}
      <p className="text-xs text-muted-foreground mt-1">
        Skriv inn full adresse med gatenavn, husnummer, postnummer og by. Velg riktig forslag fra listen som dukker opp.
      </p>

      {/* Error message */}
      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {showManualPin && (
              <Dialog open={showManualPin} onOpenChange={setShowManualPin}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualPin}
                    className="ml-2"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Sett pin manuelt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <ManualPinMap
                    onCoordinatesSelected={handleManualPinCoordinates}
                    onCancel={handleCancelManualPin}
                    initialCoordinates={value ? undefined : undefined}
                  />
                </DialogContent>
              </Dialog>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && value.trim().length >= 3 && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Ingen adresser funnet. Prøv en annen søketerm eller sett pin manuelt.</span>
            <Dialog open={showManualPin} onOpenChange={setShowManualPin}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualPin}
                  className="ml-2"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Sett pin manuelt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <ManualPinMap
                  onCoordinatesSelected={handleManualPinCoordinates}
                  onCancel={handleCancelManualPin}
                  initialCoordinates={value ? undefined : undefined}
                />
              </DialogContent>
            </Dialog>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressAutocomplete;