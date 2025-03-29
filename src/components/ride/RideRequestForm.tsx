
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LocationSearch from '@/components/map/LocationSearch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2Icon } from 'lucide-react';

interface RideRequestFormProps {
  onRequestSubmit: () => void;
}

export default function RideRequestForm({ onRequestSubmit }: RideRequestFormProps) {
  const [pickup, setPickup] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const [dropoff, setDropoff] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Mock function to calculate fare based on distance
  const calculateEstimates = () => {
    if (!pickup || !dropoff) return;
    
    // Calculate distance (simplified version)
    const R = 6371e3; // Earth radius in meters
    const φ1 = pickup.lat * Math.PI/180;
    const φ2 = dropoff.lat * Math.PI/180;
    const Δφ = (dropoff.lat - pickup.lat) * Math.PI/180;
    const Δλ = (dropoff.lng - pickup.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInKm = (R * c) / 1000;
    
    // Set estimates
    const roundedDistance = Math.round(distanceInKm * 10) / 10;
    setDistance(roundedDistance);
    setEstimatedFare(Math.round(2 + roundedDistance * 1.5)); // Base fare $2 + $1.50 per km
    setEstimatedTime(Math.round(roundedDistance * 3)); // 3 minutes per km
  };
  
  // Update estimates when pickup or dropoff changes
  useState(() => {
    if (pickup && dropoff) {
      calculateEstimates();
    } else {
      setEstimatedFare(null);
      setEstimatedTime(null);
      setDistance(null);
    }
  });
  
  const handleSubmit = async () => {
    if (!pickup || !dropoff) {
      toast({
        title: "Missing information",
        description: "Please select both pickup and dropoff locations.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to request a ride.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create ride request in database
      const { data, error } = await supabase
        .from('ride_requests')
        .insert([
          {
            rider_id: user.id,
            pickup_location: {
              lat: pickup.lat,
              lng: pickup.lng,
              address: pickup.address,
            },
            dropoff_location: {
              lat: dropoff.lat,
              lng: dropoff.lng,
              address: dropoff.address,
            },
            status: 'searching',
            estimated_fare: estimatedFare || 0,
            estimated_duration: estimatedTime || 0,
            distance: distance || 0,
          },
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Ride requested",
        description: "Looking for drivers near you...",
      });
      
      onRequestSubmit();
    } catch (error: any) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Failed to create ride request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request a Ride</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Pickup Location</label>
          <LocationSearch
            placeholder="Enter pickup location"
            onLocationSelect={setPickup}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dropoff Location</label>
          <LocationSearch
            placeholder="Enter destination"
            onLocationSelect={setDropoff}
          />
        </div>
        
        {estimatedFare && estimatedTime && distance && (
          <div className="pt-2 space-y-2">
            <div className="text-sm font-medium">Ride Summary</div>
            <div className="grid grid-cols-3 gap-2 bg-accent/50 p-3 rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Fare</p>
                <p className="font-semibold">${estimatedFare}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-muted-foreground text-xs">Time</p>
                <p className="font-semibold">{estimatedTime} min</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Distance</p>
                <p className="font-semibold">{distance} km</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!pickup || !dropoff || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Requesting Ride...
            </>
          ) : (
            'Request Ride'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
