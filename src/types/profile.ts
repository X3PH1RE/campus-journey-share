
import { Json } from '@/integrations/supabase/types';

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
  type?: string;
  license_plate?: string;
  color?: string;
}

export interface CollegeInfo {
  name?: string;
  student_id?: string;
  department?: string;
  year_of_study?: string;
}

export interface UserProfile {
  avatar_url: string;
  created_at: string;
  full_name: string;
  id: string;
  is_driver: boolean;
  phone_number: string;
  rating: number;
  total_rides: number;
  updated_at: string;
  username: string;
  vehicle_info: VehicleInfo | Json;
  college_info?: CollegeInfo;
  bio?: string;
}
