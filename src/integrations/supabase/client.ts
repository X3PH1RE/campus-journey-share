
import { createClient } from '@supabase/supabase-js';
import { io } from 'socket.io-client';

// Use environment variables or fall back to the known values from the project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wtsghljhxtnvgderntdh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0c2dobGpoeHRudmdkZXJudGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTg4ODMsImV4cCI6MjA1ODgzNDg4M30.gJfy0tZ8EvRz00djTAt2xx_BShu5NZ1uvPIWhiwLuDI';

// Initialize Socket.IO
// For demo purposes, we'll use a public Socket.IO server. In production, you'd use your own server.
export const socket = io('https://socket-io-server-demo.glitch.me/');

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Set up socket event listeners for ride updates
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});

// Enable real-time for ride_requests table
supabase.channel('schema-db-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'ride_requests' 
  }, (payload) => {
    console.log('Supabase real-time update:', payload);
    
    // Emit the update through Socket.IO for immediate distribution
    socket.emit('ride_update', payload);
  })
  .subscribe();
