
import { useState, useEffect, useRef } from 'react';
import { MapPinIcon, SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  className?: string;
}

// Mock function to simulate geocoding API
const searchLocations = async (query: string): Promise<Array<{ place_name: string; center: [number, number] }>> => {
  // In a real app, you would call the Mapbox Geocoding API here
  // For now, we'll return mock data based on the query
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockLocations = [
    {
      place_name: `${query} Hall, University Campus`,
      center: [-74.006, 40.7128]
    },
    {
      place_name: `${query} Library, University Campus`,
      center: [-74.008, 40.7135]
    },
    {
      place_name: `${query} Student Center, University Campus`,
      center: [-73.996, 40.7140]
    },
    {
      place_name: `${query} Dormitory, University Campus`,
      center: [-73.990, 40.7120]
    }
  ];
  
  return mockLocations;
};

export default function LocationSearch({ placeholder = 'Search for a location', onLocationSelect, className }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const locations = await searchLocations(query);
        setResults(locations);
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result: { place_name: string; center: [number, number] }) => {
    onLocationSelect({
      address: result.place_name,
      lng: result.center[0],
      lat: result.center[1]
    });
    setQuery(result.place_name);
    setResults([]);
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isFocused && (results.length > 0 || isSearching) && (
        <div className="absolute z-10 mt-1 w-full bg-card rounded-md shadow-lg border border-border max-h-60 overflow-auto">
          {isSearching ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li
                  key={index}
                  className="px-3 py-2 hover:bg-accent cursor-pointer flex items-start gap-2 text-sm"
                  onClick={() => handleSelect(result)}
                >
                  <MapPinIcon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{result.place_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
