
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';

// Set Mapbox token (should be moved to environment variable in production)
mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2s4dmszdWZ6MDFrdzNsbnByNDNoenV2YSJ9.examplesecretkey';

interface LocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: { 
    address: string; 
    lat: number; 
    lng: number 
  } | null) => void;
}

export default function LocationSearch({ placeholder = 'Search for a location...', onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ place_name: string; center: [number, number] }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchLocations = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${mapboxgl.accessToken}&limit=5&country=us`
        );
        
        const data = await response.json();
        // Explicitly ensure the correct type for center
        const typedResults = data.features.map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center as [number, number]
        }));
        
        setResults(typedResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching locations:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      if (query) {
        searchLocations();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: { place_name: string; center: [number, number] }) => {
    onLocationSelect({
      address: result.place_name,
      lat: result.center[1], // Latitude is the second element
      lng: result.center[0]  // Longitude is the first element
    });
    setQuery(result.place_name);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    onLocationSelect(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => query && setShowResults(true)}
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full aspect-square rounded-l-none"
            onClick={handleClear}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full bg-background border rounded-md mt-1 shadow-md max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={index}
              className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
              onClick={() => handleSelect(result)}
            >
              <p className="text-sm">{result.place_name}</p>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
