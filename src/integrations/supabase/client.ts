
import { createClient } from '@supabase/supabase-js';
import { io } from 'socket.io-client';

// Use environment variables or fall back to the known values from the project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wtsghljhxtnvgderntdh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0c2dobGpoeHRudmdkZXJudGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTg4ODMsImV4cCI6MjA1ODgzNDg4M30.gJfy0tZ8EvRz00djTAt2xx_BShu5NZ1uvPIWhiwLuDI';

// Initialize Socket.IO with reconnection options
// For demo purposes, we'll use a public Socket.IO server. In production, you'd use your own server.
export const socket = io('https://socket-io-server-demo.glitch.me/', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  transports: ['websocket', 'polling'] // Try websocket first, fall back to polling
});

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Set up socket event listeners for connection status
socket.on('connect', () => {
  console.log('Connected to Socket.IO server with ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
  // Don't log the full error object, as it may cause circular reference issues
  console.error('Connection error message:', error.message);
  
  // Auto-reconnect after a delay
  setTimeout(() => {
    console.log('Attempting to reconnect to Socket.IO server...');
    socket.connect();
  }, 5000);
});

// Set up socket event listeners for ride updates
socket.on('ride_assigned', (data) => {
  console.log('Ride assigned event received:', data);
});

socket.on('ride_status_updated', (data) => {
  console.log('Ride status updated event received:', data);
});

socket.on('ride_accepted', (data) => {
  console.log('Ride accepted event received:', data);
  
  // This will broadcast the update to all clients listening for ride updates
  socket.emit('ride_update', {
    new: data,
    eventType: 'UPDATE',
    table: 'ride_requests'
  });
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
