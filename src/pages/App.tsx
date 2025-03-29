
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

const AppPage = () => {
  const { user, isLoading, isDriver, toggleDriverMode } = useAuth();
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      toast('Please sign in to continue', {
        description: 'You need to be signed in to use this app',
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth',
        },
      });
    }
  }, [isLoading, user]);

  // Redirect if not logged in
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRideRequested = (rideId: string) => {
    setActiveRideId(rideId);
    toast('Ride requested', {
      description: 'Looking for drivers near you...',
    });
  };

  const handleRideCancelled = () => {
    setActiveRideId(null);
    toast('Ride cancelled', {
      description: 'Your ride has been cancelled',
    });
  };

  const handleRideCompleted = () => {
    setActiveRideId(null);
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
        {/* Map Area - Takes up more space on larger screens but doesn't overlay content */}
        <div className="flex-1 h-[40vh] md:h-full relative">
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
        </div>
        
        {/* Content Area - Sidebar for forms and info */}
        <div className="w-full md:w-[400px] p-4 overflow-y-auto bg-background shadow-lg">
          {isDriver ? (
            <DriverDashboard />
          ) : (
            <div className="space-y-4">
              {activeRideId ? (
                <RideStatusCard 
                  rideId={activeRideId}
                  onCancel={handleRideCancelled}
                  onComplete={handleRideCompleted}
                />
              ) : (
                <RideRequestForm 
                  onRequestSubmit={(rideId: string) => handleRideRequested(rideId)} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AppPage;
