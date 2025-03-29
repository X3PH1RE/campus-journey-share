
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2Icon } from 'lucide-react';
import RideRequestForm from '@/components/ride/RideRequestForm';
import RideStatusCard from '@/components/ride/RideStatusCard';
import DriverDashboard from '@/components/driver/DriverDashboard';
import MapComponent from '@/components/map/MapComponent';
import { supabase, Ride } from '@/lib/supabase';

const App = () => {
  const { user, isLoading, isDriver } = useAuth();
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapRoutes, setMapRoutes] = useState<any[]>([]);
  const [isCheckingRide, setIsCheckingRide] = useState(true);

  // Check if user has an active ride
  useEffect(() => {
    const checkActiveRide = async () => {
      if (!user) return;

      try {
        setIsCheckingRide(true);
        const { data, error } = await supabase
          .from('ride_requests')
          .select('*')
          .eq('rider_id', user.id)
          .in('status', ['searching', 'driver_assigned', 'en_route', 'arrived', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setActiveRide(data as Ride);
          updateMapData(data as Ride);
        }
      } catch (error) {
        console.error('Error checking active ride:', error);
      } finally {
        setIsCheckingRide(false);
      }
    };

    checkActiveRide();
  }, [user]);

  // Update map when active ride changes
  const updateMapData = (ride: Ride) => {
    const markers = [
      {
        id: 'pickup',
        type: 'pickup' as const,
        lngLat: [ride.pickup_location.lng, ride.pickup_location.lat]
      },
      {
        id: 'dropoff',
        type: 'dropoff' as const,
        lngLat: [ride.dropoff_location.lng, ride.dropoff_location.lat]
      }
    ];

    // Add driver marker if driver is assigned
    if (ride.driver_id && ride.status !== 'searching') {
      // In a real app, we'd get the actual driver location
      // For demo, we'll place it near the pickup
      markers.push({
        id: 'driver',
        type: 'driver' as const,
        lngLat: [ride.pickup_location.lng - 0.01, ride.pickup_location.lat - 0.01]
      });
    }

    setMapMarkers(markers);

    // Create routes based on ride status
    const routes = [];
    
    if (ride.status === 'en_route' || ride.status === 'driver_assigned') {
      // Route from driver to pickup
      routes.push({
        type: 'pickup' as const,
        coordinates: [
          [ride.pickup_location.lng - 0.01, ride.pickup_location.lat - 0.01], // Driver location
          [ride.pickup_location.lng - 0.005, ride.pickup_location.lat - 0.005], // Waypoint
          [ride.pickup_location.lng, ride.pickup_location.lat], // Pickup
        ],
      });
    }
    
    if (ride.status === 'in_progress') {
      // Route from pickup to dropoff
      routes.push({
        type: 'dropoff' as const,
        coordinates: [
          [ride.pickup_location.lng, ride.pickup_location.lat], // Pickup
          [
            (ride.pickup_location.lng + ride.dropoff_location.lng) / 2,
            (ride.pickup_location.lat + ride.dropoff_location.lat) / 2,
          ], // Midpoint
          [ride.dropoff_location.lng, ride.dropoff_location.lat], // Dropoff
        ],
      });
    }
    
    setMapRoutes(routes);
  };

  const handleRequestSubmit = () => {
    // Re-fetch active ride after submitting a request
    setTimeout(() => {
      if (user) {
        supabase
          .from('ride_requests')
          .select('*')
          .eq('rider_id', user.id)
          .in('status', ['searching', 'driver_assigned', 'en_route', 'arrived', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data, error }) => {
            if (error) return;
            if (data) {
              setActiveRide(data as Ride);
              updateMapData(data as Ride);
            }
          });
      }
    }, 500);
  };

  const handleRideCancel = () => {
    setActiveRide(null);
    setMapMarkers([]);
    setMapRoutes([]);
  };

  const handleRideComplete = () => {
    setActiveRide(null);
    setMapMarkers([]);
    setMapRoutes([]);
  };

  // Redirect to auth if not logged in
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading || isCheckingRide) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MainLayout>
      {isDriver ? (
        <div className="container py-6">
          <DriverDashboard />
        </div>
      ) : (
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-6">Request a Ride</h1>
              {activeRide ? (
                <RideStatusCard 
                  rideId={activeRide.id}
                  onCancel={handleRideCancel}
                  onComplete={handleRideComplete}
                />
              ) : (
                <RideRequestForm onRequestSubmit={handleRequestSubmit} />
              )}
            </div>
            <div>
              <div className="bg-card rounded-lg border overflow-hidden h-[500px]">
                <MapComponent 
                  markers={mapMarkers}
                  routes={mapRoutes}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default App;
