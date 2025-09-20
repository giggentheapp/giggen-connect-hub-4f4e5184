import React, { useState, useRef, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Manual pin map removed - simplified address input only

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
  // Simple address validation without external geocoding
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple validation only - no external geocoding for now
  useEffect(() => {
    const validateAddress = () => {
      if (!value.trim()) {
        setValidationError('');
        return;
      }

      if (value.trim().length < 3) {
        setValidationError('');
        return;
      }

      // Simple address validation - just check if it looks like an address
      const addressPattern = /[\d\w\s,.-]+/;
      if (addressPattern.test(value)) {
        setValidationError('');
      } else {
        setValidationError('Ugyldig adresseformat');
      }
    };

    const timeoutId = setTimeout(validateAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Just save the address without coordinates for now
      onChange(value);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="address-input" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Adresse
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
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
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Info message about simplified functionality */}
      {value.trim() && !validationError && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Adresse lagret. Kartfunksjonalitet kommer snart for bedre posisjonering.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressAutocomplete;