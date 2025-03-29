
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';

type Marker = {
  id: string;
  type: 'pickup' | 'dropoff' | 'driver' | 'rider';
  lngLat: [number, number];
};

type Route = {
  coordinates: [number, number][];
  type: 'pickup' | 'dropoff';
};

interface MapComponentProps {
  markers?: Marker[];
  routes?: Route[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

// Temporary Mapbox token input form
const MapBoxTokenForm = ({ 
  onTokenSubmit 
}: { 
  onTokenSubmit: (token: string) => void 
}) => {
  const [token, setToken] = useState('');
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Mapbox Access Token Required</h2>
        <p className="mb-4 text-muted-foreground">
          Please enter your Mapbox public access token to enable maps. You can get one from your 
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-primary ml-1">
            Mapbox account
          </a>.
        </p>
        <div className="flex gap-2">
          <input 
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="pk.eyj1..."
          />
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            onClick={() => onTokenSubmit(token)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const MapComponent: React.FC<MapComponentProps> = ({
  markers = [],
  routes = [],
  center = [-74.0066, 40.7135], // Default to NYC
  zoom = 12,
  onMapClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routesRef = useRef<{ [key: string]: mapboxgl.MapboxGeoJSONFeature }>({});
  const [mapToken, setMapToken] = useState<string | null>(localStorage.getItem('mapbox_token'));
  const { toast } = useToast();

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapToken(token);
    toast({
      title: "Token saved",
      description: "Your Mapbox token has been saved locally.",
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapToken || mapContainer.current === null || map.current !== null) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }));

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapToken, center, zoom, onMapClick]);

  // Handle markers
  useEffect(() => {
    if (!map.current || !mapToken) return;

    // Remove markers that are no longer in the list
    Object.keys(markersRef.current).forEach(id => {
      if (!markers.find(m => m.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(marker => {
      const { id, type, lngLat } = marker;

      let markerColor = '#8B5CF6'; // default purple
      if (type === 'pickup') markerColor = '#10B981'; // green
      if (type === 'dropoff') markerColor = '#EF4444'; // red
      if (type === 'driver') markerColor = '#3B82F6'; // blue

      if (!markersRef.current[id]) {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center';
        el.style.width = '24px';
        el.style.height = '24px';
        
        // Create marker icon
        const icon = document.createElement('div');
        icon.className = 'rounded-full w-5 h-5';
        icon.style.backgroundColor = markerColor;
        icon.style.border = '2px solid white';
        icon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        // Add pulse effect for certain marker types
        if (type === 'driver' || type === 'rider') {
          const pulseRing = document.createElement('div');
          pulseRing.className = 'absolute w-10 h-10 rounded-full';
          pulseRing.style.backgroundColor = `${markerColor}33`; // 20% opacity
          pulseRing.style.animation = 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite';
          el.appendChild(pulseRing);
        }
        
        el.appendChild(icon);
        
        // Create and add the marker
        const newMarker = new mapboxgl.Marker(el)
          .setLngLat(lngLat)
          .addTo(map.current!);
        
        markersRef.current[id] = newMarker;
      } else {
        // Update position if it exists
        markersRef.current[id].setLngLat(lngLat);
      }
    });
  }, [markers, mapToken]);

  // Handle routes
  useEffect(() => {
    if (!map.current || !mapToken || routes.length === 0) return;

    const mapInstance = map.current;

    // Wait for map to be loaded
    if (!mapInstance.isStyleLoaded()) {
      mapInstance.on('load', addRoutes);
    } else {
      addRoutes();
    }

    function addRoutes() {
      routes.forEach((route, index) => {
        const sourceId = `route-${index}`;
        const layerId = `route-layer-${index}`;
        
        // Add source if it doesn't exist
        if (!mapInstance.getSource(sourceId)) {
          mapInstance.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates
              }
            }
          });
        } else {
          // Update source data if it exists
          (mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          });
        }
        
        // Add layer if it doesn't exist
        if (!mapInstance.getLayer(layerId)) {
          mapInstance.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': route.type === 'pickup' ? '#10B981' : '#EF4444',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }
      });

      // Center map to fit all coordinates
      if (routes.length > 0) {
        const allCoords = routes.flatMap(route => route.coordinates);
        const bounds = new mapboxgl.LngLatBounds();
        
        allCoords.forEach(coord => {
          bounds.extend(coord as mapboxgl.LngLatLike);
        });
        
        mapInstance.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }
    }

    // Cleanup function
    return () => {
      if (mapInstance.isStyleLoaded()) {
        routes.forEach((_, index) => {
          const layerId = `route-layer-${index}`;
          const sourceId = `route-${index}`;
          
          if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
          }
          
          if (mapInstance.getSource(sourceId)) {
            mapInstance.removeSource(sourceId);
          }
        });
      }
    };
  }, [routes, mapToken]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {!mapToken && <MapBoxTokenForm onTokenSubmit={handleTokenSubmit} />}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapComponent;
