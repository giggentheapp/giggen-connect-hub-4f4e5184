import React, { useState, useRef, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  onChange: (address: string, coordinates?: {
    lat: number;
    lng: number;
  }) => void;
  className?: string;
  placeholder?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  className,
  placeholder = "Søk etter adresse..."
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Geocode address using Supabase Edge Function
  const geocodeAddress = async (address: string) => {
    if (!address.trim() || address.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: address.trim() }
      });

      if (error) {
        console.error('Geocoding error:', error);
        setValidationError('Kunne ikke finne adresse');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (data && data.features && data.features.length > 0) {
        const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center,
          text: feature.text,
          properties: feature.properties
        }));
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setValidationError('Ingen adresser funnet');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setValidationError('Feil ved adressesøk');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced geocoding - only trigger if user is typing
  useEffect(() => {
    if (!userTyping) return;
    const timeoutId = setTimeout(() => geocodeAddress(value), 500);
    return () => clearTimeout(timeoutId);
  }, [value, userTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setUserTyping(true);
    onChange(newValue);
    if (!newValue.trim()) {
      setSelectedCoordinates(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const coordinates = {
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    };
    
    setSelectedCoordinates(coordinates);
    setUserTyping(false); // Stop triggering geocoding after selection
    onChange(suggestion.place_name, coordinates);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[0]);
    }
  };

  return (
    <div className={cn("relative space-y-2", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            validationError && "border-destructive focus:border-destructive"
          )}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <MapPin className={cn(
              "h-4 w-4",
              selectedCoordinates ? "text-green-600" : "text-muted-foreground"
            )} />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b last:border-b-0 flex items-start gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{suggestion.text}</div>
                <div className="text-xs text-muted-foreground truncate">{suggestion.place_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Success message with coordinates */}
      {selectedCoordinates && !validationError && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Adresse georeferert
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressAutocomplete;