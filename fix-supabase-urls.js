import {createClient} from '@supabase/supabase-js' 

const SUPABASE_URL='https://kiuzrsirplaulpogsdup.supabase.co' 
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXpyc2lycGxhdWxwb2dzZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzA5MzgsImV4cCI6MjA2NzgwNjkzOH0.C8DszEIYetXEPqBtmfHHYUwUzx18VWUsRb-LMXasCAE' 

const supabase=createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 

async function updateSupabaseConfig() {
  try {
    console.log('🔧 Updating Supabase project configuration...') 
    
    // The real fix: Update the site URL in your Supabase project
    const {data, error} = await supabase.auth.admin.updateAuthConfig({
      SITE_URL: 'https://alhajhasan.sa',
      REDIRECT_URLS: [ 
        'https://alhajhasan.sa',
        'https://alhajhasan.sa/#/auth/callback',
        'https://alhajhasan.sa/auth/callback' 
      ]
    }) 
    
    if (error) {
      console.error('❌ Error updating auth config:', error) 
      throw error
    } 
    
    console.log('✅ Supabase auth configuration updated successfully!') 
    return {success: true, data}
  } catch (error) {
    console.error('❌ Failed to update Supabase configuration:', error) 
    return {success: false, error: error.message}
  }
} 

// Run the configuration update
updateSupabaseConfig() 
  .then(result => {
    if (result.success) {
      console.log('✅ Configuration update completed successfully!') 
      console.log('🎉 Your password reset links should now use the correct domain URL.')
    } else {
      console.log('❌ Configuration update failed:', result.error) 
      console.log('📝 You need to manually update the Site URL in your Supabase dashboard.')
    }
  }) 
  .catch(error => {
    console.error('💥 Unexpected error:', error)
  })

export default updateSupabaseConfig