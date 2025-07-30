// This script can be run as a scheduled function or edge function
// to process the email notification queue
import supabase from './lib/supabase';

const processEmailQueue = async () => {
  try {
    console.log('Starting email queue processing...');
    
    // Get pending email notifications (limit to 10 at a time)
    const { data: notifications, error } = await supabase
      .from('order_email_notifications_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
      
    if (error) {
      console.error('Error fetching email notifications:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Found ${notifications?.length || 0} pending email notifications`);
    
    if (!notifications || notifications.length === 0) {
      return { success: true, message: 'No pending notifications', processed: 0 };
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each notification
    for (const notification of notifications) {
      try {
        console.log(`Processing notification ${notification.id} for ${notification.customer_email}`);
        
        // Here you would integrate with your email sending service
        // For example, SendGrid, Mailgun, AWS SES, etc.
        
        // For now, we'll simulate a successful send
        const emailResult = { success: true };
        
        // Mark as processed
        const { error: updateError } = await supabase
          .from('order_email_notifications_queue')
          .update({ 
            status: emailResult.success ? 'completed' : 'failed',
            processed_at: new Date().toISOString(),
            error_message: emailResult.success ? null : emailResult.error
          })
          .eq('id', notification.id);
          
        if (updateError) {
          console.error('Error updating notification status:', updateError);
          failureCount++;
        } else {
          successCount++;
        }
      } catch (notificationError) {
        console.error(`Error processing notification ${notification.id}:`, notificationError);
        
        // Mark as failed
        await supabase
          .from('order_email_notifications_queue')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: notificationError.message
          })
          .eq('id', notification.id);
          
        failureCount++;
      }
    }
    
    return {
      success: true,
      message: `Processed ${successCount + failureCount} notifications`,
      processed: successCount + failureCount,
      success_count: successCount,
      failure_count: failureCount
    };
  } catch (error) {
    console.error('Error in email queue processing:', error);
    return { success: false, error: error.message };
  }
};

// If this is being run directly (e.g. as an edge function or scheduled function)
if (typeof processEmailQueue === 'function') {
  processEmailQueue()
    .then(result => console.log('Email processing complete:', result))
    .catch(error => console.error('Email processing failed:', error));
}

export default processEmailQueue;