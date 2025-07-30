import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kiuzrsirplaulpogsdup.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE'

if (SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

// Get the current domain dynamically
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://alhajhasan.sa'; // fallback for production
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Support multiple domains for redirects
    redirectTo: `${getCurrentDomain()}/#/auth/callback`,
    // Disable email confirmation requirement
    emailRedirectTo: `${getCurrentDomain()}/#/auth/callback`,
    // Additional options to help with authentication
    storageKey: 'alhajhasan-auth-token',
    debug: true
  },
  // Add global headers for better API access
  global: {
    headers: {
      'X-Client-Info': 'alhajhasan-admin-panel'
    }
  },
  // Configure realtime for better performance
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export default supabase;