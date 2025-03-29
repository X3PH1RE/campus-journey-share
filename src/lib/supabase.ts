
import { createClient } from '@supabase/supabase-js';

// Default Supabase values for development (replace with real values in production)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha2VrZXkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMzA5ODUzMiwiZXhwIjoxOTI4Njc0NTMyfQ.fake-key-do-not-use-in-production';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
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
