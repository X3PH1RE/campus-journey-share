
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom marker icons
const createCustomIcon = (color: string, pulse: boolean = false) => {
  return L.divIcon({
    className: `custom-marker ${pulse ? 'pulse' : ''}`,
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const pickupIcon = createCustomIcon('#10B981'); // green
const dropoffIcon = createCustomIcon('#EF4444'); // red
const driverIcon = createCustomIcon('#3B82F6', true); // blue with pulse
const riderIcon = createCustomIcon('#8B5CF6', true); // purple with pulse

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
  mode?: 'pickup' | 'dropoff' | 'driver' | 'rider';
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  onLocationSelect?: (location: { lat: number; lng: number } | null) => void;
}

// Component to update map view when center prop changes
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  markers = [],
  routes = [],
  center = [20.5937, 78.9629], // Default to center of India
  zoom = 5, // Zoom level to see all of India
  mode,
  onMapClick,
  onLocationSelect,
}) => {
  const { toast } = useToast();

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick({ lng: e.latlng.lng, lat: e.latlng.lat });
    }
  };

  // Function to get the appropriate icon based on marker type
  const getMarkerIcon = (type: 'pickup' | 'dropoff' | 'driver' | 'rider') => {
    switch (type) {
      case 'pickup':
        return pickupIcon;
      case 'dropoff':
        return dropoffIcon;
      case 'driver':
        return driverIcon;
      case 'rider':
        return riderIcon;
      default:
        return DefaultIcon;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      {/* Add CSS styles */}
      <style>
        {`
        .custom-marker.pulse::before {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, 0.2);
          z-index: -1;
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          position: relative;
        }

        /* Ensure the map stays contained */
        .leaflet-pane,
        .leaflet-control-container,
        .leaflet-top,
        .leaflet-bottom {
          z-index: 400 !important; /* Lower z-index to avoid overlap with UI */
          pointer-events: auto;
        }

        /* Make sure all controls are visible and accessible */
        .leaflet-control {
          pointer-events: auto !important;
          z-index: 800 !important;
        }
        `}
      </style>
      
      <MapContainer
        className="h-full w-full rounded-lg"
        // @ts-ignore - React-Leaflet props type mismatch
        center={center}
        // @ts-ignore - React-Leaflet props type mismatch
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} zoom={zoom} />
        
        {/* Base map layer */}
        <TileLayer
          // @ts-ignore - React-Leaflet props type mismatch
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // @ts-ignore - React-Leaflet props type mismatch
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Route polylines */}
        {routes.map((route, index) => (
          <Polyline 
            key={`route-${index}`}
            // @ts-ignore - Type mismatch between LatLngExpression[][] and our format
            positions={route.coordinates.map(coord => [coord[1], coord[0]])} 
            pathOptions={{ 
              color: route.type === 'pickup' ? '#10B981' : '#EF4444', 
              weight: 4, 
              opacity: 0.8 
            }}
          />
        ))}
        
        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            // @ts-ignore - Type definitions don't match actual prop requirements
            position={[marker.lngLat[1], marker.lngLat[0]]}
            // @ts-ignore - Type definitions don't match actual prop requirements
            icon={getMarkerIcon(marker.type)}
          >
            <Popup>
              {marker.type.charAt(0).toUpperCase() + marker.type.slice(1)} location
            </Popup>
          </Marker>
        ))}
        
        {/* Map click handler setup */}
        {onMapClick && (
          <div className="absolute inset-0 z-[400]">
            {/* This div is just to capture clicks, but shouldn't affect layout */}
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
