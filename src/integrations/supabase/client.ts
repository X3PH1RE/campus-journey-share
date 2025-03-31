
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enable real-time for ride_requests table
supabase.channel('schema-db-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'ride_requests' 
  }, () => {})
  .subscribe();
