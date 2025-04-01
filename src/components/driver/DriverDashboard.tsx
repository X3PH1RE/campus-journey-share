
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase, socket } from '@/integrations/supabase/client';
import { Ride, VehicleInfo } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CarIcon, 
  IndianRupeeIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MapComponent from '../map/MapComponent';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rideRequests, setRideRequests] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    total: 0,
  });
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user) return;
    
    // Always fetch any currently assigned ride, regardless of online status
    fetchCurrentRide();
    
    // Fetch earnings data
    fetchEarnings();
    
    // Set up Socket.IO room for this driver
    if (user.id) {
      socket.emit('join_room', `driver_${user.id}`);
    }
    
    // Listen for new ride requests
    const handleNewRideRequest = (rideRequest: any) => {
      console.log('New ride request received via Socket.IO:', rideRequest);
      
      // Only add to list if driver is online
      if (isOnline) {
        setRideRequests(prev => {
          // Check if this ride is already in our list
          const exists = prev.some(ride => ride.id === rideRequest.id);
          if (exists) return prev;
          return [rideRequest as unknown as Ride, ...prev];
        });
        
        toast({
          title: 'New ride request',
          description: 'A new ride request is available nearby.',
        });
      }
    };
    
    // Listen for ride updates
    const handleRideUpdate = (payload: any) => {
      if (!payload.new) return;
      
      const updatedRide = payload.new as unknown as Ride;
      
      // If this is the driver's current ride
      if (currentRide && updatedRide.id === currentRide.id) {
        console.log('Current ride updated via Socket.IO:', updatedRide);
        setCurrentRide(updatedRide);
        
        // If ride was cancelled
        if (updatedRide.status === 'cancelled') {
          toast({
            title: 'Ride cancelled',
            description: 'The rider has cancelled this ride.',
            variant: 'destructive',
          });
          setCurrentRide(null);
        }
        
        // If ride was completed
        if (updatedRide.status === 'completed') {
          toast({
            title: 'Ride completed',
            description: `You've earned $${updatedRide.actual_fare || updatedRide.estimated_fare}.`,
          });
          
          // Refresh earnings
          fetchEarnings();
          setCurrentRide(null);
        }
      }
      
      // If this is in the available rides list and no longer searching, remove it
      if (updatedRide.status !== 'searching') {
        setRideRequests(prev => prev.filter(r => r.id !== updatedRide.id));
      }
    };
    
    socket.on('new_ride_request', handleNewRideRequest);
    socket.on('ride_update', handleRideUpdate);
    
    // Only fetch available ride requests if online
    if (isOnline) {
      fetchRideRequests();
    }
    
    return () => {
      // Clean up Socket.IO listeners
      if (user.id) {
        socket.emit('leave_room', `driver_${user.id}`);
      }
      socket.off('new_ride_request', handleNewRideRequest);
      socket.off('ride_update', handleRideUpdate);
    };
  }, [user, isOnline, toast, currentRide]);
  
  const fetchRideRequests = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'searching')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log('Fetched ride requests:', data);
      setRideRequests(data as unknown as Ride[]);
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCurrentRide = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['driver_assigned', 'en_route', 'arrived', 'in_progress'])
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setCurrentRide(data as unknown as Ride);
        // Remove ride from available requests
        setRideRequests(prev => prev.filter(r => r.id !== data.id));
      }
    } catch (error) {
      console.error('Error fetching current ride:', error);
    }
  };
  
  const fetchEarnings = async () => {
    if (!user) return;
    
    try {
      // Get today's earnings
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayData, error: todayError } = await supabase
        .from('ride_requests')
        .select('actual_fare, estimated_fare')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', todayStart.toISOString());
        
      if (todayError) throw todayError;
      
      // Get week's earnings
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const { data: weekData, error: weekError } = await supabase
        .from('ride_requests')
        .select('actual_fare, estimated_fare')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', weekStart.toISOString());
        
      if (weekError) throw weekError;
      
      // Get total earnings
      const { data: totalData, error: totalError } = await supabase
        .from('ride_requests')
        .select('actual_fare, estimated_fare')
        .eq('driver_id', user.id)
        .eq('status', 'completed');
        
      if (totalError) throw totalError;
      
      // Calculate sums
      const calculateSum = (rides: any[]) => {
        return rides.reduce((sum, ride) => {
          return sum + (ride.actual_fare || ride.estimated_fare || 0);
        }, 0);
      };
      
      setEarnings({
        today: calculateSum(todayData),
        week: calculateSum(weekData),
        total: calculateSum(totalData),
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };
  
  const handleToggleOnline = async () => {
    setIsOnline(!isOnline);
    
    if (!isOnline) {
      toast({
        title: 'You are now online',
        description: 'You will start receiving ride requests.',
      });
      
      // Refresh ride requests when going online
      fetchRideRequests();
      
      // Notify the server that driver is online
      if (user?.id) {
        socket.emit('driver_online', { driver_id: user.id });
      }
    } else {
      toast({
        title: 'You are now offline',
        description: 'You will not receive any new ride requests.',
      });
      
      // Notify the server that driver is offline
      if (user?.id) {
        socket.emit('driver_offline', { driver_id: user.id });
      }
    }
  };
  
  const handleAcceptRide = async (ride: Ride) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('ride_requests')
        .update({
          driver_id: user.id,
          status: 'driver_assigned',
        })
        .eq('id', ride.id)
        .eq('status', 'searching'); // Make sure it's still available
        
      if (error) throw error;
      
      // Set as current ride
      setCurrentRide({
        ...ride,
        driver_id: user.id,
        status: 'driver_assigned',
      });
      
      // Remove from available requests
      setRideRequests(prev => prev.filter(r => r.id !== ride.id));
      
      // Emit Socket.IO events for immediate notification with detailed data
      const rideData = {
        id: ride.id,
        driver_id: user.id,
        rider_id: ride.rider_id,
        status: 'driver_assigned',
        pickup_location: ride.pickup_location,
        dropoff_location: ride.dropoff_location,
        estimated_fare: ride.estimated_fare,
        estimated_duration: ride.estimated_duration,
        distance: ride.distance
      };
      
      // Direct event for immediate UI update
      socket.emit('ride_accepted', rideData);
      
      // Also emit to rider's specific room
      socket.emit('ride_assigned', {
        ride_id: ride.id,
        driver_id: user.id,
        rider_id: ride.rider_id,
        status: 'driver_assigned'
      });
      
      // Join the room for this specific ride
      socket.emit('join_room', `ride_${ride.id}`);
      
      toast({
        title: 'Ride accepted',
        description: 'You have accepted this ride request.',
      });
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast({
        title: 'Failed to accept ride',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRejectRide = (rideId: string) => {
    // Just remove from UI, no need to update in DB
    setRideRequests(prev => prev.filter(r => r.id !== rideId));
  };
  
  const updateRideStatus = async (status: string) => {
    if (!currentRide || !user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status,
        })
        .eq('id', currentRide.id);
        
      if (error) throw error;
      
      setCurrentRide({
        ...currentRide,
        status: status as any,
      });
      
      // Emit Socket.IO event for immediate notification
      socket.emit('ride_status_updated', {
        ride_id: currentRide.id,
        status: status
      });
      
      toast({
        title: 'Status updated',
        description: `Ride status updated to ${status.replace('_', ' ')}.`,
      });
    } catch (error: any) {
      console.error('Error updating ride status:', error);
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCompleteRide = async () => {
    if (!currentRide || !user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('ride_requests')
        .update({
          status: 'completed',
          actual_fare: currentRide.estimated_fare, // In a real app, this might be different
        })
        .eq('id', currentRide.id);
        
      if (error) throw error;
      
      // Emit Socket.IO event for immediate notification
      socket.emit('ride_completed', {
        ride_id: currentRide.id,
        actual_fare: currentRide.estimated_fare
      });
      
      setCurrentRide(null);
      
      toast({
        title: 'Ride completed',
        description: `You've earned ₹${currentRide.estimated_fare}.`,
      });
      
      // Refresh earnings
      fetchEarnings();
    } catch (error: any) {
      console.error('Error completing ride:', error);
      toast({
        title: 'Failed to complete ride',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMapMarkers = () => {
    const markers = [];
    
    if (currentRide) {
      // Add pickup location
      markers.push({
        id: 'pickup',
        type: 'pickup' as const,
        lngLat: [currentRide.pickup_location.lng, currentRide.pickup_location.lat],
      });
      
      // Add dropoff location
      markers.push({
        id: 'dropoff',
        type: 'dropoff' as const,
        lngLat: [currentRide.dropoff_location.lng, currentRide.dropoff_location.lat],
      });
      
      // Add driver location (mock)
      markers.push({
        id: 'driver',
        type: 'driver' as const,
        lngLat: [currentRide.pickup_location.lng - 0.01, currentRide.pickup_location.lat - 0.01],
      });
    } else {
      // Show available ride requests on map
      rideRequests.slice(0, 5).forEach(req => {
        markers.push({
          id: `pickup-${req.id}`,
          type: 'pickup' as const,
          lngLat: [req.pickup_location.lng, req.pickup_location.lat],
        });
      });
      
      // Add driver location (mock)
      if (rideRequests.length > 0) {
        const firstReq = rideRequests[0];
        markers.push({
          id: 'driver',
          type: 'driver' as const,
          lngLat: [firstReq.pickup_location.lng - 0.01, firstReq.pickup_location.lat - 0.01],
        });
      }
    }
    
    return markers;
  };
  
  const getMapRoutes = () => {
    const routes = [];
    
    if (currentRide) {
      // Route to pickup (mock path)
      routes.push({
        type: 'pickup' as const,
        coordinates: [
          [currentRide.pickup_location.lng - 0.01, currentRide.pickup_location.lat - 0.01], // Driver location
          [currentRide.pickup_location.lng - 0.005, currentRide.pickup_location.lat - 0.005], // Waypoint
          [currentRide.pickup_location.lng, currentRide.pickup_location.lat], // Pickup
        ],
      });
      
      // If in progress, show route to dropoff
      if (currentRide.status === 'in_progress') {
        routes.push({
          type: 'dropoff' as const,
          coordinates: [
            [currentRide.pickup_location.lng, currentRide.pickup_location.lat], // Pickup
            [
              (currentRide.pickup_location.lng + currentRide.dropoff_location.lng) / 2,
              (currentRide.pickup_location.lat + currentRide.dropoff_location.lat) / 2,
            ], // Midpoint
            [currentRide.dropoff_location.lng, currentRide.dropoff_location.lat], // Dropoff
          ],
        });
      }
    }
    
    return routes;
  };
  
  const getMapCenter = () => {
    if (currentRide) {
      return [currentRide.pickup_location.lng, currentRide.pickup_location.lat] as [number, number];
    }
    
    if (rideRequests.length > 0) {
      return [rideRequests[0].pickup_location.lng, rideRequests[0].pickup_location.lat] as [number, number];
    }
    
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Driver Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your rides and track your earnings
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="online-mode" className={isOnline ? "text-green-500" : "text-muted-foreground"}>
            {isOnline ? "Online" : "Offline"}
          </Label>
          <Switch
            id="online-mode"
            checked={isOnline}
            onCheckedChange={handleToggleOnline}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupeeIcon className="h-5 w-5 text-primary mr-1" />
              {earnings.today.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupeeIcon className="h-5 w-5 text-primary mr-1" />
              {earnings.week.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupeeIcon className="h-5 w-5 text-primary mr-1" />
              {earnings.total.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {currentRide ? (
            <Card>
              <CardHeader>
                <CardTitle>Current Ride</CardTitle>
                <CardDescription>
                  {currentRide.status === 'driver_assigned' && 'Head to pickup location'}
                  {currentRide.status === 'en_route' && 'En route to pickup location'}
                  {currentRide.status === 'arrived' && 'Waiting for rider'}
                  {currentRide.status === 'in_progress' && 'Ride in progress'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">{currentRide.pickup_location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Dropoff</p>
                      <p className="text-sm text-muted-foreground">{currentRide.dropoff_location.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>{currentRide.estimated_duration} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CarIcon className="h-4 w-4" />
                      <span>{currentRide.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <span>₹{currentRide.estimated_fare}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {currentRide.status === 'driver_assigned' && (
                  <Button 
                    className="flex-1"
                    onClick={() => updateRideStatus('en_route')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CarIcon className="h-4 w-4 mr-2" />
                        Start Navigation
                      </>
                    )}
                  </Button>
                )}
                
                {currentRide.status === 'en_route' && (
                  <Button 
                    className="flex-1"
                    onClick={() => updateRideStatus('arrived')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        I've Arrived
                      </>
                    )}
                  </Button>
                )}
                
                {currentRide.status === 'arrived' && (
                  <Button 
                    className="flex-1"
                    onClick={() => updateRideStatus('in_progress')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CarIcon className="h-4 w-4 mr-2" />
                        Start Ride
                      </>
                    )}
                  </Button>
                )}
                
                {currentRide.status === 'in_progress' && (
                  <Button 
                    className="flex-1"
                    onClick={handleCompleteRide}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Complete Ride
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Rides</h3>
                {isOnline ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Go online to see requests
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : rideRequests.length > 0 ? (
                  rideRequests.map((ride) => (
                    <Card key={ride.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <CarIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <div className="flex items-start gap-2 mb-1">
                                <MapPinIcon className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                                <p className="text-sm">{ride.pickup_location.address}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPinIcon className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                                <p className="text-sm">{ride.dropoff_location.address}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ClockIcon className="h-3 w-3" />
                                <span>{ride.estimated_duration} min</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CarIcon className="h-3 w-3" />
                                <span>{ride.distance} km</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <IndianRupeeIcon className="h-3 w-3" />
                                <span>{ride.estimated_fare}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <div className="flex border-t border-border">
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none border-r h-10 border-border text-muted-foreground"
                          onClick={() => handleRejectRide(ride.id)}
                        >
                          <XIcon className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none h-10 text-primary"
                          onClick={() => handleAcceptRide(ride)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : isOnline ? (
                  <Card className="bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <CarIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-center">
                        No ride requests available at the moment.
                        <br />
                        Stay online to receive new requests.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <CarIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-center">
                        You're currently offline.
                        <br />
                        Go online to start receiving ride requests.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="lg:row-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>
                {currentRide ? 'Current Ride' : 'Nearby Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              <div className="h-[500px]">
                <MapComponent 
                  markers={getMapMarkers()}
                  routes={getMapRoutes()}
                  center={getMapCenter()}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
