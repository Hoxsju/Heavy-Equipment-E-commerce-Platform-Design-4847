import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kiuzrsirplaulpogsdup.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE'

if(SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>'){
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})