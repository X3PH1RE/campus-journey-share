
// This file is deprecated and will be removed in a future update.
// Please use @/integrations/supabase/client instead.
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Re-export the supabase client to maintain backward compatibility
export { supabase };

// Type definitions
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type RideStatus = 
  | 'searching'
  | 'driver_assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress' 
  | 'completed'
  | 'cancelled';

export type Ride = {
  id: string;
  rider_id: string;
  driver_id?: string;
  pickup_location: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff_location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: RideStatus;
  created_at: string;
  estimated_fare: number;
  actual_fare?: number;
  estimated_duration: number;
  distance: number;
};
