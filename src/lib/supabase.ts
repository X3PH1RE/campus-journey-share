
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_driver: boolean;
  vehicle_info?: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  phone_number?: string;
  rating?: number;
  total_rides?: number;
};

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
