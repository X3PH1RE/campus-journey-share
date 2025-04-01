
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RideRequestForm from '@/components/ride/RideRequestForm';
import MainLayout from '@/components/layout/MainLayout';
import DriverDashboard from '@/components/driver/DriverDashboard';
import MapComponent from '@/components/map/MapComponent';
import RideStatusCard from '@/components/ride/RideStatusCard';
import { Navigate } from 'react-router-dom';
import { CarIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, socket } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

const AppPage = () => {
  const { user, isLoading: authLoading, isDriver, toggleDriverMode } = useAuth();
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (!user || authLoading) return;
    
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
            
            socket.emit('join_room', `ride_${data.id}`);
          }
        } catch (error) {
          console.error('Error checking active rides:', error);
        }
      };
      
      checkActiveRides();
    } else {
      setActiveRideId(null);
    }
    
    if (user.id) {
      const roomId = isDriver ? `driver_${user.id}` : `rider_${user.id}`;
      
      socket.emit('join_room', roomId);
      console.log(`Joined room: ${roomId}`);
      
      const handleRideAssignment = (data: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride assignment:`, data);
        
        if (!isDriver && data.rider_id === user.id) {
          setActiveRideId(data.ride_id || data.id);
          setIsSearching(false);
          
          socket.emit('join_room', `ride_${data.ride_id || data.id}`);
          
          toast('Driver assigned', {
            description: 'A driver has been assigned to your ride',
          });
        }
      };
      
      const handleRideUpdate = (payload: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride update:`, payload);
        
        if (!isDriver && payload.new && payload.new.rider_id === user.id) {
          if (payload.new.status === 'driver_assigned') {
            console.log('Driver assigned to ride:', payload.new);
            setActiveRideId(payload.new.id);
            
            socket.emit('join_room', `ride_${payload.new.id}`);
            
            toast('Driver assigned', {
              description: 'A driver has been assigned to your ride',
            });
          }
          
          if (!activeRideId && ['en_route', 'arrived', 'in_progress'].includes(payload.new.status)) {
            setActiveRideId(payload.new.id);
          }
        }
      };
      
      const handleRideAccepted = (data: any) => {
        console.log(`${isDriver ? 'Driver' : 'Rider'} received ride accepted event:`, data);
        
        if (!isDriver && data.rider_id === user.id) {
          setActiveRideId(data.id);
          setIsSearching(false);
          
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

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRideRequested = (rideId: string) => {
    setActiveRideId(rideId);
    setIsSearching(true);
    
    socket.emit('join_room', `ride_${rideId}`);
    
    toast('Ride requested', {
      description: 'Looking for drivers near you...',
    });
    
    socket.emit('new_ride_request', { 
      ride_id: rideId,
      rider_id: user?.id
    });
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleRideCancelled = () => {
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

  const renderSidebarContent = () => (
    <div className="w-full p-4 overflow-y-auto bg-background">
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
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-60px)]">
        <div className="relative flex-1 h-[60vh] md:h-full overflow-hidden">
          <MapComponent
            mode={isDriver ? 'driver' : mapMode}
            onLocationSelect={handleLocationSelect}
          />
          
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
          
          {isMobile && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    variant="default" 
                    className="h-12 px-6 rounded-full shadow-lg hailo-btn-gradient font-medium"
                  >
                    {isDriver ? "Driver Dashboard" : "Request a Ride"}
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[70vh]">
                  {renderSidebarContent()}
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div className="hidden md:block w-full md:w-[400px] md:absolute md:right-0 md:top-0 md:bottom-0 md:h-full shadow-lg z-10">
            {renderSidebarContent()}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AppPage;
