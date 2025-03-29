
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
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
        // Use OpenStreetMap's Nominatim API with India focus
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Hailo Ride App' // Nominatim requires a User-Agent
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        
        const data = await response.json();
        setResults(data);
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

  const handleSelect = (result: { display_name: string; lat: string; lon: string }) => {
    onLocationSelect({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    });
    setQuery(result.display_name);
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
              <p className="text-sm">{result.display_name}</p>
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
