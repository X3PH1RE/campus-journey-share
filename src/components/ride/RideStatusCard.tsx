import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase, socket } from '@/integrations/supabase/client';
import { Profile, Ride, RideStatus, VehicleInfo } from '@/lib/supabase';
import { 
  ClockIcon, 
  MapPinIcon,
  CarIcon,
  PhoneIcon,
  XIcon,
  CheckIcon,
  StarIcon,
  Loader2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RideStatusCardProps {
  rideId: string;
  onCancel: () => void;
  onComplete: () => void;
}

const statusMessages: Record<RideStatus, string> = {
  searching: "Looking for drivers near you...",
  driver_assigned: "Driver is on the way to pick you up",
  en_route: "Driver is heading to your pickup location",
  arrived: "Driver has arrived at your pickup location",
  in_progress: "Your ride is in progress",
  completed: "Your ride has been completed",
  cancelled: "This ride has been cancelled",
};

const statusColors: Record<RideStatus, string> = {
  searching: "bg-yellow-500",
  driver_assigned: "bg-blue-500",
  en_route: "bg-blue-500",
  arrived: "bg-green-500",
  in_progress: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function RideStatusCard({ rideId, onCancel, onComplete }: RideStatusCardProps) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setIsLoading(true);
        const { data: rideData, error: rideError } = await supabase
          .from('ride_requests')
          .select('*')
          .eq('id', rideId)
          .single();

        if (rideError) throw rideError;
        
        // Cast the data to our expected Ride type
        setRide(rideData as unknown as Ride);
        
        // If driver assigned, fetch driver profile
        if (rideData.driver_id) {
          await fetchDriverProfile(rideData.driver_id);
        }
      } catch (error: any) {
        console.error('Error fetching ride details:', error);
        toast({
          title: "Failed to load ride details",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideDetails();
    
    // Socket.IO listener for ride updates
    const handleRideUpdate = (payload: any) => {
      if (payload.new && payload.new.id === rideId) {
        console.log('Socket.IO ride update received:', payload);
        const updatedRide = payload.new as unknown as Ride;
        setRide(updatedRide);
        
        // If driver just assigned, fetch driver profile
        if (updatedRide.driver_id && (!ride?.driver_id || updatedRide.driver_id !== ride?.driver_id)) {
          fetchDriverProfile(updatedRide.driver_id);
        }
        
        // Show toast for status updates
        if (updatedRide.status !== ride?.status) {
          const newStatus = updatedRide.status as RideStatus;
          toast({
            title: "Ride status updated",
            description: statusMessages[newStatus],
          });

          // If completed, trigger the completion handler
          if (newStatus === 'completed') {
            onComplete();
          }
          
          // If cancelled, trigger the cancellation handler
          if (newStatus === 'cancelled') {
            onCancel();
          }
        }
      }
    };

    // Join a room specific to this ride
    socket.emit('join_room', `ride_${rideId}`);
    
    // Listen for ride updates through Socket.IO
    socket.on('ride_update', handleRideUpdate);
    
    return () => {
      // Leave the room and remove listeners when component unmounts
      socket.emit('leave_room', `ride_${rideId}`);
      socket.off('ride_update', handleRideUpdate);
    };
  }, [rideId, toast, onComplete, onCancel, ride]);
  
  const fetchDriverProfile = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', driverId)
        .single();
        
      if (error) throw error;
      
      setDriver(data as Profile);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;
    
    try {
      setIsCancelling(true);
      
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', ride.id);
        
      if (error) throw error;
      
      toast({
        title: "Ride cancelled",
        description: "Your ride request has been cancelled successfully.",
      });
      
      onCancel();
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Failed to cancel ride",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleRateDriver = async () => {
    if (!ride || !driver) return;
    
    try {
      setIsLoading(true);
      
      // Submit rating
      const { error } = await supabase
        .from('driver_ratings')
        .insert([
          {
            ride_id: ride.id,
            driver_id: driver.id,
            rider_id: ride.rider_id,
            rating: rating,
          }
        ]);
        
      if (error) throw error;
      
      toast({
        title: "Thank you for your feedback",
        description: `You rated your driver ${rating} stars.`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error rating driver:', error);
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderVehicleInfo = () => {
    if (!driver?.vehicle_info) return null;
    
    const vehicleInfo = driver.vehicle_info as unknown as VehicleInfo;
    return `${vehicleInfo.color} ${vehicleInfo.make} ${vehicleInfo.model}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ride) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ride information not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ride.status === 'completed') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rate Your Ride</CardTitle>
          <CardDescription>
            How was your ride with {driver?.full_name || 'your driver'}?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  rating >= star ? "text-yellow-500" : "text-muted"
                )}
                onClick={() => setRating(star)}
              >
                <StarIcon className="h-8 w-8" />
              </Button>
            ))}
          </div>
          
          <div className="text-center mt-2 text-sm text-muted-foreground">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            disabled={rating === 0 || isLoading}
            onClick={handleRateDriver}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Your Ride</CardTitle>
          <Badge 
            className={cn(
              "text-white",
              statusColors[ride.status] || "bg-gray-500"
            )}
          >
            {ride.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{statusMessages[ride.status]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">{ride.pickup_location.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Dropoff</p>
              <p className="text-sm text-muted-foreground">{ride.dropoff_location.address}</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>{ride.estimated_duration} min</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CarIcon className="h-4 w-4" />
              <span>{ride.distance} km</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>${ride.estimated_fare}</span>
            </div>
          </div>
        </div>
        
        {driver && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium mb-2">Your Driver</p>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={driver.avatar_url || ''} />
                <AvatarFallback>{driver.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{driver.full_name}</p>
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <StarIcon className="h-3 w-3 text-yellow-500 mr-1" />
                    <span>{driver.rating || '4.8'}</span>
                  </div>
                  <span>•</span>
                  <span>{renderVehicleInfo()}</span>
                </div>
              </div>
              <Button size="icon" variant="outline">
                <PhoneIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {['searching', 'driver_assigned', 'en_route'].includes(ride.status) && (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCancelRide}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XIcon className="h-4 w-4 mr-2" />
                Cancel Ride
              </>
            )}
          </Button>
        )}
        
        {ride.status === 'arrived' && (
          <Button className="flex-1">
            <CheckIcon className="h-4 w-4 mr-2" />
            I'm Here
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
