
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import RideRequestForm from '@/components/ride/RideRequestForm';
import MainLayout from '@/components/layout/MainLayout';
import DriverDashboard from '@/components/driver/DriverDashboard';
import MapComponent from '@/components/map/MapComponent';
import RideStatusCard from '@/components/ride/RideStatusCard';
import { Navigate } from 'react-router-dom';
import { CarIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, socket } from '@/integrations/supabase/client';

const AppPage = () => {
  const { user, isLoading: authLoading, isDriver, toggleDriverMode } = useAuth();
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast('Please sign in to continue', {
        description: 'You need to be signed in to use this app',
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth',
        },
      });
    }
  }, [authLoading, user]);

  // Check for active rides when component mounts or user/driver mode changes
  useEffect(() => {
    if (!user || authLoading) return;
    
    // When switching to rider mode, check for active rides
    if (!isDriver) {
      const checkActiveRides = async () => {
        try {
          const { data, error } = await supabase
            .from('ride_requests')
            .select('id, status')
            .eq('rider_id', user.id)
            .in('status', ['searching', 'driver_assigned', 'en_route', 'arrived', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            console.log('Active ride found:', data);
            setActiveRideId(data.id);
            
            // Join the Socket.IO room for this ride
            socket.emit('join_room', `ride_${data.id}`);
          }
        } catch (error) {
          console.error('Error checking active rides:', error);
        }
      };
      
      checkActiveRides();
    } else {
      // If switching to driver mode, clear active ride
      setActiveRideId(null);
    }
    
    // Set up Socket.IO listeners for user mode
    if (user.id) {
      const roomId = isDriver ? `driver_${user.id}` : `rider_${user.id}`;
      
      // Join the room for this user
      socket.emit('join_room', roomId);
      console.log(`Joined room: ${roomId}`);
      
      // Set up listener for ride assignments
      const handleRideAssignment = (data: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride assignment:`, data);
        
        // Only process if we're in rider mode and this is for us
        if (!isDriver && data.rider_id === user.id) {
          setActiveRideId(data.ride_id || data.id);
          setIsSearching(false); // Stop any loading indicators
          
          // Join the Socket.IO room for this ride
          socket.emit('join_room', `ride_${data.ride_id || data.id}`);
          
          toast('Driver assigned', {
            description: 'A driver has been assigned to your ride',
          });
        }
      };
      
      // Set up listener for ride updates
      const handleRideUpdate = (payload: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride update:`, payload);
        
        // If this is a ride update for the rider's current request
        if (!isDriver && payload.new && payload.new.rider_id === user.id) {
          // Handle various status updates
          if (payload.new.status === 'driver_assigned') {
            console.log('Driver assigned to ride:', payload.new);
            setActiveRideId(payload.new.id);
            
            // Join the Socket.IO room for this ride if not already joined
            socket.emit('join_room', `ride_${payload.new.id}`);
            
            toast('Driver assigned', {
              description: 'A driver has been assigned to your ride',
            });
          }
          
          // For all other updates, just ensure we have the active ride ID set
          else if (!activeRideId && ['en_route', 'arrived', 'in_progress'].includes(payload.new.status)) {
            setActiveRideId(payload.new.id);
          }
        }
      };
      
      // Direct event for ride acceptance
      const handleRideAccepted = (data: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride accepted event:`, data);
        
        // Only process if we're in rider mode and this is for our ride
        if (!isDriver && data.rider_id === user.id) {
          setActiveRideId(data.id);
          setIsSearching(false);
          
          // Join the Socket.IO room for this ride
          socket.emit('join_room', `ride_${data.id}`);
          
          toast('Driver assigned', {
            description: 'A driver has been assigned to your ride',
          });
        }
      };
      
      socket.on('ride_assigned', handleRideAssignment);
      socket.on('ride_accepted', handleRideAccepted);
      socket.on('ride_update', handleRideUpdate);
      
      return () => {
        // Leave the room and remove listeners when component unmounts
        socket.emit('leave_room', roomId);
        console.log(`Left room: ${roomId}`);
        
        socket.off('ride_assigned', handleRideAssignment);
        socket.off('ride_accepted', handleRideAccepted);
        socket.off('ride_update', handleRideUpdate);
        
        if (activeRideId) {
          socket.emit('leave_room', `ride_${activeRideId}`);
          console.log(`Left room: ride_${activeRideId}`);
        }
      };
    }
  }, [user, authLoading, isDriver]);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRideRequested = (rideId: string) => {
    setActiveRideId(rideId);
    setIsSearching(true);
    
    // Join the Socket.IO room for this ride
    socket.emit('join_room', `ride_${rideId}`);
    
    toast('Ride requested', {
      description: 'Looking for drivers near you...',
    });
    
    // Broadcast a new ride request to all online drivers
    socket.emit('new_ride_request', { 
      ride_id: rideId,
      rider_id: user?.id
    });
  };

  const handleRideCancelled = () => {
    // Leave the Socket.IO room for this ride
    if (activeRideId) {
      socket.emit('leave_room', `ride_${activeRideId}`);
    }
    
    setActiveRideId(null);
    setIsSearching(false);
    toast('Ride cancelled', {
      description: 'Your ride has been cancelled',
    });
  };

  const handleRideCompleted = () => {
    // Leave the Socket.IO room for this ride
    if (activeRideId) {
      socket.emit('leave_room', `ride_${activeRideId}`);
    }
    
    setActiveRideId(null);
    setIsSearching(false);
    toast('Ride completed', {
      description: 'Thanks for riding with Hailo!',
    });
  };

  const handleLocationSelect = (location: { lat: number; lng: number } | null) => {
    setSelectedLocation(location);
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-60px)]">
        {/* Main content area with sidebar and map container */}
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Sidebar content - Forms and info */}
          <div className="w-full md:w-[400px] p-4 bg-background z-10 order-2 md:order-1">
            {isDriver ? (
              <DriverDashboard />
            ) : (
              <div className="space-y-4">
                {activeRideId ? (
                  <RideStatusCard 
                    rideId={activeRideId}
                    onCancel={handleRideCancelled}
                    onComplete={handleRideCompleted}
                    isSearching={isSearching}
                  />
                ) : (
                  <RideRequestForm 
                    onRequestSubmit={(rideId: string) => handleRideRequested(rideId)} 
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Map container with fixed dimensions */}
          <div className="relative w-full h-[40vh] md:h-auto md:flex-1 order-1 md:order-2">
            <div className="absolute inset-0 bg-gray-100 rounded-lg overflow-hidden">
              <MapComponent
                mode={isDriver ? 'driver' : mapMode}
                onLocationSelect={handleLocationSelect}
              />
            </div>
            
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="bg-background/80 backdrop-blur-sm flex items-center justify-center gap-2 shadow-md"
                onClick={toggleDriverMode}
              >
                {isDriver ? (
                  <>
                    <UserIcon className="h-4 w-4" />
                    <span>Rider Mode</span>
                  </>
                ) : (
                  <>
                    <CarIcon className="h-4 w-4" />
                    <span>Driver Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AppPage;
